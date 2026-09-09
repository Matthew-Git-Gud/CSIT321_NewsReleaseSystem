const pool = require("../config/database");

// =========================
// GET ARTICLE RATING
// =========================

const getArticleRating = async (
  req,
  res,
) => {
  try {
    const articleId = Number(
      req.params.articleId,
    );

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    // Get article first
    const [articles] =
      await pool.query(
        `
        SELECT
          article_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
        [articleId],
      );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    if (
      articles[0].status !==
      "published"
    ) {
      return res.status(400).json({
        message:
          "Ratings are only available for published articles",
      });
    }

    // Get average + number of ratings
    const [ratingRows] =
      await pool.query(
        `
        SELECT
          ROUND(
            AVG(rating),
            1
          ) AS average_rating,
          COUNT(*) AS rating_count
        FROM article_ratings
        WHERE article_id = ?
        `,
        [articleId],
      );

    let userRating = null;

    // User may be logged in.
    // If authenticated, return their rating too.
    if (req.user?.user_id) {
      const [userRatings] =
        await pool.query(
          `
          SELECT rating
          FROM article_ratings
          WHERE article_id = ?
            AND user_id = ?
          LIMIT 1
          `,
          [
            articleId,
            req.user.user_id,
          ],
        );

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

    return res.status(200).json({
      averageRating,
      ratingCount,
      userRating,
    });
  } catch (error) {
    console.error(
      "Get article rating error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load article rating",
    });
  }
};

// =========================
// CREATE / UPDATE RATING
// =========================

const rateArticle = async (
  req,
  res,
) => {
  try {
    const articleId = Number(
      req.params.articleId,
    );

    const userId =
      req.user.user_id;

    const rating =
      Number(req.body.rating);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        message:
          "Rating must be between 1 and 5",
      });
    }

    const [articles] =
      await pool.query(
        `
        SELECT
          article_id,
          author_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
        [articleId],
      );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    const article =
      articles[0];

    if (
      article.status !==
      "published"
    ) {
      return res.status(400).json({
        message:
          "Only published articles can be rated",
      });
    }

    // Prevent users rating their own article
    if (
      article.author_id ===
      userId
    ) {
      return res.status(400).json({
        message:
          "You cannot rate your own article",
      });
    }

    // Insert if none exists,
    // update if user already rated it.
    await pool.query(
      `
      INSERT INTO article_ratings (
        article_id,
        user_id,
        rating
      )
      VALUES (?, ?, ?)

      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        updated_at =
          CURRENT_TIMESTAMP
      `,
      [
        articleId,
        userId,
        rating,
      ],
    );

    // Return latest statistics
    const [ratingRows] =
      await pool.query(
        `
        SELECT
          ROUND(
            AVG(rating),
            1
          ) AS average_rating,
          COUNT(*) AS rating_count
        FROM article_ratings
        WHERE article_id = ?
        `,
        [articleId],
      );

    return res.status(200).json({
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

    return res.status(500).json({
      message:
        "Unable to save rating",
    });
  }
};

module.exports = {
  getArticleRating,
  rateArticle,
};