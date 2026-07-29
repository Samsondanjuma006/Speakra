const fs = require("fs");

const file = "data/vectors/index.json";

const vectors = JSON.parse(fs.readFileSync(file, "utf8"));

const unique = new Map();

for (const vector of vectors) {
  unique.set(vector.file, vector);
}

const cleaned = [...unique.values()];

fs.writeFileSync(file, JSON.stringify(cleaned, null, 2));

console.log("Original vectors:", vectors.length);
console.log("Unique vectors:", cleaned.length);
console.log("Duplicates removed:", vectors.length - cleaned.length);
