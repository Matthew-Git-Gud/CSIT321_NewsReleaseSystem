require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes/routes');
const { initializeSocketServer } = require('./config/socket');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

const server = http.createServer(app);
initializeSocketServer(server, 'http://localhost:5173');
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (Socket.IO enabled)`));
