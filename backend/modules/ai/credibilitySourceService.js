const dns = require('node:dns').promises;
const net = require('node:net');
const { toPlainText, AiError } = require('./aiService');

const MAX_SOURCES = 5;
const MAX_BYTES = 1_000_000;
const MAX_TEXT_CHARS = 18_000;
const TIMEOUT_MS = 12_000;

function isBlockedIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a,b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19));
}

function isBlockedIPv6(ip) {
  const value = ip.toLowerCase().split('%')[0];
  if (value === '::' || value === '::1') return true;
  if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return true;
  if (value.startsWith('::ffff:')) {
    const mapped = value.slice(7);
    if (net.isIP(mapped) === 4) return isBlockedIPv4(mapped);
  }
  return false;
}

async function validatePublicHttpUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new AiError(400, 'One of the cited source URLs is invalid'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new AiError(400, 'Cited sources must be public HTTP or HTTPS URLs');
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new AiError(400, 'Local or private network URLs cannot be used as sources');
  }
  const ipType = net.isIP(hostname);
  if (ipType === 4 && isBlockedIPv4(hostname)) throw new AiError(400, 'Private network URLs cannot be used as sources');
  if (ipType === 6 && isBlockedIPv6(hostname)) throw new AiError(400, 'Private network URLs cannot be used as sources');
  if (!ipType) {
    let addresses;
    try { addresses = await dns.lookup(hostname, { all: true, verbatim: true }); }
    catch { throw new AiError(422, 'A cited source hostname could not be resolved'); }
    if (!addresses.length || addresses.some(item => item.family === 4 ? isBlockedIPv4(item.address) : isBlockedIPv6(item.address))) {
      throw new AiError(400, 'Cited source resolves to a private or restricted network');
    }
  }
  url.hash = '';
  return url;
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(parseInt(n, 16), 0x10ffff)));
}

function extractHtml(html) {
  const title = decodeEntities((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  let body = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|button|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(article|main|section|p|div|li|h[1-6]|br|tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  body = decodeEntities(body).replace(/[\t\r ]+/g, ' ').replace(/\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { title, text: body.slice(0, MAX_TEXT_CHARS) };
}

async function fetchOneSource(rawUrl) {
  let url = await validatePublicHttpUrl(rawUrl);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, { method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: { 'User-Agent': 'NewsReleaseSystem-SourceChecker/1.0', Accept: 'text/html, text/plain;q=0.9' } });
    } catch (error) {
      if (error.name === 'AbortError') throw new AiError(504, 'A cited source took too long to respond');
      throw new AiError(502, 'A cited source could not be reached');
    } finally { clearTimeout(timer); }

    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirect === 3) throw new AiError(422, 'A cited source redirected too many times');
      url = await validatePublicHttpUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new AiError(422, `Source returned HTTP ${response.status}`);
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!(contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/xhtml+xml'))) {
      throw new AiError(415, 'Source is not an HTML or plain-text webpage');
    }
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_BYTES) throw new AiError(413, 'Cited source webpage is too large to process');
    const reader = response.body?.getReader();
    if (!reader) throw new AiError(422, 'Cited source returned an empty response');
    const chunks = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) { await reader.cancel(); throw new AiError(413, 'Cited source webpage is too large to process'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock?.(); }
    const html = Buffer.concat(chunks).toString('utf8');
    const extracted = contentType.includes('text/plain')
      ? { title: '', text: html.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_CHARS) }
      : extractHtml(html);
    if (!extracted.text || extracted.text.length < 80) throw new AiError(422, 'Not enough readable text could be extracted from this source');
    return { url: url.toString(), title: extracted.title || url.hostname, text: extracted.text };
  }
  throw new AiError(422, 'Unable to retrieve cited source');
}

function extractSourceUrlsFromArticle(html) {
  const sourceBlock = String(html || '').match(/<([a-z][\w:-]*)\b(?=[^>]*data-article-sources=["']true["'])[^>]*>([\s\S]*?)<\/\1>/i);
  if (!sourceBlock) return [];
  const urls = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = anchorRegex.exec(sourceBlock[2])) !== null) {
    const decoded = decodeEntities(match[1]).trim();
    if (decoded && !urls.includes(decoded)) urls.push(decoded);
  }
  return urls;
}

async function retrieveArticleSources(articleHtml) {
  const urls = extractSourceUrlsFromArticle(articleHtml);
  if (!urls.length) throw new AiError(422, 'Add at least one URL in the Cited Sources textbox before running credibility analysis');
  if (urls.length > MAX_SOURCES) throw new AiError(400, `A maximum of ${MAX_SOURCES} cited sources can be checked at once`);
  const results = await Promise.all(urls.map(async url => {
    try { return { status: 'retrieved', ...(await fetchOneSource(url)) }; }
    catch (error) { return { status: 'unavailable', url, message: error.message || 'Source could not be retrieved' }; }
  }));
  const retrieved = results.filter(item => item.status === 'retrieved');
  if (!retrieved.length) throw new AiError(422, 'None of the cited sources could be retrieved. Check the URLs and try again.');
  return { sources: results, retrievedCount: retrieved.length, unavailableCount: results.length - retrieved.length };
}

module.exports = { retrieveArticleSources, extractSourceUrlsFromArticle, extractHtml };
