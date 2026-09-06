const fs = require("fs-extra");

const FILE = "./data/profile.json";

/*
 * Speakra Stage 1 Memory System
 *
 * profile.json = long-term user memory
 *
 * memory.json is intentionally NOT handled here.
 * memory.json is used by server.js for conversation history.
 */

const ARRAY_FIELDS = new Set([
  "goals",
  "projects",
  "notes"
]);

const ALLOWED_FIELDS = new Set([
  "name",
  "job",
  "city",
  "learning",
  "favoriteColor",
  "favoriteLanguage",
  "goals",
  "projects",
  "notes"
]);

async function readProfile() {
  try {
    if (await fs.pathExists(FILE)) {
      const profile = await fs.readJson(FILE);

      if (profile && typeof profile === "object" && !Array.isArray(profile)) {
        return profile;
      }
    }
  } catch (err) {
    console.error("Memory: could not read profile:", err.message);
  }

  return {};
}

async function writeProfile(profile) {
  await fs.writeJson(FILE, profile, {
    spaces: 2
  });
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}

function addUnique(array, value) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return array;
  }

  const exists = array.some(
    item => cleanText(item).toLowerCase() === cleaned.toLowerCase()
  );

  if (!exists) {
    array.push(cleaned);
  }

  return array;
}

function removeMatching(array, value) {
  const target = cleanText(value).toLowerCase();

  return array.filter(
    item => cleanText(item).toLowerCase() !== target
  );
}

/*
 * Save directly recognizable facts from a user's message.
 */
async function remember(message) {
  const profile = await readProfile();

  const original = cleanText(message);
  const text = original.toLowerCase();

  if (!original) {
    return profile;
  }

  /*
   * Name
   */
  if (text.startsWith("my name is ")) {
    const value = cleanText(original.substring("my name is ".length));

    if (value) {
      profile.name = value;
    }
  }

  /*
   * Favorite color
   */
  if (text.startsWith("my favorite color is ")) {
    const value = cleanText(
      original.substring("my favorite color is ".length)
    );

    if (value) {
      profile.favoriteColor = value;
    }
  }

  /*
   * City / location
   */
  if (text.startsWith("i live in ")) {
    const value = cleanText(
      original.substring("i live in ".length)
    );

    if (value) {
      profile.city = value;
    }
  }

  /*
   * Job
   */
  if (text.startsWith("i work as ")) {
    const value = cleanText(
      original.substring("i work as ".length)
    );

    if (value) {
      profile.job = value;
    }
  }

  /*
   * Learning
   */
  if (text.startsWith("i am learning ")) {
    const value = cleanText(
      original.substring("i am learning ".length)
    );

    if (value) {
      profile.learning = value;
    }
  }

  if (text.startsWith("i'm learning ")) {
    const value = cleanText(
      original.substring("i'm learning ".length)
    );

    if (value) {
      profile.learning = value;
    }
  }

  /*
   * Goal
   */
  if (text.startsWith("my goal is ")) {
    const value = cleanText(
      original.substring("my goal is ".length)
    );

    if (value) {
      profile.goals ??= [];
      addUnique(profile.goals, value);
    }
  }

  /*
   * Project
   */
  if (text.startsWith("i am building ")) {
    const value = cleanText(
      original.substring("i am building ".length)
    );

    if (value) {
      profile.projects ??= [];
      addUnique(profile.projects, value);
    }
  }

  if (text.startsWith("i'm building ")) {
    const value = cleanText(
      original.substring("i'm building ".length)
    );

    if (value) {
      profile.projects ??= [];
      addUnique(profile.projects, value);
    }
  }

  /*
   * Favorite programming language
   */
  if (text.startsWith("my favorite language is ")) {
    const value = cleanText(
      original.substring("my favorite language is ".length)
    );

    if (value) {
      profile.favoriteLanguage = value;
    }
  }

  /*
   * Explicit note
   */
  if (text.startsWith("remember that ")) {
    const value = cleanText(
      original.substring("remember that ".length)
    );

    if (value) {
      profile.notes ??= [];
      addUnique(profile.notes, value);
    }
  }

  /*
   * Make sure array fields are clean and deduplicated.
   */
  for (const field of ARRAY_FIELDS) {
    if (Array.isArray(profile[field])) {
      const cleaned = [];

      for (const item of profile[field]) {
        addUnique(cleaned, item);
      }

      if (cleaned.length > 0) {
        profile[field] = cleaned;
      } else {
        delete profile[field];
      }
    }
  }

  await writeProfile(profile);

  return profile;
}

/*
 * Merge structured memory produced by another memory system.
 *
 * Only approved fields are accepted.
 * This prevents random AI output such as "query" or "file"
 * from becoming permanent user memory.
 */
async function mergeMemory(newMemory) {
  const profile = await readProfile();

  if (
    !newMemory ||
    typeof newMemory !== "object" ||
    Array.isArray(newMemory)
  ) {
    return profile;
  }

  for (const [rawKey, rawValue] of Object.entries(newMemory)) {
    const key = cleanText(rawKey);

    if (!ALLOWED_FIELDS.has(key)) {
      continue;
    }

    if (ARRAY_FIELDS.has(key)) {
      profile[key] ??= [];

      const values = Array.isArray(rawValue)
        ? rawValue
        : [rawValue];

      for (const value of values) {
        addUnique(profile[key], value);
      }

      continue;
    }

    const value = cleanText(rawValue);

    if (value) {
      profile[key] = value;
    }
  }

  await writeProfile(profile);

  return profile;
}

/*
 * Return the complete long-term profile.
 */
async function getProfile() {
  return readProfile();
}

/*
 * Forget memory.
 *
 * Examples:
 *
 * forget("job")
 * forget("goals")
 * forget("goals", "Become an AI engineer")
 * forget("name")
 */
async function forget(key, value = null) {
  const profile = await readProfile();

  const field = cleanText(key);

  if (!field || !ALLOWED_FIELDS.has(field)) {
    return profile;
  }

  if (value !== null && ARRAY_FIELDS.has(field)) {
    if (Array.isArray(profile[field])) {
      profile[field] = removeMatching(profile[field], value);

      if (profile[field].length === 0) {
        delete profile[field];
      }
    }
  } else {
    delete profile[field];
  }

  await writeProfile(profile);

  return profile;
}

module.exports = {
  remember,
  mergeMemory,
  getProfile,
  forget
};
