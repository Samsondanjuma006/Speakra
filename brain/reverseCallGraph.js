const projectSearch = require("../index/searchIndex");

function reverseCallGraph(functionName) {

  const callers = projectSearch.findCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  let reply =
`🧭 Reverse Call Graph

Target:
${functionName}()

`;

  for (const caller of callers) {

    reply +=
`📄 ${caller.file}
   │
   └── Line ${caller.line}
        │
        ▼
     ${functionName}()

`;

  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  reverseCallGraph
};
