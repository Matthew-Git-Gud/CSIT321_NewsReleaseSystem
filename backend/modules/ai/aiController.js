const service = require('./aiService');
const credibilitySources = require('./credibilitySourceService');
const credibility = require('./aiCredibilityService');

function respondWithError(error, res) {
  if (error instanceof service.AiError) return res.status(error.status).json({ message: error.message });
  console.error('AI request failed:', { name: error.name, message: error.message, stack: error.stack });
  return res.status(502).json({ message: 'AI service is unavailable right now' });
}

async function retrieveCredibilitySources(req, res) {
  try {
    const content = req.body?.content;
    if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ message: 'Article content is required' });
    if (content.length > 100000) return res.status(413).json({ message: 'Article content is too large to analyse' });
    return res.json(await credibilitySources.retrieveArticleSources(content));
  } catch (error) { return respondWithError(error, res); }
}

async function analyseArticleCredibility(req, res) {
  try {
    const { content, title } = req.body || {};
    return res.json(await credibility.analyseArticleCredibility({ content, title }));
  } catch (error) { return respondWithError(error, res); }
}

async function generateCoverImagePrompt(req, res) {
  try { return res.json(await service.generateCoverImagePrompt(req.body || {})); }
  catch (error) { return respondWithError(error, res); }
}
async function generateCoverImage(req, res) {
  try { const { imagePrompt, width, height } = req.body || {}; return res.json(await service.generateCoverImage(imagePrompt, { width, height })); }
  catch (error) { return respondWithError(error, res); }
}
async function getArticleSummary(req, res) {
  try { return res.json(await service.getArticleSummary(req.params.id)); }
  catch (error) { return respondWithError(error, res); }
}
async function summarizeArticle(req, res) {
  try { return res.json(await service.summarizeArticle(req.params.id, { force: req.body?.force === true })); }
  catch (error) { return respondWithError(error, res); }
}
module.exports = { getArticleSummary, summarizeArticle, generateCoverImagePrompt, generateCoverImage, retrieveCredibilitySources, analyseArticleCredibility };
