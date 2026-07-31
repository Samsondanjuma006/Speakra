const fs = require("fs");
const path = require("path");
const projectSearch = require("../index/searchIndex");

function traceFunction(functionName) {

  const callers = projectSearch.findCallers(functionName);

  if (callers.length === 0) {
    return {
      found: false
    };
  }

  const sections = callers.map(c => {

    const fullPath = path.join(process.cwd(), c.file);

    if (!fs.existsSync(fullPath)) {
      return `• ${c.file}
  Line ${c.line}`;
    }

    const lines = fs.readFileSync(fullPath, "utf8").split("\n");

    const start = Math.max(0, c.line - 2);
    const end = Math.min(lines.length, c.line + 1);

    const context = lines
      .slice(start, end)
      .map((line, index) => {
        const lineNumber = start + index + 1;
        return `${lineNumber}  ${line}`;
      })
      .join("\n");

    return `${c.file}
Line ${c.line}

${context}`;
  });

  return {
    found: true,
    reply:
`🔗 Call Chain

Function:
${functionName}()

Called from:

${sections.join("\n\n")}`
  };

}

module.exports = {
  traceFunction
};
