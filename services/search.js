const axios = require("axios");

async function search(query) {
  const response = await axios.post(
    "https://api.tavily.com/search",
    {
      query,
      search_depth: "basic",
      include_answer: true,
      max_results: 5
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
}

module.exports = { search };
