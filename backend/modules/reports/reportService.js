const { outcome } = require('../../shared/outcome');
const repository = require("./reportRepository");

const ALLOWED_REASONS = [
  "misinformation",
  "inappropriate",
  "spam",
  "harassment",
  "other",
];

// =========================
// CREATE ARTICLE REPORT
// =========================

const createArticleReport = async (
  command,
) => {
  try {
    const articleId = Number(
      command.identifiers.articleId,
    );

    const reporterId =
      command.actor.user_id;

    const {
      reason,
      details,
    } = command.payload;

    // Validate article ID
    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    // Validate reason
    if (
      !reason ||
      !ALLOWED_REASONS.includes(
        reason,
      )
    ) {
      return outcome('INVALID', {
        message:
          "Please select a valid report reason",
      });
    }

    // Validate optional details
    const cleanDetails =
      details?.trim() || null;

    if (
      cleanDetails &&
      cleanDetails.length > 500
    ) {
      return outcome('INVALID', {
        message:
          "Report details cannot exceed 500 characters",
      });
    }

    // Check article exists and is published
    const [articles] =
      await repository.statement1([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    const article = articles[0];

    if (
      article.status !== "published"
    ) {
      return outcome('INVALID', {
        message:
          "Only published articles can be reported",
      });
    }

    // Prevent users from reporting
    // their own articles
    if (
      article.author_id ===
      reporterId
    ) {
      return outcome('INVALID', {
        message:
          "You cannot report your own article",
      });
    }

    // Prevent duplicate pending reports
    const [existingReports] =
      await repository.statement2([
          articleId,
          reporterId,
        ], undefined);

    if (
      existingReports.length > 0
    ) {
      return outcome('CONFLICT', {
        message:
          "You have already reported this article",
      });
    }

    // Create report
    const [result] =
      await repository.statement3([
          articleId,
          reporterId,
          reason,
          cleanDetails,
        ], undefined);

    return outcome('CREATED', {
      message:
        "Article reported successfully",
      report: {
        report_id:
          result.insertId,
        article_id:
          articleId,
        reporter_id:
          reporterId,
        reason,
        details:
          cleanDetails,
        status: "pending",
      },
    });
  } catch (error) {
    console.error(
      "Create article report error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to report article",
    });
  }
};

const getArticleReportStatus = async (
  command,
) => {
  try {
    const articleId = Number(
      command.identifiers.articleId,
    );

    const userId =
      command.actor.user_id;

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid article ID",
      });
    }

    const [articles] =
      await repository.statement4([articleId], undefined);

    if (articles.length === 0) {
      return outcome('NOT_FOUND', {
        message: "Article not found",
      });
    }

    const isAuthor =
      articles[0].author_id ===
      userId;

    // No need to check reports
    // if this user wrote the article
    if (isAuthor) {
      return outcome('OK', {
        isAuthor: true,
        hasReported: false,
      });
    }

    const [reports] =
      await repository.statement5([
          articleId,
          userId,
        ], undefined);

    return outcome('OK', {
      isAuthor: false,
      hasReported:
        reports.length > 0,
    });
  } catch (error) {
    console.error(
      "Get article report status error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load report status",
    });
  }
};

const getPendingReports = async (
  command,
) => {
  try {
    const [reports] =
      await repository.statement6(undefined, undefined);

    return outcome('OK', 
      reports,
    );
  } catch (error) {
    console.error(
      "Get pending reports error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to load article reports",
    });
  }
};


// =========================
// UPDATE REPORT STATUS
// =========================

// =========================
// UPDATE REPORT STATUS
// =========================

const updateReportStatus = async (
  command,
) => {
  let connection;

  try {
    const reportId = Number(
      command.identifiers.reportId,
    );

    const adminId =
      command.actor.user_id;

    const { status } = command.payload;

    if (
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return outcome('INVALID', {
        message: "Invalid report ID",
      });
    }

    const allowedStatuses = [
      "reviewed",
      "dismissed",
    ];

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return outcome('INVALID', {
        message:
          "Invalid report status",
      });
    }

    connection =
      await repository.getConnection();

    await connection.beginTransaction();

    // Get report AND associated article
    const [reports] =
      await repository.statement7([reportId], connection);

    if (reports.length === 0) {
      await connection.rollback();

      return outcome('NOT_FOUND', {
        message:
          "Report not found",
      });
    }

    const report = reports[0];

    if (
      report.status !== "pending"
    ) {
      await connection.rollback();

      return outcome('INVALID', {
        message:
          "This report has already been reviewed",
      });
    }

    // Update report
    await repository.statement8([
        status,
        adminId,
        reportId,
      ], connection);

    // If admin accepts the report,
    // remove the reported article
    if (status === "reviewed") {
      await repository.statement9([report.article_id], connection);
    }

    await connection.commit();

    return outcome('OK', {
      message:
        status === "reviewed"
          ? "Report accepted and article removed"
          : "Report dismissed",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Update report status error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
      message:
        "Unable to update report",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  createArticleReport,
  getArticleReportStatus,
  getPendingReports,
  updateReportStatus,
};