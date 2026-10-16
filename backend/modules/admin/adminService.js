const { outcome } = require('../../shared/outcome');
const repository = require("./adminRepository");

const getDashboard = async (
  command,
) => {
  const search =
    typeof command.filters.search === "string"
      ? command.filters.search.trim()
      : "";

  const status =
    typeof command.filters.status === "string"
      ? command.filters.status
      : "";

  const categoryId =
    Number.parseInt(
      command.filters.categoryId,
      10,
    );

  try {
    // =========================
    // DASHBOARD SUMMARY
    // =========================

    const [summaryRows] =
      await repository.statement1(undefined, undefined);

    // =========================
    // CATEGORIES
    // =========================

    const [categories] =
      await repository.statement2(undefined, undefined);

    // =========================
    // FILTERS
    // =========================

    const filters = [];
    const values = [];

    if (search) {
      filters.push(
        `(a.title LIKE ?
          OR u.username LIKE ?
          OR u.full_name LIKE ?)`,
      );

      const searchTerm =
        `%${search}%`;

      values.push(
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    if (
      [
        "draft",
        "published",
        "deleted",
      ].includes(status)
    ) {
      filters.push(
        "a.status = ?",
      );

      values.push(status);
    }

    if (
      Number.isInteger(categoryId)
    ) {
      filters.push(
        "a.category_id = ?",
      );

      values.push(categoryId);
    }

    const whereClause =
      filters.length > 0
        ? `WHERE ${filters.join(
            " AND ",
          )}`
        : "";

    // =========================
    // ARTICLES
    // =========================

    const [articles] =
      await repository.statement3(values, undefined, { whereClause });

    return outcome('OK', {
      summary:
        summaryRows[0],

      categories,
      articles,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load the admin dashboard",
    });
  }
};

const getUsers = async (command) => {
  try {
    const search =
      command.filters.search?.trim() || "";

    let sql = `
      SELECT
        user_id,
        username,
        email,
        full_name,
        role,
        status,
        created_at
      FROM users
    `;

    const params = [];

    if (search) {
      sql += `
        WHERE
          username LIKE ?
          OR email LIKE ?
          OR full_name LIKE ?
      `;

      const searchValue = `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
      );
    }

    sql += `
      ORDER BY created_at DESC
    `;

    const [users] =
      await repository.queryUsers(sql, params);

    return outcome('OK', {
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load users",
    });
  }
};


const updateUserStatus = async (
  command,
) => {
  try {
    const userId =
      Number(command.identifiers.userId);

    const { status } = command.payload;

    if (
      ![
        "active",
        "suspended",
      ].includes(status)
    ) {
      return outcome('INVALID', {
        message:
          "Invalid account status",
      });
    }

    if (
      userId === command.actor.user_id
    ) {
      return outcome('INVALID', {
        message:
          "You cannot suspend your own account",
      });
    }

    const [users] =
      await repository.statement4([userId], undefined);

    if (users.length === 0) {
      return outcome('NOT_FOUND', {
        message:
          "User not found",
      });
    }

    /*
     * Prevent one administrator
     * from suspending another
     * administrator.
     */
    if (
      users[0].role === "admin"
    ) {
      return outcome('FORBIDDEN', {
        message:
          "Administrator accounts cannot be suspended",
      });
    }

    await repository.statement5([
        status,
        userId,
      ], undefined);

    return outcome('OK', {
      message:
        status === "suspended"
          ? "User suspended successfully"
          : "User reactivated successfully",

      user: {
        user_id: userId,
        status,
      },
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to update user status",
    });
  }
};

const deleteArticleAsAdmin = async (command) => {
  try {
    const articleId =
      Number(command.identifiers.articleId);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    const [articles] = await repository.statement6([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    if (
      articles[0].status === "deleted"
    ) {
      return outcome('INVALID', {
        message:
          "Article is already deleted",
      });
    }

    await repository.statement7([articleId], undefined);

    return outcome('OK', {
      message:
        "Article deleted successfully",
    });
  } catch (error) {
    console.error(
      "Admin delete article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to delete article",
    });
  }
};

const getArticleForAdminEdit = async (
  command,
) => {
  try {
    const articleId =
      Number(command.identifiers.articleId);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    const [articles] =
      await repository.statement8([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    return outcome('OK', {
      article: articles[0],
    });
  } catch (error) {
    console.error(
      "Admin get article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load article",
    });
  }
};

const updateArticleAsAdmin = async (
  command,
) => {
  try {
    const articleId =
      Number(command.identifiers.articleId);

    const {
      title,
      summary,
      content,
      category_id,
      status,
    } = command.payload;

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    if (
      !title?.trim() ||
      !summary?.trim() ||
      !content?.trim() ||
      !category_id
    ) {
      return outcome('INVALID', {
        message:
          "Title, summary, content and category are required",
      });
    }

    const allowedStatuses = [
      "draft",
      "published",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return outcome('INVALID', {
        message:
          "Invalid article status",
      });
    }

    const [articles] =
      await repository.statement9([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    if (
      articles[0].status ===
      "deleted"
    ) {
      return outcome('INVALID', {
        message:
          "Deleted articles cannot be edited",
      });
    }

    const [categories] =
      await repository.statement10([category_id], undefined);

    if (
      categories.length === 0
    ) {
      return outcome('INVALID', {
        message:
          "Invalid category",
      });
    }

    await repository.statement11([
        title.trim(),
        summary.trim(),
        content.trim(),
        category_id,
        status,
        articleId,
      ], undefined);

    const [updatedArticles] =
      await repository.statement12([articleId], undefined);

    return outcome('OK', {
      message:
        "Article updated successfully",
      article:
        updatedArticles[0],
    });
  } catch (error) {
    console.error(
      "Admin update article error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to update article",
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  deleteArticleAsAdmin,
  getArticleForAdminEdit,
  updateArticleAsAdmin,
};