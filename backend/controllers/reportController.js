const pool = require(
  "../config/database",
);

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
  req,
  res,
) => {
  try {
    const articleId = Number(
      req.params.articleId,
    );

    const reporterId =
      req.user.user_id;

    const {
      reason,
      details,
    } = req.body;

    // Validate article ID
    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
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
      return res.status(400).json({
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
      return res.status(400).json({
        message:
          "Report details cannot exceed 500 characters",
      });
    }

    // Check article exists and is published
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

    const article = articles[0];

    if (
      article.status !== "published"
    ) {
      return res.status(400).json({
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
      return res.status(400).json({
        message:
          "You cannot report your own article",
      });
    }

    // Prevent duplicate pending reports
    const [existingReports] =
      await pool.query(
        `
        SELECT report_id
        FROM article_reports
        WHERE article_id = ?
          AND reporter_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
        [
          articleId,
          reporterId,
        ],
      );

    if (
      existingReports.length > 0
    ) {
      return res.status(409).json({
        message:
          "You have already reported this article",
      });
    }

    // Create report
    const [result] =
      await pool.query(
        `
        INSERT INTO article_reports (
          article_id,
          reporter_id,
          reason,
          details
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          articleId,
          reporterId,
          reason,
          cleanDetails,
        ],
      );

    return res.status(201).json({
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

    return res.status(500).json({
      message:
        "Unable to report article",
    });
  }
};

const getArticleReportStatus = async (
  req,
  res,
) => {
  try {
    const articleId = Number(
      req.params.articleId,
    );

    const userId =
      req.user.user_id;

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    const [articles] =
      await pool.query(
        `
        SELECT
          article_id,
          author_id
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

    const isAuthor =
      articles[0].author_id ===
      userId;

    // No need to check reports
    // if this user wrote the article
    if (isAuthor) {
      return res.status(200).json({
        isAuthor: true,
        hasReported: false,
      });
    }

    const [reports] =
      await pool.query(
        `
        SELECT report_id
        FROM article_reports
        WHERE article_id = ?
          AND reporter_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
        [
          articleId,
          userId,
        ],
      );

    return res.status(200).json({
      isAuthor: false,
      hasReported:
        reports.length > 0,
    });
  } catch (error) {
    console.error(
      "Get article report status error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load report status",
    });
  }
};

const getPendingReports = async (
  req,
  res,
) => {
  try {
    const [reports] =
      await pool.query(
        `
        SELECT
          ar.report_id,
          ar.article_id,
          ar.reporter_id,
          ar.reason,
          ar.details,
          ar.status,
          ar.created_at,

          a.title AS article_title,
          a.author_id,

          reporter.username AS reporter_username,
          reporter.full_name AS reporter_name,

          author.username AS author_username,
          author.full_name AS author_name

        FROM article_reports ar

        JOIN articles a
          ON ar.article_id = a.article_id

        JOIN users reporter
          ON ar.reporter_id = reporter.user_id

        JOIN users author
          ON a.author_id = author.user_id

        WHERE ar.status = 'pending'

        ORDER BY ar.created_at DESC
        `,
      );

    return res.status(200).json(
      reports,
    );
  } catch (error) {
    console.error(
      "Get pending reports error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load article reports",
    });
  }
};


// =========================
// UPDATE REPORT STATUS
// =========================

const updateReportStatus = async (
  req,
  res,
) => {
  try {
    const reportId = Number(
      req.params.reportId,
    );

    const adminId =
      req.user.user_id;

    const {
      status,
    } = req.body;

    if (
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return res.status(400).json({
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
      return res.status(400).json({
        message:
          "Invalid report status",
      });
    }

    const [reports] =
      await pool.query(
        `
        SELECT
          report_id,
          status
        FROM article_reports
        WHERE report_id = ?
        `,
        [reportId],
      );

    if (reports.length === 0) {
      return res.status(404).json({
        message:
          "Report not found",
      });
    }

    if (
      reports[0].status !== "pending"
    ) {
      return res.status(400).json({
        message:
          "This report has already been reviewed",
      });
    }

    await pool.query(
      `
      UPDATE article_reports

      SET
        status = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ?

      WHERE report_id = ?
      `,
      [
        status,
        adminId,
        reportId,
      ],
    );

    return res.status(200).json({
      message:
        status === "reviewed"
          ? "Report marked as reviewed"
          : "Report dismissed",
    });
  } catch (error) {
    console.error(
      "Update report status error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to update report",
    });
  }
};

module.exports = {
  createArticleReport,
  getArticleReportStatus,
  getPendingReports,
  updateReportStatus,
};