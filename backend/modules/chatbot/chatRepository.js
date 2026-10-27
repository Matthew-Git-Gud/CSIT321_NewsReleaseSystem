const db = require('../../config/database');
async function create(userId, title='New conversation') {
 const [r] = await db.execute('INSERT INTO ai_conversations (user_id,title) VALUES (?,?)',[userId,title.slice(0,120)]);
 return r.insertId;
}
async function owned(id,userId) {
 const [[r]] = await db.execute('SELECT conversation_id FROM ai_conversations WHERE conversation_id=? AND user_id=?',[id,userId]);
 return Boolean(r);
}
async function list(userId) {
 const [r] = await db.execute('SELECT conversation_id AS id,title,updated_at AS updatedAt FROM ai_conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 50',[userId]); return r;
}
async function messages(id) {
 const [r] = await db.execute('SELECT message_id AS id,role,content,created_at AS createdAt FROM ai_messages WHERE conversation_id=? ORDER BY message_id ASC LIMIT 300',[id]); return r;
}
async function append(id,role,content) {
 await db.execute('INSERT INTO ai_messages (conversation_id,role,content) VALUES (?,?,?)',[id,role,content]);
 await db.execute('UPDATE ai_conversations SET updated_at=NOW() WHERE conversation_id=?',[id]);
}
async function rename(id,title) {
 await db.execute('UPDATE ai_conversations SET title=? WHERE conversation_id=? AND title=?',[title.slice(0,120),id,'New conversation']);
}
async function remove(id,userId) { await db.execute('DELETE FROM ai_conversations WHERE conversation_id=? AND user_id=?',[id,userId]); }
async function internalArticle(id) {
 const [[r]] = await db.execute("SELECT article_id AS id,title,summary,content FROM articles WHERE article_id=? AND status='published' LIMIT 1",[id]); return r;
}
function searchTerms(query) {
 const stopWords = new Set([
  'the','and','for','that','this','with','from','what','when','where','which','who',
  'have','has','had','been','being','are','was','were','will','would','could','should',
  'about','into','onto','your','you','our','their','them','they','then','than','there',
  'here','how','why','can','does','did','not','but','all','any','some','more','most',
  'news','article','articles','tell','show','find','recent','recently'
 ]);
 return [...new Set(String(query || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [])]
  .filter(term => !stopWords.has(term))
  .slice(0, 5);
}
function likePattern(term) {
 return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}
function keywordWhere(columns, terms) {
 const where = terms.map(() => `(${columns.map(column => `${column} LIKE ?`).join(' OR ')})`).join(' OR ');
 const params = terms.flatMap(term => columns.map(() => likePattern(term)));
 return { where, params };
}
async function searchInternal(q) {
 const terms = searchTerms(q);
 if (!terms.length) return [];
 const { where, params } = keywordWhere(['title', 'summary'], terms);
 const [rows] = await db.execute(
  `SELECT article_id AS id, title, summary FROM articles
   WHERE status='published' AND (${where})
   ORDER BY article_id DESC LIMIT 5`, params
 );
 return rows;
}
async function searchExternal(q) {
 const terms = searchTerms(q);
 if (!terms.length) return [];
 const { where, params } = keywordWhere(['title', 'description', 'source_name'], terms);
 const [rows] = await db.execute(
  `SELECT title, description, source_name AS sourceName,
          article_url AS articleUrl, published_at AS publishedAt
   FROM external_articles WHERE (${where})
   ORDER BY published_at DESC LIMIT 5`, params
 );
 return rows;
}
module.exports={create,owned,list,messages,append,rename,remove,internalArticle,searchInternal,searchExternal};
