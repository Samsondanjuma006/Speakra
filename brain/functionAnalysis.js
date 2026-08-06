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
// Generate a simple explanation of the function
let summary = `This function is named ${functionName}.`;

if (/remember/i.test(functionName)) {
  summary =
    "This function stores important user information into SamuAI's long-term memory and updates the saved profile.";
}
else if (/search/i.test(functionName)) {
  summary =
    "This function searches the project index to locate files, functions or dependencies.";
}
else if (/load/i.test(functionName)) {
  summary =
    "This function loads information from disk into memory.";
}
else if (/save/i.test(functionName)) {
  summary =
    "This function writes information from memory back to disk.";
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

// Function Intelligence
let intelligence = [];

if (/remember/i.test(functionName)) {
  intelligence.push("Stores user memory permanently.");
  intelligence.push("Reads profile.json.");
  intelligence.push("Updates profile.json.");
}

if (/save/i.test(functionName)) {
  intelligence.push("Writes data to disk.");
}

if (/load/i.test(functionName)) {
  intelligence.push("Reads data from disk.");
}

if (/find/i.test(functionName)) {
  intelligence.push("Searches project information.");
}

if (/build/i.test(functionName)) {
  intelligence.push("Constructs project structures.");
}

if (intelligence.length === 0) {
  intelligence.push("Purpose could not be inferred automatically.");
}

const intelligenceText = intelligence
  .map(i => `• ${i}`)
  .join("\n");
  return {
    found: true,
    
reply:
`🧠 Function Analysis

Function:
${functionName}()

📖 Summary:
${summary}

🧠 Function Intelligence:
${intelligenceText}

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

