const fs = require("fs");
const path = require("path");
const projectSearch = require("../index/searchIndex");

function analyzeFunction(functionName) {
  const results = projectSearch.findFunction(functionName);

  if (results.length === 0) {
    return {
      found: false
    };
  }

  const file = results[0];

  const fullPath = path.join(process.cwd(), file.file);

  let code = "";

  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, "utf8").split("\n");

    const start = Math.max(0, file.line - 3);
    const end = Math.min(lines.length, file.line + 4);

    code = lines
      .slice(start, end)
      .map((line, index) => {
        const lineNumber = start + index + 1;
        return `${lineNumber}  ${line}`;
      })
      .join("\n");
  }

  const callers = projectSearch.findCallers(functionName);

  const callerText =
    callers.length > 0
      ? callers
          .map(c => `• ${c.file} — Line ${c.line}`)
          .join("\n")
      : "No callers found.";

  const dependencyText =
    file.requires && file.requires.length > 0
      ? file.requires
          .map(r => `• ${r.module} — Line ${r.line}`)
          .join("\n")
      : "No dependencies found.";

  return {
    found: true,
    reply:
`🧠 Function Analysis

Function:
${functionName}()

📍 Defined in:
${file.file} — Line ${file.line}

🔗 Called from:
${callerText}

📦 Dependencies:
${dependencyText}

📝 Code:
${code}`
  };
}

module.exports = {
  analyzeFunction
};
