const { outcome } = require('../../shared/outcome');
const jwt = require("jsonwebtoken");

const repository = require("./appealRepository");

// =========================
// SUBMIT SUSPENSION APPEAL
// =========================

const submitAppeal = async (
  command,
) => {
  try {
    const { appealToken, reason } =
      command.payload;

    // =========================
    // VALIDATION
    // =========================

    if (!appealToken) {
      return outcome('UNAUTHENTICATED', {
        message:
          "Appeal authorization is required",
      });
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return outcome('INVALID', {
        message:
          "Please provide a reason for your appeal",
      });
    }

    if (reason.trim().length > 2000) {
      return outcome('INVALID', {
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
      return outcome('UNAUTHENTICATED', {
        message:
          "Your appeal session has expired. Please sign in again.",
      });
    }

    if (
      decoded.purpose !==
      "suspension_appeal"
    ) {
      return outcome('UNAUTHENTICATED', {
        message:
          "Invalid appeal authorization",
      });
    }

    const userId = decoded.user_id;

    // =========================
    // CHECK USER
    // =========================

    const [users] =
      await repository.statement1([userId], undefined);

    if (users.length === 0) {
      return outcome('NOT_FOUND', {
        message:
          "User account not found",
      });
    }

    if (
      users[0].status !==
      "suspended"
    ) {
      return outcome('INVALID', {
        message:
          "This account is not suspended",
      });
    }

    // =========================
    // PREVENT DUPLICATE
    // PENDING APPEAL
    // =========================

    const [pendingAppeals] =
      await repository.statement2([userId], undefined);

    if (pendingAppeals.length > 0) {
      return outcome('CONFLICT', {
        message:
          "You already have a pending appeal",
      });
    }

    // =========================
    // CREATE APPEAL
    // =========================

    const [result] =
      await repository.statement3([
          userId,
          reason.trim(),
        ], undefined);

    return outcome('CREATED', {
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

    return outcome('INTERNAL_ERROR', {
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
  command,
) => {
  try {
    const [appeals] =
      await repository.statement4(undefined, undefined);

    /*
     * The controller turns outcome.data into a JSON object. Wrap the list
     * under a key so the browser receives an array at data.appeals.
     */
    return outcome('OK', {
      appeals,
    });
  } catch (error) {
    console.error(
      "Get pending appeals error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
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
  command,
) => {
  const connection =
    await repository.getConnection();

  try {
    const appealId = Number(
      command.identifiers.appealId,
    );

    const {
      status,
      adminResponse,
    } = command.payload;

    if (
      !Number.isInteger(appealId) ||
      appealId <= 0
    ) {
      return outcome('INVALID', {
        message:
          "Invalid appeal ID",
      });
    }

    if (
      status !== "approved" &&
      status !== "rejected"
    ) {
      return outcome('INVALID', {
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
      return outcome('INVALID', {
        message:
          "Admin response must not exceed 500 characters",
      });
    }

    await connection.beginTransaction();

    // Lock appeal while reviewing
    const [appeals] =
      await repository.statement5([appealId], connection);

    if (appeals.length === 0) {
      await connection.rollback();

      return outcome('NOT_FOUND', {
        message:
          "Appeal not found",
      });
    }

    const appeal = appeals[0];

    if (
      appeal.status !== "pending"
    ) {
      await connection.rollback();

      return outcome('CONFLICT', {
        message:
          "This appeal has already been reviewed",
      });
    }

    // =========================
    // UPDATE APPEAL
    // =========================

    await repository.statement6([
        status,
        command.actor.user_id,
        adminResponse?.trim() ||
          null,
        appealId,
      ], connection);

    // =========================
    // APPROVED =
    // REACTIVATE USER
    // =========================

    if (status === "approved") {
      await repository.statement7([appeal.user_id], connection);
    }

    await connection.commit();

    return outcome('OK', {
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

    return outcome('INTERNAL_ERROR', {
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
