const { outcome } = require('../../shared/outcome');
const repository = require("./savedArticleRepository");

// ========================================
// GET /api/saved-articles
// ========================================

const getSavedArticles = async (command) => {
  try {
    const userId = command.actor.user_id;

    const [articles] = await repository.statement1([userId], undefined);

    return outcome('OK', {
      articles,
    });
  } catch (error) {
    console.error(
      "Get saved articles error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while fetching saved articles",
    });
  }
};


// ========================================
// GET /api/articles/:articleId/saved
// ========================================

const getSavedStatus = async (command) => {
  try {
    const userId = command.actor.user_id;
    const articleId = command.identifiers.articleId;

    const [savedArticles] =
      await repository.statement2([userId, articleId], undefined);

    return outcome('OK', {
      saved:
        savedArticles.length > 0,
    });
  } catch (error) {
    console.error(
      "Get saved status error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while checking saved article",
    });
  }
};


// ========================================
// POST /api/articles/:articleId/save
// ========================================

const saveArticle = async (command) => {
  try {
    const userId = command.actor.user_id;
    const articleId = command.identifiers.articleId;

    // Only published articles can be saved.
    const [articles] = await repository.statement3([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    // Check whether already saved.
    const [existing] = await repository.statement4([userId, articleId], undefined);

    if (existing.length > 0) {
      return outcome('OK', {
        message: "Article already saved",
        saved: true,
      });
    }

    await repository.statement5([userId, articleId], undefined);

    return outcome('CREATED', {
      message:
        "Article saved successfully",
      saved: true,
    });
  } catch (error) {
    console.error(
      "Save article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while saving article",
    });
  }
};


// ========================================
// DELETE /api/articles/:articleId/save
// ========================================

const unsaveArticle = async (command) => {
  try {
    const userId = command.actor.user_id;
    const articleId = command.identifiers.articleId;

    await repository.statement6([userId, articleId], undefined);

    return outcome('OK', {
      message:
        "Article removed from saved articles",
      saved: false,
    });
  } catch (error) {
    console.error(
      "Unsave article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while removing saved article",
    });
  }
};

module.exports = {
  getSavedArticles,
  getSavedStatus,
  saveArticle,
  unsaveArticle,
};