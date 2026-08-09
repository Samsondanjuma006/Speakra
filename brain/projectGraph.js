const search = require("../index/searchIndex");

function buildProjectGraph() {
  const index = search.loadIndex();
  const graph = {};

  for (const file of index) {
    graph[file.file] = {};

    const functions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    for (const fn of functions) {
      graph[file.file][fn.name] = {
        calls: fn.calls || [],
        line: fn.line
      };
    }
  }

  return graph;
}

function findCallees(functionName) {
  const graph = buildProjectGraph();
  const results = [];

  for (const file of Object.keys(graph)) {
    const functions = graph[file];

    if (functions[functionName]) {
      for (const callee of functions[functionName].calls) {
        results.push({
          file,
          caller: functionName,
          callee
        });
      }
    }
  }

  return results;
}

module.exports = {
  buildProjectGraph,
  findCallees
};
