const { analyzeFunction } = require("./functionAnalysis");
const { analyzeFunctionImpact } = require("./functionImpact");

function explainFunctionReason(functionName) {

  const analysis = analyzeFunction(functionName);

  if (!analysis.found) {
    return { found: false };
  }

  const impact = analyzeFunctionImpact(functionName);

  let reply =
`🧠 Function Reasoning

Function:
${functionName}()

${analysis.summary}
`;

  if (impact.found) {
    reply += "\n\n" + impact.reply;
  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  explainFunctionReason
};
