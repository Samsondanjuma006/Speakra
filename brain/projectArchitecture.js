const projectSearch = require("../index/searchIndex");

function explainArchitecture() {

  const files = projectSearch.loadIndex();

  const groups = {
    Brain: [],
    Index: [],
    Services: [],
    Routes: [],
    Public: [],
    Data: [],
    Other: []
  };

  for (const file of files) {

    const name = file.file;

    if (name.startsWith("brain/")) {
      groups.Brain.push(name);
    } else if (name.startsWith("index/")) {
      groups.Index.push(name);
    } else if (name.startsWith("services/")) {
      groups.Services.push(name);
    } else if (name.startsWith("routes/")) {
      groups.Routes.push(name);
    } else if (name.startsWith("public/")) {
      groups.Public.push(name);
    } else if (name.startsWith("data/")) {
      groups.Data.push(name);
    } else {
      groups.Other.push(name);
    }

  }

  let reply = "🏗️ Project Architecture\n\n";

  for (const [section, list] of Object.entries(groups)) {

    if (list.length === 0) continue;

    reply += `${section}\n`;

    reply += list.map(f => `• ${f}`).join("\n");

    reply += "\n\n";

  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  explainArchitecture
};
