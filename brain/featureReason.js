const projectSearch = require("../index/searchIndex");

function explainFeature(feature) {

  const index = projectSearch.loadIndex();

  const keyword = feature.toLowerCase();

  const files = [];

  for (const file of index) {

    const name = file.file.toLowerCase();

    if (name.includes(keyword)) {
      files.push(file.file);
      continue;
    }

    const allFunctions = [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ];

    if (
      allFunctions.some(fn =>
        fn.name.toLowerCase().includes(keyword)
      )
    ) {
      files.push(file.file);
    }

  }

  if (files.length === 0) {
    return {
      found: false
    };
  }

  return {
    found: true,
    reply:
`🧠 Feature Analysis

Feature:
${feature}

Files involved:

${files.map(f => "• " + f).join("\n")}

Total files:
${files.length}`
  };

}

module.exports = {
  explainFeature
};
