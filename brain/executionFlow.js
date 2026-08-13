const projectGraph = require("./projectGraph");
const projectSearch = require("../index/searchIndex");

const flows = {
  chat: [
    "Browser sends POST /chat",
    "server.js receives the request",
    "Message is validated",
    "remember(message) stores important facts",
    "loadProfile() reloads the user profile",
    "Project Brain checks whether it can answer locally",
    "answerProjectQuestion(message) analyzes the project question",
    "If Project Brain finds an answer, the reply is returned immediately",
    "Otherwise the normal AI path continues",
    "User message is added to conversation history",
    "Profile facts are prepared for the AI",
    "The message is checked to determine whether web search is needed",
    "If needed, Tavily web search is performed",
    "AI messages are constructed",
    "Request is sent to OpenRouter",
    "Assistant reply is extracted",
    "Assistant reply is added to conversation history",
    "Conversation history is trimmed when necessary",
    "Memory is saved to disk",
    "Reply is returned to the browser"
  ],

  startup: [
    "server.js starts",
    "dotenv loads environment variables",
    "Memory and profile loading begin",
    "Express middleware is configured",
    "WhatsApp routes are mounted",
    "GET / and POST /chat routes are registered",
    "Static files are enabled",
    "Memory and profile finish loading",
    "Express begins listening on the configured port"
  ]
};

function explainFunctionExecution(functionName) {
  const direct = projectGraph.findCallees(functionName);

  const functionInfo = projectSearch.findFunction(functionName);

  if (functionInfo.length === 0) {
    return {
      found: false,
      reply: `❌ I couldn't find ${functionName}() in the project.`
    };
  }

  const lines = [];

  lines.push("🚀 Function Call Map");
  lines.push("");
  lines.push(`${functionName}()`);
  lines.push("");

  if (direct.length === 0) {
    lines.push("└─ No other project functions detected.");
  } else {
    for (const item of direct) {
      const location =
        item.file
          ? ` — ${item.file}`
          : "";

      lines.push(
        `↓ ${item.callee}()${location}`
      );
    }
  }

  lines.push("");
  lines.push("ℹ️ This shows direct project-function calls.");
  lines.push(
    "Conditional branches may execute only when their conditions match."
  );

  return {
    found: true,
    reply: lines.join("\n")
  };
}

function explainExecution(topic) {
  const key = topic.toLowerCase().trim();

  if (
    key.includes("chat") ||
    key.includes("message") ||
    key.includes("/chat")
  ) {
    return {
      found: true,
      reply:
`🚀 Chat Runtime Execution Flow

${flows.chat.map((step, i) => `${i + 1}. ${step}`).join("\n")}

🔀 Main decision:

POST /chat
   ↓
Project Brain
   ├─ found → return Project Brain reply
   └─ not found → continue to normal AI pipeline`
    };
  }

  if (
    key.includes("startup") ||
    key.includes("start")
  ) {
    return {
      found: true,
      reply:
`🚀 Startup Execution Flow

${flows.startup.map((step, i) => `${i + 1}. ${step}`).join("\n")}`
    };
  }

  const index = projectSearch.loadIndex();

  for (const file of index) {
    const functions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    const match = functions.find(
      fn =>
        fn.name.toLowerCase() === key ||
        key.includes(fn.name.toLowerCase())
    );

    if (match) {
      return explainFunctionExecution(match.name);
    }
  }

  return {
    found: false
  };
}

module.exports = {
  explainExecution,
  explainFunctionExecution
};
