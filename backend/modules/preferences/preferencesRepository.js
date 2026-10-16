const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).execute(
  'SELECT category_id, name FROM categories ORDER BY name',
  params,
);

const statement2 = (params, connection) => (connection || pool).execute(
  `SELECT c.category_id, c.name
       FROM user_preferred_categories AS upc
       JOIN categories AS c ON c.category_id = upc.category_id
       WHERE upc.user_id = ?
       ORDER BY c.name`,
  params,
);

const statement3 = (params, connection, { placeholders } = {}) => (connection || pool).execute(
  `SELECT category_id FROM categories WHERE category_id IN (${placeholders})`,
  params,
);

const statement4 = (params, connection) => (connection || pool).execute(
  'INSERT IGNORE INTO user_preferences (user_id) VALUES (?)',
  params,
);

const statement5 = (params, connection) => (connection || pool).execute(
  'DELETE FROM user_preferred_categories WHERE user_id = ?',
  params,
);

const statement6 = (params, connection) => (connection || pool).query(
  'INSERT INTO user_preferred_categories (user_id, category_id) VALUES ?',
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6 };
