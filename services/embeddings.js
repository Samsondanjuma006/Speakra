const fs = require("fs-extra");

const path = require("path");

const VECTOR_FILE = path.join(__dirname, "../data/vectors/index.json");

async function loadVectors() {
  try {
    return await fs.readJson(VECTOR_FILE);
  } catch {
    return [];
  }
}

async function saveVectors(vectors) {
  await fs.outputJson(VECTOR_FILE, vectors, {
    spaces: 2
  });
}

module.exports = {
  loadVectors,
  saveVectors
};
