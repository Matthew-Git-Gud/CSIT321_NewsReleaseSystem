const repository = require('./articleRepository');
const credibilityAutomation = require('../ai/aiCredibilityAutomation');
const credibilityService = require('../ai/aiCredibilityService');
const credibilityRepository = require('../ai/aiCredibilityRepository');

class ArticleError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const requireFields = ({ title, summary, content, category_id }) => {
  if (!title || !summary || !content || !category_id) {
    throw new ArticleError(400, 'Title, summary, content and category are required');
  }
};

const validatePublishRequirements = ({ content, featured_image_url }) => {
  if (!featured_image_url || !String(featured_image_url).trim()) {
    throw new ArticleError(400, 'A cover image is required before publishing');
  }
  const sources = require('../ai/credibilitySourceService').extractSourceUrlsFromArticle(content);
  if (!sources.length) {
    throw new ArticleError(400, 'At least one cited source is required before publishing');
  }
};

const runRequiredCredibilityAnalysis = async ({ title, content }) => {
  try {
    return await credibilityService.analyseArticleCredibility({ title, content });
  } catch (error) {
    throw new ArticleError(
      error.status || 502,
      `Credibility analysis must complete before publishing: ${error.message || 'Analysis unavailable'}`
    );
  }
};

const saveRequiredAssessment = async (article, report) => {
  const contentHash = credibilityAutomation.getArticleContentHash(article);
  await credibilityRepository.saveAssessment(article.article_id, contentHash, report);
};

const createArticle = async (body, authorId) => {
  requireFields(body);
  const status = ['draft', 'published'].includes(body.status) ? body.status : 'draft';
  if (!await repository.findCategory(body.category_id)) {
    throw new ArticleError(400, 'Invalid category');
  }

  let credibilityReport = null;
  if (status === 'published') {
    validatePublishRequirements(body);
    credibilityReport = await runRequiredCredibilityAnalysis({
      title: body.title.trim(),
      content: body.content.trim(),
    });
  }

  const id = await repository.insertArticle({
    authorId, category_id: body.category_id,
    title: body.title.trim(), summary: body.summary.trim(),
    content: body.content.trim(), featured_image_url: body.featured_image_url || null, status,
  });
  const article = await repository.findCreatedArticle(id);

  if (status === 'published' && article && credibilityReport) {
    await saveRequiredAssessment(article, credibilityReport);
  }

  return {
    message: status === 'published' ? 'Article published successfully' : 'Draft saved successfully',
    article,
  };
};

const getMyArticles = async authorId => ({ articles: await repository.findByAuthor(authorId) });

const deleteArticle = async (articleId, authorId) => {
  const affected = await repository.softDelete(articleId, authorId);
  if (!affected) throw new ArticleError(404, 'Article not found');
  return { message: 'Article deleted successfully' };
};

const getArticleForEdit = async (articleId, authorId) => {
  const article = await repository.findForEdit(articleId, authorId);
  if (!article) throw new ArticleError(404, 'Article not found');
  return { article };
};

const updateArticle = async (articleId, authorId, body) => {
  requireFields(body);
  if (!['draft', 'published'].includes(body.status)) {
    throw new ArticleError(400, 'Invalid article status');
  }
  if (!await repository.findCategory(body.category_id)) {
    throw new ArticleError(400, 'Invalid category');
  }

  let credibilityReport = null;
  if (body.status === 'published') {
    validatePublishRequirements(body);
    credibilityReport = await runRequiredCredibilityAnalysis({
      title: body.title.trim(),
      content: body.content.trim(),
    });
  }

  const affected = await repository.update(articleId, authorId, {
    title: body.title.trim(), summary: body.summary.trim(),
    content: body.content.trim(), featured_image_url: body.featured_image_url || null, category_id: body.category_id,
    status: body.status,
  });
  if (!affected) throw new ArticleError(404, 'Article not found');

  if (body.status === 'published' && credibilityReport) {
    const article = await repository.findCredibilityArticle(articleId, authorId);
    if (article) await saveRequiredAssessment(article, credibilityReport);
  }
  return { message: 'Article updated successfully' };
};

const getArticleById = async articleId => {
  const article = await repository.findPublishedById(articleId);
  if (!article) throw new ArticleError(404, 'Article not found');
  return { article };
};

const getCoverImageUrl = content => {
  if (typeof content !== 'string') return null;
  const imageMatch = content.match(/<img\\b[^>]*\\bsrc\\s*=\\s*["']([^"']+)["']/i);
  if (!imageMatch) return null;
  const source = imageMatch[1].trim();
  return /^(https?:\/\/|\/api\/media\/|\/article-covers\/)/i.test(source) ? source : null;
};

const getPublishedArticles = async () => {
  const articles = await repository.findPublished();
  return {
    articles: articles.map(({ content, ...article }) => ({
      ...article,
      cover_image_url: article.featured_image_url || getCoverImageUrl(content),
    })),
  };
};
const getPersonalisedFeed = async userId => ({ articles: await repository.findPersonalised(userId) });

const recordArticleView = async (rawId, sessionId) => {
  const articleId = Number(rawId);
  if (!Number.isSafeInteger(articleId) || articleId <= 0) {
    throw new ArticleError(400, 'Invalid article ID');
  }
  const validSessionId = typeof sessionId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId);
  if (!validSessionId) throw new ArticleError(400, 'Invalid session ID');
  const result = await repository.recordView(articleId, sessionId);
  if (!result) throw new ArticleError(404, 'Published article not found');
  return result;
};

const getRelatedArticles = async rawId => {
  const articleId = Number(rawId);
  if (!Number.isSafeInteger(articleId) || articleId <= 0) {
    throw new ArticleError(400, 'Invalid article ID');
  }
  const source = await repository.findPublishedById(articleId);
  if (!source) throw new ArticleError(404, 'Published article not found');
  return { articles: await repository.findRelated(articleId, 5) };
};

module.exports = {
  ArticleError, createArticle, getMyArticles, deleteArticle, getArticleForEdit,
  updateArticle, getArticleById, getPublishedArticles, getPersonalisedFeed,
  recordArticleView, getRelatedArticles,
};
