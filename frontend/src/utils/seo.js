import { getImageUrl } from './image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL 
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` 
  : 'http://localhost:5001/apis/v1';

const SITE_URL = 'https://educationmasters.in';
const SITE_NAME = 'Education Masters';
const DEFAULT_OG_IMAGE = 'https://educationmasters.in/assets/img/defaults/user.png';

/**
 * Strip HTML tags and entities to generate clean snippet for meta description
 */
export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\\r\\n|\\r|\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Server-side fetch helper for articles and jobs with graceful fallback
 */
export async function fetchPageData(slug, preferredType = 'auto') {
  if (!slug) return null;

  try {
    // 1. If explicitly a job
    if (preferredType === 'job') {
      const res = await fetch(`${API_BASE}/jobs/${slug}`, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return { data: json.data, type: 'job' };
      }
    }

    // 2. Try blogs API
    const blogRes = await fetch(`${API_BASE}/blogs/${slug}`, { next: { revalidate: 60 } });
    if (blogRes.ok) {
      const blogJson = await blogRes.json();
      if (blogJson?.data) return { data: blogJson.data, type: 'blog' };
    }

    // 3. Fallback check jobs API if not already tried
    if (preferredType !== 'job') {
      const jobRes = await fetch(`${API_BASE}/jobs/${slug}`, { next: { revalidate: 60 } });
      if (jobRes.ok) {
        const jobJson = await jobRes.json();
        if (jobJson?.data) return { data: jobJson.data, type: 'job' };
      }
    }
  } catch (err) {
    console.error(`[SEO] Error fetching page data for slug "${slug}":`, err.message);
  }

  return null;
}

/**
 * Generate Next.js dynamic metadata for single pages
 */
export function generatePageMetadata({ result, slug, canonicalPath, fallbackTitle, fallbackType }) {
  const data = result?.data;
  const type = result?.type || fallbackType || 'article';
  const isJob = type === 'job';

  // 1. Title
  let title = data?.metadata?.m_title || data?.title || fallbackTitle || '';
  if (!title.includes('Education Masters')) {
    if (isJob) {
      title = `${title} - Apply Online, Vacancies & Eligibility | ${SITE_NAME}`;
    } else if (canonicalPath.includes('/admit-card')) {
      title = `${title} - Admit Card & Hall Ticket Download | ${SITE_NAME}`;
    } else if (canonicalPath.includes('/result')) {
      title = `${title} - Results, Merit List & Cut Off | ${SITE_NAME}`;
    } else {
      title = `${title} | ${SITE_NAME}`;
    }
  }

  // 2. Description
  let description = data?.metadata?.m_desc;
  if (!description) {
    const rawText = stripHtml(data?.content || data?.description || data?.eligibility || '');
    if (rawText.length > 20) {
      description = rawText.length > 160 ? rawText.substring(0, 157) + '...' : rawText;
    } else if (isJob) {
      description = `Complete details for ${data?.title || 'Government Job Recruitment'}. Check eligibility criteria, vacancy count, application fees, important exam dates, and official apply links at Education Masters.`;
    } else {
      description = `Read verified examination updates, notification insights, preparation strategies, and details for ${data?.title || 'Government Exam'} on Education Masters.`;
    }
  }

  // 3. Canonical URL
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`;

  // 4. Image
  let imageUrl = DEFAULT_OG_IMAGE;
  if (data?.featured_media) {
    imageUrl = getImageUrl(data.featured_media);
  }

  // 5. Author
  const authorName = data?.author?.name || data?.author?.nicename || 'Vikash Suyal';

  // 6. Keywords
  let keywords = data?.metadata?.m_keys;
  if (!keywords) {
    const categoryNames = (data?.categories || []).map(c => c.name).filter(Boolean);
    const tagNames = (data?.tags || []).map(t => t.name).filter(Boolean);
    keywords = [
      ...categoryNames,
      ...tagNames,
      'Government Jobs',
      'Govt Exam Notification',
      'Admit Card',
      'Results',
      'Education Masters'
    ].join(', ');
  }

  // 7. Dates
  const publishedTime = data?.created_at || data?.createdAt || new Date().toISOString();
  const modifiedTime = data?.updated_at || data?.updatedAt || publishedTime;

  return {
    title,
    description,
    keywords,
    authors: [{ name: authorName, url: SITE_URL }],
    creator: authorName,
    publisher: SITE_NAME,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: isJob ? 'website' : 'article',
      publishedTime,
      modifiedTime,
      authors: [authorName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: data?.title || title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@educationmasters',
    },
  };
}

/**
 * Generate Schema.org JSON-LD structured data
 */
export function generateJsonLd({ result, slug, canonicalPath }) {
  const data = result?.data;
  if (!data) return null;

  const isJob = result?.type === 'job';
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`;
  const authorName = data?.author?.name || data?.author?.nicename || 'Vikash Suyal';
  const authorBio = data?.author?.bio || 'Education expert and founder of EducationMasters.in.';
  const authorImage = data?.author?.image ? getImageUrl(data.author.image) : DEFAULT_OG_IMAGE;

  let imageUrl = DEFAULT_OG_IMAGE;
  if (data?.featured_media) {
    imageUrl = getImageUrl(data.featured_media);
  }

  // Breadcrumb schema
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': isJob ? 'Jobs' : (canonicalPath.includes('admit-card') ? 'Admit Cards' : (canonicalPath.includes('result') ? 'Results' : 'Articles')),
        'item': isJob ? `${SITE_URL}/jobs` : (canonicalPath.includes('admit-card') ? `${SITE_URL}/admit-cards` : (canonicalPath.includes('result') ? `${SITE_URL}/results` : `${SITE_URL}/category/articles`))
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': data.title,
        'item': canonicalUrl
      }
    ]
  };

  // Main Entity schema
  if (isJob) {
    const jobPosting = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      'title': data.title,
      'description': stripHtml(data.description || data.eligibility || data.title),
      'datePosted': data.created_at || data.createdAt || new Date().toISOString(),
      'validThrough': data.dates?.last_date || data.app_ends || undefined,
      'employmentType': 'FULL_TIME',
      'hiringOrganization': {
        '@type': 'Organization',
        'name': data.dept || 'Government Organization',
        'sameAs': data.links?.site_url || SITE_URL
      },
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'IN',
          'addressRegion': data.state?.name || 'India'
        }
      },
      'baseSalary': data.salary ? {
        '@type': 'MonetaryAmount',
        'currency': 'INR',
        'value': {
          '@type': 'QuantitativeValue',
          'value': data.salary
        }
      } : undefined,
      'url': canonicalUrl
    };

    return [breadcrumbList, jobPosting];
  }

  // Article / NewsArticle schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': data.title,
    'description': stripHtml(data.content || '').substring(0, 160),
    'image': [imageUrl],
    'datePublished': data.created_at || data.createdAt || new Date().toISOString(),
    'dateModified': data.updated_at || data.updatedAt || data.created_at || new Date().toISOString(),
    'author': {
      '@type': 'Person',
      'name': authorName,
      'jobTitle': 'Content Creator & Education Specialist',
      'description': stripHtml(authorBio),
      'image': authorImage,
      'url': SITE_URL
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://educationmasters.in/assets/img/defaults/user.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl
    }
  };

  return [breadcrumbList, articleSchema];
}
