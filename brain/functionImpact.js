const projectSearch = require("../index/searchIndex");
const {
  traceCallers,
  traceCallees
} = require("./projectGraph");

function analyzeFunctionImpact(functionName) {
  const results = projectSearch.findFunction(functionName);

  if (results.length === 0) {
    return {
      found: false
    };
  }

  const functionInfo = results[0];

  const callers = traceCallers(functionName);
  const callees = traceCallees(functionName);

  const directCallers = callers.filter(c => c.depth === 0);

  const callerText =
    directCallers.length > 0
      ? directCallers
          .map(c =>
            `• ${c.caller}() — ${c.file}:${c.line}`
          )
          .join("\n")
      : "No direct callers found.";

  const recursiveCallerText =
    callers.length > 0
      ? callers
          .map(c =>
            `• ${c.caller}() — ${c.file}:${c.line} (depth ${c.depth})`
          )
          .join("\n")
      : "No recursive callers found.";

  const calleeText =
    callees.length > 0
      ? callees
          .map(c =>
            `• ${c.callee}() — ${c.calleeFile}:${c.calleeLine}`
          )
          .join("\n")
      : "No project function calls detected.";

  const affectedFiles = [
    ...new Set(
      callers.map(c => c.file)
    )
  ];

  let risk = "LOW";

  if (callers.length >= 5 || affectedFiles.length >= 3) {
    risk = "HIGH";
  } else if (callers.length > 0) {
    risk = "MEDIUM";
  }

  return {
    found: true,
    reply:
`🛡 Function Impact Analysis

Function:
${functionName}()

📍 Defined in:
${functionInfo.file} — Line ${functionInfo.line}

🔗 Direct callers:
${callerText}

📈 Recursive callers:
${recursiveCallerText}

→ Calls:
${calleeText}

📁 Affected files:
${
  affectedFiles.length > 0
    ? affectedFiles.map(file => `• ${file}`).join("\n")
    : "No caller files found."
}

⚠️ Risk:
${risk}

Changing ${functionName}() may affect ${callers.length} caller function${callers.length === 1 ? "" : "s"} across ${affectedFiles.length} file${affectedFiles.length === 1 ? "" : "s"}.`
  };
}

module.exports = {
  analyzeFunctionImpact
};
