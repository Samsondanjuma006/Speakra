const fs = require("fs-extra");
const path = require("path");

const BUSINESSES_DIR = path.join(__dirname, "..", "data", "businesses");

function getCustomersFile(businessId) {
  return path.join(
    BUSINESSES_DIR,
    businessId,
    "customers.json"
  );
}

async function getCustomers(businessId) {
  if (!businessId) {
    throw new Error("Business id is required");
  }

  const file = getCustomersFile(businessId);

  if (!(await fs.pathExists(file))) {
    return [];
  }

  return fs.readJson(file);
}

async function saveCustomers(businessId, customers) {
  const businessDir = path.join(
    BUSINESSES_DIR,
    businessId
  );

  await fs.ensureDir(businessDir);

  await fs.writeJson(
    getCustomersFile(businessId),
    customers,
    { spaces: 2 }
  );
}

async function addCustomer(businessId, customer) {
  if (!businessId) {
    throw new Error("Business id is required");
  }

  if (!customer || !customer.id) {
    throw new Error("Customer id is required");
  }

  const customers = await getCustomers(businessId);

  const existing = customers.find(
    item => item.id === customer.id
  );

  if (existing) {
    return existing;
  }

  const newCustomer = {
    id: customer.id,
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    notes: customer.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  customers.push(newCustomer);

  await saveCustomers(
    businessId,
    customers
  );

  return newCustomer;
}

async function getCustomer(businessId, customerId) {
  const customers = await getCustomers(businessId);

  return (
    customers.find(
      customer => customer.id === customerId
    ) || null
  );
}

module.exports = {
  getCustomers,
  addCustomer,
  getCustomer
};
