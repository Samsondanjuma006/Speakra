const projectSearch = require("../index/searchIndex");

function buildReverseCallHierarchy(functionName) {

  const callers = projectSearch.findCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  let reply =
`🌳 Reverse Call Hierarchy

${functionName}()

Called by

`;

  for (const caller of callers) {

    reply +=
`├── ${caller.file}
│    ${caller.caller || "Unknown Function"}()

`;

  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  buildReverseCallHierarchy
};
