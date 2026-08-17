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
function findCallees(functionName, graph = null) {

  if (!graph) {
    graph = buildProjectGraph();
  }

  const results = [];

  for (const file of Object.keys(graph)) {
    const functions = graph[file];

    if (functions[functionName]) {
      for (const call of functions[functionName].calls || []) {

        const callee =
          typeof call === "string"
            ? call
            : call.name;

        const line =
          typeof call === "string"
            ? null
            : call.line;

        if (!callee) continue;

        if (
          Object.values(graph).some(
            fileFunctions => fileFunctions[callee]
          )
        ) {
          results.push({
            file,
            caller: functionName,
            callee,
            line
          });
        }
      }
    }
  }

  return results;
}
function findFunctionLocation(graph, functionName) {
  for (const file of Object.keys(graph)) {
    if (graph[file][functionName]) {
      return {
        file,
        line: graph[file][functionName].line
      };
    }
  }

  return {
    file: null,
    line: null
  };
}
function traceCallees(
  functionName,
  visited = new Set(),
  depth = 0,
  graph = null
) {
  if (visited.has(functionName) || depth > 8) {
    return [];
  }

  if (!graph) {
    graph = buildProjectGraph();
  }

  visited.add(functionName);

const direct = findCallees(functionName, graph);
  const results = [];

  for (const call of direct) {
    const location = findFunctionLocation(graph, call.callee);

    results.push({
      file: call.file,
      caller: call.caller,
      callee: call.callee,
      callLine: call.line,
      calleeFile: location.file,
      calleeLine: location.line,
      depth
    });

    const deeper = traceCallees(
      call.callee,
      visited,
      depth + 1,
      graph
    );

    results.push(...deeper);
  }

  return results;
}
function traceCallers(
  functionName,
  visited = new Set(),
  depth = 0
) {
  if (visited.has(functionName) || depth > 8) {
    return [];
  }

  visited.add(functionName);

  const direct = search.findCallers(functionName);
  const results = [];

  for (const caller of direct) {
    // Stop circular caller chains before adding the cycle to the result.
    if (visited.has(caller.caller)) {
      continue;
    }

    results.push({
      file: caller.file,
      caller: caller.caller,
      callee: functionName,
      line: caller.line,
      depth
    });

    const deeper = traceCallers(
      caller.caller,
      visited,
      depth + 1
    );

    results.push(...deeper);
  }

  return results;
}
module.exports = {
  buildProjectGraph,
  findCallees,
  traceCallees,
  traceCallers
};
