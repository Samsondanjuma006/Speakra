const fs = require("fs-extra");

const FILE = "./data/profile.json";

async function remember(message) {
  let profile = {};

  try {
    if (await fs.pathExists(FILE)) {
      profile = await fs.readJson(FILE);
    }
  } catch {
    profile = {};
  }

  const text = message.toLowerCase().trim();

  // Basic facts
  if (text.startsWith("my name is ")) {
    profile.name = message.substring(11).trim();
  }

  if (text.startsWith("my favorite color is ")) {
    profile.favoriteColor = message.substring(21).trim();
  }

  if (text.startsWith("i live in ")) {
    profile.city = message.substring(10).trim();
  }

  if (text.startsWith("i work as ")) {
    profile.job = message.substring(10).trim();
  }

  if (text.startsWith("i am learning ")) {
    profile.learning = message.substring(14).trim();
  }

  if (text.startsWith("i'm learning ")) {
    profile.learning = message.substring(14).trim();
  }

  if (text.startsWith("my goal is ")) {
    profile.goals ??= [];
    profile.goals.push(message.substring(11).trim());
  }

  if (text.startsWith("i am building ")) {
    profile.projects ??= [];
    profile.projects.push(message.substring(14).trim());
  }

  if (text.startsWith("my favorite language is ")) {
    profile.favoriteLanguage = message.substring(24).trim();
  }

  if (text.startsWith("remember that ")) {
    profile.notes ??= [];
    profile.notes.push(message.substring(14).trim());
  }

  if (profile.goals) {
    profile.goals = [...new Set(profile.goals)];
  }

  if (profile.projects) {
    profile.projects = [...new Set(profile.projects)];
  }

  if (profile.notes) {
    profile.notes = [...new Set(profile.notes)];
  }

  await fs.writeJson(FILE, profile, {
    spaces: 2
  });

  return profile;
}
async function mergeMemory(newMemory) {
  let profile = {};

  try {
    if (await fs.pathExists(FILE)) {
      profile = await fs.readJson(FILE);
    }
  } catch {
    profile = {};
  }

    for (const [key, value] of Object.entries(newMemory)) {
  if (key === "goal") {
    profile.goals ??= [];

    if (!profile.goals.some(g => g.toLowerCase() === value.toLowerCase())) {
      profile.goals.push(value);
    }

  } else if (key === "project") {
    profile.projects ??= [];

    if (!profile.projects.includes(value)) {
      profile.projects.push(value);
    }

  } else if (key === "note") {
    profile.notes ??= [];

    if (!profile.notes.includes(value)) {
      profile.notes.push(value);
    }

  } else {
    profile[key] = value;
  }
}
  await fs.writeJson(FILE, profile, {
    spaces: 2
  });

  return profile;
}
async function getProfile() {
  try {
    if (await fs.pathExists(FILE)) {
      return await fs.readJson(FILE);
    }
  } catch {}

  return {};
}
async function forget(key) {
  let profile = {};

  try {
    if (await fs.pathExists(FILE)) {
      profile = await fs.readJson(FILE);
    }
  } catch {
    return;
  }

  delete profile[key];

  await fs.writeJson(FILE, profile, {
    spaces: 2
  });
}module.exports = {
  remember,
  mergeMemory,
  getProfile,
  forget
};
