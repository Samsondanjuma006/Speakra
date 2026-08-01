const projectSearch = require("../index/searchIndex");

function getProjectFunctions(file) {
  const index = projectSearch.loadIndex();

  const target = index.find(f => f.file === file);

  if (!target) {
    return [];
  }

  const definedFunctions = new Set([
    ...target.functions.map(f => f.name),
    ...target.arrowFunctions.map(f => f.name)
  ]);

  return target.calls
    .filter(call => definedFunctions.has(call.name))
    .map(call => ({
      name: call.name,
      line: call.line
    }));
}

function groupFunctions(functions) {
  const groups = new Map();

  for (const fn of functions) {
    if (!groups.has(fn.name)) {
      groups.set(fn.name, {
        name: fn.name,
        count: 0,
        lines: []
      });
    }

    const group = groups.get(fn.name);

    group.count++;
    group.lines.push(fn.line);
  }

  return Array.from(groups.values());
}

function analyzeDeepFunctionImpact(functionName) {
  const results = projectSearch.findFunction(functionName);

  if (results.length === 0) {
    return {
      found: false
    };
  }

  const callers = projectSearch.findCallers(functionName);

  const impact = [];

  for (const caller of callers) {
    const functions = getProjectFunctions(caller.file);
    const groupedFunctions = groupFunctions(functions);

    impact.push({
      file: caller.file,
      line: caller.line,
      functions: groupedFunctions
    });
  }
const affectedFunctions = [];
const uniqueFunctionNames = new Set();
let totalFunctionReferences = 0;

for (const caller of impact) {
  for (const fn of caller.functions) {
    totalFunctionReferences += fn.count;
    uniqueFunctionNames.add(fn.name);

    if (!affectedFunctions.some(
      item => item.file === caller.file && item.name === fn.name
    )) {
      affectedFunctions.push({
        file: caller.file,
        name: fn.name,
        count: fn.count
      });
    }
  }
}
 let risk = "LOW";

  if (
    callers.length >= 3 ||
    affectedFunctions.length >= 6
  ) {
    risk = "HIGH";
  } else if (
    callers.length > 0 ||
    affectedFunctions.length > 0
  ) {
    risk = "MEDIUM";
  }

  let impactText = "No second-level project functions found.";

  if (impact.length > 0) {
    impactText = impact
      .map(caller => {
        const functionsText =
          caller.functions.length > 0
            ? caller.functions
                .map(fn =>
                  `  • ${fn.name}() — ${fn.count} call${fn.count === 1 ? "" : "s"}`
                )
                .join("\n")
            : "  • No other project functions found.";

        return `📄 ${caller.file} — Line ${caller.line}\n${functionsText}`;
      })
      .join("\n\n");
  }

  return {
    found: true,
    reply:
`🧠 Deep Function Impact Analysis

Function:
${functionName}()

📍 Defined in:
${results[0].file} — Line ${results[0].line}

🔗 Direct callers:
${
  callers.length > 0
    ? callers
        .map(c => `• ${c.file} — Line ${c.line}`)
        .join("\n")
    : "No callers found."
}

🌐 Second-level project impact:

${impactText}

⚠️ Risk:
${risk}

Changing ${functionName}() may affect ${callers.length} direct caller file${callers.length === 1 ? "" : "s"}, ${uniqueFunctionNames.size} unique project function${uniqueFunctionNames.size === 1 ? "" : "s"}, across ${totalFunctionReferences} total function reference${totalFunctionReferences === 1 ? "" : "s"}.`
  };
}
module.exports = {
  analyzeDeepFunctionImpact
};
