const { outcome } = require('../../shared/outcome');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const repository = require("./authRepository");

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

const sendLoginResponse = (user) => {
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

    return outcome('FORBIDDEN', {
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

  

  return outcome('OK', {
    __authToken: token,
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
  command,
) => {
  try {
    const {
      full_name,
      username,
      email,
      password,
    } = command.payload;

    if (
      !full_name ||
      !username ||
      !email ||
      !password
    ) {
      return outcome('INVALID', {
          message:
            "All fields are required",
        });
    }

    const [existingUsers] =
      await repository.statement1([
          username,
          email,
        ], undefined);

    if (
      existingUsers.length > 0
    ) {
      return outcome('CONFLICT', {
          message:
            "Username or email already exists",
        });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10,
      );

    await repository.statement2([
        username,
        email,
        passwordHash,
        full_name,
      ], undefined);

    return outcome('CREATED', {
        message:
          "Registration successful",
      });
  } catch (error) {
    console.error(
      "Register error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
        message:
          "Server error",
      });
  }
};

// =========================
// NORMAL LOGIN
// =========================

const login = async (
  command,
) => {
  try {
    const {
      email,
      password,
    } = command.payload;

    if (
      !email ||
      !password
    ) {
      return outcome('INVALID', {
          message:
            "Email and password are required",
        });
    }

    // =========================
    // FIND USER
    // =========================

    const [users] =
      await repository.statement3([email], undefined);

    if (users.length === 0) {
      return outcome('UNAUTHENTICATED', {
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
      return outcome('UNAUTHENTICATED', {
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

    return sendLoginResponse(user);
  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
        message:
          "Server error",
      });
  }
};

// =========================
// ADMIN LOGIN
// =========================

const adminLogin = async (
  command,
) => {
  try {
    const {
      email,
      password,
    } = command.payload;

    if (
      !email ||
      !password
    ) {
      return outcome('INVALID', {
          message:
            "Email and password are required",
        });
    }

    const [users] =
      await repository.statement4([email], undefined);

    if (users.length === 0) {
      return outcome('UNAUTHENTICATED', {
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
      return outcome('UNAUTHENTICATED', {
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
      return outcome('FORBIDDEN', {
          message:
            "This account does not have administrator access",
        });
    }

    // Handles both:
    // active admin
    // suspended admin
    return sendLoginResponse(user);
  } catch (error) {
    console.error(
      "Admin login error:",
      error,
    );

    return outcome('INTERNAL_ERROR', {
        message:
          "Server error",
      });
  }
};

// =========================
// LOGOUT
// =========================

const logout = (
  command,
) => {
  

  return outcome('OK', {
    __clearAuthToken: true,
    message:
      "Logout successful",
  });
};

// =========================
// CURRENT USER
// =========================

const getCurrentUser = (
  command,
) => {
  return outcome('OK', {
    user: command.actor,
  });
};

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  getCurrentUser,
};