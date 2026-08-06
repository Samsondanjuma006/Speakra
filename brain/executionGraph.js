const projectSearch = require("../index/searchIndex");

function buildExecutionGraph(functionName) {

  const callers = projectSearch.findCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  const index = projectSearch.loadIndex();

  let reply =
`🕸 Execution Graph

Target:
${functionName}()

`;

  for (const caller of callers) {

console.log("EXEC GRAPH:", caller);

reply +=
`📄 ${caller.file}
 └── ${caller.caller || "Unknown Function"}() — Line ${caller.line}
  
     ${functionName}()
`;
  const file = index.find(f => f.file === caller.file);

    if (!file) {
      reply += "\n";
      continue;
    }
const functions = [
  ...file.functions,
  ...file.arrowFunctions
];

// Find functions that actually call the target function
const flow = functions.filter(fn => {
  if (!fn.calls) return false;

  return fn.calls.includes(functionName);
});

if (flow.length > 0) {
  reply += "\nExecution flow:\n";

  for (const fn of flow) {
    reply += `        ├── ${fn.name}() → ${functionName}()\n`;
  }
} else {
  reply += "\nExecution flow:\n";
  reply += "        └── Direct call from route or script\n";
}
  reply += "\n";

  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  buildExecutionGraph
};
