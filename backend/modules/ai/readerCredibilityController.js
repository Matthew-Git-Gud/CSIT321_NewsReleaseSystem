
const articles = require('../articles/articleRepository');
const credibilityRepository = require('./aiCredibilityRepository');
const automation = require('./aiCredibilityAutomation');

// Public readers may view completed reports for published articles.
// The content hash ensures an obsolete assessment is never displayed.
const getReaderCredibility = async (req, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isSafeInteger(articleId) || articleId <= 0) {
    return res.status(400).json({ message: 'Invalid article ID' });
  }
  try {
    const article = await articles.findPublishedById(articleId);
    if (!article) return res.status(404).json({ message: 'Published article not found' });

    const contentHash = automation.getArticleContentHash(article);
    const assessment = await credibilityRepository.findAssessment(articleId, contentHash);
    if (!assessment) return res.json({ status: 'not_started', report: null });
    if (assessment.analysis_status === 'completed') {
      let report = assessment.report_json;
      if (typeof report === 'string') report = JSON.parse(report);
      return res.json({
        status: 'completed',
        classification: assessment.classification,
        generated_at: assessment.generated_at,
        report,
      });
    }
    if (assessment.analysis_status === 'failed') {
      return res.json({ status: 'failed', report: null, message: 'Credibility analysis could not be completed. Please try again.' });
    }
    return res.json({ status: assessment.analysis_status, report: null });
  } catch (error) {
    console.error('Reader credibility lookup failed:', error);
    return res.status(500).json({ message: 'Unable to load credibility assessment' });
  }
};

// Generation is authenticated to reduce anonymous AI-cost abuse.
// The analysis runs asynchronously; readers poll the public GET endpoint.
const requestReaderCredibility = async (req, res) => {
  const articleId = Number(req.params.articleId);
  if (!Number.isSafeInteger(articleId) || articleId <= 0) {
    return res.status(400).json({ message: 'Invalid article ID' });
  }
  try {
    const article = await articles.findPublishedById(articleId);
    if (!article) return res.status(404).json({ message: 'Published article not found' });
    const contentHash = automation.getArticleContentHash(article);
    const existing = await credibilityRepository.findAssessment(articleId, contentHash);
    if (existing?.analysis_status === 'completed') {
      return res.json({ status: 'completed', message: 'Credibility assessment is ready' });
    }
    if (existing?.analysis_status === 'pending') {
      return res.status(202).json({ status: 'pending', message: 'Credibility analysis is already running' });
    }
    automation.scheduleArticleAnalysis(article);
    return res.status(202).json({ status: 'pending', message: 'Credibility analysis has been queued' });
  } catch (error) {
    console.error('Reader credibility request failed:', error);
    return res.status(500).json({ message: 'Unable to request credibility assessment' });
  }
};

module.exports = { getReaderCredibility, requestReaderCredibility };
