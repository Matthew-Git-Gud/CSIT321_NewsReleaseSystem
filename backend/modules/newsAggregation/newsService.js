const provider = require('./newsProvider');
const repository = require('./newsRepository');

async function list({ category = 'all', query = '', page = 1, limit = 12 }) {
  const cleanCategory = String(category).toLowerCase();
  if (cleanCategory !== 'all' && !Object.hasOwn(provider.CATEGORY_MAP, cleanCategory)) {
    const error = new Error('Invalid category'); error.status = 400; throw error;
  }
  const cleanQuery = String(query).trim();
  if (cleanQuery.length > 120) { const error = new Error('Search must be 120 characters or fewer'); error.status = 400; throw error; }
  const cleanPage = Number(page), cleanLimit = Number(limit);
  if (!Number.isSafeInteger(cleanPage) || cleanPage < 1 || !Number.isSafeInteger(cleanLimit) || cleanLimit < 1 || cleanLimit > 30) {
    const error = new Error('Invalid pagination parameters'); error.status = 400; throw error;
  }
  // Search remote only for fresh, first-page searches, at most once per query per hour.
  // Guests can search locally even when the provider is unavailable.
  let providerWarning = null;
  if (cleanQuery && cleanPage === 1) {
    try {
      const last = await repository.getLastSearch(cleanQuery.toLowerCase());
      if (!last || Date.now() - new Date(last).getTime() > 60 * 60 * 1000) {
        const results = await provider.searchNews(cleanQuery);
        await repository.saveArticles(results, cleanCategory === 'all' ? 'general' : cleanCategory);
        await repository.markSearch(cleanQuery.toLowerCase());
      }
    } catch (error) {
      console.error('External news search failed:', error.message);
      providerWarning = 'Showing cached results; live news search is temporarily unavailable.';
    }
  }
  const result = await repository.listArticles({ category: cleanCategory, query: cleanQuery, page: cleanPage, limit: cleanLimit });
  return { ...result, providerWarning };
}


const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function refreshCategories() {
  const report = {};

  const categories = Object.keys(provider.CATEGORY_MAP);

  for (const category of categories) {
    try {
      const articles = await provider.topHeadlines(category);

      report[category] = {
        saved: await repository.saveArticles(articles, category)
      };
    } catch (error) {
      report[category] = {
        error: error.message
      };
    }

    // Wait 2 seconds before the next request
    if (category !== categories[categories.length - 1]) {
      await sleep(2000);
    }
  }

  return report;
}

module.exports = { list, refreshCategories };
