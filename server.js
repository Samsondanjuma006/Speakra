require("dotenv").config();

const { answerProjectQuestion } = require("./brain/projectBrain");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs-extra");
const multer = require("multer");
const path = require("path");
const { remember } = require("./memory");
const { search } = require("./services/search");

const app = express();
const PORT = process.env.PORT || 3000;

const MEMORY_FILE = "./data/memory.json";
const PROFILE_FILE = "./data/profile.json";
const UPLOAD_INDEX_FILE = "./data/upload-index.json";
const UPLOAD_DIR = "./uploads";

const MAX_STORED_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 20;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILE_CONTEXT = 6000;

let history = [];
let profile = {};
let uploadedFiles = {};
let uploadedIndex = {};

const SYSTEM_MESSAGE = {
  role: "system",
  content: "You are Speakra, a friendly and helpful AI assistant."
};

/*
 * Stage 3 — File Intelligence
 *
 * Supported files are text/code files only for now.
 */
const ALLOWED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css"
]);

function detectLanguage(filename = "") {
  const ext = path.extname(filename).toLowerCase();

  const languages = {
    ".txt": "Plain Text",
    ".md": "Markdown",
    ".js": "JavaScript",
    ".jsx": "React JSX",
    ".ts": "TypeScript",
    ".tsx": "React TypeScript",
    ".json": "JSON",
    ".html": "HTML",
    ".css": "CSS"
  };

  return languages[ext] || "Unknown";
}

function extractFileInfo(content, filename) {
  const imports = [];
  const functions = [];
  const components = [];
  const classes = [];
  const exports = [];

  const importRegex =
    /import\s+(?:.*?\s+from\s+)?['"](.+?)['"]/g;

  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  const functionMatches =
    content.match(/\bfunction\s+[A-Za-z0-9_$]+/g) || [];

  for (const item of functionMatches) {
    functions.push(item.replace(/^function\s+/, ""));
  }

  const arrowMatches =
    content.match(
      /\b(?:const|let|var)\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s*)?\(/g
    ) || [];

  for (const item of arrowMatches) {
    const name = item
      .replace(/^(const|let|var)\s+/, "")
      .replace(/\s*=\s*(?:async\s*)?\($/, "")
      .trim();

    if (name) {
      functions.push(name);
    }
  }

  const componentMatches =
    content.match(/\bfunction\s+[A-Z][A-Za-z0-9_$]*/g) || [];

  for (const item of componentMatches) {
    components.push(item.replace(/^function\s+/, ""));
  }

  const componentConstMatches =
    content.match(
      /\bconst\s+[A-Z][A-Za-z0-9_$]*\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g
    ) || [];

  for (const item of componentConstMatches) {
    const name = item
      .replace(/^const\s+/, "")
      .split("=")[0]
      .trim();

    if (name) {
      components.push(name);
    }
  }

  const classMatches =
    content.match(/\bclass\s+[A-Za-z0-9_$]+/g) || [];

  for (const item of classMatches) {
    classes.push(item.replace(/^class\s+/, ""));
  }

  const exportMatches =
    content.match(
      /\bexport\s+(?:default\s+)?(?:function|class|const|let|var)?\s*[A-Za-z0-9_$]*/g
    ) || [];

  for (const item of exportMatches) {
    exports.push(item.trim());
  }

  return {
    filename,
    language: detectLanguage(filename),
    imports: [...new Set(imports)],
    functions: [...new Set(functions)],
    components: [...new Set(components)],
    classes: [...new Set(classes)],
    exports: [...new Set(exports)],
    size: Buffer.byteLength(content, "utf8"),
    lines: content.split("\n").length
  };
}

/*
 * Stage 3 file storage.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^A-Za-z0-9._-]/g, "_");

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safeName}`;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          "Unsupported file type. Please upload a text or code file."
        )
      );
    }

    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

/*
 * Stage 2 — Conversation history
 */
async function loadMemory() {
  try {
    const savedHistory = await fs.readJson(MEMORY_FILE);

    if (Array.isArray(savedHistory)) {
      history = savedHistory.filter(
        message =>
          message &&
          typeof message === "object" &&
          (message.role === "user" ||
            message.role === "assistant")
      );
    } else {
      history = [];
    }
  } catch {
    history = [];
  }
}

async function saveMemory() {
  await fs.writeJson(
    MEMORY_FILE,
    [SYSTEM_MESSAGE, ...history.slice(-MAX_STORED_MESSAGES)],
    {
      spaces: 2
    }
  );
}

/*
 * Stage 1 — User profile memory
 */
async function loadProfile() {
  try {
    const savedProfile = await fs.readJson(PROFILE_FILE);

    if (
      savedProfile &&
      typeof savedProfile === "object" &&
      !Array.isArray(savedProfile)
    ) {
      profile = savedProfile;
    } else {
      profile = {};
    }
  } catch {
    profile = {};
  }
}

function buildProfileFacts() {
  const facts = [];

  if (profile.name) {
    facts.push(`User's name is ${profile.name}.`);
  }

  if (profile.favoriteColor) {
    facts.push(
      `User's favorite color is ${profile.favoriteColor}.`
    );
  }

  if (profile.favoriteFood) {
    facts.push(
      `User's favorite food is ${profile.favoriteFood}.`
    );
  }

  if (profile.city) {
    facts.push(`User lives in ${profile.city}.`);
  }

  if (profile.job) {
    facts.push(`User works as ${profile.job}.`);
  }

  if (profile.learning) {
    facts.push(`User is learning ${profile.learning}.`);
  }

  if (profile.favoriteLanguage) {
    facts.push(
      `User's favorite programming language is ${profile.favoriteLanguage}.`
    );
  }

  if (
    Array.isArray(profile.projects) &&
    profile.projects.length > 0
  ) {
    facts.push(
      `User's projects: ${profile.projects.join(", ")}.`
    );
  }

  if (
    Array.isArray(profile.goals) &&
    profile.goals.length > 0
  ) {
    facts.push(
      `User's goals: ${profile.goals.join("; ")}.`
    );
  }

  if (
    Array.isArray(profile.notes) &&
    profile.notes.length > 0
  ) {
    facts.push(
      `User's preferences/notes: ${profile.notes.join("; ")}.`
    );
  }

  return facts.join("\n");
}

/*
 * Stage 3 — File Intelligence
 */
async function saveUploadIndex() {
  await fs.writeJson(
    UPLOAD_INDEX_FILE,
    uploadedIndex,
    {
      spaces: 2
    }
  );
}

async function loadUploadIndex() {
  try {
    const savedIndex = await fs.readJson(
      UPLOAD_INDEX_FILE
    );

    if (
      savedIndex &&
      typeof savedIndex === "object" &&
      !Array.isArray(savedIndex)
    ) {
      uploadedIndex = savedIndex;
    } else {
      uploadedIndex = {};
    }
  } catch {
    uploadedIndex = {};
  }
}

async function loadUploadedFiles() {
  uploadedFiles = {};

  await fs.ensureDir(UPLOAD_DIR);

  const files = await fs.readdir(UPLOAD_DIR);

  for (const storedName of files) {
    const fullPath = path.join(UPLOAD_DIR, storedName);

    try {
      const stat = await fs.stat(fullPath);

      if (!stat.isFile()) {
        continue;
      }

      const content = await fs.readFile(
        fullPath,
        "utf8"
      );

      const existingInfo = Object.values(
        uploadedIndex
      ).find(
        info => info && info.storedName === storedName
      );

      if (existingInfo) {
        uploadedFiles[existingInfo.filename] = content;
      }
    } catch (err) {
      console.error(
        `Couldn't load uploaded file ${storedName}:`,
        err.message
      );
    }
  }

  /*
   * Remove index entries whose files no longer exist.
   */
  for (const [filename, info] of Object.entries(
    uploadedIndex
  )) {
    if (!info || !info.storedName) {
      delete uploadedIndex[filename];
      continue;
    }

    const exists = await fs.pathExists(
      path.join(UPLOAD_DIR, info.storedName)
    );

    if (!exists) {
      delete uploadedIndex[filename];
    }
  }

  await saveUploadIndex();

  console.log(
    "Stage 3: loaded",
    Object.keys(uploadedFiles).length,
    "uploaded files."
  );
}

function findRelevantFiles(message) {
  const filenames = Object.keys(uploadedFiles);

  if (filenames.length === 0) {
    return [];
  }

  const lowerMessage = message.toLowerCase();

  /*
   * If the user clearly refers to the uploaded file
   * and only one file is uploaded, use that file directly.
   */
  const explicitFileReference =
    /\b(this file|the file|uploaded file|the uploaded file|this uploaded file)\b/i.test(
      message
    );

  if (explicitFileReference && filenames.length === 1) {
    return [filenames[0]];
  }

  const words = lowerMessage
    .split(/\W+/)
    .filter(word => word.length > 1);

  const scored = [];

  for (const [filename, content] of Object.entries(
    uploadedFiles
  )) {
    const info = uploadedIndex[filename] || {};

    const searchText = [
      filename,
      info.language || "",
      ...(info.imports || []),
      ...(info.functions || []),
      ...(info.components || []),
      ...(info.classes || []),
      ...(info.exports || [])
    ]
      .join(" ")
      .toLowerCase();

    const lowerContent = content.toLowerCase();

    let score = 0;

    for (const word of words) {
      if (searchText.includes(word)) {
        score += 3;
      }

      if (lowerContent.includes(word)) {
        score += 1;
      }
    }

    if (lowerMessage.includes(filename.toLowerCase())) {
      score += 20;
    }

    if (score > 0) {
      scored.push({
        filename,
        score
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.filename);
}

function buildFileContext(message) {
  const filenames = findRelevantFiles(message);

  if (filenames.length === 0) {
    return "";
  }

  let context = "UPLOADED FILE CONTEXT:\n";

  for (const filename of filenames) {
    const info = uploadedIndex[filename] || {};
    const content = uploadedFiles[filename] || "";

    context += `\nFILE: ${filename}\n`;
    context += `LANGUAGE: ${
      info.language || "Unknown"
    }\n`;

    if (info.functions?.length) {
      context += `FUNCTIONS: ${info.functions.join(
        ", "
      )}\n`;
    }

    if (info.classes?.length) {
      context += `CLASSES: ${info.classes.join(
        ", "
      )}\n`;
    }

    if (info.exports?.length) {
      context += `EXPORTS: ${info.exports.join(
        ", "
      )}\n`;
    }

    context += `CONTENT:\n${content}\n`;
    context += `END FILE: ${filename}\n`;
  }

  return context.slice(0, MAX_FILE_CONTEXT);
}

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

/*
 * Main chat route
 */
app.post("/chat", async (req, res) => {
  console.log(
    ">>>>>>>> REQUEST FROM BROWSER <<<<<<<<"
  );
  console.log(req.headers["user-agent"]);
  console.log(req.body);

  try {
    const message = (req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }

    /*
     * Stage 1 memory
     */
    await remember(message);
    await loadProfile();

    /*
     * Project Brain
     *
     * Only explicit code/project-analysis questions
     * should activate Project Brain.
     */
    const projectQuestion =
      /\b(function|caller|call\s+hierarchy|call\s+chain|callchain|dependency|dependencies|source\s+code|implementation|stack\s+trace|execution\s+path|pipeline|route|endpoint|module|import|export|variable|class|method|syntax|bug|error|debug|index|indexing|buildindex|project\s+brain)\b/i.test(
        message
      ) ||
      /\b(who calls|what calls|where is .* defined|where is .* used|what depends on|show me the call chain|trace .* function|trace .* call|which file|which files|find .* function|find .* code|how does .* work in the project)\b/i.test(
        message
      ) ||
      /\b(analyze|analyse|inspect|explain|trace|find|show|check|debug)\b.*\b(project|code|function|module|dependency|pipeline|route)\b/i.test(
        message
      );

    if (projectQuestion) {
      console.log("MESSAGE:", message);

      const result = answerProjectQuestion(message);

      console.log("FOUND =", result.found);

      if (result.found) {
        console.log(
          "ENTERED PROJECT BRAIN"
        );

        return res.json({
          reply:
            "🔥 PROJECT BRAIN ACTIVE 🔥\n\n" +
            result.reply
        });
      }
    }

    /*
     * Store user's message.
     */
    history.push({
      role: "user",
      content: message
    });

    /*
     * Stage 2 conversation context.
     */
    const recentHistory = history.slice(
      -MAX_CONTEXT_MESSAGES
    );

    /*
     * Stage 1 profile memory.
     */
    const facts = buildProfileFacts();

    /*
     * Stage 3 uploaded-file context.
     */
    const fileContext =
      buildFileContext(message);

    /*
     * Tavily web search.
     */
    let searchContext = "";

    const needsSearch =
      /latest|today|news|search|look up|who is|what is|weather|price|score/i.test(
        message
      );

    if (needsSearch) {
      try {
        const result = await search(message);

        console.log(
          "===== TAVILY SEARCH ====="
        );
        console.log(result);
        console.log(
          "========================="
        );

        searchContext = `
LIVE WEB SEARCH RESULTS

Summary:
${result.answer || "No summary available."}

Top Results:
${(result.results || [])
  .slice(0, 2)
  .map(
    (item, index) =>
      `${index + 1}. ${item.title}
Source: ${item.url}`
  )
  .join("\n\n")}
`;
      } catch (e) {
        console.error(
          "Tavily search failed:",
          e.response?.data || e.message
        );
      }
    }

    /*
     * Build complete AI context.
     */
    const systemContent = [
      "You are Speakra, a friendly and helpful AI assistant.",
      "",
      "LONG-TERM USER MEMORY:",
      facts || "No saved user facts.",
      "",
      fileContext,
      "",
      searchContext
    ].join("\n");

    const messages = [
      {
        role: "system",
        content: systemContent.slice(
          0,
          8000
        )
      },
      ...recentHistory
    ];

    console.log(
      `Sending ${recentHistory.length} conversation messages to AI`
    );

    if (fileContext) {
      console.log(
        "Stage 3: uploaded file context included."
      );
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages,
        max_tokens: 300
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json",
          "HTTP-Referer":
            "https://speakra.onrender.com",
          "X-Title": "Speakra"
        }
      }
    );

    const reply =
      response.data.choices[0].message.content;

    /*
     * Store assistant reply.
     */
    history.push({
      role: "assistant",
      content: reply
    });

    /*
     * Keep only most recent 50 messages.
     */
    if (
      history.length >
      MAX_STORED_MESSAGES
    ) {
      history = history.slice(
        -MAX_STORED_MESSAGES
      );
    }

    await saveMemory();

    res.json({
      reply
    });
  } catch (err) {
    console.error(
      err.response?.data || err.message
    );

    res.status(500).json({
      reply:
        "Sorry, I couldn't contact the AI."
    });
  }
});

/*
 * Stage 3 — File upload route
 */
app.post(
  "/upload",
  (req, res, next) => {
    upload.array("file", 10)(
      req,
      res,
      err => {
        if (err) {
          console.error(
            "Upload error:",
            err.message
          );

          return res.status(400).json({
            reply: err.message
          });
        }

        next();
      }
    );
  },
  async (req, res) => {
    console.log(
      "=== STAGE 3 UPLOAD REQUEST ==="
    );

    try {
      if (
        !req.files ||
        req.files.length === 0
      ) {
        return res.status(400).json({
          reply: "No file uploaded."
        });
      }

      const uploaded = [];

      for (const file of req.files) {
        const content =
          await fs.readFile(
            file.path,
            "utf8"
          );

        const info =
          extractFileInfo(
            content,
            file.originalname
          );

        uploadedFiles[
          file.originalname
        ] = content;

        uploadedIndex[
          file.originalname
        ] = {
          ...info,
          storedName:
            file.filename,
          uploadedAt:
            new Date().toISOString()
        };

        uploaded.push({
          filename:
            file.originalname,
          language:
            info.language,
          size:
            info.size,
          lines:
            info.lines,
          functions:
            info.functions.length,
          classes:
            info.classes.length,
          components:
            info.components.length
        });

        console.log(
          "Indexed file:",
          file.originalname
        );
      }

      await saveUploadIndex();

      return res.json({
        uploaded:
          uploaded.length,
        filename:
          uploaded.length === 1
            ? uploaded[0].filename
            : undefined,
        files: uploaded
      });
    } catch (err) {
      console.error(
        "File processing error:",
        err.message
      );

      return res.status(500).json({
        reply:
          "Couldn't read and process the uploaded file."
      });
    }
  }
);

/*
 * Startup
 */
Promise.all([
  loadMemory(),
  loadProfile(),
  loadUploadIndex(),
  fs.ensureDir(UPLOAD_DIR)
])
  .then(async () => {
    await loadUploadedFiles();

    app.listen(PORT, () => {
      console.log(
        `Speakra is running on port ${PORT}`
      );
    });
  })
  .catch(err => {
    console.error(
      "Speakra startup failed:",
      err
    );

    process.exit(1);
  });
