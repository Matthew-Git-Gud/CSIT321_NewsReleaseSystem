const pool = require('../../config/database');

// Persistence only: SQL queries and the atomic view-recording transaction.
const findCategory = async (categoryId) => {
  const [rows] = await pool.execute(
    'SELECT category_id FROM categories WHERE category_id = ?', [categoryId]
  );
  return rows[0] || null;
};

const insertArticle = async (data) => {
  const [result] = await pool.execute(
    `INSERT INTO articles (author_id, category_id, title, summary, content, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.authorId, data.category_id, data.title, data.summary, data.content, data.status]
  );
  return result.insertId;
};

const findCreatedArticle = async (id) => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.title, a.summary, a.content,
            a.status, a.created_at, a.updated_at, c.category_id,
            c.name AS category
     FROM articles a JOIN categories c ON a.category_id = c.category_id
     WHERE a.article_id = ?`, [id]
  );
  return rows[0] || null;
};

const findByAuthor = async (authorId) => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.title, a.summary, a.status,
            a.created_at, a.updated_at, c.category_id, c.name AS category
     FROM articles a JOIN categories c ON a.category_id = c.category_id
     WHERE a.author_id = ? AND a.status != 'deleted'
     ORDER BY a.updated_at DESC`, [authorId]
  );
  return rows;
};

const softDelete = async (articleId, authorId) => {
  const [result] = await pool.execute(
    `UPDATE articles SET status = 'deleted'
     WHERE article_id = ? AND author_id = ? AND status != 'deleted'`,
    [articleId, authorId]
  );
  return result.affectedRows;
};

const findForEdit = async (articleId, authorId) => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.category_id, a.title,
            a.summary, a.content, a.status, a.created_at, a.updated_at,
            c.name AS category
     FROM articles a JOIN categories c ON a.category_id = c.category_id
     WHERE a.article_id = ? AND a.author_id = ? AND a.status != 'deleted'`,
    [articleId, authorId]
  );
  return rows[0] || null;
};

const update = async (articleId, authorId, data) => {
  const [result] = await pool.execute(
    `UPDATE articles
     SET title = ?, summary = ?, content = ?, category_id = ?, status = ?
     WHERE article_id = ? AND author_id = ? AND status != 'deleted'`,
    [data.title, data.summary, data.content, data.category_id, data.status, articleId, authorId]
  );
  return result.affectedRows;
};

const findPublishedById = async (articleId) => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.category_id, a.title, a.summary,
            a.content, a.status, a.view_count, a.created_at, a.updated_at,
            c.name AS category, u.username AS author_username,
            u.full_name AS author_name
     FROM articles a
     JOIN categories c ON a.category_id = c.category_id
     JOIN users u ON a.author_id = u.user_id
     WHERE a.article_id = ? AND a.status = 'published'`, [articleId]
  );
  return rows[0] || null;
};

const findPublished = async () => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.category_id, a.title, a.summary,
            a.created_at, a.updated_at, c.name AS category,
            u.username AS author_username, u.full_name AS author_name
     FROM articles a
     JOIN categories c ON a.category_id = c.category_id
     JOIN users u ON a.author_id = u.user_id
     WHERE a.status = 'published' ORDER BY a.created_at DESC`
  );
  return rows;
};

const findPersonalised = async (userId) => {
  const [rows] = await pool.query(
    `SELECT a.article_id, a.title, a.summary, a.content, a.status,
            a.created_at, a.updated_at, c.category_id, c.name AS category,
            u.username AS author, u.full_name AS author_name
     FROM articles a
     JOIN categories c ON a.category_id = c.category_id
     JOIN users u ON a.author_id = u.user_id
     JOIN user_preferred_categories upc ON a.category_id = upc.category_id
     WHERE upc.user_id = ? AND a.status = 'published'
     ORDER BY a.created_at DESC`, [userId]
  );
  return rows;
};

const recordView = async (articleId, sessionId) => {
  const connection = await pool.getConnection();
  let inTransaction = false;
  try {
    await connection.beginTransaction();
    inTransaction = true;
    const [articles] = await connection.execute(
      `SELECT view_count FROM articles
       WHERE article_id = ? AND status = 'published' FOR UPDATE`, [articleId]
    );
    if (!articles.length) {
      await connection.rollback();
      inTransaction = false;
      return null;
    }
    const [result] = await connection.execute(
      `INSERT IGNORE INTO article_views (article_id, session_id)
       VALUES (?, ?)`, [articleId, sessionId]
    );
    const counted = result.affectedRows === 1;
    if (counted) {
      await connection.execute(
        'UPDATE articles SET view_count = view_count + 1 WHERE article_id = ?',
        [articleId]
      );
    }
    const [updated] = await connection.execute(
      'SELECT view_count FROM articles WHERE article_id = ?', [articleId]
    );
    await connection.commit();
    inTransaction = false;
    return { viewCount: updated[0].view_count, counted };
  } catch (error) {
    if (inTransaction) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Prioritise matching categories, then fill remaining slots with recent published articles.
// The current article must be published to expose related recommendations.
const findRelated = async (articleId, limit = 5) => {
  const [rows] = await pool.execute(
    `SELECT a.article_id, a.author_id, a.category_id, a.title, a.summary,
            a.created_at, a.updated_at, c.name AS category,
            u.username AS author_username, u.full_name AS author_name
     FROM articles source
     JOIN articles a ON a.article_id <> source.article_id
     JOIN categories c ON a.category_id = c.category_id
     JOIN users u ON a.author_id = u.user_id
     WHERE source.article_id = ? AND source.status = 'published'
       AND a.status = 'published'
     ORDER BY (a.category_id = source.category_id) DESC,
              a.created_at DESC, a.article_id DESC
     LIMIT ${Number(limit)}`,
    [articleId]
  );
  return rows;
};

module.exports = {
  findCategory, insertArticle, findCreatedArticle, findByAuthor,
  softDelete, findForEdit, update, findPublishedById, findPublished,
  findPersonalised, recordView, findRelated,
};
