
require('dotenv').config({ path: './.env' });

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const pool = require('./config/database');
const routes = require('./routes/routes');
const { initializeSocketServer } = require('./config/socket');

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = 'http://localhost:5173';

// =========================
// EXPRESS MIDDLEWARE
// =========================

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// =========================
// BACKEND READINESS CHECK
// =========================

// Checks whether Express and MySQL are ready.
// Does not require JWT authentication.
app.get('/api/health/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      ready: true,
    });
  } catch (error) {
    console.error(
      '[Health Check] Database unavailable:',
      error.message
    );

    return res.status(503).json({
      ready: false,
    });
  }
});

// =========================
// API ROUTES
// =========================

app.use('/api', routes);

// =========================
// HTTP + SOCKET.IO SERVER
// =========================

const server = http.createServer(app);

// =========================
// DATABASE CONNECTION CHECK
// =========================

async function waitForDatabase(
  maxAttempts = 15,
  retryDelayMs = 1000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query('SELECT 1');

      console.log(
        '[Database] Connected successfully!'
      );

      return;
    } catch (error) {
      console.error(
        `[Database] Connection attempt ${attempt}/${maxAttempts} failed:`,
        error.message
      );

      if (attempt === maxAttempts) {
        throw new Error(
          'Database unavailable after maximum retry attempts.'
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs)
      );
    }
  }
}

// =========================
// START APPLICATION
// =========================

async function startServer() {
  try {
    console.log('[Startup] Checking database connection...');

    // Wait for MySQL before starting HTTP requests.
    await waitForDatabase();

    // Initialize Socket.IO using your existing setup.
    initializeSocketServer(
      server,
      FRONTEND_ORIGIN
    );

    // Start Express and Socket.IO together.
    await new Promise((resolve, reject) => {
      server.once('error', reject);

      server.listen(PORT, () => {
        server.off('error', reject);
        resolve();
      });
    });

    console.log(
      `[Startup] Server running on port ${PORT} (Socket.IO enabled)`
    );

    console.log(
      '[Startup] Backend ready to accept requests.'
    );
  } catch (error) {
    console.error(
      '[Startup] Failed to start application:',
      error
    );

    process.exitCode = 1;

    // Close the database pool on startup failure.
    try {
      await pool.end();
    } catch (closeError) {
      console.error(
        '[Startup] Failed to close database pool:',
        closeError.message
      );
    }
  }
}

startServer();
