require("dotenv").config();

console.log("API key loaded:", !!
process.env.OPENROUTER_API_KEY);

const personality = require("./personality");
const { chat } = require("./services/ai");
const { chatGroq } = require("./services/groq");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs-extra");
const multer = require("multer");
const { remember, mergeMemory, getProfile, forget } = require("./memory");
const { search } = require("./services/search");
const { loadVectors, saveVectors } = require("./services/embeddings");
const memoryPrompt = require("./memoryPrompt");
const { extractMemory } = require("./memoryExtractor");

const app = express();
const PORT = process.env.PORT || 3000;

const path = require("path");

function detectLanguage(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();

  switch (ext) {
    case "js":
      return "JavaScript";
    case "jsx":
      return "React JSX";
    case "ts":
      return "TypeScript";
    case "tsx":
      return "React TypeScript";
    case "py":
      return "Python";
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    case "json":
      return "JSON";
    default:
      return "Unknown";
  }
}

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
      const allowed = [
  ".txt",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css"
];
const ext = path.extname(file.originalname).toLowerCase();

console.log("Uploading:", file.originalname, "Extension:", ext);

    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only text files are supported for now."));
    }
  }
});
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const MEMORY_FILE = "./data/memory.json";
const PROFILE_FILE = "./data/profile.json";
const UPLOAD_MAP_FILE = "./data/upload-map.json";

let history = [];
let profile = {};
let uploadedIndex = {};
let uploadedFiles = {};
function getRelevantFiles(question) {
  const q = question.toLowerCase();
  let result = "";

  for (const [filename, content] of Object.entries(uploadedFiles)) {
    if (
      q.includes(filename.toLowerCase()) ||
      content.toLowerCase().includes(q)
    ) {
      result +=
`FILE: ${filename}

${content}

END OF ${filename}

`;
    }
  }

  scored.sort((a, b) => b.score - a.score);

return scored.map(item => item.vector);

  }

async function getRelevantVectors(question) {

const vectors = await loadVectors();

const q = question.toLowerCase();

let result = [];

let scored = [];

for (const vector of vectors) {

let score = 0;

if (

  (q.includes(vector.file.toLowerCase()) && (score += 10)) ||
   
(vector.functions || []).some(fn => {

  if (
    q.includes(
      fn
        .replace(/^(function|const)\s+/, "")
        .replace(/\s*=.*$/, "")
        .replace(/\(.*/, "")
        .toLowerCase()
    )
  ) {
    score += 5;
    return true;
  }

  return false;
})
||
(vector.components || []).some(component =>
  
  q.includes(
    component
      .replace(/^const\s+/, "")
      .replace(/\s*=.*$/, "")
      .replace(/\(.*/, "")
      .toLowerCase()
  )
)
||
(vector.imports || []).some(imp =>
  q.includes(
  imp
    .split("/")
    .pop()
    .toLowerCase()
 )
)
||
vector.exports.some(exp =>
  q.includes(exp.toLowerCase())
)
) {

scored.push({
  vector,
  score
});

result.push(vector);

 }

}

return result;

} 

async function loadMemory() {
try {
    history = await fs.readJson(MEMORY_FILE);
  } catch {
    history = [
      {
        role: "system",
        content: "You are SamuAI, a friendly and helpful AI assistant."
      }
    ];
  }
}

async function saveMemory() {
  await fs.writeJson(MEMORY_FILE, history, {
    spaces: 2
  });
}

async function loadUploadedFiles() {
  uploadedFiles = {};
  uploadedIndex = {};

const uploadMap = await loadUploadMap();

  const files = await fs.readdir("uploads").catch(() => []);

  for (const file of files) {
    try {
      const content = await fs.readFile(`uploads/${file}`, "utf8");

      const originalName = uploadMap[file] || file;

uploadedFiles[originalName] = content;

      uploadedIndex[originalName] = {
        imports: [],
        functions: [],
        components: [],
        classes: [],
        exports: []
      };
    } catch (err) {
      console.log("Couldn't load", file);
    }
  }

  console.log("Loaded", Object.keys(uploadedFiles).length, "uploaded files.");
 

console.log("Uploaded file names:", Object.keys(uploadedFiles));
 }

async function loadUploadMap() {
  try {
    const text = await fs.readFile(UPLOAD_MAP_FILE, "utf8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function saveUploadMap(map) {
  await fs.writeFile(
    UPLOAD_MAP_FILE,
    JSON.stringify(map, null, 2),
    "utf8"
  );
}

async function loadProfile() {
  try {
    profile = await fs.readJson(PROFILE_FILE);
  } catch {
    profile = {};
  }
}

async function saveProfile() {
  await fs.writeJson(PROFILE_FILE, profile, {
    spaces: 2
  });
}

function findRelevantFiles(message) {
  const words = message.toLowerCase().split(/\W+/);

  const scoredMatches = [];

  for (const [filename, info] of Object.entries(uploadedIndex)) {
    const searchText = [
  filename,
  ...(info.imports || []),
  ...(info.functions || []),
  ...(info.components || []),
  ...(info.classes || []),
  ...(info.exports || [])
]
.join(" ")
.toLowerCase();

const fileContent = (uploadedFiles[filename] || "").toLowerCase();

    let score = 0;

for (const word of words) {
  if (searchText.includes(word)) score += 2;
  if (fileContent.includes(word)) score += 1;
}

if (score > 0) {
  scoredMatches.push({
    filename,
    score
  });
}
}
return scoredMatches
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map(item => item.filename);}
  
function findDependencies(target) {
  const dependencies = [];

  for (const [filename, info] of Object.entries(uploadedIndex)) {
    if ((info.imports || []).includes(target)) {
      dependencies.push(filename);
    }
  }

  return dependencies;
}

function collectDependencies(filename, visited = new Set()) {
  if (visited.has(filename)) {
    return [];
  }

  visited.add(filename);

  const info = uploadedIndex[filename];

  if (!info) {
    return [];
  }

  let files = [];

  for (const imported of (info.imports || [])) {
    const importedName = imported
      .replace(/^(\.\/|\.\.\/)+/, "")
      .toLowerCase();

    const match = Object.keys(uploadedIndex).find(file =>
      file
        .toLowerCase()
        .replace(/\.(tsx?|jsx?)$/, "")
        .endsWith(importedName)
    );

    if (match) {
      files.push(match);
      files.push(...collectDependencies(match, visited));
    }
 
  }

  return [...new Set(files)];
}

function findSymbol(symbol) {

  const matches = [];
  const scored = [];

  for (const [filename, content] of Object.entries(uploadedFiles)) {

    const info = uploadedIndex[filename];

let score = 0;

if (
  content.includes(symbol) ||

  (info?.functions || []).some(fn => {
  if (fn.includes(symbol)) {
    score += 10;
    return true;
  }
  return false;
})
  || (info?.components || []).some(c => c.includes(symbol)) ||

  (info?.exports || []).some(e => e.includes(symbol))
) {
  scored.push({
  file: filename,
  score
});

matches.push(filename);
}
  }

  scored.sort((a, b) => b.score - a.score);

return scored.map(item => item.file);

}

function buildProjectMap() {
 const map = [];

  for (const [filename, info] of Object.entries(uploadedIndex)) {
    map.push({
      file: filename,
      imports: info.imports || [],
      exports: info.exports || [],
      functions: info.functions || [],
      components: info.components || [],
      language: info.language || "Unknown"
    });
  }

  return map;
}

app.get("/", (req, res) => {
console.log("Headers:", req.headers);
console.log("Body:", req.body);
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/chat", async (req, res) => {
  try {
   const message = req.body?.message;

if (!message) {
  return res.status(400).json({
    reply: "Please enter a message."
  });
}

const text = message.toLowerCase();
const lower = text;

if (text.startsWith("forget ")) {
  const key = message.substring(7).trim();

  await forget(key);

  return res.json({
    reply: `Okay, I forgot your ${key}.`
  });
}    
    // Forget commands
    if (lower === "forget my job") {
      await forget("job");
      return res.json({ reply: "Okay, I've forgotten your job." });
    }

    if (lower === "forget my goals") {
      await forget("goals");
      await forget("goal");
      return res.json({ reply: "Okay, I've forgotten your goals." });
    }

    if (lower === "forget my notes") {
      await forget("notes");
      return res.json({ reply: "Okay, I've forgotten your notes." });
    }

    if (lower === "forget everything you know about me") {
      await forget("name");
      await forget("job");
      await forget("learning");
      await forget("projects");
      await forget("goals");
      await forget("goal");
      await forget("notes");

      return res.json({
        reply: "Done. I've forgotten everything I knew about you."
      });
    }

    // Memory recall
    if (
      lower.includes("what do you remember about me") ||
      lower.includes("what do you know about me")
    ) {
      const profile = await getProfile();

      let reply = "Here's what I remember about you:\n\n";

      if (profile.name) {
        reply += `• Name: ${profile.name}\n`;
      }

      if (profile.job) {
        reply += `• Job: ${profile.job}\n`;
      }

      if (profile.learning) {
        reply += `• Learning: ${profile.learning}\n`;
      }

      if (profile.projects?.length) {
        reply += `• Projects: ${profile.projects.join(", ")}\n`;
      }

      if (profile.goals?.length) {
        reply += `• Goals: ${profile.goals.join(", ")}\n`;
      }

      if (profile.notes?.length) {
        reply += `• Notes: ${profile.notes.join(", ")}\n`;
      }

      return res.json({ reply });
    }
        // Automatically remember important facts
    await remember(message);

    // AI memory extraction
    const aiMemory = await extractMemory(message);
    console.log("AI MEMORY:", aiMemory);

    if (Object.keys(aiMemory).length > 0) {
      await mergeMemory(aiMemory);
    }

    // Reload profile
    await loadProfile();

    history.push({
      role: "user",
      content: message
    });

    // Build memory context
    let facts = "Known information about the user:\n";

    if (profile.name) {
      facts += `- Name: ${profile.name}\n`;
    }

    if (profile.favoriteColor) {
      facts += `- Favorite color: ${profile.favoriteColor}\n`;
    }

    if (profile.city) {
      facts += `- City: ${profile.city}\n`;
    }

    if (profile.job) {
      facts += `- Job: ${profile.job}\n`;
    }

    if (profile.learning) {
      facts += `- Learning: ${profile.learning}\n`;
    }

    if (profile.favoriteLanguage) {
      facts += `- Favorite language: ${profile.favoriteLanguage}\n`;
    }

    if (profile.projects?.length) {
      facts += `- Projects: ${profile.projects.join(", ")}\n`;
    }

    if (profile.goals?.length) {
      facts += `- Goals: ${profile.goals.join(", ")}\n`;
    }

    if (profile.notes?.length) {
      facts += `- Notes: ${profile.notes.join(", ")}\n`;
    }

    // Web search
    let searchContext = "";

    const needsSearch =
      /latest|today|news|search|look up|who is|what is|weather|price|score/i.test(message);

    if (needsSearch) {
      console.log("Searching for:", message);

      try {
        const result = await search(message);

        searchContext = `
LIVE WEB SEARCH RESULTS

Summary:
${result.answer || "No summary available."}

Top Results:
${(result.results || [])
  .map(
    (item, index) => `${index + 1}. ${item.title}
${item.content}
Source: ${item.url}`
  )
  .join("\n\n")}
`;
      } catch (e) {
        console.error("Tavily search failed:", e.response?.data || e.message);
      }
    }

let fileContext = "";

const vectorMatches = await getRelevantVectors(message);

console.log("Vector matches:", vectorMatches);

const projectKeywords = [
  "server",
  "file",
  "project",
  "code",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  "function",
  "class",
  "component",
  "upload",
  "memory",
  "route",
  "api",
  "bug",
  "fix",
  "error"
];

const shouldSearchProject = projectKeywords.some(keyword =>
  message.toLowerCase().includes(keyword)
);

const relevantFiles = shouldSearchProject
  ? findRelevantFiles(message)
  : [];

const MAX_FILES = 3;

const selectedFiles = relevantFiles.slice(0, MAX_FILES);

const dependencyFiles = selectedFiles.flatMap(file => collectDependencies(file));

const relatedFiles = [];
relatedFiles.push(...dependencyFiles);

const symbols = message.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []


for (const symbol of symbols) {
  for (const file of findSymbol(symbol)) {
    if (!relevantFiles.includes(file)) {
      relevantFiles.push(file);
    }
  }
}

console.log("Relevant files found:", relevantFiles.length);

const projectMap = buildProjectMap();

const dependencyMap = projectMap.map(file => ({
  file: file.file,
  importedBy: findDependencies(file.file),
  imports: file.imports
}));

const projectContext = `
PROJECT STRUCTURE

${projectMap
  .slice(0, 10)  
  .map(file => `${file.file} (${file.language})`)
  .join("\n")}
`;

const dependencyContext = `
PROJECT DEPENDENCIES

${dependencyMap
  .slice(0, 10)
  .map(item =>
  `${item.file}
Imported by: ${item.importedBy.join(", ") || "None"}
Imports: ${item.imports.join(", ") || "None"}`
)
  .join("\n")}
`;

console.log("Relevant files:", relevantFiles);

for (const filename of selectedFiles) {

  relatedFiles.push(
  ...collectDependencies(filename)
);

}

for (const related of relatedFiles) {
  console.log("Related:", related);
}

const uniqueRelatedFiles = [...new Set(relatedFiles)];

const finalRelatedFiles = uniqueRelatedFiles.slice(0, 5);

for (const related of finalRelatedFiles) {

const relatedName = related
  .replace(/^(\.\/|\.\.\/)+/, "")
  .toLowerCase();

const match = Object.keys(uploadedFiles).find(file => {
  const normalized = file.toLowerCase().replace(/\.(tsx?|jsx?)$/, "");
  return normalized.endsWith(relatedName);
});

if (match) {
  console.log("Found related file:", match);

 console.log("Import matched:", related, "->", match);

  const relatedContent = (uploadedFiles[match] || "").slice(0, 1000);

  if (relatedContent) {
    fileContext += `RELATED FILE: ${match}

${relatedContent}

END OF ${match}

 `;
}
}

for (const filename of selectedFiles) {
  const content = (uploadedFiles[filename] || "").slice(0, 2000);

  if (!content) continue;

  fileContext += `FILE: ${filename}

${content}

END OF ${filename}

`;
}
console.log("fileContext length:", fileContext.length);
console.log(fileContext.substring(0, 200));

    const messages = [
      {
        role: "system",
        content:
  personality +
  "\n\n" +
  "If uploaded file content is provided below, treat it as the user's current working file.\n" +
"You can summarize it, explain it, find bugs, optimize it, rewrite it, answer questions about it, and refer to specific code when appropriate.\n\n" +  facts +
"\n" +
  searchContext +
fileContext +
"\n\n" +
projectContext +
"\n\n" +
dependencyContext
        },

        ...history.filter(msg => msg.role !== "system").slice(-10)      ];
console.log("Sending request to AI...");

let reply;

try {
  reply = await chat(messages);
} catch (err) {
console.log("Fallback catch reached.");

  if (err.response?.status === 429) {
    console.log("OpenRouter rate limit reached. Falling back to Groq...");
console.log("===== MESSAGES SENT TO GROQ =====");
console.dir(messages, { depth: null });
console.log("=================================");
    
reply = await chatGroq(messages);
  } else {
    throw err;
  }
}

if (!reply || reply.trim() === "{}") {
  reply = "Sorry, I couldn't generate a useful answer. Please try asking again.";
}
console.log("Reply type:", typeof reply);
console.log("Reply:", reply);
    history.push({
      role: "assistant",
      content: reply
    });

    if (history.length > 51) {
      history = [
        history[0],
        ...history.slice(-50)
      ];
    }

    await saveMemory();

    return res.json({
      reply
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      reply: "Sorry, I couldn't contact the AI."
    });
  }
});
app.post("/upload", upload.array("file", 100), async (req, res) => {

console.log("=== UPLOAD REQUEST RECEIVED ===");
console.log("req.files:", req.files);

  try {
    if (!req.files || req.files.length === 0) {    

  return res.status(400).json({
        reply: "No file uploaded."
      });
    }
for (const file of req.files) {
  const content = await fs.readFile(file.path, "utf8");
  
  const language = detectLanguage(file.originalname);

const uploadMap = await loadUploadMap();

uploadMap[file.filename] = file.originalname;

await saveUploadMap(uploadMap);

  uploadedFiles[file.originalname] = content;

  const imports = [];
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"](.+?)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  uploadedIndex[file.originalname] = {
    language,
    imports,
    functions: [
      ...(content.match(/function\s+([A-Za-z0-9_]+)/g) || []),

      ...(content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\(/g) || [])
    ],
    components: [
      ...(content.match(/function\s+([A-Z][A-Za-z0-9_]*)/g) || []),

      ...(content.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=/g) || [])
    ],
    classes: content.match(/class\s+([A-Za-z0-9_]+)/g) || [],

    exports: content.match(/export\s+(default\s+)?(function|class|const)?\s*[A-Za-z0-9_]*/g) || []
  };

  const vectors = await loadVectors();

const existingIndex = vectors.findIndex(
  vector => vector.file === file.originalname
);

if (existingIndex !== -1) {
  vectors.splice(existingIndex, 1);
}

  vectors.push({
    file: file.originalname,
    language,
    imports,
    functions: uploadedIndex[file.originalname].functions,
    components: uploadedIndex[file.originalname].components,
    classes: uploadedIndex[file.originalname].classes,
    exports: uploadedIndex[file.originalname].exports
  });

  await saveVectors(vectors);

  console.log("Vector indexed:", file.originalname);
  
  uploadedIndex[file.originalname].summary =
    content
      .split("\n")
      .slice(0, 20)
      .join("\n");
  console.log("Indexed:", file.originalname);
}

console.log("Stored files:", Object.keys(uploadedFiles).length);

return res.json({
  uploaded: req.files.length
});

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      reply: "Couldn't read the file."
    });
  }
});
Promise.all([
  loadMemory(),
  loadProfile(),
  loadUploadedFiles()
]).then(async () => {

  vectors = await loadVectors();

  console.log("Loaded", vectors.length, "vectors.");

  app.listen(PORT, () => {
    console.log(`SamuAI is running on port ${PORT}`);
  });

});
