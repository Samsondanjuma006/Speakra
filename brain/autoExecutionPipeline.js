const projectGraph = require("./projectGraph");

const IGNORED_FILES = new Set([
  "public/marked.min.js",
  "test-current.js",
  "test-env.js",
  "test-search.js"
]);

// SamuAI's project-analysis machinery.
// These files describe/analyze the project rather than representing
// the application's normal runtime execution path.
const ANALYSIS_FILES = new Set([
  "brain/projectBrain.js",
  "brain/projectGraph.js",
  "brain/executionFlow.js",
  "brain/executionPipeline.js",
  "brain/autoExecutionPipeline.js",
  "brain/recursiveExecution.js",
  "brain/fullExecutionTree.js",
  "brain/executionGraph.js",
  "brain/callHierarchy.js",
  "brain/reverseCallHierarchy.js",
  "brain/reverseCallGraph.js",
  "brain/dependencyTree.js",
  "brain/dependencyTracer.js",
  "brain/functionAnalysis.js",
  "brain/functionImpact.js",
  "brain/functionReason.js",
  "brain/projectReasoner.js",
  "brain/featureReason.js",
  "brain/projectArchitecture.js",
  "brain/fileExplainer.js",
  "brain/functionExplorer.js",
  "brain/functionLocator.js",
  "brain/deepFunctionImpact.js",
  "brain/callChain.js",
  "brain/impactAnalyzer.js"
]);

function isIgnoredFile(file) {
  return IGNORED_FILES.has(file);
}

function isAnalysisFile(file) {
  return !!file && ANALYSIS_FILES.has(file);
}

function buildAutoExecutionPipeline(functionName) {
  if (functionName === "answerProjectQuestion") {
    return {
      found: true,
      reply: `🚀 Automatic Execution Pipeline

Browser
  ↓
POST /chat
  ↓
server.js
  ↓
answerProjectQuestion()
  ↓
Project Brain result

🔀 Decision:
  ├─ found → return Project Brain reply
  └─ not found → continue to normal AI pipeline`
    };
  }

  const chain = projectGraph
    .traceCallees(functionName)
    .filter(item =>
      !isIgnoredFile(item.file) &&
      !isIgnoredFile(item.calleeFile)
    )
    .filter(item =>
      !isAnalysisFile(item.calleeFile)
    );

  const lines = [];

  for (const item of chain) {
    const indent = "  ".repeat(item.depth);

    const location =
      item.calleeFile && item.calleeLine
        ? ` — ${item.calleeFile}:${item.calleeLine}`
        : "";

    lines.push(
      `${indent}↓ ${item.callee}()${location}`
    );
  }

  return {
    found: true,
    reply:
`🚀 Automatic Execution Pipeline

${functionName}()

${lines.length > 0
  ? lines.join("\n")
  : "No application-level project function calls detected."}`
  };
}

module.exports = {
  buildAutoExecutionPipeline
};
