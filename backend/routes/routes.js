const express = require('express')

const {
  register,
  login,
  logout,
  getCurrentUser,
} = require('../modules/auth/authController')

const {
  createArticle,
  getMyArticles,
  getArticleById,
  getArticleForEdit,
  updateArticle,
  recordArticleView,
  deleteArticle,
  getPublishedArticles,
  getPersonalisedFeed,
  getRelatedArticles,
} = require("../modules/articles/articleController");

const {
  getCategories,
} = require('../modules/categories/categoryController')

const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require(
  "../modules/comments/commentController",
);

const {
  getSavedArticles,
  getSavedStatus,
  saveArticle,
  unsaveArticle,
} = require(
  "../modules/saved-articles/savedArticleController",
);
const requireAdmin = require(
  "../middleware/adminMiddleware",
);

const {
  getDashboard,
  getUsers,
  updateUserStatus,
  deleteArticleAsAdmin,
  getArticleForAdminEdit,
  updateArticleAsAdmin,
} = require(
  "../modules/admin/adminController",
);

const {
  getCategories:
    getPreferenceCategories,

  getPreferences,
  savePreferences,
} = require(
  "../modules/preferences/preferencesController",
);

const {
  createArticleReport,
  getArticleReportStatus,
  getPendingReports,
  updateReportStatus,
} = require(
  "../modules/reports/reportController",
);

const {
  getArticleRating,
  rateArticle,
} = require(
  "../modules/ratings/ratingController",
);

const {
  submitAppeal,
  getPendingAppeals,
  reviewAppeal,
} = require(
  "../modules/appeals/appealController",
);

const {
  authenticate,
  optionalAuthenticate,
} = require(
  "../middleware/authMiddleware",
);

const { uploadMedia, getMedia } = require('../modules/media/mediaController');
const {
  list: listNotifications,
  unreadCount: getNotificationUnreadCount,
  markRead: markNotificationRead,
  markAllRead: markAllNotificationsRead,
} = require('../modules/notifications/notificationController')


const { shareArticle: shareArticleWithUser, sharedWithMe } = require('../modules/shares/shareController')

const router = express.Router()

router.post('/media', authenticate, uploadMedia);
router.get('/media/:filename', getMedia);


router.post(
  "/articles/:articleId/reports",
  authenticate,
  createArticleReport,
);

router.get(
  "/articles/:articleId/report-status",
  authenticate,
  getArticleReportStatus,
);

//rating
router.get(
  "/articles/:articleId/rating",
  optionalAuthenticate,
  getArticleRating,
);

router.put(
  "/articles/:articleId/rating",
  authenticate,
  rateArticle,
);

// Auth
router.post('/auth/register', register)
router.post('/auth/login', login)
router.post('/auth/logout', logout)
router.get('/auth/me', authenticate, getCurrentUser)

// Categories
router.get('/categories', getCategories)

router.get(
  '/articles', 
  getPublishedArticles
);

// Articles
router.get(
  "/articles/feed",
  authenticate,
  getPersonalisedFeed
);

router.get(
  "/articles/mine",
  authenticate,
  getMyArticles,
);

router.get(
  "/articles/:id/edit",
  authenticate,
  getArticleForEdit,
);

router.get(
  "/articles/:id/related",
  getRelatedArticles,
);

// Sharing routes (static path before the dynamic article route)
router.get('/articles/shared-with-me', authenticate, sharedWithMe);
router.post('/articles/:id/share', authenticate, shareArticleWithUser);

router.get(
  "/articles/:id",
  getArticleById,
);

router.post(
  "/articles",
  authenticate,
  createArticle,
);

router.put(
  "/articles/:id",
  authenticate,
  updateArticle,
);

router.delete(
  "/articles/:id",
  authenticate,
  deleteArticle,
);

router.get(
  "/articles/:articleId/comments",
  getComments,
);

router.post(
  "/articles/:articleId/comments",
  authenticate,
  createComment,
);

router.post(
  "/articles/:id/view",
  recordArticleView
);

//comments
router.put(
  "/comments/:commentId",
  authenticate,
  updateComment,
);

router.delete(
  "/comments/:commentId",
  authenticate,
  deleteComment,
);

// Saved articles
router.get(
  "/saved-articles",
  authenticate,
  getSavedArticles,
);

router.get(
  "/articles/:articleId/saved",
  authenticate,
  getSavedStatus,
);

router.post(
  "/articles/:articleId/save",
  authenticate,
  saveArticle,
);

router.delete(
  "/articles/:articleId/save",
  authenticate,
  unsaveArticle,
);
// ========================================
// PREFERENCES
// ========================================

router.get(
  "/preferences/categories",
  authenticate,
  getPreferenceCategories,
);

router.get(
  "/preferences",
  authenticate,
  getPreferences,
);

router.put(
  "/preferences",
  authenticate,
  savePreferences,
);


// ========================================
// ADMIN
// ========================================
router.get(
  "/admin/reports",
  authenticate,
  requireAdmin,
  getPendingReports,
);

router.put(
  "/admin/reports/:reportId/status",
  authenticate,
  requireAdmin,
  updateReportStatus,
);

router.get(
  "/admin/dashboard",
  authenticate,
  requireAdmin,
  getDashboard,
);

router.get(
  "/admin/users",
  authenticate,
  requireAdmin,
  getUsers,
);

router.put(
  "/admin/users/:userId/status",
  authenticate,
  requireAdmin,
  updateUserStatus,
);

router.delete(
  "/admin/articles/:articleId",
  authenticate,
  requireAdmin,
  deleteArticleAsAdmin,
);

router.get(
  "/admin/articles/:articleId",
  authenticate,
  requireAdmin,
  getArticleForAdminEdit,
);

router.put(
  "/admin/articles/:articleId",
  authenticate,
  requireAdmin,
  updateArticleAsAdmin,
);

// =========================
// SUSPENSION APPEALS
// =========================

// Special public endpoint.
// Identity is verified by the
// short-lived appeal token.
router.post(
  "/appeals",
  submitAppeal,
);

// Admin
router.get(
  "/admin/appeals",
  authenticate,
  requireAdmin,
  getPendingAppeals,
);

router.put(
  "/admin/appeals/:appealId",
  authenticate,
  requireAdmin,
  reviewAppeal,
);

// =========================
// NOTIFICATIONS
// =========================
router.get('/notifications', authenticate, listNotifications)
router.get('/notifications/unread-count', authenticate, getNotificationUnreadCount)
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead)
router.patch('/notifications/:id/read', authenticate, markNotificationRead)

module.exports = router