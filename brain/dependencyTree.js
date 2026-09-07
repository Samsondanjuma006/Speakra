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

function getFile(index, fileName) {
  return index.find(file =>
    file.file === fileName ||
    file.file.endsWith("/" + fileName)
  );
}

function renderDependencies(
  file,
  index,
  prefix,
  visited
) {
  const lines = [];

  if (!file.requires || file.requires.length === 0) {
    lines.push(`${prefix}└── (No dependencies)`);
    return lines;
  }

  const seenModules = new Set();

  const dependencies = file.requires.filter(dependency => {
    const moduleName = normalizeModule(dependency.module);

    if (!moduleName || seenModules.has(moduleName)) {
      return false;
    }

    seenModules.add(moduleName);
    return true;
  });

  dependencies.forEach((dependency, indexNumber) => {
    const moduleName = normalizeModule(dependency.module);
    const isLast = indexNumber === dependencies.length - 1;

    const branch = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    const dependencyFile = resolveIndexedFile(
      file.file,
      moduleName,
      index
    );

    if (!dependencyFile) {
      const status = isRelativeModule(moduleName)
        ? "not indexed"
        : "external";

      lines.push(
        `${prefix}${branch}${moduleName} — line ${dependency.line} (${status})`
      );

      return;
    }

    lines.push(
      `${prefix}${branch}${dependencyFile.file} — line ${dependency.line}`
    );

    if (visited.has(dependencyFile.file)) {
      lines.push(
        `${childPrefix}↺ ${dependencyFile.file} (circular dependency)`
      );

      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(dependencyFile.file);

    const children = renderDependencies(
      dependencyFile,
      index,
      childPrefix,
      nextVisited
    );

    lines.push(...children);
  });

  return lines;
}

function dependencyTree(fileName) {
  const index = projectSearch.loadIndex();

  const file = getFile(index, fileName);

  if (!file) {
    return {
      found: false
    };
  }

  const lines = [];

  lines.push("🌳 Dependency Tree");
  lines.push("");
  lines.push(file.file);

  const visited = new Set([file.file]);

  lines.push(
    ...renderDependencies(
      file,
      index,
      "",
      visited
    )
  );

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  dependencyTree
};
