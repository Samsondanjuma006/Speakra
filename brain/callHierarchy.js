const projectSearch = require("../index/searchIndex");

function getCalledFunction(call) {
  if (typeof call === "string") {
    return call;
  }

  if (call && typeof call === "object") {
    return call.name || call.callee || "";
  }

  return "";
}

function buildTree(index, fnName, depth = 0, visited = new Set()) {
  const indent = "│   ".repeat(depth);

  if (visited.has(fnName)) {
    return indent + "└── " + fnName + "() (recursive)\n";
  }

  visited.add(fnName);

  let output = "";

  for (const file of index) {
    const functions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    const fn = functions.find(f => f.name === fnName);

    if (!fn) continue;

    if (!fn.calls || fn.calls.length === 0) {
      return "";
    }

    for (const call of fn.calls) {
      const calledFunction = getCalledFunction(call);

      if (!calledFunction) continue;

      output += indent + "├── " + calledFunction + "()\n";

      output += buildTree(
        index,
        calledFunction,
        depth + 1,
        new Set(visited)
      );
    }

    break;
  }

  return output;
}

function buildCallHierarchy(functionName) {
  const index = projectSearch.loadIndex();

  for (const file of index) {
    const functions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    const fn = functions.find(f => f.name === functionName);

    if (!fn) continue;

    return {
      found: true,
      reply:
        `🌳 Call Hierarchy\n\n` +
        `${functionName}()\n` +
        buildTree(index, functionName)
    };
  }

  return {
    found: false
  };
}

module.exports = {
  buildCallHierarchy
};
