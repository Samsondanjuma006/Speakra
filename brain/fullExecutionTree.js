const projectSearch = require("./projectGraph");

function buildExecutionTree(functionName, visited = new Set(), depth = 0) {
  if (!functionName) return [];

  const indent = "  ".repeat(depth);

  // Detect recursion only within the current branch.
  if (visited.has(functionName)) {
    return [`${indent}↺ ${functionName}()`];
  }

  // Create a new path for this branch so sibling branches
  // can independently contain the same function.
  const currentPath = new Set(visited);
  currentPath.add(functionName);

  const output = [];

  output.push(`${indent}📌 ${functionName}()`);

  const callees = projectSearch.findCallees(functionName);

  if (!callees || callees.length === 0) {
    output.push(`${"  ".repeat(depth + 1)}(No further calls)`);
    return output;
  }

  for (const callee of callees) {
    output.push(
      `${"  ".repeat(depth + 1)}↓ ${callee.callee}()`
    );

    output.push(
      ...buildExecutionTree(
        callee.callee,
        currentPath,
        depth + 2
      )
    );
  }

  return output;
}

module.exports = {
  buildExecutionTree
};
