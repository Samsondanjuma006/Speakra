const projectSearch = require("../index/searchIndex");

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

function findIndirectCallers(functionName) {
  const directCallers = projectSearch.findCallers(functionName);

  const results = [];
  const seen = new Set();

  for (const direct of directCallers) {
    const secondLevel = projectSearch.findCallers(direct.caller);

    for (const caller of secondLevel) {
      const key =
        `${caller.caller}|${caller.file}|${caller.line}|${direct.caller}`;

      if (!seen.has(key)) {
        seen.add(key);

        results.push({
          intermediate: direct.caller,
          intermediateFile: direct.file,
          intermediateLine: direct.line,
          caller: caller.caller,
          callerFile: caller.file,
          callerLine: caller.line
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

  const callers = projectSearch.findCallers(functionName);

  const indirect = findIndirectCallers(functionName);

  const uniqueFunctions = new Set();

  for (const item of indirect) {
    uniqueFunctions.add(item.caller);
  }

  const affectedFiles = new Set();

  for (const caller of callers) {
    affectedFiles.add(caller.file);
  }

  for (const item of indirect) {
    affectedFiles.add(item.callerFile);
  }

  let risk = "LOW";

  if (
    callers.length >= 3 ||
    indirect.length >= 5 ||
    affectedFiles.size >= 3
  ) {
    risk = "HIGH";
  } else if (
    callers.length > 0 ||
    indirect.length > 0
  ) {
    risk = "MEDIUM";
  }

  const directCallerText =
    callers.length > 0
      ? callers
          .map(c =>
            `• ${c.caller}() — ${c.file}:${c.line}`
          )
          .join("\n")
      : "No direct callers found.";

  let indirectText = "No second-level callers found.";

  if (indirect.length > 0) {
    indirectText = indirect
      .map(item =>
        `• ${item.caller}() — ${item.callerFile}:${item.callerLine} → ${item.intermediate}()`
      )
      .join("\n");
  }

  return {
    found: true,
    reply:
`🧠 Deep Function Impact Analysis

Function:
${functionName}()

📍 Defined in:
${functionInfo.file} — Line ${functionInfo.line}

🔗 Direct callers:
${directCallerText}

🌐 Second-level project impact:
${indirectText}

📁 Affected files:
${
  affectedFiles.size > 0
    ? [...affectedFiles]
        .map(file => `• ${file}`)
        .join("\n")
    : "No affected files found."
}

⚠️ Risk:
${risk}

Changing ${functionName}() may affect ${callers.length} direct caller${callers.length === 1 ? "" : "s"} and ${uniqueFunctions.size} second-level function${uniqueFunctions.size === 1 ? "" : "s"} across ${affectedFiles.size} file${affectedFiles.size === 1 ? "" : "s"}.`
  };
}

module.exports = {
  analyzeDeepFunctionImpact
};
