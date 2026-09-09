const express = require('express')
const {
  register,
  login,
  adminLogin,
  logout,
  getCurrentUser,
} = require('../controllers/authController')
const authenticate = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/admin/login', adminLogin)
router.post('/logout', logout)
router.get('/me', authenticate, getCurrentUser)

module.exports = router
