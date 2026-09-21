/**
 * Helper to clean corrupted/escaped 'rn' or '\r\n' artifacts from migrated HTML content
 * while preserving legitimate words (e.g., 'government', 'pattern', 'modern', 'Northern').
 */
export const cleanHtmlContent = (html) => {
  if (!html || typeof html !== 'string') return html || '';

  let cleaned = html;

  // 1. Convert escaped newlines
  cleaned = cleaned.replace(/\\r\\n|\\n|\\r/g, '\n');

  // 2. Remove repeated 'rn' sequences like 'rnrnrnrn' or 'rn rn rn'
  cleaned = cleaned.replace(/(?:rn\s*){2,}/gi, '\n');

  // 3. Remove 'rn' between HTML tags: e.g. '>rn<', '>rn\n<', '>rn <'
  cleaned = cleaned.replace(/>\s*rn\s*</gi, '>\n<');

  // 4. Remove 'rn' immediately after closing tag or before opening tag:
  cleaned = cleaned.replace(/(>)\s*rn\s*(<)/gi, '$1\n$2');
  cleaned = cleaned.replace(/(<\/[a-zA-Z0-9_-]+>)\s*rn\s*/gi, '$1\n');
  cleaned = cleaned.replace(/\s*rn\s*(<[a-zA-Z0-9_-]+(?:>|\s[^>]*>))/gi, '\n$1');

  // 5. Clean standalone 'rn' surrounded by whitespace or at start/end
  cleaned = cleaned.replace(/(^|\n|\r|\s)rn(\s|\n|\r|$)/g, '$1$2');

  // 6. Clean up excessive empty lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

export default cleanHtmlContent;
