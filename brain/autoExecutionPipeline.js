const projectSearch = require("../index/searchIndex");

function trace(fnName, depth = 0, visited = new Set()) {
  if (visited.has(fnName) || depth > 8) {
    return [];
  }

  visited.add(fnName);

  const lines = [];
  const callers = projectSearch.findCallers(fnName);

  for (const caller of callers) {
    lines.push(
      `${"  ".repeat(depth)}${caller.file}
${"  ".repeat(depth)}└── ${fnName}() (Line ${caller.line})`
    );

    lines.push(...trace(caller.function || caller.file, depth + 1, visited));
  }

  return lines;
}

function buildAutoExecutionPipeline(functionName) {
  const pipeline = trace(functionName);

  if (pipeline.length === 0) {
    return {
      found: false
    };
  }

  return {
    found: true,
    reply:
`🚀 Automatic Recursive Execution Pipeline

Target:
${functionName}()

${pipeline.join("\n\n")}`
  };
}

module.exports = {
  buildAutoExecutionPipeline
};






