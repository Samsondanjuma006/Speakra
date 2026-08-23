const projectGraph = require("./projectGraph");

function buildExecutionGraph(functionName) {
  if (!functionName) {
    return {
      found: false
    };
  }

  const callers = projectGraph.traceCallers(functionName);

  const lines = [];

  lines.push("🕸 Execution Path");
  lines.push("");
  lines.push(`Target: ${functionName}()`);
  lines.push("");

  if (callers.length === 0) {
    lines.push("└── No project callers detected");
  } else {
    for (const item of callers) {
      const indent = "  ".repeat(item.depth);

      lines.push(
        `${indent}└── ${item.caller}() — ${item.file}:${item.line}`
      );
    }
  }

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  buildExecutionGraph
};
