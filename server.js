require("dotenv").config();

const { answerProjectQuestion } = require("./brain/projectBrain");

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs-extra");
const { remember } = require("./memory");
const { search } = require("./services/search");

const app = express();

const PORT = process.env.PORT || 3000;

const MEMORY_FILE = "./data/memory.json";
const PROFILE_FILE = "./data/profile.json";

const MAX_STORED_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 20;

let history = [];
let profile = {};

const SYSTEM_MESSAGE = {
  role: "system",
  content: "You are Speakra, a friendly and helpful AI assistant."
};

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

async function loadMemory() {
  try {
    const savedHistory = await fs.readJson(MEMORY_FILE);

    if (Array.isArray(savedHistory)) {
      history = savedHistory.filter(
        message =>
          message &&
          typeof message === "object" &&
          (message.role === "user" || message.role === "assistant")
      );
    } else {
      history = [];
    }
  } catch {
    history = [];
  }
}

async function saveMemory() {
  await fs.writeJson(
    MEMORY_FILE,
    [SYSTEM_MESSAGE, ...history.slice(-MAX_STORED_MESSAGES)],
    {
      spaces: 2
    }
  );
}

async function loadProfile() {
  try {
    const savedProfile = await fs.readJson(PROFILE_FILE);

    if (
      savedProfile &&
      typeof savedProfile === "object" &&
      !Array.isArray(savedProfile)
    ) {
      profile = savedProfile;
    } else {
      profile = {};
    }
  } catch {
    profile = {};
  }
}

function buildProfileFacts() {
  const facts = [];

  if (profile.name) {
    facts.push(`User's name is ${profile.name}.`);
  }

  if (profile.favoriteColor) {
    facts.push(`User's favorite color is ${profile.favoriteColor}.`);
  }

  if (profile.city) {
    facts.push(`User lives in ${profile.city}.`);
  }

  if (profile.job) {
    facts.push(`User works as ${profile.job}.`);
  }

  if (profile.learning) {
    facts.push(`User is learning ${profile.learning}.`);
  }

  if (profile.favoriteLanguage) {
    facts.push(
      `User's favorite programming language is ${profile.favoriteLanguage}.`
    );
  }

  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    facts.push(
      `User's projects: ${profile.projects.join(", ")}.`
    );
  }

  if (Array.isArray(profile.goals) && profile.goals.length > 0) {
    facts.push(
      `User's goals: ${profile.goals.join("; ")}.`
    );
  }

  if (Array.isArray(profile.notes) && profile.notes.length > 0) {
    facts.push(
      `User's preferences/notes: ${profile.notes.join("; ")}.`
    );
  }

  return facts.join("\n");
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/chat", async (req, res) => {
  console.log(">>>>>>>> REQUEST FROM BROWSER <<<<<<<<");
  console.log(req.headers["user-agent"]);
  console.log(req.body);

  try {
    const message = (req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }

    /*
     * Stage 1 memory
     */
    await remember(message);
    await loadProfile();

    /*
     * Project Brain
     */
    const projectQuestion =
      /function|trace|call|caller|chain|impact|dependency|used by|where|find|file|code|project|memory|brain|server|route|remember|execution|pipeline|startup/i.test(
        message
      );

    if (projectQuestion) {
      console.log("MESSAGE:", message);

      const result = answerProjectQuestion(message);

      console.log("FOUND =", result.found);

      if (result.found) {
        console.log("ENTERED PROJECT BRAIN");

        return res.json({
          reply: "🔥 PROJECT BRAIN ACTIVE 🔥\n\n" + result.reply
        });
      }
    }

    /*
     * Store the user's message.
     */
    history.push({
      role: "user",
      content: message
    });

    /*
     * Stage 2 conversation context.
     *
     * The AI receives the most recent 20 conversation messages.
     * Older messages remain stored locally but are not sent on every request.
     */
    const recentHistory = history.slice(-MAX_CONTEXT_MESSAGES);

    /*
     * Profile memory
     */
    const facts = buildProfileFacts();

    /*
     * Tavily web search
     */
    let searchContext = "";

    const needsSearch =
      /latest|today|news|search|look up|who is|what is|weather|price|score/i.test(
        message
      );

    if (needsSearch) {
      try {
        const result = await search(message);

        console.log("===== TAVILY SEARCH =====");
        console.log(result);
        console.log("=========================");

        searchContext = `
LIVE WEB SEARCH RESULTS

Summary:
${result.answer || "No summary available."}

Top Results:

${(result.results || [])
  .slice(0, 2)
  .map(
    (item, index) =>
      `${index + 1}. ${item.title}
Source: ${item.url}`
  )
  .join("\n\n")}`;
      } catch (e) {
        console.error(
          "Tavily search failed:",
          e.response?.data || e.message
        );
      }
    }

    /*
     * Build the complete AI context.
     */
    const systemContent = [
      "You are Speakra, a friendly and helpful AI assistant.",
      "",
      "LONG-TERM USER MEMORY:",
      facts || "No saved user facts.",
      "",
      searchContext
    ].join("\n");

    const messages = [
      {
        role: "system",
        content: systemContent.slice(0, 4000)
      },
      ...recentHistory
    ];

    console.log(
      `Stage 2: sending ${recentHistory.length} conversation messages to AI`
    );

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages,
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://speakra.onrender.com",
          "X-Title": "Speakra"
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    /*
     * Store the assistant's reply.
     */
    history.push({
      role: "assistant",
      content: reply
    });

    /*
     * Keep only the most recent 50 conversation messages.
     */
    if (history.length > MAX_STORED_MESSAGES) {
      history = history.slice(-MAX_STORED_MESSAGES);
    }

    await saveMemory();

    res.json({
      reply
    });
  } catch (err) {
    console.error(
      err.response?.data || err.message
    );

    res.status(500).json({
      reply: "Sorry, I couldn't contact the AI."
    });
  }
});

Promise.all([
  loadMemory(),
  loadProfile()
]).then(() => {
  app.listen(PORT, () => {
    console.log(`Speakra is running on port ${PORT}`);
  });
});
