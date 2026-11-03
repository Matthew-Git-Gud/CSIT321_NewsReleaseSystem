const db = require('../../config/database');

function normalise(raw, category) {
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!/^https?:\/\//i.test(url) || !raw.title) return null;
  return {
    title: String(raw.title).slice(0, 500),
    description: raw.description ? String(raw.description).slice(0, 2000) : null,
    sourceName: String(raw.source?.name || 'Unknown').slice(0, 255),
    sourceUrl: /^https?:\/\//i.test(raw.source?.url || '') ? raw.source.url : null,
    articleUrl: url,
    imageUrl: /^https?:\/\//i.test(raw.image || '') ? raw.image : null,
    category,
    publishedAt: raw.publishedAt && !Number.isNaN(Date.parse(raw.publishedAt)) ? new Date(raw.publishedAt) : null
  };
}

async function saveArticles(rawArticles, category) {
  let saved = 0;
  for (const raw of rawArticles) {
    const item = normalise(raw, category);
    if (!item) continue;
    await db.execute(`INSERT INTO external_articles
      (title, description, source_name, source_url, article_url, image_url, category, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description),
      source_name=VALUES(source_name), source_url=VALUES(source_url),
      image_url=VALUES(image_url), published_at=VALUES(published_at), fetched_at=CURRENT_TIMESTAMP`,
      [item.title, item.description, item.sourceName, item.sourceUrl, item.articleUrl,
       item.imageUrl, item.category, item.publishedAt]);
    saved++;
  }
  return saved;
}

async function listArticles({ category, query, page, limit }) {
  const where = [];
  const params = [];
  if (category && category !== 'all') { where.push('category = ?'); params.push(category); }
  if (query) { where.push('(title LIKE ? OR description LIKE ? OR source_name LIKE ?)');
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(pattern, pattern, pattern);
  }
  const condition = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[count]] = await db.execute(`SELECT COUNT(*) AS total FROM external_articles ${condition}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(`SELECT external_article_id AS id, title, description,
    source_name AS sourceName, source_url AS sourceUrl, article_url AS articleUrl,
    image_url AS imageUrl, category, published_at AS publishedAt
    FROM external_articles ${condition}
    ORDER BY published_at DESC, external_article_id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, params);
  return { items: rows, total: count.total, page, limit };
}

async function getLastSearch(query) {
  const [[row]] = await db.execute('SELECT searched_at FROM external_news_searches WHERE search_query = ?', [query]);
  return row?.searched_at || null;
}
async function markSearch(query) {
  await db.execute(`INSERT INTO external_news_searches (search_query, searched_at) VALUES (?, NOW())
    ON DUPLICATE KEY UPDATE searched_at=NOW()`, [query]);
}
module.exports = { saveArticles, listArticles, getLastSearch, markSearch };
