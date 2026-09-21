'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveTicker from '@/components/LiveTicker';
import {
  Calendar, User, Share2, Copy, Bookmark,
  ExternalLink, Download, ChevronRight, X,
  Send, MessageSquare, Check, Award, Globe
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` : 'http://localhost:5001/apis/v1';

// Helper for clean, bulletproof date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return 'Sep 13, 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Sep 13, 2026';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch (e) {
    return 'Sep 13, 2026';
  }
};

// Robust HTML & text sanitizer helper (removes SQL migration artifacts like 'rn', decodes entities)
const cleanHTML = (contentStr) => {
  if (!contentStr) return '';
  let str = String(contentStr);

  // Replace SQL migration line-break artifacts and escaped entities
  str = str
    .replace(/\\r\\n/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\brn\b/g, ' ')
    .replace(/rn</g, '<')
    .replace(/>rn/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return str.trim();
};

// Helper to normalize and fix external URLs (e.g., 'www.dsom,in' -> 'https://www.dsom.in')
const formatExternalUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  let url = urlStr.trim().replace(/,/g, '.');
  if (!url || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// Helper to render Job Highlights Table HTML after intro content & before eligibility criteria
const buildJobHighlightsTableHTML = (title, jobDetails) => {
  if (!jobDetails) return '';
  const postName = jobDetails.postName || title || 'N/A';
  const totalVacancies = jobDetails.totalVacancies || 'N/A';
  const jobLocation = jobDetails.jobLocation || 'All India';
  const releaseDate = jobDetails.releaseDate || 'N/A';
  const startDate = jobDetails.startDate || releaseDate;
  const lastDate = jobDetails.endDate || 'Check Notification';
  const examDate = jobDetails.examDate || 'N/A';
  const minAge = jobDetails.minAge || 'N/A';
  const maxAge = jobDetails.maxAge || 'N/A';
  const officialLink = formatExternalUrl(jobDetails.officialLink);
  const applyLink = formatExternalUrl(jobDetails.applyLink);
  const admitCardLink = formatExternalUrl(jobDetails.admitCardLink);
  const resultLink = formatExternalUrl(jobDetails.resultLink);

  return `
    <h2 class="text-2xl font-semibold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-2">${cleanHTML(title)} Job Highlights:</h2>
    <div class="overflow-x-auto my-4 border border-slate-200 rounded-md">
      <table class="w-full text-xs sm:text-sm border-collapse border border-slate-200 text-left">
        <tbody>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700 w-1/3 sm:w-1/4">Name of Exam</th>
            <td class="p-3 font-normal text-slate-900">${postName}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">No. of Seats</th>
            <td class="p-3 font-normal text-slate-900">${totalVacancies}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Job Location</th>
            <td class="p-3 font-normal text-slate-900">${jobLocation}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Notification Release Date</th>
            <td class="p-3 font-normal text-slate-900">${releaseDate}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Online Application Start Date</th>
            <td class="p-3 font-normal text-slate-900">${startDate}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Last Date to Apply</th>
            <td class="p-3 font-normal text-slate-900">${lastDate}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Prelims Exam Date</th>
            <td class="p-3 font-normal text-slate-500">${examDate}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Minimum age limit</th>
            <td class="p-3 font-normal text-slate-500">${minAge}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Maximum age limit</th>
            <td class="p-3 font-normal text-slate-500">${maxAge}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Notification Release Link</th>
            <td class="p-3 font-medium text-blue-600">${officialLink ? `<a href="${officialLink}" target="_blank" rel="noreferrer" class="hover:underline">Click here</a>` : '<span class="text-slate-500 font-normal">N/A</span>'}</td>
          </tr>
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Direct Online Application Link</th>
            <td class="p-3 font-medium text-blue-600">${applyLink ? `<a href="${applyLink}" target="_blank" rel="noreferrer" class="hover:underline">Apply now</a>` : '<span class="text-slate-500 font-normal">N/A</span>'}</td>
          </tr>
          ${admitCardLink ? `
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Admit Card Link</th>
            <td class="p-3 font-medium text-blue-600"><a href="${admitCardLink}" target="_blank" rel="noreferrer" class="hover:underline">Download Admit Card</a></td>
          </tr>` : ''}
          ${resultLink ? `
          <tr class="border-b border-slate-200 hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Result Link</th>
            <td class="p-3 font-medium text-blue-600"><a href="${resultLink}" target="_blank" rel="noreferrer" class="hover:underline">Download Result</a></td>
          </tr>` : ''}
          <tr class="hover:bg-slate-50">
            <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Helpline</th>
            <td class="p-3 font-normal text-slate-500">N/A</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};


const DEFAULT_EXPIRING_JOBS = [
  {
    id: 1,
    title: 'AIIMS Rishikesh Group A & B Recruitment 2026',
    slug: 'aiims-rishikesh-group-a-b-recruitment-2026',
    lastDate: 'Sep 14',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    title: 'IIM Udaipur Research Assistant/Associate Recruitment 2026 - Apply Online',
    slug: 'iim-udaipur-research-assistantassociate-recruitment-2026',
    lastDate: 'Sep 14',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    title: 'TISS Recruitment 2026 - Apply Online for Senior Administrative Assistant',
    slug: 'tiss-recruitment-2026-senior-administrative-assistant',
    lastDate: 'Sep 15',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 4,
    title: 'BSVS Bank of Baroda Tonk Attender Recruitment 2026 - Apply Offline',
    slug: 'bsvs-bank-of-baroda-tonk-attender-recruitment-2026',
    lastDate: 'Sep 15',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    title: 'CSIR AMPRI Recruitment 2026 - Walk-in for Project Associate, JRF & More',
    slug: 'csir-ampri-recruitment-2026-project-associate',
    lastDate: 'Sep 15',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 6,
    title: 'CSIR Director Recruitment 2026 - Apply Offline',
    slug: 'sikkim-all-government-exams-list-2026-complete-list-of-govt-exams-eligibility-jobs',
    lastDate: 'Sep 15',
    category: 'Jobs',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80'
  }
];

export default function SingleArticlePage() {
  const params = useParams();
  const pathname = usePathname() || '';
  const slug = params?.slug || '';

  const [article, setArticle] = useState(null);
  const [expiringJobs, setExpiringJobs] = useState(DEFAULT_EXPIRING_JOBS);
  const [sidebarTab, setSidebarTab] = useState('expiring'); // 'expiring' or 'mcq'
  const [loading, setLoading] = useState(true);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const isJobPage = pathname.startsWith('/job') || article?.isJob;
  const isAdmitCardPage = pathname.startsWith('/admit-card') || article?.category?.toLowerCase().includes('admit');
  const isResultPage = pathname.startsWith('/result') || article?.category?.toLowerCase().includes('result');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      fetchArticleData(slug);
    } else {
      setLoading(false);
    }
  }, [slug]);

  // Dynamically update page Title, Meta Description & Keywords matching live site standard
  useEffect(() => {
    if (article && typeof document !== 'undefined') {
      const rawTitle = article.title || article.metadata?.m_title;
      if (rawTitle) {
        document.title = `${rawTitle} | Education Masters`;
      }
      if (article.metadata?.m_desc) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = article.metadata.m_desc;
      }
      if (article.metadata?.m_keys) {
        let metaKeys = document.querySelector('meta[name="keywords"]');
        if (!metaKeys) {
          metaKeys = document.createElement('meta');
          metaKeys.name = 'keywords';
          document.head.appendChild(metaKeys);
        }
        metaKeys.content = article.metadata.m_keys;
      }
    }
  }, [article]);

  const fetchArticleData = async (articleSlug) => {
    setLoading(true);
    try {
      fetchSidebarJobs();

      // If on /job route, try Job endpoint first
      if (pathname.startsWith('/job')) {
        const resJob = await fetch(`${API_BASE}/jobs/${articleSlug}`);
        const dataJob = await resJob.json();
        if (dataJob.success && dataJob.data) {
          setArticle(formatArticleData(dataJob.data, 'job'));
          setLoading(false);
          return;
        }
      }

      // 1. Try Blog endpoint
      let res = await fetch(`${API_BASE}/blogs/${articleSlug}`);
      let data = await res.json();

      if (data.success && data.data) {
        setArticle(formatArticleData(data.data, 'blog'));
        setLoading(false);
        return;
      }

      // 2. Try Job endpoint (if not already tried)
      if (!pathname.startsWith('/job')) {
        res = await fetch(`${API_BASE}/jobs/${articleSlug}`);
        data = await res.json();

        if (data.success && data.data) {
          setArticle(formatArticleData(data.data, 'job'));
          setLoading(false);
          return;
        }
      }

      // 3. Fallback mock data
      setArticle(generateFallbackArticle(articleSlug));
    } catch (err) {
      setArticle(generateFallbackArticle(articleSlug));
    } finally {
      setLoading(false);
    }
  };

  const fetchSidebarJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs/expiring-soon?limit=6`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const formatted = data.data.map((item, idx) => ({
          id: item._id || idx,
          title: cleanHTML(item.title),
          slug: item.slug || `job-${idx}`,
          lastDate: formatDate(item.app_ends || item.dates?.last_date),
          category: 'Jobs',
          image: getImageUrl(item.featured_media, DEFAULT_EXPIRING_JOBS[idx % DEFAULT_EXPIRING_JOBS.length].image)
        }));
        setExpiringJobs(formatted);
      }
    } catch (err) {
      console.error('Sidebar fetch error:', err);
    }
  };

  const formatArticleData = (raw, type) => {
    const isJob = type === 'job';
    let firstCat = raw.categories?.[0] || raw.category;
    let catName = typeof firstCat === 'object' ? (firstCat?.name || firstCat?.slug || '') : String(firstCat || '');
    let catSlug = typeof firstCat === 'object' ? (firstCat?.slug || '') : '';
    if (catName === '[object Object]') catName = '';

    // Extract Department / Board / Agency Name intelligently if available or from title
    const extractDepartment = (rawItem) => {
      if (rawItem.department) {
        const deptStr = typeof rawItem.department === 'object' ? rawItem.department.name : String(rawItem.department);
        if (deptStr && deptStr.trim() && deptStr !== '[object Object]') return cleanHTML(deptStr);
      }
      if (rawItem.board) {
        const boardStr = typeof rawItem.board === 'object' ? rawItem.board.name : String(rawItem.board);
        if (boardStr && boardStr.trim() && boardStr !== '[object Object]') return cleanHTML(boardStr);
      }

      const titleStr = (rawItem.title || '').trim();
      const lowerTitle = titleStr.toLowerCase();

      if (lowerTitle.includes('upsc')) return 'UPSC';
      if (lowerTitle.includes('ssc')) return 'SSC';
      if (lowerTitle.includes('aiims')) return 'AIIMS';
      if (lowerTitle.includes('csir')) return 'CSIR';
      if (lowerTitle.includes('iim')) return 'IIM';
      if (lowerTitle.includes('rrb') || lowerTitle.includes('railway')) return 'Railway / RRB';
      if (lowerTitle.includes('tiss')) return 'TISS';
      if (lowerTitle.includes('bank of baroda') || lowerTitle.includes('bob')) return 'Bank of Baroda';
      if (lowerTitle.includes('sikkim') || lowerTitle.includes('spsc')) return 'SPSC / Sikkim';
      if (lowerTitle.includes('ibps')) return 'IBPS';
      if (lowerTitle.includes('lic')) return 'LIC';
      if (lowerTitle.includes('isro')) return 'ISRO';
      if (lowerTitle.includes('drdo')) return 'DRDO';

      if (catName && typeof catName === 'string' && catName.trim() && catName !== '[object Object]' && !['jobs', 'job', 'articles', 'latest job alert', 'uncategorized'].includes(catName.trim().toLowerCase())) {
        return cleanHTML(catName);
      }

      const match = titleStr.match(/^([A-Z0-9\s]{2,15}?)\s+(Recruitment|Exam|Notification|Vacancies|Posts|Jobs)/i);
      if (match && match[1] && match[1].trim().length >= 2) {
        return match[1].trim();
      }

      return isJob ? 'Jobs' : (catName && typeof catName === 'string' && catName !== '[object Object]' ? catName : 'Articles');
    };

    const categoryName = extractDepartment(raw);
    const categorySlug = catSlug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Extract authentic Author details from MongoDB User schema
    let authorName = 'Vikash Suyal';
    let authorImage = 'https://educationmasters.in/assets/img/users/admin_1777271474.png';
    let authorBio = 'Vikash Sharma is an education expert and digital learning strategist with over 10 years of experience in the Indian education ecosystem. As the founder of EducationMasters.in, he is dedicated to helping students and job aspirants stay updated with the latest government exams, results, and career guidance.';

    if (raw.author) {
      if (typeof raw.author === 'object') {
        const rawName = raw.author.name?.trim() || '';
        const rawNice = raw.author.nicename?.trim() || '';

        // Choose best display name (prefer full name over acronyms/admin)
        if (rawName.toLowerCase() === 'admin' && rawNice) {
          authorName = rawNice;
        } else if (rawName.length <= 3 && rawNice && rawNice.length > rawName.length) {
          authorName = rawNice;
        } else if (rawName) {
          authorName = rawName;
        } else if (rawNice) {
          authorName = rawNice;
        }

        if (raw.author.image) {
          authorImage = getImageUrl(raw.author.image, 'https://educationmasters.in/assets/img/defaults/user.png');
        } else {
          authorImage = 'https://educationmasters.in/assets/img/defaults/user.png';
        }

        if (raw.author.bio && raw.author.bio.trim()) {
          authorBio = cleanHTML(raw.author.bio);
        } else if (authorName.toLowerCase().includes('vikash')) {
          authorBio = 'Vikash Sharma is an education expert and digital learning strategist with over 10 years of experience in the Indian education ecosystem. As the founder of EducationMasters.in, he is dedicated to helping students and job aspirants stay updated with the latest government exams, results, and career guidance.';
          authorImage = 'https://educationmasters.in/assets/img/users/admin_1777271474.png';
        } else {
          authorBio = `${authorName} is an educational content contributor at Education Masters, dedicated to delivering verified, timely information regarding government exams, admit cards, job recruitments, and results to help students and job aspirants achieve their career goals.`;
        }
      } else if (typeof raw.author === 'string') {
        authorName = raw.author;
      }
    }

    const authorObj = {
      name: authorName,
      image: authorImage,
      bio: authorBio
    };

    const pubDate = formatDate(raw.created_at || raw.createdAt);

    const rawReleaseDate = raw.released || raw.created_at || raw.createdAt;
    const formattedReleaseDate = rawReleaseDate ? formatDate(rawReleaseDate) : 'N/A';

    const rawStartDate = raw.app_start || raw.dates?.start_date;
    const formattedStartDate = rawStartDate ? formatDate(rawStartDate) : formattedReleaseDate;

    const rawLastDate = raw.app_ends || raw.dates?.last_date;
    let formattedLastDate = 'Check Notification';
    if (rawLastDate && rawLastDate !== '0000-00-00') {
      formattedLastDate = formatDate(rawLastDate);
    }

    const rawExamDate = raw.exam_date || raw.dates?.exam_date;
    const formattedExamDate = rawExamDate && String(rawExamDate) !== 'null' ? formatDate(rawExamDate) : 'N/A';

    const minAgeVal = raw.min_age || raw.age_limit?.min_age || 'N/A';
    const maxAgeVal = raw.max_age || raw.age_limit?.max_age || 'N/A';

    // Extract dynamic job location (State name if job is state-specific, else All India)
    const extractJobLocation = (rawItem) => {
      if (!rawItem) return 'All India';
      
      // 1. Populated State object
      if (rawItem.state && typeof rawItem.state === 'object' && rawItem.state.name) {
        return cleanHTML(rawItem.state.name);
      }
      
      // 2. Direct state_name property
      if (rawItem.state_name && String(rawItem.state_name).trim()) {
        return cleanHTML(rawItem.state_name);
      }
      
      // 3. String state property (not a 24-char ObjectId string)
      if (typeof rawItem.state === 'string' && rawItem.state.trim() && !rawItem.state.match(/^[0-9a-fA-F]{24}$/)) {
        return cleanHTML(rawItem.state);
      }
      
      // 4. Job Location or Location property
      if (rawItem.job_location && String(rawItem.job_location).trim()) {
        return cleanHTML(rawItem.job_location);
      }
      if (rawItem.location && String(rawItem.location).trim()) {
        return cleanHTML(rawItem.location);
      }

      return 'All India';
    };

    const jobLocationVal = extractJobLocation(raw);

    const admitCardUrl = raw.admitCardNotification?.down_url || raw.admitCardNotification?.slug || raw.links?.admit_url || '';
    const resultUrl = raw.resultNotification?.down_url || raw.resultNotification?.slug || raw.links?.result_url || '';

    const jobDetailsObj = isJob ? {
      postName: cleanHTML(raw.title),
      totalVacancies: cleanHTML(raw.posts || raw.total_posts || raw.vacancies || 'N/A'),
      jobLocation: jobLocationVal,
      qualification: cleanHTML(raw.qualification || 'As per notification'),
      releaseDate: formattedReleaseDate,
      startDate: formattedStartDate,
      endDate: formattedLastDate,
      examDate: formattedExamDate,
      minAge: minAgeVal !== 'N/A' ? `${minAgeVal} Years` : 'N/A',
      maxAge: maxAgeVal !== 'N/A' ? `${maxAgeVal} Years` : 'N/A',
      salary: cleanHTML(raw.salary || 'As per rules'),
      applicationFee: cleanHTML(raw.fees?.gen_fee ? `General/OBC: ₹${raw.fees.gen_fee} | SC/ST: Exempted` : (raw.fees || raw.application_fee || 'As per rules')),
      officialLink: raw.noti_link || raw.links?.site_url || raw.official_website || raw.site_url || raw.notification_link || '',
      applyLink: raw.app_link || raw.links?.down_url || raw.apply_link || raw.down_url || raw.online_apply_link || '',
      admitCardLink: admitCardUrl,
      resultLink: resultUrl
    } : null;

    // Base description/content
    let fullContent = cleanHTML(raw.content || raw.description || '');

    // Combine all migrated job fields (eligibility, fees, salary) if present on raw
    if (isJob) {
      let extraHtml = '';

      if (raw.eligibility && !fullContent.includes('Eligibility Criteria')) {
        extraHtml += `<div class="my-6"><h3 class="text-base font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-1">Eligibility Criteria:</h3>${cleanHTML(raw.eligibility)}</div>`;
      }

      if (raw.fees && !fullContent.includes('Application Fees')) {
        let feesStr = typeof raw.fees === 'object' ?
          `<ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
            <li><strong>General/OBC/EWS:</strong> ₹${raw.fees.gen_fee || '25'}</li>
            <li><strong>SC Candidates:</strong> ${raw.fees.sc_fee || 'No fee'}</li>
            <li><strong>ST Candidates:</strong> ${raw.fees.obc_fee || 'No fee'}</li>
            <li><strong>PwBD / Female Candidates:</strong> ${raw.fees.ph_fee || 'No fee'}</li>
          </ul>` : cleanHTML(raw.fees);
        extraHtml += `<div class="my-6"><h3 class="text-base font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-1">Application Fees:</h3>${feesStr}</div>`;
      }

      if (raw.salary && !fullContent.includes('Pay Scale')) {
        extraHtml += `<div class="my-6"><h3 class="text-base font-semibold text-slate-900 mb-2 border-b border-slate-100 pb-1">Pay Scale:</h3>${cleanHTML(raw.salary)}</div>`;
      }

      if (!fullContent.includes('<table') && jobDetailsObj) {
        const tableHtml = buildJobHighlightsTableHTML(cleanHTML(raw.title || 'Notification Details'), jobDetailsObj);
        const eligMatch = fullContent.match(/(<h[1-6][^>]*>.*?Eligibility Criteria.*?<\/h[1-6]>|Eligibility Criteria:?)/i);
        if (eligMatch) {
          const index = eligMatch.index;
          fullContent = fullContent.slice(0, index) + tableHtml + fullContent.slice(index) + extraHtml;
        } else {
          fullContent = fullContent + tableHtml + extraHtml;
        }
      } else {
        fullContent += extraHtml;
      }
    }

    const metadataObj = raw.metadata ? {
      m_title: cleanHTML(raw.metadata.m_title || raw.title),
      m_desc: cleanHTML(raw.metadata.m_desc || raw.subtitle || ''),
      m_keys: cleanHTML(raw.metadata.m_keys || ''),
      canonical: raw.metadata.canonical || '',
      robots: raw.metadata.robots || 1,
      schema: raw.metadata.schema || ''
    } : null;

    return {
      title: cleanHTML(raw.title || 'Notification Details'),
      subtitle: cleanHTML(raw.subtitle || ''),
      author: authorObj,
      category: categoryName,
      categorySlug: categorySlug,
      date: pubDate,
      lastDate: formattedLastDate,
      image: getImageUrl(raw.featured_media, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'),
      content: fullContent,
      isJob: isJob,
      jobDetails: jobDetailsObj,
      metadata: metadataObj
    };
  };

  const generateFallbackArticle = (articleSlug) => {
    const formattedTitle = cleanHTML(articleSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '));

    const isSikkim = articleSlug.includes('sikkim');

    if (isSikkim) {
      return {
        title: 'Sikkim All Government Exams List 2026: Complete List of Govt Exams, Eligibility & Jobs',
        subtitle: '',
        author: {
          name: 'Nisha Negi',
          image: 'https://educationmasters.in/assets/img/defaults/user.png',
          bio: 'Nisha Negi is a Senior Education & Govt Exam Specialist at Education Masters. She covers state SPSC recruitments, civil services examinations, admit cards, and competitive exam preparation strategies.'
        },
        category: 'Latest Job Alert',
        date: 'Jul 29, 2026',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
        isJob: true,
        jobDetails: {
          postName: 'Sikkim State Govt Various Posts 2026',
          totalVacancies: '1,450+ Vacancies',
          qualification: '10th Pass, 12th Pass, Graduate Degree, B.Ed, Diploma',
          ageLimit: '18 to 40 Years (Age relaxation applicable as per rules)',
          salary: '₹21,700 - ₹1,12,400 (7th Pay Commission)',
          applicationFee: 'General: ₹150 | SC/ST/PWD: Exempted',
          endDate: 'October 30, 2026',
          officialLink: 'https://spsc.sikkim.gov.in',
          applyLink: 'https://spsc.sikkim.gov.in'
        },
        contentSections: [
          {
            heading: 'Overview of Sikkim Government Recruitment 2026',
            body: `Sikkim Government Exams 2026 offer excellent career opportunities for candidates looking for secure and well-paying government jobs in the state. Every year, the Sikkim Public Service Commission (SPSC) along with various Sikkim State Departments regularly announces notifications for administrative, teaching, police, engineering, and medical vacancies.`
          },
          {
            heading: 'Major Government Exams Conducted in Sikkim',
            isList: true,
            items: [
              { name: 'Sikkim State Civil Service (SCS) Exam', board: 'SPSC', qual: 'Graduate Degree', role: 'Deputy Collector, Under Secretary' },
              { name: 'Sikkim Police Sub-Inspector & Constable', board: 'Sikkim Police HQ', qual: '10th / 12th / Graduate', role: 'SI, ASI, Constable' },
              { name: 'SPSC Assistant Engineer (AE) / Junior Engineer (JE)', board: 'SPSC Dept of Power/PWD', qual: 'B.Tech / B.E / Diploma', role: 'Assistant / Junior Engineer' },
              { name: 'Sikkim Primary & Graduate Teacher (TGT/PGT)', board: 'Education Dept Sikkim', qual: 'B.Ed / D.El.Ed / STET Pass', role: 'Primary & High School Teacher' },
              { name: 'Sikkim Lower Division Clerk (LDC) & Stenographer', board: 'SPSC Recruitment Cell', qual: '12th Pass + Typing Speed', role: 'LDC / Junior Assistant' }
            ]
          },
          {
            heading: 'Eligibility Criteria & Age Limits for Sikkim Govt Jobs',
            body: `To apply for Sikkim State Government Jobs, applicants must meet the specified educational qualifications and citizenship criteria. Priority and relaxations are provided to Sikkim Subject Certificate (SSC) or Certificate of Identification (COI) holders in accordance with state reservation policies.`
          }
        ]
      };
    }

    // UPSC Full Professional Fallback Content matching reference screenshots
    return {
      title: 'UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts',
      subtitle: '',
      author: {
        name: 'Mohit',
        image: 'https://educationmasters.in/assets/img/defaults/user.png',
        bio: 'I am mohit, a student and Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content. I specialize in writing about government jobs, entrance exams, admissions, results, and career guidance to help students make informed academic and career decisions.'
      },
      category: 'UPSC',
      date: 'Sep 13, 2026',
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80',
      isJob: true,
      jobDetails: {
        postName: 'UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts',
        totalVacancies: '212 Vacancies',
        qualification: 'Master Degree, MBBS, MD/MS, B.E/B.Tech or equivalent',
        ageLimit: '18 to 40 Years (Relaxation as per rules)',
        salary: 'Pay Level 7 to Level 11 + Applicable Allowances',
        applicationFee: 'General/OBC: ₹25 | SC/ST/Female: Exempted',
        endDate: 'October 02, 2026',
        officialLink: 'https://upsc.gov.in',
        applyLink: 'https://upsconline.nic.in'
      },
      content: `
        <p>The <strong>UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts</strong> has been announced by the Union Public Service Commission (UPSC) under Advertisement No. 11/2026. This recruitment is for candidates with specialised qualifications in medical, legal, journalism and other professional fields. A total of 212 vacancies are available in different Central Government departments and offices.</p>
        
        <p>The vacancies include Specialist Grade III Assistant Professor posts in Anatomy and General Medicine, Assistant Editor, Specialist Grade II posts in Anaesthesiology and Paediatrics, Assistant Public Prosecutor and Public Law Officer/District Litigation Officer/Law Officer posts. The selected candidates will perform duties according to their respective departments and positions. Assistant Professors will be responsible for teaching and academic activities, while medical specialists will provide professional healthcare services. Assistant Public Prosecutors and Law Officers will handle legal and prosecution-related work. Assistant Editors will perform editing and publication duties.</p>
        
        <p>The selection will be conducted through <strong>direct recruitment by selection</strong>. Depending on the number of applications, UPSC may conduct a Recruitment Test for shortlisting candidates, followed by an interview where applicable. Candidates must fulfil the prescribed educational qualification, professional experience and age requirements for their selected post. The salary will be provided according to the applicable <strong>7th CPC Pay Matrix</strong> and government rules.</p>
        
        <h2 class="text-xl font-semibold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-2">Upsc Recruitment 2026 For 212 Specialist, Assistant Professor Job Highlights:</h2>
        
        <div class="overflow-x-auto my-4">
          <table class="w-full text-xs sm:text-sm border-collapse border border-slate-200 text-left">
            <tbody>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700 w-1/3 sm:w-1/4">Name of Exam</th>
                <td class="p-3 font-normal text-slate-900">UPSC Recruitment 2026 for 212 Specialist, Assistant Professor</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">No. of Seats</th>
                <td class="p-3 font-normal text-slate-900">212</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Job Location</th>
                <td class="p-3 font-normal text-slate-900">All India</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Notification Release Date</th>
                <td class="p-3 font-normal text-slate-900">12 September 2026</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Online Application Start Date</th>
                <td class="p-3 font-normal text-slate-900">12 September 2026</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Prelims Exam Date</th>
                <td class="p-3 font-normal text-slate-500">N/A</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Minimum age limit</th>
                <td class="p-3 font-normal text-slate-500">N/A</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Maximum age limit</th>
                <td class="p-3 font-normal text-slate-500">N/A</td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Notification Release Link</th>
                <td class="p-3 font-medium text-blue-600"><a href="https://upsc.gov.in" target="_blank" rel="noreferrer" class="hover:underline">Click here</a></td>
              </tr>
              <tr class="border-b border-slate-200">
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Direct Online Application Link</th>
                <td class="p-3 font-medium text-blue-600"><a href="https://upsconline.nic.in" target="_blank" rel="noreferrer" class="hover:underline">Apply now</a></td>
              </tr>
              <tr>
                <th class="p-3 bg-slate-50 border-r border-slate-200 font-semibold text-slate-700">Helpline</th>
                <td class="p-3 font-normal text-slate-500">N/A</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-4 my-6">
          <div>
            <h3 class="text-base font-semibold text-slate-900 mb-1">Eligibility Criteria:</h3>
            <p class="text-slate-600 text-sm mb-2">The eligibility requirements are different for each post.</p>
            <ul class="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
              <li><strong>Assistant Professor – Anatomy:</strong> Candidates need the prescribed recognised postgraduate medical qualification in Anatomy along with the required teaching experience.</li>
              <li><strong>Assistant Professor – General Medicine:</strong> Candidates generally need MBBS and the prescribed postgraduate medical qualification in Medicine/General Medicine or equivalent DNB, along with the required teaching experience.</li>
              <li><strong>Assistant Editor:</strong> Candidates need the prescribed degree/diploma qualification in Journalism/Mass Communication or the alternative qualification mentioned in the notification.</li>
              <li><strong>Specialist Grade II:</strong> Candidates need the prescribed medical qualification, relevant postgraduate qualification and required professional experience.</li>
              <li><strong>Assistant Public Prosecutor:</strong> A recognised <strong>Law degree</strong> and the prescribed experience at the Bar are required.</li>
              <li><strong>Public Law Officer / District Litigation Officer:</strong> Candidates need a Law degree and the required legal practice experience.</li>
              <li><strong>Age Limit:</strong> The maximum age varies according to the post, so candidates must check the exact age requirement for their selected vacancy.</li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-semibold text-slate-900 mb-1">Application Fees:</h3>
            <ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
              <li><strong>General/OBC/EWS and other applicable candidates:</strong> ₹25</li>
              <li><strong>Women candidates:</strong> No fee</li>
              <li><strong>SC candidates:</strong> No fee</li>
              <li><strong>ST candidates:</strong> No fee</li>
              <li><strong>PwBD candidates:</strong> No fee</li>
            </ul>
          </div>

          <div>
            <h3 class="text-base font-semibold text-slate-900 mb-1">Pay Scale:</h3>
            <p class="text-slate-600 text-sm mb-2">The salary is different for each post according to the 7th Central Pay Commission.</p>
            <ul class="list-disc pl-5 space-y-1 text-sm text-slate-700">
              <li><strong>Assistant Professor – Anatomy:</strong> Pay Level-11 + applicable NPA.</li>
              <li><strong>Assistant Professor – General Medicine:</strong> Pay Level-11 + applicable NPA.</li>
              <li><strong>Specialist Grade II:</strong> Pay Level-11 + applicable NPA.</li>
              <li><strong>Assistant Editor:</strong> Pay Level-7.</li>
              <li><strong>Assistant Public Prosecutor:</strong> Pay Level-10.</li>
              <li><strong>Public Law Officer / District Litigation Officer:</strong> Pay Level-8.</li>
            </ul>
          </div>

          <div class="my-6 space-y-4 font-normal">
            <p class="font-bold text-slate-900 text-sm sm:text-base">सरकारी नौकरियों, जीके अपडेट्स और करेंट अफेयर्स की ताज़ा जानकारी सबसे पहले पाने के लिए:</p>
            <div class="space-y-3 text-xs sm:text-sm">
              <div>
                <p class="font-bold text-slate-900 text-sm sm:text-base">हमारे WhatsApp चैनल को फॉलो करें:</p>
                <a href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U" target="_blank" rel="noreferrer" class="text-[#25D366] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5">https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U</a>
              </div>
              <div>
                <p class="font-bold text-slate-900 text-sm sm:text-base">हमारे Telegram चैनल को फॉलो करें:</p>
                <a href="https://t.me/educationmastersin" target="_blank" rel="noreferrer" class="text-[#0088cc] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5">https://t.me/educationmastersin</a>
              </div>
              <div>
                <p class="font-bold text-slate-900 text-sm sm:text-base">हमारे Facebook Page को फॉलो करें:</p>
                <a href="https://www.facebook.com/educationmastersindia" target="_blank" rel="noreferrer" class="text-[#1877F2] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5">https://www.facebook.com/educationmastersindia</a>
              </div>
            </div>
          </div>
        </div>
      `
    };
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      {/* Global CSS overrides for clean HTML rendering */}
      <style jsx global>{`
        .article-raw-html table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-top: 1rem !important;
          margin-bottom: 1.5rem !important;
          border: 1px solid #e2e8f0 !important;
        }
        .article-raw-html th {
          background-color: #f8fafc !important;
          font-weight: 600 !important;
          color: #334155 !important;
          padding: 0.75rem !important;
          border: 1px solid #e2e8f0 !important;
          text-align: left !important;
        }
        .article-raw-html td {
          padding: 0.75rem !important;
          border: 1px solid #e2e8f0 !important;
          color: #1e293b !important;
          font-weight: 400 !important;
        }
        .article-raw-html ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 1rem !important;
        }
        .article-raw-html li {
          margin-bottom: 0.35rem !important;
          line-height: 1.6 !important;
        }
        .article-raw-html a {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 500 !important;
        }
        .article-raw-html h2, .article-raw-html h3 {
          font-weight: 600 !important;
          color: #0f172a !important;
          margin-top: 1.5rem !important;
        }
      `}</style>

      <Header />
      <LiveTicker />

      {/* Main Page Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 md:py-6">

        {/* 3-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ================= LEFT SKYSCRAPER AD CONTAINER ================= */}
          {showLeftAd && (
            <aside className="hidden xl:block xl:col-span-2 sticky top-20">
              <div className="w-[160px] mx-auto bg-slate-900 text-white rounded overflow-hidden shadow-sm relative group">
                <button
                  onClick={() => setShowLeftAd(false)}
                  className="absolute top-1 right-1 text-slate-400 hover:text-white z-10 bg-black/40 p-0.5 rounded"
                  title="Close Ad"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="p-3 text-center border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Fortinet Ad</span>
                </div>
                <div className="p-4 space-y-3 text-center">
                  <p className="text-xs font-semibold leading-snug text-slate-100">
                    Fortinet Named a Leader in the 2026 Gartner® Magic Quadrant™
                  </p>
                  <div className="w-full h-44 bg-gradient-to-b from-rose-950 to-slate-900 rounded flex items-center justify-center border border-rose-900/50 p-2">
                    <span className="text-[11px] text-rose-200 font-medium leading-tight">Hybrid Mesh Firewalls Report</span>
                  </div>
                  <a
                    href="https://fortinet.com"
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-2 rounded transition"
                  >
                    Download Report
                  </a>
                </div>
              </div>
            </aside>
          )}

          {/* ================= CENTER MAIN ARTICLE CONTENT ================= */}
          <section className={`col-span-1 lg:col-span-8 ${showLeftAd ? 'xl:col-span-7' : 'xl:col-span-7'} space-y-4`}>

            {/* Top Breadcrumb Links - Perfectly Aligned with Content Column */}
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="hover:text-blue-600 font-normal">Home</Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {isJobPage ? (
                <Link href="/jobs" className="hover:text-blue-600 font-normal">Jobs</Link>
              ) : isAdmitCardPage ? (
                <Link href="/admit-cards" className="hover:text-blue-600 font-normal">Admit Cards</Link>
              ) : isResultPage ? (
                <Link href="/results" className="hover:text-blue-600 font-normal">Results</Link>
              ) : article?.categorySlug ? (
                <Link href={`/category/${article.categorySlug}`} className="hover:text-blue-600 font-normal">
                  {article.category || 'Articles'}
                </Link>
              ) : (
                <Link href="/category/articles" className="hover:text-blue-600 font-normal">Articles</Link>
              )}
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-600 font-normal truncate max-w-[400px]">
                {article?.title || 'Notification Details'}
              </span>
            </nav>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-72 bg-slate-100 rounded w-full"></div>
              </div>
            ) : article ? (
              <article className="space-y-4">

                {/* 1. Article Main Title */}
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-tight">
                  {article.title}
                </h1>

                {/* 2. Byline Meta: Author, Category, Posted Date & Last Date */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-700 font-normal">
                  <span>
                    By <span className="font-bold text-slate-900">{typeof article.author === 'object' ? article.author.name : article.author}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    In <Link href={article.categorySlug ? `/category/${article.categorySlug}` : '/jobs'} className="text-slate-900 font-bold underline decoration-slate-300 hover:text-blue-600 transition">{(typeof article.category === 'object' ? article.category.name : article.category) || 'Jobs'}</Link>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Posted: <span className="font-bold text-slate-900">{article.date}</span>
                  </span>
                  {(article.lastDate || article.jobDetails?.endDate) && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>
                        Last Date: <span className="font-bold text-slate-900">{article.lastDate || article.jobDetails?.endDate}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* 3. Official Disclaimer Box */}
                <div className="p-3.5 bg-[#fef9ed] border border-[#f5dfb8] rounded text-xs text-[#8a5314] leading-relaxed">
                  <strong className="font-semibold">Disclaimer:</strong> The content shown on this page related to government jobs is either sourced from various internet website or from government websites. We do not claim any affiliation or authority over this content. It&apos;s solely for information providing purpose.
                </div>

                {/* 4. Featured Banner Image */}
                {article.image && (
                  <div className="w-full my-3">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-auto max-h-[480px] object-cover rounded-md"
                    />
                  </div>
                )}

                {/* 5. Professional Social Share Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-200/80 my-4 bg-slate-50/50 px-3 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1">Share:</span>

                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#25D366] hover:bg-[#1eb956] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.228-1.157z" /></svg>
                      <span>WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" /></svg>
                      <span>Telegram</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      <span>Facebook</span>
                    </a>

                    {/* Twitter / X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      <span>Twitter</span>
                    </a>
                  </div>

                  {/* Copy Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* 6. Main Body Content: FIRST Description, THEN Table */}
                <div className="text-slate-700 text-base leading-relaxed space-y-4 font-normal">
                  {/* First: Article Description & Intro Content */}
                  {article.contentSections ? (
                    article.contentSections.map((sec, i) => (
                      <div key={i} className="space-y-2">
                        <h2 className="text-lg font-semibold text-slate-900 pt-2 border-b border-slate-100 pb-1">
                          {sec.heading}
                        </h2>

                        {sec.body && (
                          <p className="text-slate-700 font-normal leading-relaxed">
                            {sec.body}
                          </p>
                        )}

                        {sec.isList && sec.items && (
                          <div className="overflow-x-auto my-3 border border-slate-200 rounded">
                            <table className="min-w-full text-xs sm:text-sm divide-y divide-slate-200">
                              <thead className="bg-slate-100 font-semibold text-slate-700 text-left">
                                <tr>
                                  <th className="p-2.5">Exam Name</th>
                                  <th className="p-2.5">Board</th>
                                  <th className="p-2.5">Qualification</th>
                                  <th className="p-2.5">Target Post</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white font-normal">
                                {sec.items.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2.5 font-medium text-blue-600">{row.name}</td>
                                    <td className="p-2.5 text-slate-600">{row.board}</td>
                                    <td className="p-2.5 text-slate-800">{row.qual}</td>
                                    <td className="p-2.5 text-slate-900">{row.role}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      className="article-raw-html text-slate-700 text-base leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  )}

                  {/* Second: Job Highlights Table */}
                  {article.isJob && article.jobDetails && !article.content?.includes('<table') && (
                    <div className="my-6 space-y-3">
                      <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
                        {article.title} Job Highlights:
                      </h2>
                      <div className="overflow-x-auto border border-slate-200 rounded-md">
                        <table className="w-full text-xs sm:text-sm text-left border-collapse">
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Name of Exam</th>
                              <td className="p-3 font-normal text-slate-900">{article.jobDetails.postName}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">No. of Seats</th>
                              <td className="p-3 font-normal text-slate-900">{article.jobDetails.totalVacancies}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Job Location</th>
                              <td className="p-3 font-normal text-slate-900">All India</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Notification Release Date</th>
                              <td className="p-3 font-normal text-slate-900">{article.date || '12 September 2026'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Online Application Start Date</th>
                              <td className="p-3 font-normal text-slate-900">{article.date || '12 September 2026'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Last Date to Apply</th>
                              <td className="p-3 font-normal text-slate-900">{article.jobDetails.endDate || 'Check Notification'}</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Prelims Exam Date</th>
                              <td className="p-3 font-normal text-slate-500">N/A</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Minimum age limit</th>
                              <td className="p-3 font-normal text-slate-500">N/A</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Maximum age limit</th>
                              <td className="p-3 font-normal text-slate-500">N/A</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Notification Release Link</th>
                              <td className="p-3 font-medium text-blue-600">
                                <a href={article.jobDetails.officialLink} target="_blank" rel="noreferrer" className="hover:underline">Click here</a>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Direct Online Application Link</th>
                              <td className="p-3 font-medium text-blue-600">
                                <a href={article.jobDetails.applyLink} target="_blank" rel="noreferrer" className="hover:underline">Apply now</a>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Helpline</th>
                              <td className="p-3 font-normal text-slate-500">N/A</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action Link Buttons */}
                {article.isJob && article.jobDetails && (
                  <div className="my-6 flex flex-wrap gap-3 pt-2">
                    <a
                      href={article.jobDetails.applyLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded transition shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Apply Online Link</span>
                    </a>
                    <a
                      href={article.jobDetails.officialLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded transition shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Official Website Notice</span>
                    </a>
                  </div>
                )}

                {/* 7. Government Jobs & GK Updates Channel Follow Section */}
                <div className="my-6 space-y-4 font-normal">
                  <p className="font-bold text-slate-900 text-sm sm:text-base">
                    सरकारी नौकरियों, जीके अपडेट्स और करेंट अफेयर्स की ताज़ा जानकारी सबसे पहले पाने के लिए:
                  </p>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">हमारे WhatsApp चैनल को फॉलो करें:</p>
                      <a
                        href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#25D366] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5"
                      >
                        https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U
                      </a>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">हमारे Telegram चैनल को फॉलो करें:</p>
                      <a
                        href="https://t.me/educationmastersin"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0088cc] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5"
                      >
                        https://t.me/educationmastersin
                      </a>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">हमारे Facebook Page को फॉलो करें:</p>
                      <a
                        href="https://www.facebook.com/educationmastersindia"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1877F2] font-bold text-sm sm:text-base underline hover:opacity-80 break-all inline-block mt-0.5"
                      >
                        https://www.facebook.com/educationmastersindia
                      </a>
                    </div>
                  </div>
                </div>

                {/* 8. White Banner Ad Space (728x90 ratio) */}
                <div className="my-6 w-full bg-white border border-dashed border-slate-300 rounded-md p-6 flex flex-col items-center justify-center text-center min-h-[90px] shadow-2xs">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Ad Space (728 × 90 Ratio)
                  </span>
                </div>

                {/* 9. Professional Author Box Matching Live Reference Image */}
                {article.author && !article.content?.includes('class="author') && !article.content?.includes('class="mt-5 author') && (
                  <div className="my-8 p-5 bg-[#f8f9fa] border border-slate-200/90 rounded-md flex flex-col sm:flex-row items-start gap-4">
                    {/* Left Square Avatar Frame */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white border border-slate-200 rounded p-1 shadow-2xs overflow-hidden">
                      <img
                        src={typeof article.author === 'object' ? article.author.image : 'https://educationmasters.in/assets/img/defaults/user.png'}
                        alt={typeof article.author === 'object' ? article.author.name : article.author}
                        className="w-full h-full object-cover rounded-xs"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = 'true';
                            e.currentTarget.src = '/logo.webp';
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                    </div>

                    {/* Right Bio Content */}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-bold text-slate-800 leading-none">
                        {typeof article.author === 'object' ? article.author.name : article.author}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                        {typeof article.author === 'object' && article.author.bio ? article.author.bio : 'Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content covering government jobs, entrance exams, admissions, results, and career guidance.'}
                      </p>

                      {/* Social Links Row matching reference image */}
                      <div className="flex items-center space-x-2.5 pt-1 text-slate-400">
                        <a href="#" className="hover:text-blue-600 transition" title="Website"><Globe className="w-3.5 h-3.5" /></a>
                        <a href="#" className="hover:text-blue-600 transition" title="Facebook"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                        <a href="#" className="hover:text-sky-500 transition" title="Twitter"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
                        <a href="#" className="hover:text-blue-700 transition" title="LinkedIn"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.262-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>
                        <a href="#" className="hover:text-rose-600 transition" title="Instagram"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
                      </div>
                    </div>
                  </div>
                )}

              </article>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p>Article content unavailable.</p>
                <Link href="/" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
                  Return to Home
                </Link>
              </div>
            )}
          </section>

          {/* ================= RIGHT SIDEBAR WIDGET MATCHING LIVE JOB PAGE REFERENCE ================= */}
          <aside className="col-span-1 lg:col-span-4 xl:col-span-3 sticky top-20 space-y-4">

            <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-3.5 shadow-2xs">

              {/* Tab Header - 2 Equal 50% Tabs */}
              <div className="flex border-b border-slate-200 -mx-3.5 -mt-3.5 mb-3.5 bg-[#e9ecef]/50 rounded-t-lg overflow-hidden">
                <button
                  onClick={() => setSidebarTab('expiring')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition ${sidebarTab === 'expiring'
                    ? 'bg-[#e9ecef] text-slate-900 border-r border-slate-200 font-bold'
                    : 'bg-white/60 text-[#2563eb] hover:bg-white border-r border-slate-200 font-semibold'
                    }`}
                >
                  Jobs Expiring Soon
                </button>
                <button
                  onClick={() => setSidebarTab('mcq')}
                  className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm transition ${sidebarTab === 'mcq'
                    ? 'bg-[#e9ecef] text-slate-900 font-bold'
                    : 'bg-white/60 text-[#2563eb] hover:bg-white font-semibold'
                    }`}
                >
                  MCQ Questions
                </button>
              </div>

              {sidebarTab === 'expiring' ? (
                <div>
                  {/* Subheader matching screenshot: "28 Jobs are expiring in 30 Days" + "View All [Jobs]" */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">28 Jobs are expiring in 30 Days</span>
                    <div className="flex items-center space-x-1.5">
                      <Link href="/jobs" className="text-[#2563eb] font-medium hover:underline">View All</Link>
                      <span className="bg-[#2563eb] text-white text-[11px] font-semibold px-2 py-0.5 rounded flex items-center space-x-1">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                        <span>Jobs</span>
                      </span>
                    </div>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  {/* Expiring Jobs List Rows */}
                  <div className="space-y-3">
                    {expiringJobs.slice(0, 6).map((job, idx) => (
                      <div key={job.id || idx}>
                        <Link
                          href={`/job/${job.slug}`}
                          className="flex items-start space-x-3 group block transition"
                        >
                          <div className="w-[95px] h-[65px] shrink-0 rounded border border-slate-200 overflow-hidden bg-white">
                            <img
                              src={job.image}
                              alt={job.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallback) {
                                  e.currentTarget.dataset.fallback = 'true';
                                  e.currentTarget.src = '/logo.webp';
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
                              {job.title}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <span className="text-slate-500 font-normal">
                                Last Date: <span className="text-slate-600">{job.lastDate}</span>
                              </span>
                              <span className="text-[#2563eb] font-medium">Jobs</span>
                            </div>
                          </div>
                        </Link>
                        {idx < 5 && <hr className="border-slate-200/80 my-3" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* MCQ Tab Content */
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-0.5">
                    <span className="font-normal text-slate-600">Daily Practice Questions</span>
                    <Link href="/mcq-questions" className="text-[#2563eb] font-medium hover:underline">View All</Link>
                  </div>
                  <hr className="border-slate-200 mb-3.5" />

                  <div className="space-y-3 text-xs">
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Indian Polity</span>
                      <p className="font-medium text-slate-800 leading-snug">Who presides over the joint sitting of the Parliament in India?</p>
                    </div>
                    <div className="py-2 border-b border-slate-200 space-y-1">
                      <span className="text-[10px] font-semibold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded">Current Affairs</span>
                      <p className="font-medium text-slate-800 leading-snug">Which state government recently launched the Youth Employment Scheme?</p>
                    </div>
                    <div className="py-2 space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">General Science</span>
                      <p className="font-medium text-slate-800 leading-snug">What is the SI unit of electric current intensity?</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Green Channel Join Banner Box matching Live Site */}
            <div className="bg-[#e6f7ef] border border-[#a3e6c5] rounded-lg p-3 text-center space-y-1.5">
              <p className="text-xs font-semibold text-emerald-900">
                सरकारी नौकरियों और GK अपडेट्स के लिए हमारे ग्रुप्स से जुड़ें:
              </p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://t.me/educationmastersin"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-2xs transition"
                >
                  <span>Telegram</span>
                </a>
              </div>
            </div>

          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
