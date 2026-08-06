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

module.exports = {
  buildProjectGraph
};
