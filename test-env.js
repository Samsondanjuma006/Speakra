require("dotenv").config();

console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY ? "OK" : "MISSING");
console.log("TAVILY:", process.env.TAVILY_API_KEY ? "OK" : "MISSING");
