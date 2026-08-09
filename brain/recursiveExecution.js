const projectSearch = require("../index/searchIndex");

function buildRecursiveExecution(functionName, visited = new Set(), depth = 0) {
  if (!functionName) {
    return [];
  }

  if (visited.has(functionName)) {
    return [
      `${"  ".repeat(depth)}↺ ${functionName} (already visited)`
    ];
  }

  visited.add(functionName);

  const callers = projectSearch.findCallers(functionName);

  let output = [];

  output.push(
    `${"  ".repeat(depth)}📌 ${functionName}()`
  );

  if (callers.length === 0) {
    output.push(
      `${"  ".repeat(depth + 1)}No callers found`
    );

    return output;
  }

  for (const caller of callers) {
    output.push(
      `${"  ".repeat(depth + 1)}← ${caller.file} : ${caller.line}`
    );

    output.push(
      ...buildRecursiveExecution(
        caller.caller,
        visited,
        depth + 2
      )
    );
  }

  return output;
}

module.exports = {
  buildRecursiveExecution
};
