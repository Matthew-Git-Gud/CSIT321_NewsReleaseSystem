
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

const clearAuthCookie = (res) => {
  res.clearCookie('token', authCookieOptions);
};

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  let decoded;

  // Verify JWT separately so database errors aren't mistaken
  // for invalid or expired authentication sessions.
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn(
      '[Auth Middleware] JWT verification failed:',
      error.message
    );

    clearAuthCookie(res);

    return res.status(401).json({
      message: 'Invalid or expired session',
    });
  }

  try {
    const [users] = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.role,
        u.status,
        COALESCE(up.accent_colour, 'emerald') AS accent_colour
      FROM users AS u
      LEFT JOIN user_preferences AS up
        ON up.user_id = u.user_id
      WHERE u.user_id = ?
      `,
      [decoded.user_id]
    );

    if (users.length === 0) {
      clearAuthCookie(res);

      return res.status(401).json({
        message: 'User account not found',
      });
    }

    const user = users[0];

    if (user.status === 'suspended') {
      clearAuthCookie(res);

      return res.status(403).json({
        message: 'Your account has been suspended',
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error(
      '[Auth Middleware] Database error:',
      error
    );

    return next(error);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    req.user = null;
    return next();
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn(
      '[Auth Middleware] Optional JWT verification failed:',
      error.message
    );

    clearAuthCookie(res);
    req.user = null;

    return next();
  }

  try {
    const [users] = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.role,
        u.status,
        COALESCE(up.accent_colour, 'emerald') AS accent_colour
      FROM users AS u
      LEFT JOIN user_preferences AS up
        ON up.user_id = u.user_id
      WHERE u.user_id = ?
      LIMIT 1
      `,
      [decoded.user_id]
    );

    if (users.length === 0) {
      clearAuthCookie(res);
      req.user = null;

      return next();
    }

    const user = users[0];

    if (user.status === 'suspended') {
      clearAuthCookie(res);
      req.user = null;

      return next();
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      accent_colour: user.accent_colour,
    };

    return next();
  } catch (error) {
    console.error(
      '[Auth Middleware] Optional authentication database error:',
      error
    );

    return next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
