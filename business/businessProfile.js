const fs = require("fs-extra");
const path = require("path");

const BUSINESSES_DIR = path.join(__dirname, "..", "data", "businesses");

async function createBusiness(business) {
  if (!business || !business.id) {
    throw new Error("Business id is required");
  }

  const businessDir = path.join(BUSINESSES_DIR, business.id);

  await fs.ensureDir(businessDir);

  const profile = {
    id: business.id,
    name: business.name || "",
    category: business.category || "",
    description: business.description || "",
    phone: business.phone || "",
    email: business.email || "",
    address: business.address || "",
    currency: business.currency || "NGN",
    timezone: business.timezone || "Africa/Lagos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const profileFile = path.join(businessDir, "profile.json");

  await fs.writeJson(profileFile, profile, {
    spaces: 2
  });

  return profile;
}

async function getBusiness(businessId) {
  if (!businessId) {
    throw new Error("Business id is required");
  }

  const profileFile = path.join(
    BUSINESSES_DIR,
    businessId,
    "profile.json"
  );

  if (!(await fs.pathExists(profileFile))) {
    return null;
  }

  return fs.readJson(profileFile);
}

module.exports = {
  createBusiness,
  getBusiness
};
