require("dotenv").config();

const { chat } = require("./services/ai");
const memoryPrompt = require("./memoryPrompt");
const { chatGroq } = require("./services/groq");

async function extractMemory(message) {
 
let reply;

try {
  reply = await chat([
    {
      role: "system",
      content: memoryPrompt
    },
    {
      role: "user",
      content: message
    }
  ]);
} catch (err) {
  if (err.response?.status === 429) {
    console.log("Memory extractor: falling back to Groq...");
    reply = await chatGroq([
      {
        role: "system",
        content: memoryPrompt
      },
      {
        role: "user",
        content: message
      }
    ]);
  } else {
    throw err;
  }
}  

 try {
    return JSON.parse(reply);
  } catch {
    return {};
  }
}

module.exports = {
  extractMemory
};
