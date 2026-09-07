const projectGraph = require("./projectGraph");

const IGNORED_FILES = new Set([
  "public/marked.min.js",
  "test-current.js",
  "test-env.js",
  "test-search.js"
]);

// Speakra's project-analysis machinery.
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
  if (functionName === "POST /chat callback") {
    return {
      found: true,
      reply: `🚀 Automatic Execution Pipeline

POST /chat callback()

↓ validate message
↓ remember(message)
↓ loadProfile()

🧠 Project Brain
  ├─ found → return Project Brain reply
  └─ not found → continue to normal AI pipeline

↓ optional search()
↓ build AI messages
↓ OpenRouter request
↓ history.push(assistant reply)
↓ saveMemory()
↓ res.json()`
    };
  }

  if (functionName === "answerProjectQuestion") {
    return {
      found: true,
      reply: `🧠 Project Brain Pipeline

answerProjectQuestion()

↓ resolveFunctionName()
↓ analyze project question
↓ return Project Brain result`
    };
  }

  const tracedChain = projectGraph.traceCallees(functionName);

  const ignoredCalls = tracedChain.filter(item =>
    isIgnoredFile(item.file) ||
    isIgnoredFile(item.calleeFile)
  );

  const analysisCalls = tracedChain.filter(item =>
    !isIgnoredFile(item.file) &&
    !isIgnoredFile(item.calleeFile) &&
    isAnalysisFile(item.calleeFile) &&
    item.callee !== "answerProjectQuestion"
  );

  const chain = tracedChain
    .filter(item =>
      !isIgnoredFile(item.file) &&
      !isIgnoredFile(item.calleeFile)
    )
    .filter(item =>
      !isAnalysisFile(item.calleeFile) ||
      item.callee === "answerProjectQuestion"
    )
    .filter(item =>
      !(item.callee === "answerProjectQuestion" && item.depth > 0)
    );

  const lines = [];

  for (const item of chain) {
    const indent = "  ".repeat(item.depth);

    const location =
      item.file && item.callLine
        ? ` — ${item.file}:${item.callLine}`
        : "";

    lines.push(
      `${indent}↓ ${item.callee}()${location}`
    );
  }

  const sections = [
    `🚀 Automatic Execution Pipeline

${functionName}()

${lines.length > 0
  ? lines.join("\n")
  : "No application-level project function calls detected."}`
  ];

  if (analysisCalls.length > 0) {
    sections.push(
      `🧠 Analysis calls excluded:

${analysisCalls
  .map(item => {
    const location =
      item.file && item.callLine
        ? ` — ${item.file}:${item.callLine}`
        : "";

    return `• ${item.callee}()${location}`;
  })
  .join("\n")}`
    );
  }

  if (ignoredCalls.length > 0) {
    sections.push(
      `🚫 Ignored calls excluded:

${ignoredCalls
  .map(item => `• ${item.callee}()`)
  .join("\n")}`
    );
  }

  return {
    found: true,
    reply: sections.join("\n\n")
  };
}

module.exports = {
  buildAutoExecutionPipeline
};
