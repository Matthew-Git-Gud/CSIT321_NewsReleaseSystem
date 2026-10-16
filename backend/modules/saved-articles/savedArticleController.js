// HTTP adapter: Express is confined to controllers. Services receive plain data.
const service = require('./savedArticleService');
const { toHttpStatus } = require('../../shared/outcome');

const authCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
};

const handle = operationName => async (req, res, next) => {
  try {
    const command = {
      payload: req.body || {}, identifiers: req.params || {}, filters: req.query || {},
      actor: req.user || null,
    };
    const result = await service[operationName](command);
    if (!result || typeof result !== 'object' || !('code' in result)) {
      throw new Error('Service did not return a domain outcome');
    }
    const body = { ...result.data };
    if (Object.prototype.hasOwnProperty.call(body, '__authToken')) {
      const token = body.__authToken;
      delete body.__authToken;
      res.cookie('token', token, { ...authCookieOptions, maxAge: 60 * 60 * 1000 });
    }
    if (body.__clearAuthToken) {
      delete body.__clearAuthToken;
      res.clearCookie('token', authCookieOptions);
    }
    return res.status(toHttpStatus(result.code)).json(body);
  } catch (error) {
    console.error('Controller error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getSavedArticles = handle('getSavedArticles');
const getSavedStatus = handle('getSavedStatus');
const saveArticle = handle('saveArticle');
const unsaveArticle = handle('unsaveArticle');

module.exports = { getSavedArticles, getSavedStatus, saveArticle, unsaveArticle };
