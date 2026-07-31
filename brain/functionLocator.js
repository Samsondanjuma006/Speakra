const fs = require("fs");
const path = require("path");
const projectSearch = require("../index/searchIndex");

function locateFunction(name) {

  const result = projectSearch.findFunction(name);

  if (result.length === 0) {
    return {
      found: false
    };
  }

  const file = result[0];

  const fullPath = path.join(process.cwd(), file.file);

  if (!fs.existsSync(fullPath)) {
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

  const lines = fs.readFileSync(fullPath, "utf8").split("\n");

  const start = Math.max(0, file.line - 3);
  const end = Math.min(lines.length, file.line + 2);

  const context = lines
    .slice(start, end)
    .map((line, index) => {
      const lineNumber = start + index + 1;
      return `${lineNumber}  ${line}`;
    })
    .join("\n");

  return {
    found: true,
    reply:
`📍 ${name}()

File:
${file.file}

Line:
${file.line}

Code:
${context}`
  };

}

module.exports = {
  locateFunction
};
