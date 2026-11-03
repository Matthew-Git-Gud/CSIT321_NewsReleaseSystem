
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// Extract a named cookie from the Socket.IO handshake.
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const prefix = `${name}=`;

  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!entry) return null;

  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

function reject(next, reason) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Socket.IO auth] ${reason}`);
  }

  return next(
    new Error("Authentication required or session expired")
  );
}

async function socketAuth(socket, next) {
  try {
    // 1. Retrieve JWT from the browser cookie.
    const token = getCookieValue(
      socket.handshake.headers.cookie,
      "token"
    );

    if (!token) {
      return reject(next, "No token cookie in handshake");
    }

    if (!process.env.JWT_SECRET) {
      return reject(next, "JWT_SECRET is not configured");
    }

    // 2. Verify JWT signature and expiration.
    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      const reason =
        error.name === "TokenExpiredError"
          ? "JWT expired"
          : "JWT verification failed";

      return reject(next, reason);
    }

    // 3. Validate the JWT payload.
    if (
      !decoded ||
      !decoded.user_id ||
      decoded.purpose
    ) {
      return reject(
        next,
        "JWT payload is not a normal user session"
      );
    }

    // 4. Verify the user still exists in MySQL.
    const [users] = await pool.query(
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
      [decoded.user_id]
    );

    if (users.length === 0) {
      return reject(next, "Account not found");
    }

    const user = users[0];

    // 5. Reject suspended accounts.
    if (user.status === "suspended") {
      return reject(next, "Account suspended");
    }

    // 6. Store the verified identity on the socket.
    socket.data.user = user;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Socket.IO auth] Authenticated user ${user.user_id}`
      );
    }

    // 7. Allow the Socket.IO connection.
    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[Socket.IO auth] Unexpected authentication failure:",
        error.message
      );
    }

    return next(
      new Error("Authentication temporarily unavailable")
    );
  }
}

module.exports = socketAuth;
