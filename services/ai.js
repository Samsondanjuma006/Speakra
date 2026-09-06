const axios = require("axios");

let openRouterBlockedUntil = 0;

function openRouterAvailable() {
  return Date.now() >= openRouterBlockedUntil;
}

async function chat(messages) {
  try {
    if (!openRouterAvailable()) {
      const err = new Error("OpenRouter is temporarily blocked.");
      err.response = { status: 429 };
      throw err;
    }

    console.log("Sending request to OpenRouter...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
{
  model: "openai/gpt-3.5-turbo",
  messages: messages,
max_tokens: 128
},
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "Speakra"
        }
      }
    );

    console.log("OpenRouter replied.");
    return response.data.choices[0].message.content;

  } catch (err) {
    console.log("========== OPENROUTER ERROR ==========");

    if (err.response?.status === 429) {
      openRouterBlockedUntil = Date.now() + 30 * 60 * 1000;
      console.log("OpenRouter disabled for 30 minutes.");
    }

   if (
  err.code === "ECONNRESET" ||
  err.code === "ETIMEDOUT" ||
  err.code === "ENOTFOUND"
) {
  err.response = { status: 429 };
}

   if (err.response) {
      console.log("Status:", err.response.status);
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }

    throw err;
  }
}

module.exports = { chat };
