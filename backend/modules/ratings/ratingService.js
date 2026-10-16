const { outcome } = require('../../shared/outcome');
const repository = require("./ratingRepository");

// =========================
// GET ARTICLE RATING
// =========================

const getArticleRating = async (
  command,
) => {
  try {
    const articleId = Number(
      command.identifiers.articleId,
    );

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    // Get article first
    const [articles] =
      await repository.statement1([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    if (
      articles[0].status !==
      "published"
    ) {
      return outcome('INVALID', {
        message:
          "Ratings are only available for published articles",
      });
    }

    // Get average + number of ratings
    const [ratingRows] =
      await repository.statement2([articleId], undefined);

    let userRating = null;

    // User may be logged in.
    // If authenticated, return their rating too.
    if (command.actor?.user_id) {
      const [userRatings] =
        await repository.statement3([
            articleId,
            command.actor.user_id,
          ], undefined);

      if (userRatings.length > 0) {
        userRating =
          userRatings[0].rating;
      }
    }

    const averageRating =
      ratingRows[0].average_rating
        ? Number(
            ratingRows[0]
              .average_rating,
          )
        : 0;

    const ratingCount =
      Number(
        ratingRows[0].rating_count,
      );

    return outcome('OK', {
      averageRating,
      ratingCount,
      userRating,
    });
  } catch (error) {
    console.error(
      "Get article rating error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load article rating",
    });
  }
};

// =========================
// CREATE / UPDATE RATING
// =========================

const rateArticle = async (
  command,
) => {
  try {
    const articleId = Number(
      command.identifiers.articleId,
    );

    const userId =
      command.actor.user_id;

    const rating =
      Number(command.payload.rating);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return outcome('INVALID', {
        message:
          "Rating must be between 1 and 5",
      });
    }

    const [articles] =
      await repository.statement4([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    const article =
      articles[0];

    if (
      article.status !==
      "published"
    ) {
      return outcome('INVALID', {
        message:
          "Only published articles can be rated",
      });
    }

    // Prevent users rating their own article
    if (
      article.author_id ===
      userId
    ) {
      return outcome('INVALID', {
        message:
          "You cannot rate your own article",
      });
    }

    // Insert if none exists,
    // update if user already rated it.
    await repository.statement5([
        articleId,
        userId,
        rating,
      ], undefined);

    // Return latest statistics
    const [ratingRows] =
      await repository.statement6([articleId], undefined);

    return outcome('OK', {
      message:
        "Rating saved successfully",

      averageRating:
        ratingRows[0]
          .average_rating
          ? Number(
              ratingRows[0]
                .average_rating,
            )
          : 0,

      ratingCount:
        Number(
          ratingRows[0]
            .rating_count,
        ),

      userRating: rating,
    });
  } catch (error) {
    console.error(
      "Rate article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to save rating",
    });
  }
};

module.exports = {
  getArticleRating,
  rateArticle,
};