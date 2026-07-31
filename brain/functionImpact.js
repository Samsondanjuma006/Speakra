const projectSearch = require("../index/searchIndex");

function analyzeFunctionImpact(functionName) {

  const results = projectSearch.findFunction(functionName);

  if (results.length === 0) {
    return {
      found: false
    };
  }

  const functionInfo = results[0];

  const callers = projectSearch.findCallers(functionName);

  const callerText =
    callers.length > 0
      ? callers
          .map(c => `• ${c.file} — Line ${c.line}`)
          .join("\n")
      : "No callers found.";

  const dependencyText =
    functionInfo.requires && functionInfo.requires.length > 0
      ? functionInfo.requires
          .map(r => `• ${r.module} — Line ${r.line}`)
          .join("\n")
      : "No direct dependencies found.";

  let risk = "LOW";

  if (callers.length >= 3) {
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

🔗 Called from:
${callerText}

📦 Dependencies:
${dependencyText}

⚠️ Risk:
${risk}

Changing ${functionName}() may affect ${callers.length} caller file${callers.length === 1 ? "" : "s"}.`
  };
}

module.exports = {
  analyzeFunctionImpact
};
