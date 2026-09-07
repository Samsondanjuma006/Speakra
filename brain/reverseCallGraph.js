const projectGraph = require("./projectGraph");

function reverseCallGraph(functionName) {
  if (!functionName) {
    return {
      found: false
    };
  }

  const callers = projectGraph.traceCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  const lines = [];

  lines.push("🧭 Reverse Call Graph");
  lines.push("");
  lines.push(`Target: ${functionName}()`);
  lines.push("");

  function render(target, depth = 0, visited = new Set()) {
    const indent = "  ".repeat(depth);

    if (visited.has(target)) {
      lines.push(`${indent}↺ ${target}()`);
      return;
    }

    const currentPath = new Set(visited);
    currentPath.add(target);

    const parents = callers.filter(
      item => item.callee === target
    );

    for (const parent of parents) {
      lines.push(
        `${indent}↑ ${parent.caller}()`
      );

      lines.push(
        `${indent}  📄 ${parent.file}:${parent.line}`
      );

      render(
        parent.caller,
        depth + 1,
        currentPath
      );
    }
  }

  render(functionName);

  return {
    found: true,
    reply: lines.join("\n")
  };
}

module.exports = {
  reverseCallGraph
};
