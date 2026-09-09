const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// =========================
// CREATE NORMAL LOGIN TOKEN
// =========================

const createToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

// =========================
// SEND LOGIN RESPONSE
// =========================

const sendLoginResponse = (
  res,
  user,
) => {
  // Suspended users do NOT
  // receive the normal login cookie.
  if (user.status === "suspended") {
    const appealToken = jwt.sign(
      {
        user_id: user.user_id,
        purpose:
          "suspension_appeal",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    return res
      .status(403)
      .json({
        message:
          "Your account has been suspended",
        suspended: true,
        canAppeal: true,
        appealToken,
      });
  }

  // =========================
  // NORMAL AUTH TOKEN
  // =========================

  const token =
    createToken(user);

  res.cookie(
    "token",
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      maxAge:
        60 * 60 * 1000,
    },
  );

  return res.json({
    message:
      "Login successful",

    user: {
      user_id:
        user.user_id,

      username:
        user.username,

      full_name:
        user.full_name,

      role:
        user.role,
    },
  });
};

// =========================
// REGISTER
// =========================

const register = async (
  req,
  res,
) => {
  try {
    const {
      full_name,
      username,
      email,
      password,
    } = req.body;

    if (
      !full_name ||
      !username ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "All fields are required",
        });
    }

    const [existingUsers] =
      await pool.execute(
        `
        SELECT user_id
        FROM users
        WHERE username = ?
           OR email = ?
        `,
        [
          username,
          email,
        ],
      );

    if (
      existingUsers.length > 0
    ) {
      return res
        .status(409)
        .json({
          message:
            "Username or email already exists",
        });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10,
      );

    await pool.execute(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        full_name
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        username,
        email,
        passwordHash,
        full_name,
      ],
    );

    return res
      .status(201)
      .json({
        message:
          "Registration successful",
      });
  } catch (error) {
    console.error(
      "Register error:",
      error,
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};

// =========================
// NORMAL LOGIN
// =========================

const login = async (
  req,
  res,
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email and password are required",
        });
    }

    // =========================
    // FIND USER
    // =========================

    const [users] =
      await pool.execute(
        `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email],
      );

    if (users.length === 0) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password",
        });
    }

    const user = users[0];

    // =========================
    // VERIFY PASSWORD FIRST
    // =========================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash,
      );

    if (!passwordMatch) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password",
        });
    }

    // =========================
    // PASSWORD CORRECT
    //
    // sendLoginResponse()
    // now decides whether the
    // account is active/suspended.
    // =========================

    return sendLoginResponse(
      res,
      user,
    );
  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};

// =========================
// ADMIN LOGIN
// =========================

const adminLogin = async (
  req,
  res,
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email and password are required",
        });
    }

    const [users] =
      await pool.execute(
        `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email],
      );

    if (users.length === 0) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password",
        });
    }

    const user = users[0];

    // =========================
    // VERIFY PASSWORD FIRST
    // =========================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash,
      );

    if (!passwordMatch) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password",
        });
    }

    // =========================
    // VERIFY ADMIN ROLE
    // =========================

    if (
      user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          message:
            "This account does not have administrator access",
        });
    }

    // Handles both:
    // active admin
    // suspended admin
    return sendLoginResponse(
      res,
      user,
    );
  } catch (error) {
    console.error(
      "Admin login error:",
      error,
    );

    return res
      .status(500)
      .json({
        message:
          "Server error",
      });
  }
};

// =========================
// LOGOUT
// =========================

const logout = (
  req,
  res,
) => {
  res.clearCookie(
    "token",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",
    },
  );

  return res.json({
    message:
      "Logout successful",
  });
};

// =========================
// CURRENT USER
// =========================

const getCurrentUser = (
  req,
  res,
) => {
  return res.json({
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  getCurrentUser,
};