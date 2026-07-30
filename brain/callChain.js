const projectSearch = require("../index/searchIndex");

function traceFunction(functionName) {

  const callers = projectSearch.findCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  return {
    found: true,
    reply:
`🔗 Call Chain

Function:
${functionName}()

Called from:

${callers
  .map(c => `• ${c.file}\n  Line ${c.line}`)
  .join("\n\n")}`
  };

}

module.exports = {
  traceFunction
};
