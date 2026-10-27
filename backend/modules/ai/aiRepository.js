const pool = require('../../config/database');

async function findPublishedArticle(id) {
  const [rows] = await pool.execute(
    "SELECT article_id, title, content FROM articles WHERE article_id = ? AND status = 'published' LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function getCachedSummary(articleId, contentHash) {
  const [rows] = await pool.execute(
    'SELECT summary FROM article_ai_summaries WHERE article_id = ? AND content_hash = ? LIMIT 1',
    [articleId, contentHash]
  );
  return rows[0]?.summary || null;
}

async function saveSummary(articleId, contentHash, summary) {
  await pool.execute(
    `INSERT INTO article_ai_summaries (article_id, content_hash, summary)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE content_hash = VALUES(content_hash),
     summary = VALUES(summary), generated_at = CURRENT_TIMESTAMP`,
    [articleId, contentHash, summary]
  );
}

module.exports = { findPublishedArticle, getCachedSummary, saveSummary };
