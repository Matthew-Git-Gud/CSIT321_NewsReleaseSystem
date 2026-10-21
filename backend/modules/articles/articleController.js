const service = require('./articleService');

// Controllers own HTTP request/response handling; services own rules;
// repositories own SQL. Keep existing endpoint exports and JSON shapes.
const handle = (operation, failureMessage, successStatus = 200) => async (req, res) => {
  try {
    const result = await operation(req);
    return res.status(successStatus).json(result);
  } catch (error) {
    if (error instanceof service.ArticleError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(failureMessage + ':', error);
    return res.status(500).json({ message: failureMessage });
  }
};

const createArticle = handle(
  req => service.createArticle(req.body, req.user.user_id),
  'Server error while creating article', 201
);
const getMyArticles = handle(
  req => service.getMyArticles(req.user.user_id),
  'Server error while fetching articles'
);
const deleteArticle = handle(
  req => service.deleteArticle(req.params.id, req.user.user_id),
  'Server error while deleting article'
);
const getArticleForEdit = handle(
  req => service.getArticleForEdit(req.params.id, req.user.user_id),
  'Server error while fetching article'
);
const updateArticle = handle(
  req => service.updateArticle(req.params.id, req.user.user_id, req.body),
  'Server error while updating article'
);
const getArticleById = handle(
  req => service.getArticleById(req.params.id),
  'Server error while fetching article'
);
const getPublishedArticles = handle(
  () => service.getPublishedArticles(),
  'Server error while fetching articles'
);
const getPersonalisedFeed = handle(
  req => service.getPersonalisedFeed(req.user.user_id),
  'Unable to load personalised feed'
);
const recordArticleView = handle(
  req => service.recordArticleView(req.params.id, (req.body || {}).sessionId),
  'Unable to record article view'
);

const getRelatedArticles = handle(
  req => service.getRelatedArticles(req.params.id),
  'Server error while fetching related articles'
);

module.exports = {
  createArticle, getMyArticles, deleteArticle, getArticleForEdit,
  updateArticle, getArticleById, getPublishedArticles, getPersonalisedFeed,
  recordArticleView, getRelatedArticles,
};
