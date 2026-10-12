import { getApiBaseUrl } from './api';

const SITE_URL = 'https://educationmasters.in';

function formatNowDate() {
  const d = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[d.getMonth()];
  const day = ('0' + d.getDate()).slice(-2);
  const year = d.getFullYear();
  let hour = d.getHours();
  const ampm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12 || 12;
  const hStr = ('0' + hour).slice(-2);
  const mStr = ('0' + d.getMinutes()).slice(-2);
  return `${month} ${day}, ${year} at ${hStr}:${mStr} ${ampm}`;
}

/**
 * Generate XML Sitemap Index
 */
export async function generateSitemapIndex() {
  let sitemaps = [];

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/sitemap/index`, {
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.sitemaps && Array.isArray(data.sitemaps)) {
        sitemaps = data.sitemaps;
      }
    }
  } catch (err) {
    console.error('Failed to fetch sitemap index from backend:', err?.message);
  }

  // High-fidelity fallback matching live educationmasters.in structure
  if (!sitemaps || sitemaps.length === 0) {
    sitemaps = [
      { name: 'jobs-sitemap.xml', loc: `${SITE_URL}/jobs-sitemap.xml/`, count: 1000, lastmod: '2026-09-24T07:58:18+00:00' },
      { name: 'jobs-sitemap2.xml', loc: `${SITE_URL}/jobs-sitemap2.xml/`, count: 37, lastmod: '2026-10-07T07:36:00+00:00' },
      { name: 'blogs-sitemap.xml', loc: `${SITE_URL}/blogs-sitemap.xml/`, count: 1000, lastmod: '2022-09-13T06:26:13+00:00' },
      { name: 'blogs-sitemap2.xml', loc: `${SITE_URL}/blogs-sitemap2.xml/`, count: 1000, lastmod: '2022-09-13T06:26:16+00:00' },
      { name: 'blogs-sitemap3.xml', loc: `${SITE_URL}/blogs-sitemap3.xml/`, count: 668, lastmod: '2026-08-05T09:53:36+00:00' },
      { name: 'pages-sitemap.xml', loc: `${SITE_URL}/pages-sitemap.xml/`, count: 18, lastmod: '2022-09-14T13:00:13+00:00' },
      { name: 'categories-sitemap.xml', loc: `${SITE_URL}/categories-sitemap.xml/`, count: 123, lastmod: '2025-12-12T04:43:28+00:00' },
      { name: 'institutes-sitemap.xml', loc: `${SITE_URL}/institutes-sitemap.xml/`, count: 625, lastmod: '2022-10-21T12:00:02+00:00' },
      { name: 'departments-sitemap.xml', loc: `${SITE_URL}/departments-sitemap.xml/`, count: 62, lastmod: '2025-10-08T18:34:06+00:00' },
      { name: 'results-sitemap.xml', loc: `${SITE_URL}/results-sitemap.xml/`, count: 102, lastmod: '2026-09-21T08:26:21+00:00' },
      { name: 'admit-cards-sitemap.xml', loc: `${SITE_URL}/admit-cards-sitemap.xml/`, count: 119, lastmod: '2026-10-01T06:31:55+00:00' },
    ];
  }

  const generatedDate = formatNowDate();

  const xmlEntries = sitemaps
    .map((sm) => {
      const loc = sm.loc.startsWith('http') ? sm.loc : `${SITE_URL}/${sm.loc}`;
      const countTag = sm.count ? `\n        <count>${sm.count}</count>` : '';
      return `    <sitemap>
        <loc><![CDATA[${loc}]]></loc>
        <lastmod><![CDATA[${sm.lastmod || new Date().toISOString()}]]></lastmod>${countTag}
    </sitemap>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<!-- This sitemap was dynamically generated on ${generatedDate} by Web Admin for Education Master -->

<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</sitemapindex>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}

/**
 * Generate XML Sub-Sitemap (urlset)
 */
export async function generateSubSitemap(type, page = 1) {
  let urls = [];

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/sitemap/urls/${type}?page=${page}&limit=1000`, {
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.urls && Array.isArray(data.urls)) {
        urls = data.urls;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch ${type} sitemap urls:`, err?.message);
  }

  const generatedDate = formatNowDate();

  const xmlUrls = urls
    .map((item) => {
      let imageXml = '';
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imageXml = item.images
          .map(
            (img) => `\n        <image:image>\n            <image:loc><![CDATA[${img}]]></image:loc>\n        </image:image>`
          )
          .join('');
      }

      return `    <url>
        <loc><![CDATA[${item.loc}]]></loc>
        <lastmod><![CDATA[${item.lastmod}]]></lastmod>
        <changefreq><![CDATA[${item.changefreq || 'daily'}]]></changefreq>
        <priority><![CDATA[${item.priority || '0.8'}]]></priority>${imageXml}
    </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<!-- This sitemap was dynamically generated on ${generatedDate} by Web Admin for Education Master -->

<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
>
${xmlUrls}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
