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

  // Prefer the complete function body stored in the project index.
  // Fall back to reading the source file for older indexes.
  let code = file.body || "";

  if (!code) {
    const fullPath = path.join(process.cwd(), file.file);

    if (fs.existsSync(fullPath)) {
      const lines = fs.readFileSync(fullPath, "utf8").split("\n");
      const startLine = Math.max(0, file.line - 3);
      const endLine = Math.min(lines.length, file.line + 4);

      code = lines
        .slice(startLine, endLine)
        .map((line, index) => {
          const lineNumber = startLine + index + 1;
          return `${lineNumber}  ${line}`;
        })
        .join("\n");
    }
  }

  const calls = file.calls || [];
  const body = code;

  // -----------------------------
  // Function Intelligence
  // -----------------------------

  const intelligence = [];

  // Input validation
  if (
    /if\s*\(\s*!?\s*[A-Za-z_][A-Za-z0-9_]*/.test(body) &&
    /throw new Error/i.test(body)
  ) {
    intelligence.push("Validates input and rejects invalid data.");
  }

  // Reads data
  if (
    /\b(get[A-Z][A-Za-z0-9_]*|read[A-Z][A-Za-z0-9_]*)\s*\(/.test(body) ||
    /\breadJson\s*\(/.test(body) ||
    /\breadFile\s*\(/.test(body)
  ) {
    intelligence.push("Reads existing data before performing its operation.");
  }

  // Writes data
  if (
    /\b(save[A-Z][A-Za-z0-9_]*|write[A-Z][A-Za-z0-9_]*)\s*\(/.test(body) ||
    /\bwriteJson\s*\(/.test(body) ||
    /\bwriteFile\s*\(/.test(body)
  ) {
    intelligence.push("Writes or persists data.");
  }

  // Array search / duplicate detection
  if (
    /\.find\s*\(/.test(body) ||
    /\.findIndex\s*\(/.test(body)
  ) {
    intelligence.push("Searches a collection to locate an existing item.");
  }

  // Array insertion
  if (
    /\.push\s*\(/.test(body)
  ) {
    intelligence.push("Adds a new item to a collection.");
  }

  // Object creation
  if (
    /const\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*\{/.test(body)
  ) {
    intelligence.push("Constructs an object containing processed data.");
  }

  // Return behavior
  if (/return\s+\[\s*\]/.test(body)) {
    intelligence.push("Can return an empty collection when no data exists.");
  }

  if (/return\s+new[A-Za-z0-9_]*/.test(body)) {
    intelligence.push("Returns newly created data.");
  }

  if (/return\s+[A-Za-z_][A-Za-z0-9_]*/.test(body)) {
    intelligence.push("Returns a computed or retrieved value.");
  }

  // Async behavior
  if (/async\s+function/.test(body) || /\bawait\s+/.test(body)) {
    intelligence.push("Performs asynchronous operations.");
  }

  // Calls detected by the project index
  if (calls.length > 0) {
    const uniqueCalls = [
      ...new Set(calls.map(call => call.name))
    ];

    intelligence.push(
      `Uses project functions: ${uniqueCalls.map(name => `${name}()`).join(", ")}.`
    );
  }

  if (intelligence.length === 0) {
    intelligence.push(
      "Purpose could not be inferred automatically from the indexed code."
    );
  }

  // -----------------------------
  // Summary
  // -----------------------------

  let summary = `This function is named ${functionName}.`;

  if (
    /customer/i.test(functionName) &&
    /\.push\s*\(/.test(body) &&
    /saveCustomers\s*\(/.test(body)
  ) {
    summary =
      "Adds a customer to the business customer list, prevents duplicate customer IDs, and saves the updated customer data.";
  } else if (/remember/i.test(functionName)) {
    summary =
      "Stores important user information into SamuAI's long-term memory and updates the saved profile.";
  } else if (/search/i.test(functionName)) {
    summary =
      "Searches the project index to locate files, functions or dependencies.";
  } else if (/load/i.test(functionName)) {
    summary =
      "Loads information from disk into memory.";
  } else if (/save/i.test(functionName)) {
    summary =
      "Writes information from memory back to disk.";
  }

  // -----------------------------
  // Callers
  // -----------------------------

  const callers = projectSearch.findCallers(functionName);

  const callerText =
    callers.length > 0
      ? callers
          .map(c => `• ${c.file} — Line ${c.line}`)
          .join("\n")
      : "No callers found.";

  // -----------------------------
  // Dependencies
  // -----------------------------

  const dependencyText =
    file.requires && file.requires.length > 0
      ? file.requires
          .map(r => `• ${r.module} — Line ${r.line}`)
          .join("\n")
      : "No dependencies found.";

  const intelligenceText = intelligence
    .map(item => `• ${item}`)
    .join("\n");

  return {
    found: true,
    summary,
    intelligence,
    file,
    callers,
    dependencies: file.requires || [],
    calls,
    code,

    reply:
`🧠 Function Analysis

Function: ${functionName}()

📖 Summary:
${summary}

🧠 Function Intelligence:
${intelligenceText}

📍 Defined in:
${file.file} — Line ${file.line}

🔗 Called from:
${callerText}

📞 Calls:
${
  calls.length > 0
    ? calls
        .map(c => `• ${c.name}() — Line ${c.line}`)
        .join("\n")
    : "No project functions called."
}

📦 Dependencies:
${dependencyText}

📝 Code:
${code}`
  };
}

module.exports = {
  analyzeFunction
};
