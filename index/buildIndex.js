const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const SKIP = new Set([
  "node_modules",
  ".git",
  "uploads",
  "index",
  "backups"
]);

const BACKUP_PATTERNS = [
  "test-current.js",
  "temp.js",
  "backup",
  "working",
  "before",
  "broken",
  "recovery",
  ".bak",
  ".current"
];

const index = [];

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {

    if (SKIP.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scan(full);
      continue;
    }

    if (!entry.name.endsWith(".js")) continue;

    if (BACKUP_PATTERNS.some(pattern => entry.name.includes(pattern))) {
      continue;
    }

    const text = fs.readFileSync(full, "utf8");

const lines = text.split("\n");

let inBlockComment = false;

function stripComments(line) {
  let result = "";
  let i = 0;

  while (i < line.length) {
    if (!inBlockComment && line.startsWith("//", i)) {
      break;
    }

    if (!inBlockComment && line.startsWith("/*", i)) {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (inBlockComment && line.startsWith("*/", i)) {
      inBlockComment = false;
      i += 2;
      continue;
    }

    if (!inBlockComment) {
      result += line[i];
    }

    i++;
  }

  return result;
}
function stripStrings(line) {
  let result = "";
  let quote = null;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escaped) {
      escaped = false;
      result += " ";
      continue;
    }

    if (quote && ch === "\\") {
      escaped = true;
      result += " ";
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      }
      result += " ";
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      result += " ";
      continue;
    }

    result += ch;
  }

  return result;
}
const functions = [];
const arrowFunctions = [];
const calls = [];
const projectFunctions = new Set();
let currentFunction = null;
lines.forEach((line, index) => {

const codeLine = stripStrings(stripComments(line));

const normal = codeLine.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)/);

if (normal) {
  currentFunction = normal[1];

functions.push({
  name: normal[1],
  line: index + 1,
  file: full.replace(ROOT + path.sep, ""),
  type: "function",
  calls: []
});

  projectFunctions.add(normal[1]);
}
const arrow = codeLine.match(
  /const\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/
);

if (arrow) {
  currentFunction = arrow[1];

  arrowFunctions.push({
    name: arrow[1],
    line: index + 1,
    file: full.replace(ROOT + path.sep, ""),
    type: "arrow",
    calls: []
  });

  projectFunctions.add(arrow[1]);
}

// Detect inline arrow callbacks such as:
// router.post("/", async (req, res) => {
const inlineArrow = codeLine.match(
  /([A-Za-z_][A-Za-z0-9_.]*)\s*\([^)]*\s*,?\s*(?:async\s*)?\([^)]*\)\s*=>/
);
if (inlineArrow) {
  const callbackTarget = inlineArrow[1];

  if (callbackTarget === "app.post") {
    currentFunction = "POST /chat callback";
  } else if (callbackTarget === "app.get") {
    currentFunction = "GET route callback";
  } else if (callbackTarget === "router.post") {
    currentFunction = "POST route callback";
  } else if (callbackTarget === "router.get") {
    currentFunction = "GET route callback";
  } else {
    currentFunction = callbackTarget + " callback";
  }
}
const matches = [
  ...codeLine.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)
];

const ignore = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "function",
  "require",
  "console",
  "message",
  "req",
  "res",
  "next",
  "callback",
  "resolve",
  "reject"
]);

for (const match of matches) {
  const name = match[1];

  if (ignore.has(name)) continue;
  if (name === currentFunction) continue;

  calls.push({
    caller: currentFunction,
    callee: name,
    file: full.replace(ROOT + path.sep, ""),
    line: index + 1
  });
}

});
const requires = [
  ...text.matchAll(/require\(["'](.+?)["']\)/g)
].map(match => {
  const before = text.slice(0, match.index);
  const line = before.split("\n").length;

  return {
    module: match[1],
    line
  };
});


for (const call of calls) {
  const fn =
    functions.find(f => f.name === call.caller) ||
    arrowFunctions.find(f => f.name === call.caller);

  if (fn && !fn.calls.includes(call.callee)) {
    fn.calls.push(call.callee);
  }
}
   index.push({
      file: full.replace(ROOT + path.sep, ""),
      functions,
      arrowFunctions,
      requires,
      calls
    });
  }
}
scan(ROOT);

// Build the complete set of project functions
const allProjectFunctions = new Set();

for (const file of index) {
  for (const fn of [...(file.functions || []), ...(file.arrowFunctions || [])]) {
    allProjectFunctions.add(fn.name);
  }
}

// Keep only calls to functions that exist in the project
for (const file of index) {
  file.calls = file.calls.filter(call =>
    allProjectFunctions.has(call.callee)
  );

  for (const fn of [...(file.functions || []), ...(file.arrowFunctions || [])]) {
    fn.calls = fn.calls.filter(callee =>
      allProjectFunctions.has(callee)
    );
  }
}


fs.writeFileSync(
  path.join(ROOT, "index", "project-index.json"),
  JSON.stringify(index, null, 2)
);

console.log(`Indexed ${index.length} JavaScript files.`);

