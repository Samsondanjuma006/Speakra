const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});
async function chatGroq(messages) {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.log("========== GROQ ERROR ==========");

    if (err.status) {
      console.log("Status:", err.status);
    }

    console.log(err.message);

    throw err;
  }
}

module.exports = { chatGroq };
