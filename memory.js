const fs = require("fs-extra");

const FILE = "./data/profile.json";

async function remember(message) {
  let profile = {};

  try {
    if (await fs.pathExists(FILE)) {
      profile = await fs.readJson(FILE);
    }
  } catch (err) {
    profile = {};
  }

  const text = message.toLowerCase().trim();

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

  await fs.writeJson(FILE, profile, {
    spaces: 2
  });

  return profile;
}

module.exports = {
  remember
};
