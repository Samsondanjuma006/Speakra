const flows = {
  "chat": [
    "User sends a message",
    "server.js receives POST /chat",
    "Project Brain checks if it can answer locally",
    "Memory system stores important facts",
    "Profile is loaded",
    "If needed, web search is performed",
    "AI request is sent to OpenRouter",
    "Assistant reply is saved to memory",
    "Reply is returned to the user"
  ],

  "startup": [
    "server.js starts",
    "Environment variables are loaded",
    "Memory is loaded",
    "Profile is loaded",
    "Express routes are created",
    "Server begins listening on port 3000"
  ]
};

function explainExecution(topic) {
  const key = topic.toLowerCase();

  if (key.includes("chat") || key.includes("message")) {
    return {
      found: true,
      reply:
`🚀 Chat Execution Flow

${flows.chat.map((step, i) => `${i + 1}. ${step}`).join("\n")}`
    };
  }

  if (key.includes("startup") || key.includes("start")) {
    return {
      found: true,
      reply:
`🚀 Startup Execution Flow

${flows.startup.map((step, i) => `${i + 1}. ${step}`).join("\n")}`
    };
  }

  return { found: false };
}

module.exports = {
  explainExecution
};
