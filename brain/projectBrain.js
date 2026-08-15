const projectSearch = require("../index/searchIndex");
const projectGraph = require("./projectGraph");
function resolveFunctionName(keyword) {
  const results = projectSearch.findFunction(keyword);

  if (results.length > 0) {
    return keyword;
  }

  const index = projectSearch.loadIndex();

  for (const file of index) {
    const functions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    const match = functions.find(
      fn => fn.name.toLowerCase() === keyword.toLowerCase()
    );

    if (match) {
      return match.name;
    }
  }

  return keyword;
}
const { explainFile } = require("./fileExplainer");
const { explainExecution } = require("./executionFlow");
const { traceFunction } = require("./callChain");
const { explainArchitecture } = require("./projectArchitecture");
const { extractKeyword } = require("../index/projectQuery");
const { dependencyTree } = require("./dependencyTree");
const { analyzeImpact } = require("./impactAnalyzer");
const { listFunctions } = require("./functionExplorer");
const { locateFunction } = require("./functionLocator");
const { analyzeFunction } = require("./functionAnalysis");
const { analyzeFunctionImpact } = require("./functionImpact");
const { reasonAboutFunction } = require("./projectReasoner");
const { reverseCallGraph } = require("./reverseCallGraph");
const { buildExecutionGraph } = require("./executionGraph");
const { findCallees, traceCallees } = require("./projectGraph");
const { buildProjectGraph } = require("./projectGraph");
const { traceDependencies } = require("./dependencyTracer");
const { buildCallHierarchy } = require("./callHierarchy");
const { buildReverseCallHierarchy } = require("./reverseCallHierarchy");
const { explainFunctionReason } = require("./functionReason");

const { explainFeature } = require("./featureReason");
const { buildExecutionPipeline } = require("./executionPipeline");
const { buildAutoExecutionPipeline } = require("./autoExecutionPipeline");
const { buildRecursiveExecution } = require("./recursiveExecution");
const { buildExecutionTree } = require("./fullExecutionTree");

function answerProjectQuestion(message) {

const keyword = extractKeyword(message);
console.log("MESSAGE:", message);
console.log("KEYWORD:", keyword);

// Trace execution chain
if (/trace/i.test(message) &&
    !/what does|callees|where is|where.*defined|definition/i.test(message)) {

  const actualFunctionName = resolveFunctionName(keyword);

  // Trace both callers and callees
  if (/trace\s+both/i.test(message)) {

    const callers = projectGraph.traceCallers(actualFunctionName);
    const chain = projectGraph.traceCallees(actualFunctionName);

    const lines = [];

    lines.push(`🔗 Bidirectional Trace\n`);
    lines.push(`${actualFunctionName}()\n`);

    // Backward trace
    lines.push(`← Called by:`);

      if (callers.length > 0) {
        for (const caller of callers) {
          const indent = "  ".repeat(caller.depth + 1);
          lines.push(
            `${indent}← ${caller.caller}() — ${caller.file}:${caller.line}`
          );
        }
      } else {
        lines.push(`  ← No project callers detected.`);
      }
    // Forward trace
    lines.push(`\n→ Calls:`);

    if (chain.length > 0) {
      for (const item of chain) {
        const indent = "  ".repeat(item.depth + 1);

        const location =
          item.calleeFile && item.calleeLine
            ? ` — ${item.calleeFile}:${item.calleeLine}`
            : "";

        lines.push(
          `${indent}→ ${item.callee}()${location}`
        );
      }
    } else {
      lines.push(`  → No project function calls detected.`);
    }

    return {
      found: true,
      reply: lines.join("\n")
    };
  }

  // Normal forward execution trace
  const chain = projectGraph.traceCallees(actualFunctionName);

  if (chain.length > 0) {
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
`🔗 Execution Trace

${actualFunctionName}()

${lines.join("\n")}`
    };
  }

  return {
    found: true,
    reply:
`🔗 Execution Trace

${actualFunctionName}()

No project function calls detected.`
  };
}
 // Where is a function defined?
  if (/where is|where.*defined|definition/i.test(message)) {
    const actualFunctionName = resolveFunctionName(keyword);
    const result = locateFunction(actualFunctionName);
    if (result.found) {
      return result;
    }
  }

// Who calls a function?
if (/what calls|who calls|called by/i.test(message)) {
const actualFunctionName = resolveFunctionName(keyword);
const callers = projectSearch.findCallers(actualFunctionName);

  if (callers.length > 0) {
    return {
      found: true,
      reply:
`🔍 ${actualFunctionName}()

Called from:

${callers
  .map(c => `• ${c.file}\n  Line ${c.line}`)
  .join("\n\n")}
Total files: ${callers.length}`
    };
  }
}
// What does a function call?
if (/what does|callees/i.test(message)) {
  const actualFunctionName = resolveFunctionName(keyword);
  const functionInfo = projectSearch.findFunction(actualFunctionName);

  if (functionInfo.length === 0) {
    return {
      found: false,
      reply: `❌ I couldn't find ${actualFunctionName}() in the project.`
    };
  }
 const callees = findCallees(actualFunctionName);

  if (callees.length > 0) {
    return {
      found: true,
      reply:
`🔍 ${actualFunctionName}()

Calls:

${callees
  .map(c => `• ${c.callee}()\n  File: ${c.file}`)
  .join("\n\n")}

Total calls: ${callees.length}`
    };
  }

  return {
    found: true,
    reply:
`🔍 ${actualFunctionName}()

Calls:

• No other project functions detected.

Note: external/library calls are not included in the project call graph.`
  };
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
  // Full Function Analysis
  if (/full analysis|analyze|everything about|explain function/i.test(message)) {

    let report = [];

    const analysis = analyzeFunction(keyword);
    if (analysis.found) {
      report.push(analysis.reply);
    }

    const callers = reverseCallGraph(keyword);
    if (callers.found) {
      report.push("\n====================\n");
      report.push(callers.reply);
    }

    const execution = buildExecutionGraph(keyword);
    if (execution.found) {
      report.push("\n====================\n");
      report.push(execution.reply);
    }

    const impact = analyzeFunctionImpact(keyword);
    if (impact.found) {
      report.push("\n====================\n");
      report.push(impact.reply);
    }

    if (report.length > 0) {
      return {
        found: true,
        reply: report.join("\n")
      };
    }
  }
// Feature Reasoning
if (/how does .* work|feature|system/i.test(message)) {

  const result = explainFeature(keyword);

  if (result.found) {
    return result;
  }

}
  // Function Execution Explanation
  if (/explain execution|execution flow of|how .* executes|explain .* execution|execution of/i.test(message)) {
    const actualFunctionName = resolveFunctionName(keyword);

    const result = explainExecution(message);

    if (result.found) {
      return result;
    }

    const functionResult = explainExecution(actualFunctionName);

    if (functionResult.found) {
      return functionResult;
    }
  }
// Function Reasoning
if (/^why\b|^explain\b|purpose|reason/i.test(message)) {

  const result = explainFunctionReason(keyword);

  if (result.found) {
    return result;
  }

}
// Recursive Execution
if (/trace|full execution|execution trace|recursive execution/i.test(message)) {

  const lines = buildRecursiveExecution(keyword);

  return {
    found: true,
    reply: lines.join("\n")
  };

}
// Call Hierarchy
if (/call hierarchy|hierarchy|what calls|trace callers|caller chain/i.test(message)) {

console.log("CALL HIERARCHY BLOCK:", message, keyword);

  const result = buildCallHierarchy(keyword);

  if (result.found) {
    return result;
  }

}
// Execution Graph
if (/execution graph|show execution graph/i.test(message)) {

  if (keyword === "graph") {
    return {
      found: true,
      reply:
        "🕸 Execution Graph\n\n" +
        "An execution graph shows how a specific function is reached and which functions call it.\n\n" +
        "For example, you can ask:\n" +
        "• show execution graph for buildAutoExecutionPipeline\n" +
        "• execution graph for answerProjectQuestion\n\n" +
        "This lets SamuAI trace the execution path through the project."
    };
  }

  const result = buildExecutionGraph(keyword);

  if (result.found) {
    return result;
  }

}

// Execution Pipeline
if (/execution pipeline|pipeline|execution flow/i.test(message)) {

  const result =
buildAutoExecutionPipeline(keyword);
  if (result.found) {
    return result;
  }

}
// Full Execution Tree
if (/execution tree|full tree|tree/i.test(message)) {

  const lines = buildExecutionTree(keyword);

  return {
    found: true,
    reply:
      "🌳 Full Execution Tree\n\n" +
      lines.join("\n")
  };

}
// Project Architecture
if (/architecture|project architecture|show architecture/i.test(message)) {
  return explainArchitecture();
}
// Project Graph
if (/project graph|show project graph/i.test(message)) {

  const graph = buildProjectGraph();

  return {
    found: true,
    reply:
      "🕸 Project Graph\n\n" +
      JSON.stringify(graph, null, 2)
  };

}

// Execution path to a specific function
if (/execution path|flow to|path to/i.test(message)) {

  const result = reasonAboutFunction(keyword);

  if (result.found) {
    return result;
  }

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
// Full reasoning about a function
if (/reason|full analysis|everything about|analyze completely/i.test(message)) {

  const result = reasonAboutFunction(keyword);

  if (result.found) {
    return result;
  }

}
 // Analyze a specific function
if (/explain|analyze|details about/i.test(message)) {

  const result = analyzeFunction(keyword);

  if (result.found) {
    return result;
  }

}
// Function Impact Analysis
if (/what affects|function impact|what happens if.*change|what breaks.*change|impact of/i.test(message)) {

  const result = analyzeFunctionImpact(keyword);

  if (result.found) {
    return result;
  }

}
// Reverse Call Graph
if (/execution path|reverse call graph|path to|who reaches/i.test(message)) {

  const result = reverseCallGraph(keyword);

  if (result.found) {
    return result;
  }

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

${projectSearch.loadIndex()
  .find(f => f.file === file.file)
  .functions
  .map(f => "• " + f.name + "()")
  .join("\n")}`
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
