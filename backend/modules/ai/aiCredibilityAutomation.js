const crypto = require('node:crypto');
const repository = require('./aiCredibilityRepository');
const { analyseArticleCredibility } = require('./aiCredibilityService');

function getArticleContentHash(article) {
  return crypto.createHash('sha256')
    .update(`${article.title || ''}\\n\\n${article.content || ''}`)
    .digest('hex');
}

// Fire-and-forget by design: publication must not depend on Azure availability.
// The result and processing state are persisted for the admin queue and reader cache.
const inFlight = new Set();

function scheduleArticleAnalysis(article) {
  if (!article || !Number.isSafeInteger(Number(article.article_id)) ||
      article.status !== 'published' || !article.content) return;

  const articleId = Number(article.article_id);
  const contentHash = getArticleContentHash(article);

  if (inFlight.has(`${articleId}:${contentHash}`)) return;
  inFlight.add(`${articleId}:${contentHash}`);

  setImmediate(async () => {
    try {
      const existing = await repository.findAssessment(articleId, contentHash);
      if (existing?.analysis_status === 'completed' || existing?.analysis_status === 'pending') return;

      await repository.markPending(articleId, contentHash);
      const report = await analyseArticleCredibility({
        title: article.title,
        content: article.content,
      });
      await repository.saveAssessment(articleId, contentHash, report);
    } catch (error) {
      console.error('Automatic article credibility analysis failed:', {
        articleId,
        message: error.message,
      });
      try {
        await repository.markFailed(articleId, contentHash, error.message);
      } catch (saveError) {
        console.error('Could not save credibility analysis failure state:', {
          articleId,
          message: saveError.message,
        });
      }
    } finally {
      inFlight.delete(`${articleId}:${contentHash}`);
    }
  });
}

module.exports = { scheduleArticleAnalysis, getArticleContentHash };
