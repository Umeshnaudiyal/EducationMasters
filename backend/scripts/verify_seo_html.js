async function testSeo(url) {
  console.log(`\n================ Testing SEO for: ${url} ================`);
  const res = await fetch(url);
  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  console.log('Page Title:', titleMatch ? titleMatch[1] : 'Not Found');

  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
  console.log('Meta Description:', descMatch ? descMatch[1] : 'Not Found');

  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
  console.log('Canonical URL:', canonicalMatch ? canonicalMatch[1] : 'Not Found');

  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  console.log('OG Title:', ogTitleMatch ? ogTitleMatch[1] : 'Not Found');

  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  console.log('OG Image:', ogImageMatch ? ogImageMatch[1] : 'Not Found');

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      console.log('JSON-LD Schema Types:', Array.isArray(parsed) ? parsed.map(p => p['@type']) : parsed['@type']);
      if (Array.isArray(parsed)) {
        const main = parsed[1] || parsed[0];
        console.log('Schema Details:', {
          type: main['@type'],
          headline_or_title: main.headline || main.title,
          author: main.author?.name
        });
      }
    } catch (e) {
      console.log('JSON-LD Parse error:', e.message);
    }
  } else {
    console.log('JSON-LD: Not Found');
  }
}

async function run() {
  await testSeo('http://localhost:3000/uttarakhand-current-affairs-november-40-important-updates');
  await testSeo('http://localhost:3000/job/test-post');
  await testSeo('http://localhost:3000/admit-card/uttarakhand-current-affairs-november-40-important-updates');
  await testSeo('http://localhost:3000/result/uttarakhand-current-affairs-november-40-important-updates');
}

run().catch(console.error);
