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

const functions = [];
const arrowFunctions = [];
const calls = [];
const projectFunctions = new Set();
let currentFunction = null;
lines.forEach((line, index) => {

const normal = line.match(/(?:async\s+)?function\s+([A-Za-z0-9_]+)/);

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
const arrow = line.match(
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

const matches = [
  ...line.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)
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

console.log(calls[calls.length - 1]);

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

fs.writeFileSync(
  path.join(ROOT, "index", "project-index.json"),
  JSON.stringify(index, null, 2)
);

console.log(`Indexed ${index.length} JavaScript files.`);

