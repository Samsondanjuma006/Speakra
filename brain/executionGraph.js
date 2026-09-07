const projectGraph = require("./projectGraph");

function buildExecutionGraph(functionName) {
  if (!functionName) {
    return {
      found: false
    };
  }

  const calls = projectGraph.traceCallees(functionName);

  const lines = [];

  lines.push("🕸 Execution Graph");
  lines.push("");
  lines.push(`Target: ${functionName}()`);
  lines.push("");

  if (calls.length === 0) {
    lines.push("└── No project callees detected");
  } else {
    const tree = new Map();

    for (const item of calls) {
      if (!tree.has(item.caller)) {
        tree.set(item.caller, []);
      }

      tree.get(item.caller).push(item);
    }

    function render(functionName, depth = 0, visited = new Set()) {
      const indent = "  ".repeat(depth);

      if (visited.has(functionName)) {
        lines.push(`${indent}└── ${functionName}() (recursive)`);
        return;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(functionName);

      const children = tree.get(functionName) || [];

      for (const child of children) {
        lines.push(
          `${indent}├── ${child.callee}()` +
          (child.calleeFile
            ? ` — ${child.calleeFile}:${child.calleeLine}`
            : "")
        );

        render(child.callee, depth + 1, nextVisited);
      }
    }

    render(functionName);
  }

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  buildExecutionGraph
};
