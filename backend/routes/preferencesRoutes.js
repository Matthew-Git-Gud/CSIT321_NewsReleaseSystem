const express = require('express')
const authenticate = require('../middleware/authMiddleware')
const {
  getCategories,
  getPreferences,
  savePreferences,
} = require('../controllers/preferencesController')

const router = express.Router()

// Every preference endpoint is protected so users can only change their own topics.
router.use(authenticate)
router.get('/categories', getCategories)
router.get('/', getPreferences)
router.put('/', savePreferences)

module.exports = router
