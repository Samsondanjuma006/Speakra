require("dotenv").config();
const { answerProjectQuestion } = require("./brain/projectBrain");

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs-extra");
const { remember } = require("./memory");
const { search } = require("./services/search");

const projectSearch = require("./index/searchIndex");
const { extractKeyword } = require("./index/projectQuery");

const app = express();
const PORT = process.env.PORT || 3000;
const whatsappRoutes = require("./whatsapp/whatsappRoutes");

app.use(cors());
app.use("/whatsapp", whatsappRoutes);
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

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
        content: "You are Speakra, a friendly and helpful AI assistant."
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

async function saveProfile() {
  await fs.writeJson(PROFILE_FILE, profile, {
    spaces: 2
  });
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

    // Automatically remember important facts
    await remember(message);

    // Reload profile after saving
    await loadProfile();

// Project Brain
const projectQuestion =
/function|trace|call|caller|chain|impact|dependency|used by|where|find|file|code|project|memory|brain|server|route|remember|execution|pipeline|startup/i.test(message);

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
history.push({
      role: "user",
      content: message
    });

    let facts = "";

    if (profile.name) {
      facts += `User's name is ${profile.name}.\n`;
    }

    if (profile.favoriteColor) {
      facts += `User's favorite color is ${profile.favoriteColor}.\n`;
    }

    if (profile.city) {
      facts += `User lives in ${profile.city}.\n`;
    }

    if (profile.job) {
      facts += `User works as ${profile.job}.\n`;
    }

    if (profile.learning) {
      facts += `User is learning ${profile.learning}.\n`;
    }    // Use Tavily for internet searches
    let searchContext = "";

    const needsSearch =
      /latest|today|news|search|look up|who is|what is|weather|price|score/i.test(message);

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
    (item, index) => `${index + 1}. ${item.title}
Source: ${item.url}`
  )
  .join("\n\n")}`;

      } catch (e) {
        console.error("Tavily search failed:", e.response?.data || e.message);
      }
    }

    const messages = [
      {
        role: "system",
        content:
          "You are Speakra, a friendly and helpful AI assistant.\n\nRemember these facts about the user:\n" +
         facts.slice(0, 300) +
         searchContext.slice(0, 800)
      },

      ...history.filter(msg => msg.role !== "system").slice(-1)

    ];    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
     {
      model: "openrouter/free",
      messages: messages,
      max_tokens: 200
     },

      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Speakra"
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    history.push({
      role: "assistant",
      content: reply
    });

    if (history.length > 51) {
      history = [
        history[0],
        ...history.slice(-50)
      ];
    }

    await saveMemory();

    res.json({
      reply
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

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
