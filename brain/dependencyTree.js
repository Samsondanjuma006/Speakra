const projectSearch = require("../index/searchIndex");

function dependencyTree(fileName) {

  const index = projectSearch.loadIndex();

  const file = index.find(f => f.file.endsWith(fileName));

  if (!file) {
    return {
      found: false
    };
  }

  let reply = `🌳 Dependency Tree\n\n${file.file}\n`;

  if (file.requires.length === 0) {
    reply += "\n(No dependencies)";
  } else {

    for (const dep of file.requires) {
      reply += `├── ${dep}\n`;
    }

  }

  return {
    found: true,
    reply
  };

}

module.exports = {
  dependencyTree
};
