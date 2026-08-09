const projectSearch = require("./projectGraph");

function buildExecutionTree(functionName, visited = new Set(), depth = 0) {
  if (!functionName) return [];

  if (visited.has(functionName)) {
    return [`${"  ".repeat(depth)}↺ ${functionName}()`];
  }

  visited.add(functionName);

  const output = [];
  output.push(`${"  ".repeat(depth)}📌 ${functionName}()`);

  const callees = projectSearch.findCallees(functionName);

  if (!callees || callees.length === 0) {
    output.push(`${"  ".repeat(depth + 1)}(No further calls)`);
    return output;
  }

  for (const callee of callees) {
    output.push(`${"  ".repeat(depth + 1)}↓ ${callee.callee}()`);

    output.push(
      ...buildExecutionTree(
        callee.callee,
        visited,
        depth + 2
      )
    );
  }

  return output;
}

module.exports = {
  buildExecutionTree
};
