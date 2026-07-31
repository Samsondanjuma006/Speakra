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

lines.forEach((line, index) => {

  const normal = line.match(/function\s+([A-Za-z0-9_]+)/);

  if (normal) {
    functions.push({
      name: normal[1],
      line: index + 1
    });
  }

  const arrow = line.match(/const\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?\(/);

  if (arrow) {
    arrowFunctions.push({
      name: arrow[1],
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
const calls = [];

lines.forEach((line, index) => {

  const matches = [
    ...line.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)
  ];

  for (const match of matches) {

    const name = match[1];

    if (
      [
        "if",
        "for",
        "while",
        "switch",
        "catch",
        "function",
        "require",
        "console"
      ].includes(name)
    ) {
      continue;
    }

    calls.push({
      name,
      line: index + 1
    });
  }

});
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

