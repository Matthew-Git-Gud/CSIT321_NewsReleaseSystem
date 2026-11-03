const API_ROOT = 'https://gnews.io/api/v4';

async function requestGNews(path, params) {
  const key = process.env.GNEWS_API_KEY;
  if (!key) throw new Error('GNEWS_API_KEY is not configured');
  const url = new URL(`${API_ROOT}/${path}`);
  Object.entries({ ...params, apikey: key }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  
if (!response.ok) {
  const error = new Error(
    `News provider returned HTTP ${response.status}`
  );

  error.status = response.status;
  error.retryAfter = response.headers.get("retry-after");

  throw error;
}

  const json = await response.json();
  return Array.isArray(json.articles) ? json.articles : [];
}

const CATEGORY_MAP = {
  general: 'general', world: 'world', business: 'business', technology: 'technology',
  science: 'science', health: 'health', sports: 'sports', entertainment: 'entertainment'
};

function topHeadlines(category, max = 10) {
  if (!Object.hasOwn(CATEGORY_MAP, category)) throw new Error('Unsupported category');
  return requestGNews('top-headlines', { category: CATEGORY_MAP[category], lang: 'en', max });
}
function searchNews(query, max = 10) {
  return requestGNews('search', { q: query, lang: 'en', sortby: 'publishedAt', max });
}
module.exports = { topHeadlines, searchNews, CATEGORY_MAP };
