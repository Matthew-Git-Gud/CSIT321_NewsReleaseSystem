const jwt = require("jsonwebtoken");

const pool = require(
  "../config/database",
);

// =========================
// SUBMIT SUSPENSION APPEAL
// =========================

const submitAppeal = async (
  req,
  res,
) => {
  try {
    const { appealToken, reason } =
      req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!appealToken) {
      return res.status(401).json({
        message:
          "Appeal authorization is required",
      });
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        message:
          "Please provide a reason for your appeal",
      });
    }

    if (reason.trim().length > 2000) {
      return res.status(400).json({
        message:
          "Appeal reason must not exceed 2000 characters",
      });
    }

    // =========================
    // VERIFY APPEAL TOKEN
    // =========================

    let decoded;

    try {
      decoded = jwt.verify(
        appealToken,
        process.env.JWT_SECRET,
      );
    } catch {
      return res.status(401).json({
        message:
          "Your appeal session has expired. Please sign in again.",
      });
    }

    if (
      decoded.purpose !==
      "suspension_appeal"
    ) {
      return res.status(401).json({
        message:
          "Invalid appeal authorization",
      });
    }

    const userId = decoded.user_id;

    // =========================
    // CHECK USER
    // =========================

    const [users] =
      await pool.query(
        `
        SELECT
          user_id,
          status
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId],
      );

    if (users.length === 0) {
      return res.status(404).json({
        message:
          "User account not found",
      });
    }

    if (
      users[0].status !==
      "suspended"
    ) {
      return res.status(400).json({
        message:
          "This account is not suspended",
      });
    }

    // =========================
    // PREVENT DUPLICATE
    // PENDING APPEAL
    // =========================

    const [pendingAppeals] =
      await pool.query(
        `
        SELECT appeal_id
        FROM suspension_appeals
        WHERE user_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
        [userId],
      );

    if (pendingAppeals.length > 0) {
      return res.status(409).json({
        message:
          "You already have a pending appeal",
      });
    }

    // =========================
    // CREATE APPEAL
    // =========================

    const [result] =
      await pool.query(
        `
        INSERT INTO suspension_appeals (
          user_id,
          reason
        )
        VALUES (?, ?)
        `,
        [
          userId,
          reason.trim(),
        ],
      );

    return res.status(201).json({
      message:
        "Your appeal has been submitted successfully",
      appealId:
        result.insertId,
    });
  } catch (error) {
    console.error(
      "Submit appeal error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to submit appeal",
    });
  }
};

// =========================
// GET PENDING APPEALS
// ADMIN
// =========================

const getPendingAppeals = async (
  req,
  res,
) => {
  try {
    const [appeals] =
      await pool.query(
        `
        SELECT
          sa.appeal_id,
          sa.user_id,
          sa.reason,
          sa.status,
          sa.submitted_at,

          u.username,
          u.full_name,
          u.email

        FROM suspension_appeals sa

        JOIN users u
          ON u.user_id = sa.user_id

        WHERE sa.status = 'pending'

        ORDER BY
          sa.submitted_at ASC
        `,
      );

    return res.status(200).json(
      appeals,
    );
  } catch (error) {
    console.error(
      "Get pending appeals error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load appeals",
    });
  }
};

// =========================
// REVIEW APPEAL
// ADMIN
// =========================

const reviewAppeal = async (
  req,
  res,
) => {
  const connection =
    await pool.getConnection();

  try {
    const appealId = Number(
      req.params.appealId,
    );

    const {
      status,
      adminResponse,
    } = req.body;

    if (
      !Number.isInteger(appealId) ||
      appealId <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid appeal ID",
      });
    }

    if (
      status !== "approved" &&
      status !== "rejected"
    ) {
      return res.status(400).json({
        message:
          "Status must be approved or rejected",
      });
    }

    if (
      adminResponse &&
      (
        typeof adminResponse !==
          "string" ||
        adminResponse.length > 500
      )
    ) {
      return res.status(400).json({
        message:
          "Admin response must not exceed 500 characters",
      });
    }

    await connection.beginTransaction();

    // Lock appeal while reviewing
    const [appeals] =
      await connection.query(
        `
        SELECT
          appeal_id,
          user_id,
          status
        FROM suspension_appeals
        WHERE appeal_id = ?
        FOR UPDATE
        `,
        [appealId],
      );

    if (appeals.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message:
          "Appeal not found",
      });
    }

    const appeal = appeals[0];

    if (
      appeal.status !== "pending"
    ) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "This appeal has already been reviewed",
      });
    }

    // =========================
    // UPDATE APPEAL
    // =========================

    await connection.query(
      `
      UPDATE suspension_appeals
      SET
        status = ?,
        reviewed_at =
          CURRENT_TIMESTAMP,
        reviewed_by = ?,
        admin_response = ?
      WHERE appeal_id = ?
      `,
      [
        status,
        req.user.user_id,
        adminResponse?.trim() ||
          null,
        appealId,
      ],
    );

    // =========================
    // APPROVED =
    // REACTIVATE USER
    // =========================

    if (status === "approved") {
      await connection.query(
        `
        UPDATE users
        SET status = 'active'
        WHERE user_id = ?
        `,
        [appeal.user_id],
      );
    }

    await connection.commit();

    return res.status(200).json({
      message:
        status === "approved"
          ? "Appeal approved and account reactivated"
          : "Appeal rejected",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Review appeal error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to review appeal",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  submitAppeal,
  getPendingAppeals,
  reviewAppeal,
};