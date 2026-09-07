const path = require("path");
const projectSearch = require("../index/searchIndex");

function normalizeModule(moduleName) {
  return moduleName.replace(/\\/g, "/");
}

function isRelativeModule(moduleName) {
  return (
    moduleName.startsWith("./") ||
    moduleName.startsWith("../")
  );
}

function getFile(index, fileName) {
  return index.find(file =>
    file.file === fileName ||
    file.file.endsWith("/" + fileName)
  );
}

function resolveIndexedFile(fromFile, moduleName, index) {
  const normalized = normalizeModule(moduleName);

  if (!isRelativeModule(normalized)) {
    return null;
  }

  const fromDirectory = path.posix.dirname(fromFile);

  const candidates = [
    path.posix.normalize(
      path.posix.join(fromDirectory, normalized)
    ),
    path.posix.normalize(
      path.posix.join(fromDirectory, normalized + ".js")
    ),
    path.posix.normalize(
      path.posix.join(fromDirectory, normalized + ".json")
    ),
    path.posix.normalize(
      path.posix.join(fromDirectory, normalized, "index.js")
    )
  ];

  for (const candidate of candidates) {
    const match = index.find(file => file.file === candidate);

    if (match) {
      return match;
    }
  }

  return null;
}

function findDependencyPaths(
  currentFile,
  targetFile,
  index,
  visited = new Set()
) {
  if (visited.has(currentFile.file)) {
    return [];
  }

  const nextVisited = new Set(visited);
  nextVisited.add(currentFile.file);

  if (currentFile.file === targetFile.file) {
    return [[currentFile.file]];
  }

  if (!currentFile.requires || currentFile.requires.length === 0) {
    return [];
  }

  const paths = [];

  for (const dependency of currentFile.requires) {
    const moduleName = normalizeModule(dependency.module);

    const dependencyFile = resolveIndexedFile(
      currentFile.file,
      moduleName,
      index
    );

    if (!dependencyFile) {
      continue;
    }

    const childPaths = findDependencyPaths(
      dependencyFile,
      targetFile,
      index,
      nextVisited
    );

    for (const childPath of childPaths) {
      paths.push([
        currentFile.file,
        ...childPath
      ]);
    }
  }

  return paths;
}

function traceDependencies(fromFileName, toFileName = null) {
  const index = projectSearch.loadIndex();

  const fromFile = getFile(index, fromFileName);

  if (!fromFile) {
    return {
      found: false,
      reply: `Source file not found in project index: ${fromFileName}`
    };
  }

  if (!toFileName) {
    return {
      found: true,
      reply:
        `🔎 Dependency Trace\n\n` +
        `Source: ${fromFile.file}\n\n` +
        `No target file was specified.`
    };
  }

  const targetFile = getFile(index, toFileName);

  if (!targetFile) {
    return {
      found: false,
      reply: `Target file not found in project index: ${toFileName}`
    };
  }

  const paths = findDependencyPaths(
    fromFile,
    targetFile,
    index
  );

  if (paths.length === 0) {
    return {
      found: false,
      reply:
        `🔎 Dependency Trace\n\n` +
        `No dependency path found from ${fromFile.file} ` +
        `to ${targetFile.file}.`
    };
  }

  const lines = [];

  lines.push("🔎 Dependency Trace");
  lines.push("");
  lines.push(`From: ${fromFile.file}`);
  lines.push(`To: ${targetFile.file}`);
  lines.push("");

  for (let i = 0; i < paths.length; i++) {
    lines.push(`Path ${i + 1}:`);
    lines.push("");

    const dependencyPath = paths[i];

    for (let j = 0; j < dependencyPath.length; j++) {
      const prefix = "  ".repeat(j);

      lines.push(
        `${prefix}└── ${dependencyPath[j]}`
      );
    }

    if (i < paths.length - 1) {
      lines.push("");
    }
  }

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  traceDependencies
};
