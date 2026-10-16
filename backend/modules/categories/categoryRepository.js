const pool = require("../../config/database");

async function findAllCategories() {
  const [rows] = await pool.execute(
    "SELECT category_id, name FROM categories ORDER BY name ASC"
  );
  return rows;
}

module.exports = { findAllCategories };
