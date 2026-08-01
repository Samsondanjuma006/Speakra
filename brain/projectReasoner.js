const { analyzeFunction } = require("./functionAnalysis");
const { analyzeFunctionImpact } = require("./functionImpact");
const { analyzeDeepFunctionImpact } = require("./deepFunctionImpact");
const { traceFunction } = require("./callChain");

function reasonAboutFunction(name) {

  const parts = [];

  const analysis = analyzeFunction(name);
  if (analysis.found) {
    parts.push(analysis.reply);
  }

  const trace = traceFunction(name);
  if (trace.found) {
    parts.push(trace.reply);
  }

  const impact = analyzeFunctionImpact(name);
  if (impact.found) {
    parts.push(impact.reply);
  }

  const deep = analyzeDeepFunctionImpact(name);
  if (deep.found) {
    parts.push(deep.reply);
  }

  if (parts.length === 0) {
    return {
      found: false
    };
  }

  return {
    found: true,
    reply: parts.join("\n\n====================\n\n")
  };

}

module.exports = {
  reasonAboutFunction
};
