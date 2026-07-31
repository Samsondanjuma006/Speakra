const projectSearch = require("../index/searchIndex");

function locateFunction(name) {

  const result = projectSearch.findFunction(name);

  if (result.length === 0) {
    return {
      found: false
    };
  }

  const file = result[0];

  return {
    found: true,
    reply:
`📍 ${name}()

File:
${file.file}

Line:
${file.line}`
  };

}

module.exports = {
  locateFunction
};
