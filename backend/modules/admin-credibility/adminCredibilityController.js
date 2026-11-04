const pool = require('../../config/database');

const listModerationQueue = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.article_id, a.title, a.summary, a.content, a.status AS article_status,
              a.created_at, u.username AS author, u.full_name AS author_name,
              c.analysis_status, c.classification, c.report_json, c.error_message,
              c.generated_at, c.moderation_status, c.admin_notes, c.reviewed_at,
              reviewer.username AS reviewer_username
       FROM article_ai_credibility c
       JOIN articles a ON a.article_id = c.article_id
       JOIN users u ON u.user_id = a.author_id
       LEFT JOIN users reviewer ON reviewer.user_id = c.reviewed_by
       WHERE c.moderation_status IN ('pending_review', 'under_review')
         AND a.status = 'published'
       ORDER BY CASE c.classification WHEN 'contradictory' THEN 0 ELSE 1 END,
                c.generated_at ASC`
    );
    const items = rows.map(row => ({
      ...row,
      report: typeof row.report_json === 'string' ? JSON.parse(row.report_json) : row.report_json,
    }));
    return res.json({ items });
  } catch (error) {
    console.error('Credibility moderation queue error:', error);
    return res.status(500).json({ message: 'Unable to load credibility moderation queue' });
  }
};

const updateModerationStatus = async (req, res) => {
  const articleId = Number(req.params.articleId);
  const { status, notes = '' } = req.body || {};
  const allowed = ['under_review', 'approved', 'revision_requested', 'removed'];
  if (!Number.isSafeInteger(articleId) || articleId <= 0 || !allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid moderation decision' });
  }
  if (typeof notes !== 'string' || notes.length > 5000) {
    return res.status(400).json({ message: 'Moderation notes must be 5,000 characters or fewer' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT article_id FROM article_ai_credibility WHERE article_id = ? FOR UPDATE`,
      [articleId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Credibility assessment not found' });
    }
    await connection.execute(
      `UPDATE article_ai_credibility
       SET moderation_status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE article_id = ?`,
      [status, notes.trim() || null, req.user.user_id, articleId]
    );
    if (status === 'removed') {
      await connection.execute(`UPDATE articles SET status = 'deleted' WHERE article_id = ?`, [articleId]);
    }
    await connection.commit();
    return res.json({ message: 'Moderation decision saved', article_id: articleId, moderation_status: status });
  } catch (error) {
    await connection.rollback();
    console.error('Credibility moderation update error:', error);
    return res.status(500).json({ message: 'Unable to save moderation decision' });
  } finally {
    connection.release();
  }
};

module.exports = { listModerationQueue, updateModerationStatus };
