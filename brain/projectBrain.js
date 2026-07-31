const projectSearch = require("../index/searchIndex");
const { explainFile } = require("./fileExplainer");
const { explainExecution } = require("./executionFlow");
const { traceFunction } = require("./callChain");
const { explainArchitecture } = require("./projectArchitecture");
const { extractKeyword } = require("../index/projectQuery");
const { dependencyTree } = require("./dependencyTree");
const { analyzeImpact } = require("./impactAnalyzer");
const { listFunctions } = require("./functionExplorer");
const { locateFunction } = require("./functionLocator");

function answerProjectQuestion(message) {

const keyword = extractKeyword(message);

// Trace function call chain
if (/trace/i.test(message)) {

  const trace = traceFunction(keyword);

  if (trace.found) {
    return trace;
  }

}

// Who calls a function?
if (/what calls|who calls|called by/i.test(message)) {
  const callers = projectSearch.findCallers(keyword);

  if (callers.length > 0) {
    return {
      found: true,
      reply:
`🔍 ${keyword}()

Called from:

${callers
  .map(c => `• ${c.file}\n  Line ${c.line}`)
  .join("\n\n")}
Total files: ${callers.length}`
    };
  }
}
// Impact Analysis
if (/what breaks|impact|delete|remove/i.test(message) && keyword.endsWith(".js")) {

  const result = analyzeImpact(keyword);

  if (result.found) {
    return result;
  }

}
// Dependency Tree
if (/dependency tree|dependencies/i.test(message) && keyword.endsWith(".js")) {

  const tree = dependencyTree(keyword);

  if (tree.found) {
    return tree;
  }

}
// Project Architecture
if (/architecture|project architecture|show architecture/i.test(message)) {
  return explainArchitecture();
}
const flow = explainExecution(message);
// Execution Flow

if (flow.found) {
  return flow;
}
// Who uses a file?
if (/who uses|used by|imports/i.test(message) && keyword.endsWith(".js")) {
  const usedBy = projectSearch.findUsedBy(keyword);

  if (usedBy.length > 0) {
    return {
      found: true,
      reply:
`📄 ${keyword}

Used by:

${usedBy.map(f => "• " + f.file).join("\n")}

Total files: ${usedBy.length}`
    };
  }
}
// List functions in a file
if (/show all functions|list functions|functions in/i.test(message) && keyword.endsWith(".js")) {

  const result = listFunctions(keyword);

  if (result.found) {
    return result;
  }

}
// Explain a specific JavaScript file
if (/explain/i.test(message) && keyword.endsWith(".js")) {
    return explainFile(keyword);
}
// Locate a function
if (/where is|jump to|locate|find function/i.test(message)) {

  const result = locateFunction(keyword);

  if (result.found) {
    return result;
  }

}

const functionResult = projectSearch.findFunction(keyword);

if (functionResult.length > 0) {

  const file = functionResult[0];

  return {
    found: true,
    reply:
`I found the function "${keyword}".

📄 File:
${file.file}

Functions in this file:
${file.functions.map(f => "• " + f.name + "()").join("\n")}`
  };

}
   // List all project files
    if (/list|all|files|project files/i.test(message)) {
      return {
        found: true,
        reply:
`Project files:

${projectSearch.listFiles().map(f => "• " + f).join("\n")}

Total files: ${projectSearch.listFiles().length}`
      };
    }
  const requireResult = projectSearch.findRequire(keyword);

  if (requireResult.length > 0) {
    return {
      found: true,
      reply:
`I found "${keyword}" in these project files:

${requireResult.map(f => "• " + f.file).join("\n")}

Total files: ${requireResult.length}`
    };
  }

  return {
    found: false
  };
}

module.exports = {
  answerProjectQuestion
};
