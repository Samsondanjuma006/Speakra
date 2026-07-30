const fs = require("fs");
const path = require("path");

const INDEX_FILE = path.join(__dirname, "project-index.json");

function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
}

function findFunction(name) {
  const index = loadIndex();

  return index.filter(file =>
    file.functions.includes(name) ||
    file.arrowFunctions.includes(name)
  );
}

function findRequire(moduleName) {
  const index = loadIndex();

  return index.filter(file =>
    file.requires.some(r => r.includes(moduleName))
  );
}
function findUsedBy(fileName) {
  const index = loadIndex();

  return index.filter(file =>
    file.requires.some(req =>
      req.endsWith(fileName.replace(".js", "")) ||
      req.endsWith(fileName)
    )
  );
}
function listFiles() {
  return loadIndex().map(file => file.file);
}
function findCallers(functionName) {
  const index = loadIndex();

  const results = [];

  for (const file of index) {
    for (const call of file.calls) {
      if (call.name === functionName) {
        results.push({
          file: file.file,
          line: call.line
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
