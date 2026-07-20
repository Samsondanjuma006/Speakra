require("dotenv").config();

const { search } = require("./services/search");

(async () => {
  try {
    const result = await search("Latest AI news");
    console.log(result.answer);
    console.log(result.results);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
