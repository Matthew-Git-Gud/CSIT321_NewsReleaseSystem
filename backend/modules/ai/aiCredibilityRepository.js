const pool = require('../../config/database');
async function findAssessment(articleId, contentHash) {
  const [rows] = await pool.execute(`SELECT article_id, content_hash, analysis_status, classification, report_json, error_message, generated_at FROM article_ai_credibility WHERE article_id = ? AND content_hash = ? LIMIT 1`, [articleId, contentHash]);
  return rows[0] || null;
}
async function markPending(articleId, contentHash) {
  await pool.execute(`INSERT INTO article_ai_credibility (article_id, content_hash, analysis_status, classification, report_json, error_message, generated_at, moderation_status, admin_notes, reviewed_by, reviewed_at) VALUES (?, ?, 'pending', NULL, NULL, NULL, NULL, 'not_flagged', NULL, NULL, NULL) ON DUPLICATE KEY UPDATE content_hash = VALUES(content_hash), analysis_status = 'pending', classification = NULL, report_json = NULL, error_message = NULL, generated_at = NULL, moderation_status = 'not_flagged', admin_notes = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = CURRENT_TIMESTAMP`, [articleId, contentHash]);
}
async function saveAssessment(articleId, contentHash, report) {
  const moderationStatus = ['contradictory', 'partially_supported'].includes(report.classification) ? 'pending_review' : 'not_flagged';
  await pool.execute(`INSERT INTO article_ai_credibility (article_id, content_hash, analysis_status, classification, report_json, error_message, generated_at, moderation_status) VALUES (?, ?, 'completed', ?, ?, NULL, CURRENT_TIMESTAMP, ?) ON DUPLICATE KEY UPDATE content_hash = VALUES(content_hash), analysis_status = 'completed', classification = VALUES(classification), report_json = VALUES(report_json), error_message = NULL, generated_at = CURRENT_TIMESTAMP, moderation_status = VALUES(moderation_status), admin_notes = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = CURRENT_TIMESTAMP`, [articleId, contentHash, report.classification, JSON.stringify(report), moderationStatus]);
}
async function markFailed(articleId, contentHash, message) {
  await pool.execute(`INSERT INTO article_ai_credibility (article_id, content_hash, analysis_status, classification, report_json, error_message, generated_at, moderation_status) VALUES (?, ?, 'failed', NULL, NULL, ?, NULL, 'not_flagged') ON DUPLICATE KEY UPDATE content_hash = VALUES(content_hash), analysis_status = 'failed', classification = NULL, report_json = NULL, error_message = VALUES(error_message), generated_at = NULL, moderation_status = 'not_flagged', admin_notes = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = CURRENT_TIMESTAMP`, [articleId, contentHash, String(message || 'Credibility analysis failed').slice(0, 500)]);
}
module.exports = { findAssessment, markPending, saveAssessment, markFailed };
