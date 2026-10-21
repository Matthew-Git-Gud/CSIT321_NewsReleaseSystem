const { outcome } = require('../../shared/outcome');
const repository = require("./commentRepository");

// GET /api/articles/:articleId/comments
const getComments = async (command) => {
  try {
    const articleId = command.identifiers.articleId;

    const [comments] = await repository.statement1([articleId], undefined);

    return outcome('OK', {
      comments,
    });
  } catch (error) {
    console.error(
      "Get comments error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while fetching comments",
    });
  }
};


// POST /api/articles/:articleId/comments
const createComment = async (command) => {
  try {
    const articleId =
      command.identifiers.articleId;

    const userId =
      command.actor.user_id;

    const { comment_text } =
      command.payload;

    if (
      !comment_text ||
      !comment_text.trim()
    ) {
      return outcome('INVALID', {
        message:
          "Comment cannot be empty",
      });
    }

    // Make sure the article exists
    // and is publicly published.
    const [articles] =
      await repository.statement2([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message:
          "Article not found",
      });
    }

    const [result] =
      await repository.statement3([
          articleId,
          userId,
          comment_text.trim(),
        ], undefined);

    // Return the newly-created
    // comment with user information.
    const [comments] =
      await repository.statement4([result.insertId], undefined);

    return outcome('CREATED', {
      message:
        "Comment posted successfully",

      comment: comments[0],
    });
  } catch (error) {
    console.error(
      "Create comment error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while posting comment",
    });
  }
};

// PUT /api/comments/:commentId
const updateComment = async (command) => {
  try {
    const commentId = command.identifiers.commentId;
    const userId = command.actor.user_id;
    const { comment_text } = command.payload;

    if (
      !comment_text ||
      !comment_text.trim()
    ) {
      return outcome('INVALID', {
        message:
          "Comment cannot be empty",
      });
    }

    const [result] =
      await repository.statement5([
          comment_text.trim(),
          commentId,
          userId,
        ], undefined);

    if (result.affectedRows === 0) {
      return outcome('NOT_FOUND', {
        message:
          "Comment not found",
      });
    }

    const [comments] =
      await repository.statement6([commentId], undefined);

    return outcome('OK', {
      message:
        "Comment updated successfully",
      comment: comments[0],
    });
  } catch (error) {
    console.error(
      "Update comment error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while updating comment",
    });
  }
};


// DELETE /api/comments/:commentId
const deleteComment = async (command) => {
  try {
    const commentId =
      command.identifiers.commentId;

    const userId =
      command.actor.user_id;

    const [result] =
      await repository.statement7([
          commentId,
          userId,
        ], undefined);

    if (result.affectedRows === 0) {
      return outcome('NOT_FOUND', {
        message:
          "Comment not found",
      });
    }

    return outcome('OK', {
      message:
        "Comment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete comment error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Server error while deleting comment",
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};