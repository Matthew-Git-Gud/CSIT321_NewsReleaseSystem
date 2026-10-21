const repository = require('./articleRepository');

class ArticleError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ArticleError';
    this.status = status;
  }
}

const requireFields = ({ title, summary, content, category_id }) => {
  // Preserve the existing controller's required-field semantics.
  if (!title || !summary || !content || !category_id) {
    throw new ArticleError(400, 'Title, summary, content and category are required');
  }
};

const createArticle = async (body, authorId) => {
  requireFields(body);
  const status = ['draft', 'published'].includes(body.status) ? body.status : 'draft';
  if (!await repository.findCategory(body.category_id)) {
    throw new ArticleError(400, 'Invalid category');
  }
  const id = await repository.insertArticle({
    authorId, category_id: body.category_id,
    title: body.title.trim(), summary: body.summary.trim(),
    content: body.content.trim(), status,
  });
  const article = await repository.findCreatedArticle(id);
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
  const affected = await repository.update(articleId, authorId, {
    title: body.title.trim(), summary: body.summary.trim(),
    content: body.content.trim(), category_id: body.category_id,
    status: body.status,
  });
  if (!affected) throw new ArticleError(404, 'Article not found');
  return { message: 'Article updated successfully' };
};

const getArticleById = async articleId => {
  const article = await repository.findPublishedById(articleId);
  if (!article) throw new ArticleError(404, 'Article not found');
  return { article };
};

const getPublishedArticles = async () => ({ articles: await repository.findPublished() });
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

module.exports = {
  ArticleError, createArticle, getMyArticles, deleteArticle, getArticleForEdit,
  updateArticle, getArticleById, getPublishedArticles, getPersonalisedFeed,
  recordArticleView,
};
