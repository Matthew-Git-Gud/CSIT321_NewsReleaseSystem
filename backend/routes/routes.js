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

const { summarizeArticle: summarizeArticleWithAi, getArticleSummary: getArticleAiSummary, generateCoverImagePrompt, generateCoverImage,retrieveCredibilitySources, analyseArticleCredibility } = require('../modules/ai/aiController');

const { listModerationQueue, updateModerationStatus } = require('../modules/admin-credibility/adminCredibilityController');

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

router.post('/ai/cover-image/prompt', authenticate, generateCoverImagePrompt);
router.post('/ai/cover-image/generate', authenticate, generateCoverImage);
router.post('/ai/credibility/sources', authenticate, retrieveCredibilitySources);
router.post('/ai/credibility/analyse', authenticate, analyseArticleCredibility);

router.get('/articles/:id/summary', getArticleAiSummary);
router.post('/articles/:id/summarize', summarizeArticleWithAi);

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

router.get('/admin/credibility', authenticate, requireAdmin, listModerationQueue);
router.put('/admin/credibility/:articleId/status', authenticate, requireAdmin, updateModerationStatus);

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

// =========================
// FRIENDS
// =========================
const friends = require('../modules/friends/friendController');
router.get('/users/search', authenticate, friends.searchUsers);
router.get('/friends', authenticate, friends.listFriends);
router.get('/friends/requests', authenticate, friends.listRequests);
router.post('/friends/requests', authenticate, friends.sendRequest);
router.patch('/friends/requests/:id/accept', authenticate, friends.acceptRequest);
router.patch('/friends/requests/:id/reject', authenticate, friends.rejectRequest);
router.delete('/friends/requests/:id', authenticate, friends.cancelRequest);
router.delete('/friends/:id', authenticate, friends.removeFriend);

// Public external news discovery (cached headlines and search)
const { listExternalNews } = require('../modules/newsAggregation/newsController');
router.get('/external-news', listExternalNews);

router.use('/chat', require('../modules/chatbot/chatRoutes'));

module.exports = router