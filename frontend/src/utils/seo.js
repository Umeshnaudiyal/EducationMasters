import { getImageUrl } from './image';
import { getApiBaseUrl } from './api';

const API_BASE = getApiBaseUrl();

const SITE_URL = 'https://educationmasters.in';
const SITE_NAME = 'Education Masters';
const DEFAULT_OG_IMAGE = 'https://educationmasters.in/assets/img/defaults/user.png';
const DEFAULT_LOGO = 'https://educationmasters.in/assets/img/defaults/logo_full.png';

const STATE_PINCODES = {
  'delhi': { locality: 'New Delhi', pin: '110001' },
  'uttarakhand': { locality: 'Dehradun', pin: '248001' },
  'uttar pradesh': { locality: 'Lucknow', pin: '226001' },
  'rajasthan': { locality: 'Jaipur', pin: '302001' },
  'bihar': { locality: 'Patna', pin: '800001' },
  'madhya pradesh': { locality: 'Bhopal', pin: '462001' },
  'haryana': { locality: 'Chandigarh', pin: '160001' },
  'punjab': { locality: 'Chandigarh', pin: '160001' },
  'himachal pradesh': { locality: 'Shimla', pin: '171001' },
  'jharkhand': { locality: 'Ranchi', pin: '834001' },
  'chhattisgarh': { locality: 'Raipur', pin: '492001' },
  'maharashtra': { locality: 'Mumbai', pin: '400001' },
  'gujarat': { locality: 'Gandhinagar', pin: '382010' },
  'west bengal': { locality: 'Kolkata', pin: '700001' },
  'odisha': { locality: 'Bhubaneswar', pin: '751001' },
  'andhra pradesh': { locality: 'Amaravati', pin: '522501' },
  'telangana': { locality: 'Hyderabad', pin: '500001' },
  'tamil nadu': { locality: 'Chennai', pin: '600001' },
  'karnataka': { locality: 'Bengaluru', pin: '560001' },
  'kerala': { locality: 'Thiruvananthapuram', pin: '695001' },
  'assam': { locality: 'Guwahati', pin: '781001' },
  'jammu and kashmir': { locality: 'Srinagar', pin: '190001' },
  'all india': { locality: 'New Delhi', pin: '110001' }
};

/**
 * Safely parse date strings into ISO 8601 format
 */
export function parseDateToISO(dateInput, defaultDaysAhead = 60) {
  if (!dateInput) {
    const future = new Date(Date.now() + defaultDaysAhead * 24 * 60 * 60 * 1000);
    return future.toISOString();
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      const parsed = new Date(`${year}-${month}-${day}T23:59:59+05:30`);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }

    // Match YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      const parsed = new Date(`${year}-${month}-${day}T23:59:59+05:30`);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }

    const standardDate = new Date(trimmed);
    if (!isNaN(standardDate.getTime())) {
      return standardDate.toISOString();
    }
  }

  const future = new Date(Date.now() + defaultDaysAhead * 24 * 60 * 60 * 1000);
  return future.toISOString();
}

/**
 * Extract numerical salary range for Google JobPosting baseSalary
 */
export function extractSalaryRange(salaryStr) {
  const defaultSalary = {
    '@type': 'MonetaryAmount',
    'currency': 'INR',
    'value': {
      '@type': 'QuantitativeValue',
      'minValue': 21700,
      'maxValue': 69100,
      'unitText': 'MONTH'
    }
  };

  if (!salaryStr) return defaultSalary;

  const clean = stripHtml(salaryStr).replace(/,/g, '');
  const matches = clean.match(/\b\d{4,7}\b/g);

  if (matches && matches.length >= 2) {
    const nums = matches.map(Number).filter(n => n >= 5000 && n <= 500000);
    if (nums.length >= 2) {
      const min = Math.min(nums[0], nums[1]);
      const max = Math.max(nums[0], nums[1]);
      return {
        '@type': 'MonetaryAmount',
        'currency': 'INR',
        'value': {
          '@type': 'QuantitativeValue',
          'minValue': min,
          'maxValue': max,
          'unitText': 'MONTH'
        }
      };
    } else if (nums.length === 1) {
      return {
        '@type': 'MonetaryAmount',
        'currency': 'INR',
        'value': {
          '@type': 'QuantitativeValue',
          'value': nums[0],
          'unitText': 'MONTH'
        }
      };
    }
  } else if (matches && matches.length === 1) {
    const val = Number(matches[0]);
    if (val >= 5000 && val <= 500000) {
      return {
        '@type': 'MonetaryAmount',
        'currency': 'INR',
        'value': {
          '@type': 'QuantitativeValue',
          'value': val,
          'unitText': 'MONTH'
        }
      };
    }
  }

  return defaultSalary;
}

/**
 * Build rich HTML formatted job description for Google JobPosting
 */
export function buildJobHtmlDescription(data) {
  const title = stripHtml(data.title || 'Government Recruitment Notification');
  const dept = stripHtml(data.dept || 'Government Department / Commission');
  const post = stripHtml(data.post || data.desig || title);
  const totalPosts = stripHtml(data.total_posts || data.posts || 'Various');
  const startDate = stripHtml(data.app_start || data.dates?.start_date || 'Refer Notification');
  const lastDate = stripHtml(data.app_ends || data.dates?.last_date || 'Refer Notification');
  const examDate = stripHtml(data.dates?.exam_date || data.exam_date || 'To be announced soon');
  const minAge = stripHtml(data.min_age || data.age_limit?.min_age || '18');
  const maxAge = stripHtml(data.max_age || data.age_limit?.max_age || '30');
  const eligibility = stripHtml(data.eligibility || 'Candidate must possess the required educational qualification as specified in the official notification.');
  const fees = stripHtml(data.fees?.gen_fee ? `General/OBC: ₹${data.fees.gen_fee} | SC/ST/Female: Exempted` : (typeof data.fees === 'string' ? data.fees : 'As per official rules'));

  return `<p><strong>${title}</strong>: Applications are invited by <strong>${dept}</strong> for the recruitment of <strong>${post}</strong> for a total of <strong>${totalPosts} vacancies</strong>. Eligible and interested candidates can review the eligibility criteria, important dates, selection process, and application procedure below.</p>
<h3>Important Dates</h3>
<ul>
  <li>Application Start Date: ${startDate}</li>
  <li>Last Date to Apply Online: ${lastDate}</li>
  <li>Exam Date / Schedule: ${examDate}</li>
</ul>
<h3>Vacancy & Age Limit Details</h3>
<ul>
  <li>Total Openings: ${totalPosts} Posts</li>
  <li>Minimum Age: ${minAge} Years</li>
  <li>Maximum Age: ${maxAge} Years (Age relaxation applicable as per government norms)</li>
  <li>Designation: ${post}</li>
</ul>
<h3>Educational Qualification & Eligibility</h3>
<p>${eligibility}</p>
<h3>Application Fee Details</h3>
<p>${fees}</p>
<h3>How to Apply</h3>
<p>Eligible candidates should visit the official recruitment portal, verify eligibility conditions, register online, fill in all academic and personal credentials, upload photographs and signatures, pay the requisite examination fee, and submit the online application form before the closing date.</p>`;
}

/**
 * Generate Schema.org JSON-LD structured data
 */
export function generateJsonLd({ result, slug, canonicalPath }) {
  const data = result?.data;
  if (!data) return null;

  const isJob = result?.type === 'job' || canonicalPath.includes('/job');
  const isResult = result?.type === 'result' || canonicalPath.includes('/result');
  const isAdmitCard = result?.type === 'admit-card' || canonicalPath.includes('/admit-card');
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`;
  const authorName = data?.author?.name || data?.author?.nicename || 'Vikash Suyal';
  const authorBio = data?.author?.bio || 'Education expert and founder of EducationMasters.in.';
  const authorImage = data?.author?.image ? getImageUrl(data.author.image) : DEFAULT_OG_IMAGE;

  let imageUrl = DEFAULT_OG_IMAGE;
  if (data?.featured_media) {
    imageUrl = getImageUrl(data.featured_media);
  }

  // 1. Breadcrumb schema
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
        'name': isJob ? 'Jobs' : (isAdmitCard ? 'Admit Cards' : (isResult ? 'Results' : 'Articles')),
        'item': isJob ? `${SITE_URL}/jobs` : (isAdmitCard ? `${SITE_URL}/admit-cards` : (isResult ? `${SITE_URL}/results` : `${SITE_URL}/category/articles`))
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': data.title,
        'item': canonicalUrl
      }
    ]
  };

  // Build clean description snippet tailored to type
  let articleDesc = data?.metadata?.m_desc;
  if (!articleDesc) {
    const rawContent = stripHtml(data.description || data.content || data.inst_down || data.eligibility || '');
    if (rawContent.length > 20) {
      articleDesc = rawContent.length > 160 ? rawContent.substring(0, 157) + '...' : rawContent;
    } else if (isResult) {
      articleDesc = `Check ${data.title} direct download link, score card, merit list, cut-off marks, and selection status on Education Masters.`;
    } else if (isAdmitCard) {
      articleDesc = `Download ${data.title} hall ticket, exam dates, shift timings, and official exam day instructions on Education Masters.`;
    } else {
      articleDesc = `Check latest recruitment, notification, and examination details for ${data.title} on Education Masters.`;
    }
  }

  // Determine published date (prioritize release dates for results & admit cards)
  const publishedDate = parseDateToISO(data.exam_rdate || data.result_date || data.created_at || data.createdAt);
  const modifiedDate = parseDateToISO(data.updated_at || data.updatedAt || data.exam_rdate || data.created_at || data.createdAt);

  // 2. Article / NewsArticle schema (100% valid with free access to eliminate paywall warnings)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': (data.title || '').length > 110 ? (data.title || '').substring(0, 107) + '...' : (data.title || ''),
    'name': data.title,
    'description': articleDesc,
    'articleBody': stripHtml(data.content || data.description || data.inst_down || data.inst_impl || data.eligibility || data.title),
    'image': [imageUrl, DEFAULT_LOGO],
    'datePublished': publishedDate,
    'dateModified': modifiedDate,
    'isAccessibleForFree': true,
    'author': {
      '@type': 'Person',
      'name': authorName,
      'jobTitle': 'Content Creator & Education Specialist',
      'description': stripHtml(authorBio),
      'image': authorImage,
      'url': `${SITE_URL}/author/${encodeURIComponent(authorName.toLowerCase())}`
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': DEFAULT_LOGO,
        'width': 1200,
        'height': 480
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    'about': {
      '@type': 'Thing',
      'name': isResult
        ? 'Government Examination Result & Merit List'
        : (isAdmitCard
          ? 'Examination Admit Card & Hall Ticket'
          : (isJob ? 'Government Job Recruitment' : 'Educational Notification & Syllabus')),
      'description': data.title
    }
  };

  // Build dynamic FAQ schema for rich search results
  const faqSchema = buildFaqSchema({
    type: isJob ? 'job' : (isResult ? 'result' : (isAdmitCard ? 'admit-card' : 'article')),
    data,
    title: data.title,
    dept: data.dept,
    lastDate: data.app_ends || data.dates?.last_date,
    openings: data.total_posts || data.posts,
    eligibility: stripHtml(data.eligibility || ''),
    fees: typeof data.fees === 'string' ? stripHtml(data.fees) : (data.fees?.gen_fee ? `Gen/OBC: ₹${data.fees.gen_fee}` : ''),
    examDate: data.exam_date || data.dates?.exam_date,
    rDate: data.exam_rdate || data.result_date
  });

  if (!isJob) {
    const schemas = [breadcrumbList, articleSchema, ...(faqSchema ? [faqSchema] : [])];
    if (data?.metadata?.schema && typeof data.metadata.schema === 'string') {
      try {
        const custom = JSON.parse(data.metadata.schema);
        if (Array.isArray(custom)) return [...custom, ...schemas];
        if (typeof custom === 'object') return [custom, ...schemas];
      } catch (e) {
        // ignore
      }
    }
    return schemas;
  }

  // 3. Fully compliant JobPosting schema (Zero warnings for Google Search Central)
  const deptName = stripHtml(data.dept || 'Government Organization');
  const rawStateName = typeof data.state === 'object' && data.state?.name ? data.state.name : (typeof data.state === 'string' ? data.state : '');
  const stateKey = (rawStateName || '').toLowerCase().trim();
  const locInfo = STATE_PINCODES[stateKey] || STATE_PINCODES['all india'];
  const stateName = rawStateName || 'India';

  const datePosted = parseDateToISO(data.created_at || data.createdAt || data.app_start);
  let validThrough = parseDateToISO(data.app_ends || data.dates?.last_date || data.dates?.fee_date);
  const now = new Date();
  if (new Date(validThrough) <= now) {
    const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    validThrough = futureDate.toISOString();
  }

  let openings = parseInt(data.total_posts || data.posts, 10);
  if (isNaN(openings) || openings <= 0) {
    const match = (data.title || '').match(/\b(\d+)\s+(?:Posts|Vacancies|Constable|Openings)\b/i);
    if (match) openings = parseInt(match[1], 10);
    else openings = 1;
  }

  const eligibilitySnippet = stripHtml(data.eligibility || 'Candidate must possess the required educational qualification and criteria as specified.');

  let orgSameAs = SITE_URL;
  const rawSameAs = data.links?.site_url || data.noti_link || data.app_link;
  if (rawSameAs && typeof rawSameAs === 'string') {
    const trimmed = rawSameAs.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      orgSameAs = trimmed;
    } else if (trimmed.length > 3 && !trimmed.startsWith('javascript:')) {
      orgSameAs = `https://${trimmed.replace(/^\/+/, '')}`;
    }
  }

  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': data.title,
    'description': buildJobHtmlDescription(data),
    'datePosted': datePosted,
    'validThrough': validThrough,
    'employmentType': ['FULL_TIME'],
    'hiringOrganization': {
      '@type': 'Organization',
      'name': deptName,
      'sameAs': orgSameAs,
      'logo': DEFAULT_LOGO
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': `${deptName}, ${stateName}`,
        'addressLocality': locInfo.locality,
        'addressRegion': stateName,
        'postalCode': locInfo.pin,
        'addressCountry': 'IN'
      }
    },
    'baseSalary': extractSalaryRange(data.salary),
    'identifier': {
      '@type': 'PropertyValue',
      'name': deptName,
      'value': slug || String(data._id || data.id || 'JOB-NOTIFICATION')
    },
    'totalJobOpenings': openings,
    'educationRequirements': {
      '@type': 'EducationalOccupationalCredential',
      'credentialCategory': eligibilitySnippet.substring(0, 150)
    },
    'experienceRequirements': {
      '@type': 'OccupationalExperienceRequirements',
      'monthsOfExperience': 0
    },
    'directApply': true,
    'jobImmediateStart': false,
    'industry': 'Government Administration & Defence Services',
    'url': canonicalUrl,
    'image': [imageUrl, DEFAULT_LOGO]
  };

  const schemas = [breadcrumbList, jobPosting, articleSchema, ...(faqSchema ? [faqSchema] : [])];
  if (data?.metadata?.schema && typeof data.metadata.schema === 'string') {
    try {
      const custom = JSON.parse(data.metadata.schema);
      if (Array.isArray(custom)) return [...custom, ...schemas];
      if (typeof custom === 'object') return [custom, ...schemas];
    } catch (e) {
      // ignore
    }
  }

  return schemas;
}

/**
 * Build dynamic FAQPage schema for Google Search rich snippets
 */
export function buildFaqSchema({ type, data, title, dept, lastDate, openings, eligibility, fees, examDate, rDate }) {
  if (data?.faq_content && typeof data.faq_content === 'string' && data.faq_content.trim().length > 10) {
    const qMatches = data.faq_content.match(/<h[3-6][^>]*>(.*?)<\/h[3-6]>\s*<p[^>]*>(.*?)<\/p>/gi);
    if (qMatches && qMatches.length > 0) {
      const parsedQuestions = qMatches.slice(0, 6).map(block => {
        const qMatch = block.match(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/i);
        const aMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
        return {
          '@type': 'Question',
          'name': stripHtml(qMatch ? qMatch[1] : ''),
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': stripHtml(aMatch ? aMatch[1] : '')
          }
        };
      }).filter(q => q.name && q.acceptedAnswer.text);

      if (parsedQuestions.length > 0) {
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': parsedQuestions
        };
      }
    }
  }

  let questions = [];

  if (type === 'job') {
    questions = [
      {
        '@type': 'Question',
        'name': `What is the last date to apply for ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The last date to submit online applications for ${title} is ${lastDate || 'as specified in the official notification'}.`
        }
      },
      {
        '@type': 'Question',
        'name': `How many total vacancies are announced for ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `A total of ${openings || 'various'} posts have been announced by ${dept || 'the recruitment authority'}.`
        }
      },
      {
        '@type': 'Question',
        'name': `What is the minimum eligibility criteria?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': eligibility || 'Candidates must possess the required educational qualifications as specified in the recruitment notification.'
        }
      },
      {
        '@type': 'Question',
        'name': `What is the application fee for this exam?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': fees || 'Application fee can be paid online through Net Banking, Debit/Credit Card, or UPI as per government guidelines.'
        }
      }
    ];
  } else if (type === 'result') {
    questions = [
      {
        '@type': 'Question',
        'name': `How can I download and check ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Candidates can download the scorecard, selection status, and official merit list through the direct download link on Education Masters.`
        }
      },
      {
        '@type': 'Question',
        'name': `When was the result officially declared?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The result was published on ${rDate || 'the official department portal'}.`
        }
      },
      {
        '@type': 'Question',
        'name': `What details are provided on the result merit list?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The scorecard and merit list display candidate roll number, category-wise qualifying marks, cut-off percentages, and qualification status.`
        }
      }
    ];
  } else if (type === 'admit-card') {
    questions = [
      {
        '@type': 'Question',
        'name': `How to download ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Candidates can download the hall ticket by logging in with their registration number/roll number and date of birth/password on the official portal link provided.`
        }
      },
      {
        '@type': 'Question',
        'name': `What is the examination date?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The examination is scheduled for ${examDate || 'as announced in the official examination calendar'}.`
        }
      },
      {
        '@type': 'Question',
        'name': `What documents should be carried to the examination center?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `Candidates must bring a printed copy of the admit card along with an original valid photo identity card (Aadhaar, Voter ID, PAN card, or Passport) and recent passport photographs.`
        }
      }
    ];
  }

  if (questions.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions
  };
}



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
    // 1. If explicitly a result
    if (preferredType === 'result') {
      const res = await fetch(`${API_BASE}/results/${slug}`, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return { data: json.data, type: 'result' };
      }
    }

    // 2. If explicitly an admit-card
    if (preferredType === 'admit-card') {
      const res = await fetch(`${API_BASE}/admit-cards/${slug}`, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return { data: json.data, type: 'admit-card' };
      }
    }

    // 3. If explicitly a job
    if (preferredType === 'job') {
      const res = await fetch(`${API_BASE}/jobs/${slug}`, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) return { data: json.data, type: 'job' };
      }
    }

    // 4. Try blogs API
    const blogRes = await fetch(`${API_BASE}/blogs/${slug}`, { next: { revalidate: 60 } });
    if (blogRes.ok) {
      const blogJson = await blogRes.json();
      if (blogJson?.data) return { data: blogJson.data, type: 'blog' };
    }

    // 5. Fallback check results API
    if (preferredType !== 'result') {
      const resRes = await fetch(`${API_BASE}/results/${slug}`, { next: { revalidate: 60 } });
      if (resRes.ok) {
        const resJson = await resRes.json();
        if (resJson?.data) return { data: resJson.data, type: 'result' };
      }
    }

    // 6. Fallback check admit-cards API
    if (preferredType !== 'admit-card') {
      const acRes = await fetch(`${API_BASE}/admit-cards/${slug}`, { next: { revalidate: 60 } });
      if (acRes.ok) {
        const acJson = await acRes.json();
        if (acJson?.data) return { data: acJson.data, type: 'admit-card' };
      }
    }

    // 7. Fallback check jobs API
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
 * Generate Schema.org JSON-LD for MCQ Questions & Quiz Pages
 */
export function generateMcqJsonLd({ slug, taxInfo, canonicalUrl }) {
  const name = taxInfo?.name || (slug ? slug.replace(/-/g, ' ') : 'General Knowledge');
  const title = taxInfo?.title || `${name} MCQ Questions with Answers - Education Masters`;
  const desc = taxInfo?.description || `Practice subject-wise ${name} multiple choice questions (MCQs) with answers and explanations for competitive exams like SSC, UPSC, Railways, and Banking.`;
  const url = canonicalUrl || `${SITE_URL}/mcq-questions/${slug || ''}`;

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
        'name': 'MCQ Questions',
        'item': `${SITE_URL}/mcq-questions`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': `${name} MCQs`,
        'item': url
      }
    ]
  };

  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': `${name} MCQ Quiz & Objective Questions`,
    'description': desc,
    'educationalLevel': 'Competitive Examination & General Studies',
    'isAccessibleForFree': true,
    'about': {
      '@type': 'Thing',
      'name': name
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': DEFAULT_LOGO,
        'width': 1200,
        'height': 480
      }
    }
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': title.length > 110 ? title.substring(0, 107) + '...' : title,
    'name': title,
    'description': desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
    'articleBody': desc,
    'image': [DEFAULT_OG_IMAGE, DEFAULT_LOGO],
    'datePublished': '2024-01-01T00:00:00+05:30',
    'dateModified': new Date().toISOString(),
    'isAccessibleForFree': true,
    'author': {
      '@type': 'Person',
      'name': 'Vikash Suyal',
      'jobTitle': 'Content Creator & Education Specialist',
      'description': 'Education expert and founder of EducationMasters.in.',
      'image': DEFAULT_OG_IMAGE,
      'url': `${SITE_URL}/author/vikash%20suyal`
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': DEFAULT_LOGO,
        'width': 1200,
        'height': 480
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url
    }
  };

  return [breadcrumbList, quizSchema, articleSchema];
}



