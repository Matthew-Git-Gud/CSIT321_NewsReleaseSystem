const service = require('./aiService');

function respondWithError(error, res) {
  if (error instanceof service.AiError) return res.status(error.status).json({ message: error.message });
  console.error('AI summary request failed:', {
    status: error.status,
    name: error.name,
    message: error.message,
    stack: error.stack
  }); return res.status(502).json({ message: 'AI summary is unavailable right now' });
}


async function generateCoverImagePrompt(req, res) {
  try {
    return res.json(await service.generateCoverImagePrompt(req.body || {}));
  } catch (error) { return respondWithError(error, res); }
}


async function generateCoverImage(req, res) {
  try {
    const { imagePrompt, width, height } = req.body || {};
    return res.json(await service.generateCoverImage(imagePrompt, { width, height }));
  } catch (error) { return respondWithError(error, res); }
}

async function getArticleSummary(req, res) {
  try {
    return res.json(await service.getArticleSummary(req.params.id));
  } catch (error) { return respondWithError(error, res); }
}

async function summarizeArticle(req, res) {
  try {
    // Explicit regeneration only; never infer it from a page view.
    const force = req.body?.force === true;
    return res.json(await service.summarizeArticle(req.params.id, { force }));
  } catch (error) { return respondWithError(error, res); }
}



module.exports = {
  getArticleSummary,
  summarizeArticle,
  generateCoverImagePrompt,
  generateCoverImage,
};
