const express = require('express')
const authenticate = require('../middleware/authMiddleware')
const requireAdmin = require('../middleware/adminMiddleware')
const { getDashboard } = require('../controllers/adminController')

const router = express.Router()

// Authentication runs before the role check so only signed-in admins reach dashboard data.
router.use(authenticate, requireAdmin)
router.get('/dashboard', getDashboard)

module.exports = router
