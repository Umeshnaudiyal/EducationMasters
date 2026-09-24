/**
 * Helper to clean corrupted/escaped 'rn' or '\r\n' artifacts from migrated HTML content
 * while preserving legitimate words (e.g., 'government', 'pattern', 'modern', 'Northern').
 */
export const cleanHtmlContent = (text) => {
  if (!text || typeof text !== 'string') return text || '';

  let cleaned = text;

  // 1. Normalize escaped newlines
  cleaned = cleaned.replace(/\\r\\n|\\r|\\n/g, '\n');

  // 2. Remove multiple repeated 'rn' (e.g. 'rnrn', 'rnrnrn', 'rn rn')
  cleaned = cleaned.replace(/(?:rn[\s\r\n]*){2,}/gi, '\n\n');

  // 3. Remove 'rn' between HTML tags (e.g., '</p>rn<p>', '</h3>rn<ul>', '</li>rn<li>', '>rn<')
  cleaned = cleaned.replace(/>[\s\r\n]*(?:rn[\s\r\n]*)+</gi, '>\n<');

  // 4. Remove 'rn' right after a closing HTML tag: e.g. '</p>rn', '</div>rn', '</li>rn'
  cleaned = cleaned.replace(/(<\/[a-zA-Z0-9_-]+>)[\s\r\n]*(?:rn[\s\r\n]*)+/gi, '$1\n');

  // 5. Remove 'rn' right before an opening HTML tag: e.g. 'rn<p', 'rn<div', 'rn<li', 'rn<ul'
  cleaned = cleaned.replace(/(?:^|[\s\r\n])(?:rn[\s\r\n]*)+(<[a-zA-Z0-9_-]+(?:>|\s[^>]*>))/gi, '\n$1');

  // 6. Remove 'rn' right after an opening tag with attributes (e.g., 'aria-level="1">rn<p')
  cleaned = cleaned.replace(/(<[a-zA-Z0-9_-]+[^>]*>)[\s\r\n]*(?:rn[\s\r\n]*)+(?=[<a-zA-Z0-9_\u0900-\u097F])/gi, '$1\n');

  // 7. Remove 'rn' after punctuation like '.', '!', '?', ':', ')', ']' followed by a word/capital letter/Hindi or space
  cleaned = cleaned.replace(/([\.\!\?\:\)\]\}])\s*(?:rn)+\s*(?=[A-Z\u0900-\u097F0-9])/g, '$1\n\n');

  // 8. Remove isolated/standalone 'rn' bounded by whitespace, punctuation, or string boundary
  cleaned = cleaned.replace(/(^|[\s\r\n\(\[\{\"\'])rn([\s\r\n\)\.\,\!\?\:\;\]\}\"\']|$)/g, '$1$2');

  // 9. Clean up excessive consecutive newlines (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

export default cleanHtmlContent;
