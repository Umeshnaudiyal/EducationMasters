/**
 * Helper to clean corrupted/escaped 'rn' or '\r\n' artifacts from migrated HTML content
 * while strictly preserving legitimate words containing 'rn' (e.g., 'government', 'pattern', 'modern', 'Northern', 'learn', 'born').
 */
export const cleanHtmlContent = (text) => {
  if (!text || typeof text !== 'string') return text || '';

  let cleaned = text;

  // 1. Normalize escaped newlines
  cleaned = cleaned.replace(/\\r\\n|\\r|\\n/g, '\n');

  // 2. Remove multiple repeated 'rn' (e.g. 'rnrn', 'rnrnrn', 'rn rn', 'rn\nrn')
  cleaned = cleaned.replace(/\b(?:rn[\s\r\n]*){2,}\b/gi, '\n\n');
  cleaned = cleaned.replace(/(?:^|[\s\r\n])(?:rn[\s\r\n]+)+rn(?=[\s\r\n]|$)/gi, '\n\n');

  // 3. Remove 'rn' between HTML tags (e.g., '</p>rn<p>', '</h3>rn<ul>', '</h2>rn<p>', '</li>rn<li>', '>rn<', '> rn <')
  cleaned = cleaned.replace(/>[\s\r\n]*(?:rn[\s\r\n]*)+</gi, '>\n<');

  // 4. Remove 'rn' right after a closing HTML tag: e.g. '</p>rn', '</div>rn', '</h2>rn', '</li>rn'
  cleaned = cleaned.replace(/(<\/[a-zA-Z0-9_-]+>)[\s\r\n]*(?:rn[\s\r\n]*)+/gi, '$1\n');

  // 5. Remove 'rn' right before an opening HTML tag: e.g. 'rn<p', 'rn<div', 'rn<li', 'rn<ul', 'rn<h2'
  cleaned = cleaned.replace(/(?:^|[\s\r\n])(?:rn[\s\r\n]*)+(<[a-zA-Z0-9_-]+(?:>|\s[^>]*>))/gi, '\n$1');

  // 6. Remove 'rn' right after an opening tag with attributes (e.g., 'aria-level="1">rn<p')
  cleaned = cleaned.replace(/(<[a-zA-Z0-9_-]+[^>]*>)[\s\r\n]*(?:rn[\s\r\n]*)+(?=[<a-zA-Z0-9_\u0900-\u097F])/gi, '$1\n');

  // 7. Remove 'rn' after punctuation like '.', '!', '?', ':', ')', ']' followed by a word/capital letter/Hindi or space
  cleaned = cleaned.replace(/([\.\!\?\:\)\]\}])\s*(?:rn)+\s*(?=[A-Z\u0900-\u097F0-9])/g, '$1\n\n');

  // 8. Remove isolated/standalone 'rn' on its own line or surrounded by whitespace / boundary
  cleaned = cleaned.replace(/(?:^|[\r\n])\s*rn\s*(?:[\r\n]|$)/gi, '\n');
  cleaned = cleaned.replace(/(^|[\s\r\n\(\[\{\"\'])rn([\s\r\n\)\.\,\!\?\:\;\]\}\"\']|$)/g, '$1$2');

  // 9. Remove empty paragraphs like <p>&nbsp;</p> or <p></p> at the end of content
  cleaned = cleaned.replace(/(?:<p>(?:&nbsp;|\s)*<\/p>\s*)+$/gi, '');

  // 10. Clean up excessive consecutive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

/**
 * Strips all HTML tags and unescapes entities, returning clean plain text for SEO meta tags and table summaries.
 */
export const stripHtmlToPlainText = (html) => {
  if (!html || typeof html !== 'string') return '';
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<\/li>|<br\s*\/?>|<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;|&rsquo;|&#8216;|&#8217;/g, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/&hellip;|&#8230;/g, '...')
    .replace(/&bull;|&#8226;/g, '•')
    .replace(/&copy;|&#169;/g, '©')
    .replace(/&reg;|&#174;/g, '®')
    .replace(/&trade;|&#8482;/g, '™')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
  return text;
};

export const stripHtml = stripHtmlToPlainText;

export default cleanHtmlContent;

