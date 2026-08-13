const fs = require("fs");
const path = require("path");

const INDEX_FILE = path.join(__dirname, "project-index.json");

function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
}
function findFunction(name) {
  const index = loadIndex();

  const results = [];

  for (const file of index) {

    const normal = file.functions.find(f => f.name === name);

if (normal) {
  results.push({
    file: file.file,
    line: normal.line,
    type: "function",
    requires: file.requires
  });
}
    const arrow = file.arrowFunctions.find(f => f.name === name);

if (arrow) {
  results.push({
    file: file.file,
    line: arrow.line,
    type: "arrow",
    requires: file.requires
  });
}

  }

  return results;
}
function findRequire(moduleName) {
  const index = loadIndex();

  return index.filter(file =>
    file.requires.some(r =>
      r.module.includes(moduleName)
    )
  );
}
function findUsedBy(fileName) {
  const index = loadIndex();

  const results = [];

  for (const file of index) {

    const dependency = file.requires.find(req =>
      req.module.endsWith(fileName.replace(".js", "")) ||
      req.module.endsWith(fileName)
    );

    if (dependency) {
      results.push({
        file: file.file,
        line: dependency.line
      });
    }

  }

  return results;
}
function listFiles() {
  return loadIndex().map(file => file.file);
}
function findCallers(functionName) {
  const index = loadIndex();
  const results = [];

  for (const file of index) {
    for (const call of (file.calls || [])) {
      if (call.callee === functionName) {
        results.push({
          file: file.file,
          line: call.line,
          caller: call.caller
        });
      }
    }
  }

  return results;
}

module.exports = {
  loadIndex,
  findFunction,
  findRequire,
  listFiles,
  findUsedBy,
  findCallers
};
