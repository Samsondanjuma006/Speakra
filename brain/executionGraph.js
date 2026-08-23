const projectSearch = require("../index/searchIndex");

function buildExecutionGraph(functionName) {
  if (!functionName) {
    return {
      found: false
    };
  }

  const lines = [];

  function walk(currentFunction, depth, path) {
    const indent = "  ".repeat(depth);

    if (path.has(currentFunction)) {
      lines.push(
        `${indent}↺ ${currentFunction}() — cycle detected`
      );
      return;
    }

    const nextPath = new Set(path);
    nextPath.add(currentFunction);

    const callers = projectSearch.findCallers(currentFunction);

    if (callers.length === 0) {
      lines.push(
        `${indent}└── No project callers found`
      );
      return;
    }

    for (const caller of callers) {
      const callerName = caller.caller || "Unknown Function";

      lines.push(
        `${indent}└── ${callerName}() — ${caller.file}:${caller.line}`
      );

      walk(callerName, depth + 1, nextPath);
    }
  }

  lines.push("🕸 Execution Path");
  lines.push("");
  lines.push(`Target: ${functionName}()`);
  lines.push("");

  walk(functionName, 0, new Set());

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  buildExecutionGraph
};
