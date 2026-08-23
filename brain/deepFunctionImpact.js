const projectSearch = require("../index/searchIndex");

const MAX_DEPTH = 10;

function getFunctionInfo(file, functionName) {
  const index = projectSearch.loadIndex();

  const target = index.find(f => f.file === file);

  if (!target) {
    return null;
  }

  return [
    ...(target.functions || []),
    ...(target.arrowFunctions || [])
  ].find(fn => fn.name === functionName) || null;
}

function buildRecursiveImpact(functionName) {
  const results = [];
  const queue = [
    {
      functionName,
      depth: 0,
      path: [functionName]
    }
  ];

  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.depth >= MAX_DEPTH) {
      continue;
    }

    const callers = projectSearch.findCallers(current.functionName);

    for (const caller of callers) {
      const key =
        `${caller.caller}|${caller.file}|${caller.line}|${current.functionName}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      const nextDepth = current.depth + 1;

      // Do not record circular call paths as additional impact.
      if (current.path.includes(caller.caller)) {
        continue;
      }

      const nextPath = [
        ...current.path,
        caller.caller
      ];

      results.push({
        functionName: caller.caller,
        file: caller.file,
        line: caller.line,
        depth: nextDepth,
        via: current.functionName,
        path: nextPath
      });

      if (nextDepth < MAX_DEPTH) {
        queue.push({
          functionName: caller.caller,
          depth: nextDepth,
          path: nextPath
        });
      }
    }
  }

  return results;
}

function analyzeDeepFunctionImpact(functionName) {
  const results = projectSearch.findFunction(functionName);

  if (results.length === 0) {
    return {
      found: false
    };
  }

  const functionInfo = results[0];

  const impact = buildRecursiveImpact(functionName);

  const directCallers = impact.filter(
    item => item.depth === 1
  );

  const indirectCallers = impact.filter(
    item => item.depth > 1
  );

  const uniqueFunctions = new Set(
    impact.map(item => item.functionName)
  );

  const directCallerFunctions = new Set(
    directCallers.map(item => item.functionName)
  );

  const directCallSites = directCallers.length;

  const indirectCallSites = indirectCallers.length;

  const affectedFiles = new Set(
    impact.map(item => item.file)
  );

  const maxDepth =
    impact.length > 0
      ? Math.max(...impact.map(item => item.depth))
      : 0;

  let risk = "LOW";

  if (
    uniqueFunctions.size >= 8 ||
    affectedFiles.size >= 3 ||
    maxDepth >= 5
  ) {
    risk = "HIGH";
  } else if (
    uniqueFunctions.size > 0
  ) {
    risk = "MEDIUM";
  }

  const directText =
    directCallers.length > 0
      ? directCallers
          .map(item =>
            `• ${item.functionName}() — ${item.file}:${item.line}`
          )
          .join("\n")
      : "No direct callers found.";

  let recursiveText =
    "No recursive callers beyond level 1.";

  if (indirectCallers.length > 0) {
    recursiveText = indirectCallers
      .map(item =>
        `• Level ${item.depth}: ${item.functionName}() — ${item.file}:${item.line} → ${item.via}()`
      )
      .join("\n");
  }

  const affectedFileText =
    affectedFiles.size > 0
      ? [...affectedFiles]
          .map(file => `• ${file}`)
          .join("\n")
      : "No affected files found.";

  return {
    found: true,
    reply:
`🧠 Deep Function Impact Analysis

Function:
${functionName}()

📍 Defined in:
${functionInfo.file} — Line ${functionInfo.line}

🔗 Direct callers:
${directText}

🌐 Recursive impact:
${recursiveText}

📊 Impact Summary:
• Direct caller functions: ${directCallerFunctions.size}
• Direct call sites: ${directCallSites}
• Recursive call sites: ${indirectCallSites}
• Unique affected functions: ${uniqueFunctions.size}
• Affected files: ${affectedFiles.size}
• Maximum caller depth: ${maxDepth}
• Maximum analysis depth: ${MAX_DEPTH}

📁 Affected files:
${affectedFileText}

⚠️ Risk:
${risk}

Changing ${functionName}() may affect ${directCallerFunctions.size} direct caller function${directCallerFunctions.size === 1 ? "" : "s"} and ${uniqueFunctions.size} unique affected caller function${uniqueFunctions.size === 1 ? "" : "s"} across ${affectedFiles.size} file${affectedFiles.size === 1 ? "" : "s"}.`
  };
}

module.exports = {
  analyzeDeepFunctionImpact
};
