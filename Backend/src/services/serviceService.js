const { sql } = require('../db');
const cache = require('./cacheService');

async function getAllServices() {
  try {
    const result = await sql`SELECT * FROM services`;
    return result;
  } catch (err) {
    console.error("Error fetching services:", err);
    throw err;
  }
}

async function createService(name, description) {
  try {
    const result = await sql`
      INSERT INTO services (name, description)
      VALUES (${name}, ${description})
      RETURNING *
    `;
    await cache.invalidateStatus();
    return result[0];
  } catch (err) {
    console.error("Error creating service:", err);
    throw err;
  }
}

async function getServiceById(id) {
  try {
    const result = await sql`SELECT * FROM services WHERE id = ${id}`;
    return result[0];
  } catch (err) {
    console.error("Error fetching service by id:", err);
    throw err;
  }
}

async function updateService(id, name, description, status) {
  try {
    const result = await sql`
      UPDATE services
      SET
        name        = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        status      = COALESCE(${status}, status)
      WHERE id = ${id}
      RETURNING *
    `;
    await cache.invalidateStatus();
    return result[0];
  } catch (err) {
    console.error("Error updating service:", err);
    throw err;
  }
}

module.exports = {
  getAllServices,
  createService,
  getServiceById,
  updateService,
};
