const express = require("express");
const fs = require("fs-extra");

const { chat } = require("../services/ai");
const { remember } = require("../memory");
const { extractFacts } = require("../utils/smartMemory");

const router = express.Router();

const MEMORY_FILE = "./data/memory.json";
const PROFILE_FILE = "./data/profile.json";

let history = [];
let profile = {};

async function loadMemory() {
  try {
    history = await fs.readJson(MEMORY_FILE);
  } catch {
    history = [
      {
        role: "system",
        content: "You are SamuAI, a friendly and helpful AI assistant."
      }
    ];
  }
}

async function saveMemory() {
  await fs.writeJson(MEMORY_FILE, history, {
    spaces: 2
  });
}

async function loadProfile() {
  try {
    profile = await fs.readJson(PROFILE_FILE);
  } catch {
    profile = {};
  }
}

router.post("/", async (req, res) => {
  try {
    const message = (req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }
await remember(message);

const factsFound = extractFacts(message);

if (Object.keys(factsFound).length > 0) {
  await mergeMemory(factsFound);
}
const profile = await getProfile();



    history.push({
      role: "user",
      content: message
    });

    let facts = "";

    if (profile.name)
      facts += `User's name is ${profile.name}.\n`;

    if (profile.favoriteColor)
      facts += `User's favorite color is ${profile.favoriteColor}.\n`;

    if (profile.city)
      facts += `User lives in ${profile.city}.\n`;

    if (profile.job)
      facts += `User works as ${profile.job}.\n`;

    if (profile.learning)
      facts += `User is learning ${profile.learning}.\n`;

    const messages = [
      {
        role: "system",
        content:
          "You are SamuAI, a friendly AI assistant.\n\nKnown facts:\n" +
          facts
      },
      ...history.filter(msg => msg.role !== "system")
    ];

    const reply = await chat(messages);

    history.push({
      role: "assistant",
      content: reply
    });

    if (history.length > 51) {
      history = [history[0], ...history.slice(-50)];
    }

    await saveMemory();

    res.json({
      reply
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      reply: "Sorry, I couldn't contact the AI."
    });
  }
});

(async () => {
  await loadMemory();
  await loadProfile();
})();

module.exports = router;
