const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const authenticate = async (
  req,
  res,
  next,
) => {
  try {
    const token =
      req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    const [users] =
      await pool.query(
        `
        SELECT
          user_id,
          username,
          full_name,
          role,
          status
        FROM users
        WHERE user_id = ?
        `,
        [decoded.user_id],
      );

    if (users.length === 0) {
      res.clearCookie("token");

      return res.status(401).json({
        message:
          "User account not found",
      });
    }

    const user = users[0];

    if (
      user.status ===
      "suspended"
    ) {
      res.clearCookie("token");

      return res.status(403).json({
        message:
          "Your account has been suspended",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    res.clearCookie("token");

    return res.status(401).json({
      message:
        "Invalid or expired session",
    });
  }
};

const optionalAuthenticate = async (
  req,
  res,
  next,
) => {
  try {
    const token =
      req.cookies.token;

    // No token = guest.
    // Continue normally.
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET,
      );

    const [users] =
      await pool.query(
        `
        SELECT
          user_id,
          username,
          full_name,
          role,
          status
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [decoded.user_id],
      );

    // Invalid/deleted user:
    // treat as guest.
    if (users.length === 0) {
      res.clearCookie("token");
      req.user = null;

      return next();
    }

    const user = users[0];

    // Suspended user:
    // don't authenticate them.
    if (user.status === "suspended") {
      res.clearCookie("token");
      req.user = null;

      return next();
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };

    return next();
  } catch (error) {
    // Expired/invalid token:
    // continue as guest.
    res.clearCookie("token");
    req.user = null;

    return next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};