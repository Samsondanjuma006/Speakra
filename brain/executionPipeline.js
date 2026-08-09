const projectSearch = require("../index/searchIndex");

function buildExecutionPipeline(feature) {

  const keyword = feature.toLowerCase();

  const files = projectSearch.loadIndex();

  const pipeline = [];

  for (const file of files) {

    if (!file.file.toLowerCase().includes(keyword)) continue;

    pipeline.push(file.file);

  }

  if (pipeline.length === 0) {
    return {
      found: false
    };
  }

  return {
    found: true,
    reply:
`🚀 Execution Pipeline

Feature:
${feature}

Execution Flow

Browser
   │
   ▼
POST /chat
   │
${pipeline.join("\n↓\n")}`
  };

}

module.exports = {
  buildExecutionPipeline
};
