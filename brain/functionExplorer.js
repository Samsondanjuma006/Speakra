const projectSearch = require("../index/searchIndex");

function listFunctions(fileName) {

  const index = projectSearch.loadIndex();

  const file = index.find(f => f.file.endsWith(fileName));

  if (!file) {
    return {
      found: false
    };
  }

  const functions = [
    ...file.functions,
    ...file.arrowFunctions
  ];

  if (functions.length === 0) {
    return {
      found: true,
      reply:
`📄 ${file.file}

No functions found.`
    };
  }

  return {
    found: true,
    reply:
`📄 ${file.file}

Functions:

${functions
  .map(f => `• ${f.name}() — Line ${f.line}`)
  .join("\n")}

  Total: ${functions.length}`
    };
}

module.exports = {
  listFunctions
};
