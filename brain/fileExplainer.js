const projectSearch = require("../index/searchIndex");

function explainFile(fileName) {
  const files = projectSearch.loadIndex();

  const file = files.find(f =>
    f.file.toLowerCase() === fileName.toLowerCase()
  );

  if (!file) {
    return {
      found: false
    };
  }

  let reply = `📄 ${file.file}\n\n`;

  if (file.functions.length > 0) {
    reply += "Functions:\n";
    reply += file.functions.map(f => "• " + f + "()").join("\n");
    reply += "\n\n";
  }

  if (file.arrowFunctions.length > 0) {
    reply += "Arrow Functions:\n";
    reply += file.arrowFunctions.map(f => "• " + f).join("\n");
    reply += "\n\n";
  }

  if (file.requires.length > 0) {
    reply += "Dependencies:\n";
    reply += file.requires.map(r => "• " + r).join("\n");
  }

  return {
    found: true,
    reply
  };
}

module.exports = {
  explainFile
};
