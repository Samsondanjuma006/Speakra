const projectSearch = require("../index/searchIndex");

function traceDependencies(functionName, visited = new Set()) {
  if (visited.has(functionName)) {
    return [];
  }

  visited.add(functionName);

  const callers = projectSearch.findCallers(functionName);

  let result = [];

  for (const caller of callers) {
    result.push(caller);

    result.push(
      ...traceDependencies(caller.caller, visited)
    );
  }

  return result;
}

module.exports = {
  traceDependencies
};
