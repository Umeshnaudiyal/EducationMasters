'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveTicker from '@/components/LiveTicker';
import {
  Calendar, User, Share2, Copy, Bookmark,
  ExternalLink, Download, ChevronRight, ChevronDown, X,
  Send, MessageSquare, Check, Award, Globe,
  Building, Clock, FileText, HelpCircle, CheckCircle2,
  Share, BookmarkCheck
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/apis/v1` : 'http://localhost:5001/apis/v1';

// Helper for clean, bulletproof date formatting
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '0000-00-00') return 'As per scheduled';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch (e) {
    return String(dateStr);
  }
};

// Robust HTML & text sanitizer helper (removes SQL migration artifacts like 'rn', decodes entities)
const cleanHTML = (contentStr) => {
  if (!contentStr) return '';
  let str = String(contentStr);

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

// Helper to normalize and fix external URLs
const formatExternalUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  let url = urlStr.trim().replace(/,/g, '.');
  if (!url || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// Parse structured FAQ questions & answers from HTML string or raw content
const parseFaqs = (faqRaw, defaultExamName = '') => {
  if (!faqRaw) return [];
  if (Array.isArray(faqRaw)) return faqRaw;

  const cleaned = cleanHTML(faqRaw);
  if (!cleaned) return [];

  // Match pattern like <li><strong>Q?</strong></li> <p>Answer</p> or <p><strong>Q. Question?</strong></p><p>Answer</p>
  const faqs = [];
  const regex = /<(?:li|p|h[3-6]|div)[^>]*>\s*<strong[^>]*>([^<]+)<\/strong>\s*<\/(?:li|p|h[3-6]|div)>\s*<(?:p|div)[^>]*>(.*?)<\/(?:p|div)>/gi;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    let q = match[1].replace(/^[Q0-9.\s]+/, '').trim();
    let a = match[2].replace(/^Answer:\s*/i, '').replace(/<[^>]*>/g, '').trim();
    if (q && a) {
      faqs.push({ question: q, answer: a });
    }
  }

  // If regex parsing didn't find pairs, check if list items exist
  if (faqs.length === 0) {
    const listItems = cleaned.match(/<li[^>]*>(.*?)<\/li>/gi);
    if (listItems && listItems.length > 0) {
      listItems.forEach((item, idx) => {
        const text = item.replace(/<[^>]*>/g, '').trim();
        if (text) {
          faqs.push({
            question: `Question ${idx + 1}`,
            answer: text
          });
        }
      });
    }
  }

  return faqs;
};

// Helper to parse HTML instructions (inst_down or inst_impl) into clean text items
const parseInstructionItems = (htmlStr) => {
  if (!htmlStr) return [];
  const cleaned = cleanHTML(htmlStr);
  const items = [];

  const liMatches = cleaned.match(/<li[^>]*>(.*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    liMatches.forEach((li) => {
      const text = li.replace(/<[^>]*>/g, '').trim();
      if (text) items.push(text);
    });
  } else {
    // Split by paragraphs or newlines
    const pMatches = cleaned.match(/<p[^>]*>(.*?)<\/p>/gi);
    if (pMatches && pMatches.length > 0) {
      pMatches.forEach((p) => {
        const text = p.replace(/<[^>]*>/g, '').trim();
        if (text) items.push(text);
      });
    } else {
      const lines = cleaned.split(/\n+/).map(l => l.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      items.push(...lines);
    }
  }

  return items;
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
  const [relatedJobs, setRelatedJobs] = useState(DEFAULT_EXPIRING_JOBS);
  const [sidebarTab, setSidebarTab] = useState('expiring'); // 'expiring' or 'mcq'
  const [loading, setLoading] = useState(true);
  const [showLeftAd, setShowLeftAd] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const isJobPage = pathname.startsWith('/job') || article?.isJob;
  const isAdmitCardPage = pathname.startsWith('/admit-card') || article?.isAdmitCard || article?.category?.toLowerCase().includes('admit');
  const isResultPage = pathname.startsWith('/result') || article?.isResult || article?.category?.toLowerCase().includes('result');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      fetchArticleData(slug);
    } else {
      setLoading(false);
    }
  }, [slug, pathname]);

  // Dynamically update page Title, Meta Description & Keywords
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
      fetchRelatedJobs();

      // 1. If on /result route, try Result endpoint first
      if (pathname.startsWith('/result')) {
        const resRes = await fetch(`${API_BASE}/results/${articleSlug}`);
        const dataRes = await resRes.json();
        if (dataRes.success && dataRes.data) {
          setArticle(formatArticleData(dataRes.data, 'result'));
          setLoading(false);
          return;
        }
      }

      // 2. If on /admit-card route, try Admit Card endpoint first
      if (pathname.startsWith('/admit-card')) {
        const resAC = await fetch(`${API_BASE}/admit-cards/${articleSlug}`);
        const dataAC = await resAC.json();
        if (dataAC.success && dataAC.data) {
          setArticle(formatArticleData(dataAC.data, 'admit-card'));
          setLoading(false);
          return;
        }
      }

      // 3. If on /job route, try Job endpoint first
      if (pathname.startsWith('/job')) {
        const resJob = await fetch(`${API_BASE}/jobs/${articleSlug}`);
        const dataJob = await resJob.json();
        if (dataJob.success && dataJob.data) {
          setArticle(formatArticleData(dataJob.data, 'job'));
          setLoading(false);
          return;
        }
      }

      // 4. Try Blog endpoint
      let res = await fetch(`${API_BASE}/blogs/${articleSlug}`);
      let data = await res.json();

      if (data.success && data.data) {
        setArticle(formatArticleData(data.data, 'blog'));
        setLoading(false);
        return;
      }

      // 5. Fallback check results
      if (!pathname.startsWith('/result')) {
        res = await fetch(`${API_BASE}/results/${articleSlug}`);
        data = await res.json();
        if (data.success && data.data) {
          setArticle(formatArticleData(data.data, 'result'));
          setLoading(false);
          return;
        }
      }

      // 6. Fallback check admit cards
      if (!pathname.startsWith('/admit-card')) {
        res = await fetch(`${API_BASE}/admit-cards/${articleSlug}`);
        data = await res.json();
        if (data.success && data.data) {
          setArticle(formatArticleData(data.data, 'admit-card'));
          setLoading(false);
          return;
        }
      }

      // 7. Fallback check jobs
      if (!pathname.startsWith('/job')) {
        res = await fetch(`${API_BASE}/jobs/${articleSlug}`);
        data = await res.json();
        if (data.success && data.data) {
          setArticle(formatArticleData(data.data, 'job'));
          setLoading(false);
          return;
        }
      }

      // Fallback mock data
      setArticle(generateFallbackArticle(articleSlug));
    } catch (err) {
      console.error('Fetch article error:', err);
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

  const fetchRelatedJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs?status=publish&limit=6`);
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
        setRelatedJobs(formatted);
      }
    } catch (err) {
      console.error('Related jobs fetch error:', err);
    }
  };

  const formatArticleData = (raw, type) => {
    const isResult = type === 'result' || pathname.startsWith('/result') || raw.result_status !== undefined || (raw.inst_down !== undefined && raw.down_url && !raw.vacancies);
    const isAdmitCard = type === 'admit-card' || pathname.startsWith('/admit-card');
    const isJob = type === 'job' || (!isResult && !isAdmitCard && (raw.vacancies || raw.qualification || raw.posts));

    let firstCat = raw.categories?.[0] || raw.category;
    let catName = typeof firstCat === 'object' ? (firstCat?.name || firstCat?.slug || '') : String(firstCat || '');
    let catSlug = typeof firstCat === 'object' ? (firstCat?.slug || '') : '';
    if (catName === '[object Object]') catName = '';

    // Extract Department / Board / Agency Name
    const extractDepartment = (rawItem) => {
      if (rawItem.dept && String(rawItem.dept).trim()) {
        return cleanHTML(rawItem.dept);
      }
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
      if (lowerTitle.includes('union bank')) return 'Union Bank';
      if (lowerTitle.includes('bank of baroda') || lowerTitle.includes('bob')) return 'Bank of Baroda';
      if (lowerTitle.includes('sikkim') || lowerTitle.includes('spsc')) return 'SPSC / Sikkim';
      if (lowerTitle.includes('ibps')) return 'IBPS';
      if (lowerTitle.includes('dgqa') || lowerTitle.includes('dgaqa')) return 'DGQA';

      if (catName && typeof catName === 'string' && catName.trim() && !['jobs', 'job', 'articles', 'results', 'admit card', 'uncategorized'].includes(catName.trim().toLowerCase())) {
        return cleanHTML(catName);
      }

      if (isResult) return 'Results';
      if (isAdmitCard) return 'Admit Card';
      if (isJob) return 'Jobs';
      return 'Articles';
    };

    const categoryName = extractDepartment(raw);
    const categorySlug = catSlug || (isResult ? 'results' : isAdmitCard ? 'admit-cards' : isJob ? 'jobs' : 'articles');

    // Extract authentic Author details
    let authorName = 'Vikash Sharma';
    let authorImage = 'https://educationmasters.in/assets/img/users/admin_1777271474.png';
    let authorBio = 'Vikash Sharma is an education expert and digital learning strategist with over 10 years of experience in the Indian education ecosystem. As the founder of EducationMasters.in, he is dedicated to helping students and job aspirants stay updated with the latest government exams, results, and career guidance.';

    if (raw.author) {
      if (typeof raw.author === 'object') {
        const rawName = raw.author.name?.trim() || '';
        const rawNice = raw.author.nicename?.trim() || '';

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
        }

        if (raw.author.bio && raw.author.bio.trim()) {
          authorBio = cleanHTML(raw.author.bio);
        } else {
          authorBio = `I am ${authorName}, a student and Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content. I specialize in writing about government jobs, entrance exams, admissions, results, and career guidance to help students make informed academic decisions.`;
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

    const pubDate = formatDate(raw.created_at || raw.createdAt || raw.exam_rdate || raw.result_date);

    // Dynamic Result / Admit Card Details Object
    const examNameVal = cleanHTML(raw.post || raw.title || 'Government Examination 2026');
    const deptNameVal = cleanHTML(raw.dept || (typeof raw.department === 'object' ? raw.department?.name : raw.department) || categoryName || 'Official Authority');
    const postNameVal = cleanHTML(raw.desig || raw.post || raw.title || 'Various Posts');
    const examDateVal = raw.exam_date ? formatDate(raw.exam_date) : (raw.dates?.exam_date ? formatDate(raw.dates.exam_date) : 'As per scheduled');
    const examTimeVal = cleanHTML(raw.exam_time || 'As per scheduled');
    const examModeVal = cleanHTML(raw.exam_mode || 'Offline (OMR Based)');
    const officialWebVal = formatExternalUrl(raw.site_url || raw.website || raw.official_website || (raw.links?.site_url) || (raw.links?.official_website));
    const downUrlVal = formatExternalUrl(raw.down_url || raw.result_url || raw.links?.down_url || raw.links?.result_url || raw.site_url);

    const descriptionHtml = cleanHTML(raw.description || raw.content || '');
    const instDownRaw = cleanHTML(raw.inst_down || raw.downloadInstructions || '');
    const instImplRaw = cleanHTML(raw.inst_impl || raw.importantInstructions || '');
    const faqRaw = cleanHTML(raw.faq_content || raw.faqs || '');

    const parsedInstDown = parseInstructionItems(instDownRaw);
    const parsedInstImpl = parseInstructionItems(instImplRaw);
    const parsedFaqItems = parseFaqs(faqRaw, examNameVal);

    const resultDetailsObj = (isResult || isAdmitCard) ? {
      examName: examNameVal,
      deptName: deptNameVal,
      postName: postNameVal,
      examDate: examDateVal,
      examTime: examTimeVal,
      examMode: examModeVal,
      officialWebsite: officialWebVal,
      downUrl: downUrlVal,
      resultStatus: cleanHTML(raw.result_status || 'Declared / Out'),
      description: descriptionHtml,
      instDown: instDownRaw,
      instDownItems: parsedInstDown,
      instImpl: instImplRaw,
      instImplItems: parsedInstImpl,
      faqContent: faqRaw,
      faqItems: parsedFaqItems
    } : null;

    // Standard Job Details Object
    const jobDetailsObj = isJob ? {
      postName: cleanHTML(raw.title),
      totalVacancies: cleanHTML(raw.posts || raw.total_posts || raw.vacancies || 'N/A'),
      jobLocation: cleanHTML(raw.job_location || raw.location || (typeof raw.state === 'object' ? raw.state?.name : raw.state) || 'All India'),
      qualification: cleanHTML(raw.qualification || 'As per notification'),
      releaseDate: formatDate(raw.released || raw.created_at || raw.createdAt),
      startDate: formatDate(raw.app_start || raw.dates?.start_date || raw.created_at),
      endDate: formatDate(raw.app_ends || raw.dates?.last_date),
      examDate: raw.exam_date ? formatDate(raw.exam_date) : 'N/A',
      minAge: raw.min_age ? `${raw.min_age} Years` : 'N/A',
      maxAge: raw.max_age ? `${raw.max_age} Years` : 'N/A',
      salary: cleanHTML(raw.salary || 'As per rules'),
      applicationFee: cleanHTML(raw.fees?.gen_fee ? `General/OBC: ₹${raw.fees.gen_fee} | SC/ST: Exempted` : (raw.fees || 'As per rules')),
      officialLink: formatExternalUrl(raw.noti_link || raw.links?.site_url || raw.site_url),
      applyLink: formatExternalUrl(raw.app_link || raw.links?.down_url || raw.down_url),
      admitCardLink: formatExternalUrl(raw.admitCardNotification?.down_url || raw.links?.admit_url),
      resultLink: formatExternalUrl(raw.resultNotification?.down_url || raw.links?.result_url)
    } : null;

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
      lastDate: isJob ? formatDate(raw.app_ends || raw.dates?.last_date) : (isResult ? 'Result Declared' : 'Download Available'),
      image: getImageUrl(raw.featured_media, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'),
      content: descriptionHtml,
      isJob,
      isResult,
      isAdmitCard,
      jobDetails: jobDetailsObj,
      resultDetails: resultDetailsObj,
      metadata: metadataObj
    };
  };

  const generateFallbackArticle = (articleSlug) => {
    const formattedTitle = cleanHTML(articleSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '));

    const isResult = pathname.startsWith('/result') || articleSlug.includes('result');

    if (isResult) {
      return {
        title: `${formattedTitle} Result 2026 - Check Merit List & Selection Status`,
        subtitle: '',
        author: {
          name: 'adityapanwarjaat',
          image: 'https://educationmasters.in/assets/img/defaults/user.png',
          bio: 'I am Aditya, a student and Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content. I specialize in writing about government jobs, entrance exams, admissions, results, and career guidance to help students make informed academic decisions.'
        },
        category: 'Result',
        categorySlug: 'results',
        date: 'Sep 21, 2026',
        lastDate: 'Result Declared',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
        isResult: true,
        resultDetails: {
          examName: formattedTitle,
          deptName: 'Examination Authority',
          postName: 'Manager, Specialist Officer & Various Posts',
          examDate: 'As per scheduled',
          examTime: 'As per scheduled',
          examMode: 'Offline (OMR Based)',
          officialWebsite: 'https://educationmasters.in',
          downUrl: 'https://educationmasters.in',
          resultStatus: 'Declared / Out',
          description: `<p>The <strong>${formattedTitle} Result 2026</strong> has been announced for candidates who appeared in the examination process. Candidates can check their qualifying status, score card, and merit list through the official portal.</p><p>The result will show the qualifying status of candidates and details about the next stage of selection. Depending on the post, candidates may be shortlisted through Online Examination, Group Discussion or Personal Interview.</p>`,
          instDownItems: [
            'Visit the official recruitment website.',
            'Open the Careers / Recruitment / Result section.',
            `Find "${formattedTitle} Result 2026".`,
            'Click on the result or shortlisted candidates link when released.',
            'Enter your Registration Number and Password/Date of Birth, if login is required.',
            'Submit the details.',
            'Check your result and qualifying status.',
            'Download and save the result PDF or scorecard for future reference.'
          ],
          instImplItems: [
            'Check your name, roll number and qualifying status carefully.',
            'Download a copy of the result for future use.',
            'Check the next selection stage mentioned in the result.',
            'Keep your original documents ready for Document Verification.',
            'Regularly check the official recruitment page for further updates.'
          ],
          faqItems: [
            { question: `When will ${formattedTitle} Result 2026 be released?`, answer: 'The result date has been announced on the official website. Candidates can check their status using the direct link provided above.' },
            { question: `How can I download ${formattedTitle} Result 2026?`, answer: 'Visit the official website, open the result section, enter your login credentials and download your scorecard PDF.' },
            { question: `What happens after the ${formattedTitle} Result 2026?`, answer: 'Qualified candidates will move to the next selection stage applicable to their post, such as Document Verification or Interview.' }
          ]
        }
      };
    }

    return {
      title: 'UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts',
      subtitle: '',
      author: {
        name: 'Mohit',
        image: 'https://educationmasters.in/assets/img/defaults/user.png',
        bio: 'I am mohit, a student and Content Writer at Education Masters, passionate about creating informative, SEO-friendly, and student-focused educational content. I specialize in writing about government jobs, entrance exams, admissions, results, and career guidance to help students make informed academic and career decisions.'
      },
      category: 'UPSC',
      categorySlug: 'jobs',
      date: 'Sep 13, 2026',
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80',
      isJob: true,
      jobDetails: {
        postName: 'UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts',
        totalVacancies: '212 Vacancies',
        qualification: 'Master Degree, MBBS, MD/MS, B.E/B.Tech or equivalent',
        ageLimit: '18 to 40 Years',
        salary: 'Pay Level 7 to Level 11 + Applicable Allowances',
        applicationFee: 'General/OBC: ₹25 | SC/ST/Female: Exempted',
        endDate: 'October 02, 2026',
        officialLink: 'https://upsc.gov.in',
        applyLink: 'https://upsconline.nic.in'
      },
      content: `<p>The <strong>UPSC Recruitment 2026 for 212 Specialist, Assistant Professor and More Posts</strong> has been announced by the Union Public Service Commission.</p>`
    };
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://educationmasters.in';

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
        .article-raw-html ol {
          list-style-type: decimal !important;
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
          font-weight: 700 !important;
          color: #0f172a !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        .article-raw-html p {
          margin-bottom: 0.85rem !important;
          line-height: 1.7 !important;
          color: #334155 !important;
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
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Sponsored Ad</span>
                </div>
                <div className="p-4 space-y-3 text-center">
                  <p className="text-xs font-semibold leading-snug text-slate-100">
                    Latest Government Exam & Career Updates 2026
                  </p>
                  <div className="w-full h-44 bg-gradient-to-b from-blue-950 to-slate-900 rounded flex items-center justify-center border border-blue-900/50 p-2">
                    <span className="text-[11px] text-blue-200 font-medium leading-tight">100% Verified Job Alerts & Preparation</span>
                  </div>
                  <a
                    href="https://educationmasters.in"
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-2 rounded transition"
                  >
                    Explore Updates
                  </a>
                </div>
              </div>
            </aside>
          )}

          {/* ================= CENTER MAIN ARTICLE CONTENT ================= */}
          <section className={`col-span-1 lg:col-span-8 ${showLeftAd ? 'xl:col-span-7' : 'xl:col-span-7'} space-y-4`}>

            {/* Top Breadcrumb Links */}
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
              <article className="space-y-5">



                {/* 2. Article Main Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {article.title}
                </h1>

                {/* 3. Byline Meta: Author, Category, Posted Date & Status */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-700 font-normal">
                  <span>
                    By <span className="font-bold text-slate-900">{typeof article.author === 'object' ? article.author.name : article.author}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    In{' '}
                    {isJobPage ? (
                      <Link href="/jobs" className="text-slate-900 font-bold underline decoration-slate-300 hover:text-blue-600 transition">
                        Jobs
                      </Link>
                    ) : isAdmitCardPage ? (
                      <Link href="/admit-cards" className="text-slate-900 font-bold underline decoration-slate-300 hover:text-blue-600 transition">
                        Admit Card
                      </Link>
                    ) : isResultPage ? (
                      <Link href="/results" className="text-slate-900 font-bold underline decoration-slate-300 hover:text-blue-600 transition">
                        Result
                      </Link>
                    ) : (
                      <Link href={article.categorySlug ? `/category/${article.categorySlug}` : '/category/articles'} className="text-slate-900 font-bold underline decoration-slate-300 hover:text-blue-600 transition">
                        {(typeof article.category === 'object' ? article.category.name : article.category) || 'Articles'}
                      </Link>
                    )}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Posted: <span className="font-bold text-slate-900">{article.date}</span>
                  </span>
                  {article.lastDate && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>
                        Status: <span className="font-bold text-slate-900">{article.lastDate}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* 4. Official Disclaimer Box */}
                <div className="p-3.5 bg-[#fef9ed] border border-[#f5dfb8] rounded text-xs text-[#8a5314] leading-relaxed">
                  <strong className="font-semibold">Disclaimer:</strong> The content shown on this page related to government jobs, admit cards and results is either sourced from various internet portals or directly from official government websites. We do not claim any affiliation or authority over this content. It is solely for information providing purposes.
                </div>

                {/* 5. Featured Banner Image (if available) */}
                {article.image && (
                  <div className="w-full my-2">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-auto max-h-[460px] object-cover rounded-md border border-slate-200"
                    />
                  </div>
                )}

                {/* 6. Professional Social Share Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-y border-slate-200/80 my-3 bg-slate-50/60 px-3 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1">Share:</span>

                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#25D366] hover:bg-[#1eb956] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.228-1.157z" /></svg>
                      <span>WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" /></svg>
                      <span>Telegram</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      <span>Facebook</span>
                    </a>

                    {/* Twitter / X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
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

                {/* ========================================================================= */}
                {/* 7. DEDICATED RESULT & ADMIT CARD VIEW - MATCHING PRODUCTION SCREENSHOTS */}
                {/* ========================================================================= */}
                {(article.isResult || article.isAdmitCard) && article.resultDetails ? (
                  <div className="space-y-6 pt-2">

                    {/* SECTION 1: ABOUT [EXAM NAME] RESULT */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                        About {article.resultDetails.examName} {article.isResult ? 'Result' : 'Admit Card'}
                      </h2>
                      {article.resultDetails.description ? (
                        <div
                          className="article-raw-html text-slate-700 text-base leading-relaxed space-y-3 font-normal"
                          dangerouslySetInnerHTML={{ __html: article.resultDetails.description }}
                        />
                      ) : (
                        <p className="text-slate-700 text-base leading-relaxed">
                          {article.resultDetails.deptName} will release the {article.resultDetails.examName} {article.isResult ? 'Result 2026' : 'Admit Card 2026'} for candidates who appeared in the examination process under {article.resultDetails.postName}.
                        </p>
                      )}
                    </div>

                    {/* SECTION 2: OVERVIEW TABLE */}
                    <div className="pt-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                        {article.resultDetails.examName} {article.isResult ? 'Result' : 'Admit Card'} – Overview
                      </h2>
                      <div className="overflow-x-auto border border-slate-200 rounded-md shadow-2xs">
                        <table className="w-full text-xs sm:text-sm text-left border-collapse">
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 w-1/3 sm:w-1/4 border-r border-slate-200">
                                Name of Exam
                              </th>
                              <td className="p-3.5 font-normal text-slate-900">
                                {article.resultDetails.examName}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Conducting Department
                              </th>
                              <td className="p-3.5 font-normal text-slate-900">
                                {article.resultDetails.deptName}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Post Name
                              </th>
                              <td className="p-3.5 font-normal text-slate-900 leading-snug">
                                {article.resultDetails.postName}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Exam Date
                              </th>
                              <td className="p-3.5 font-normal text-slate-900">
                                {article.resultDetails.examDate}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Exam Time
                              </th>
                              <td className="p-3.5 font-normal text-slate-900">
                                {article.resultDetails.examTime}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Exam Mode
                              </th>
                              <td className="p-3.5 font-normal text-slate-900">
                                {article.resultDetails.examMode}
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition">
                              <th className="p-3.5 bg-[#f0f3fa] font-semibold text-slate-800 border-r border-slate-200">
                                Official Website
                              </th>
                              <td className="p-3.5 font-medium text-blue-600">
                                {article.resultDetails.officialWebsite ? (
                                  <a
                                    href={article.resultDetails.officialWebsite}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline break-all"
                                  >
                                    {article.resultDetails.officialWebsite}
                                  </a>
                                ) : (
                                  <span className="text-slate-500 font-normal">Check Official Notification</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SECTION 3: DIRECT VIEW RESULT LINK CALLOUT BANNER */}
                    <div className="my-6 p-6 sm:p-8 bg-[#1d68e1] text-white rounded-lg text-center shadow-md space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                        {article.isResult ? 'Direct View Result Link' : 'Direct Download Admit Card Link'}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto font-normal">
                        Click the button below to visit the official website and {article.isResult ? 'view/download your result' : 'download your admit card'}
                      </p>
                      <div className="pt-2">
                        <a
                          href={article.resultDetails.downUrl || article.resultDetails.officialWebsite || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block bg-[#ffc107] hover:bg-[#ffb300] active:scale-95 text-slate-900 font-extrabold text-sm sm:text-base px-8 py-3 rounded-md shadow hover:shadow-md transition duration-200"
                        >
                          {article.isResult ? 'View Result' : 'Download Admit Card'}
                        </a>
                      </div>
                    </div>

                    {/* SECTION 4: HOW TO VIEW/DOWNLOAD RESULT */}
                    <div className="pt-2 space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                        How to {article.isResult ? 'View/Download' : 'Download'} {article.resultDetails.examName} {article.isResult ? 'Result' : 'Admit Card'}
                      </h2>

                      {/* Clean In-Content Ad Frame */}
                      <div className="my-4 p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/90 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded">
                            Official Exam Portal
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            Download Scorecard & Merit List PDF Online
                          </h4>
                          <p className="text-xs text-slate-600">
                            Keep your registration number and DOB ready for quick access.
                          </p>
                        </div>
                        <a
                          href={article.resultDetails.downUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded shadow-2xs transition"
                        >
                          Learn More →
                        </a>
                      </div>

                      {/* Steps List */}
                      {article.resultDetails.instDownItems && article.resultDetails.instDownItems.length > 0 ? (
                        <ol className="list-decimal pl-5 space-y-2.5 text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                          {article.resultDetails.instDownItems.map((step, idx) => (
                            <li key={idx} className="pl-1">
                              {step}
                            </li>
                          ))}
                        </ol>
                      ) : article.resultDetails.instDown ? (
                        <div
                          className="article-raw-html text-slate-700 text-sm sm:text-base leading-relaxed space-y-2 font-normal"
                          dangerouslySetInnerHTML={{ __html: article.resultDetails.instDown }}
                        />
                      ) : (
                        <ol className="list-decimal pl-5 space-y-2.5 text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                          <li className="pl-1">Visit the official {article.resultDetails.deptName} website.</li>
                          <li className="pl-1">Open the Careers / Recruitment / Result section.</li>
                          <li className="pl-1">Find &quot;{article.resultDetails.examName} Result 2026&quot;.</li>
                          <li className="pl-1">Click on the result or shortlisted candidates link when released.</li>
                          <li className="pl-1">Enter your Registration Number and Password/Date of Birth, if login is required.</li>
                          <li className="pl-1">Submit the details and view your result status.</li>
                          <li className="pl-1">Download and save the result PDF or scorecard for future reference.</li>
                        </ol>
                      )}
                    </div>

                    {/* SECTION 5: DETAILS MENTIONED */}
                    <div className="pt-2 space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                        Details Mentioned in {article.resultDetails.examName}
                      </h2>

                      {article.resultDetails.instImplItems && article.resultDetails.instImplItems.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-2.5 text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                          {article.resultDetails.instImplItems.map((point, idx) => (
                            <li key={idx} className="pl-1">
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : article.resultDetails.instImpl ? (
                        <div
                          className="article-raw-html text-slate-700 text-sm sm:text-base leading-relaxed space-y-2 font-normal"
                          dangerouslySetInnerHTML={{ __html: article.resultDetails.instImpl }}
                        />
                      ) : (
                        <ul className="list-disc pl-5 space-y-2.5 text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                          <li className="pl-1">Check your name, roll number, and qualifying status carefully.</li>
                          <li className="pl-1">Download a copy of the result for future reference.</li>
                          <li className="pl-1">Check the next selection stage mentioned in the result notification.</li>
                          <li className="pl-1">Keep your original documents ready for Document Verification (DV).</li>
                          <li className="pl-1">Regularly check the official recruitment page for further selection rounds.</li>
                        </ul>
                      )}
                    </div>

                    {/* SECTION 6: FAQS & DISCOVER MORE BOX */}
                    {article.resultDetails.faqItems && article.resultDetails.faqItems.length > 0 && (
                      <div className="pt-3 space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-100 pb-2">
                          Frequently Asked Questions (FAQs)
                        </h2>

                        <div className="space-y-4">
                          {article.resultDetails.faqItems.slice(0, 3).map((faq, idx) => (
                            <div key={idx} className="space-y-1">
                              <p className="font-bold text-slate-900 text-sm sm:text-base">
                                Q{idx + 1}. {faq.question}
                              </p>
                              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
                                Answer: {faq.answer}
                              </p>
                            </div>
                          ))}

                          {/* Discover More Box 1 matching screenshot */}
                          <div className="my-4 border border-[#d2def2] rounded-md overflow-hidden bg-[#f3f7fd]">
                            <div className="px-4 py-2.5 bg-[#e4edfa] border-b border-[#d2def2] font-bold text-slate-800 text-sm">
                              Discover more
                            </div>
                            <div className="divide-y divide-[#e0ebf8]">
                              <Link href="/jobs" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                                <span>Recruitment & Staffing</span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </Link>
                              <Link href="/jobs" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                                <span>Job</span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </Link>
                              <Link href="/category/articles" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                                <span>education</span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </Link>
                            </div>
                          </div>

                          {article.resultDetails.faqItems.slice(3).map((faq, idx) => (
                            <div key={idx + 3} className="space-y-1">
                              <p className="font-bold text-slate-900 text-sm sm:text-base">
                                Q{idx + 4}. {faq.question}
                              </p>
                              <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
                                Answer: {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* ========================================================================= */
                  /* 7. GENERAL / JOB ARTICLE VIEW */
                  /* ========================================================================= */
                  <div className="text-slate-700 text-base leading-relaxed space-y-4 font-normal">
                    {article.content ? (
                      <div
                        className="article-raw-html text-slate-700 text-base leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    ) : null}

                    {/* Job Highlights Table for Job Articles */}
                    {article.isJob && article.jobDetails && !article.content?.includes('<table') && (
                      <div className="my-6 space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
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
                                <td className="p-3 font-normal text-slate-900">{article.jobDetails.jobLocation}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Notification Release Date</th>
                                <td className="p-3 font-normal text-slate-900">{article.jobDetails.releaseDate || article.date}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Online Application Start Date</th>
                                <td className="p-3 font-normal text-slate-900">{article.jobDetails.startDate || article.date}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Last Date to Apply</th>
                                <td className="p-3 font-normal text-slate-900">{article.jobDetails.endDate || 'Check Notification'}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Prelims Exam Date</th>
                                <td className="p-3 font-normal text-slate-500">{article.jobDetails.examDate}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Minimum age limit</th>
                                <td className="p-3 font-normal text-slate-500">{article.jobDetails.minAge}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Maximum age limit</th>
                                <td className="p-3 font-normal text-slate-500">{article.jobDetails.maxAge}</td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Notification Release Link</th>
                                <td className="p-3 font-medium text-blue-600">
                                  {article.jobDetails.officialLink ? (
                                    <a href={article.jobDetails.officialLink} target="_blank" rel="noreferrer" className="hover:underline">Click here</a>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50">
                                <th className="p-3 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">Direct Online Application Link</th>
                                <td className="p-3 font-medium text-blue-600">
                                  {article.jobDetails.applyLink ? (
                                    <a href={article.jobDetails.applyLink} target="_blank" rel="noreferrer" className="hover:underline">Apply now</a>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. Government Jobs & GK Updates Channel Follow Section */}
                <div className="my-6 space-y-4 font-normal pt-2">
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

                {/* 9. AddressGuru / Free Classified Banner Ad Space */}
                <div className="my-6 w-full bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-md p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-purple-900/40">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded">FREE</span>
                      <span className="font-bold text-sm sm:text-base tracking-wide text-white">www.addressguru.in</span>
                    </div>
                    <p className="text-xs text-purple-200">
                      FREE CLASSIFIED INDIA • POST FREE AD • LOCAL DIRECTORY
                    </p>
                  </div>
                  <a
                    href="https://addressguru.in"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded shadow transition"
                  >
                    POST FREE AD →
                  </a>
                </div>

                {/* 10. Share this Post Box with Circular Buttons & Discover More */}
                <div className="my-6 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Share this Post</h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">(इस पोस्ट को अपने दोस्तों के साथ शेयर करना ना भूले)</p>
                  </div>

                  {/* Circular Social Share Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-[#25D366] hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.228-1.157z" /></svg>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-[#0088cc] hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="Telegram"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" /></svg>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-[#1877F2] hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="Facebook"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-[#0077b5] hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="LinkedIn"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.262-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                    </a>

                    {/* Twitter */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-slate-900 hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="Twitter / X"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>

                    {/* Reddit */}
                    <a
                      href={`https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-9 h-9 rounded-full bg-[#FF4500] hover:opacity-90 text-white flex items-center justify-center shadow-xs transition transform hover:-translate-y-0.5"
                      title="Reddit"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                    </a>
                  </div>

                  {/* Discover More Box 2 */}
                  <div className="my-4 border border-[#d2def2] rounded-md overflow-hidden bg-[#f3f7fd]">
                    <div className="px-4 py-2.5 bg-[#e4edfa] border-b border-[#d2def2] font-bold text-slate-800 text-sm">
                      Discover more
                    </div>
                    <div className="divide-y divide-[#e0ebf8]">
                      <Link href="/category/articles" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                        <span>education</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                      <Link href="/category/articles" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                        <span>Educational Resources</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                      <Link href="/jobs" className="flex items-center justify-between px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-[#ebf2fc] text-sm font-medium transition">
                        <span>job</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 11. Others Category Jobs Grid */}
                <div className="my-8 pt-4 border-t border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Others Category Jobs
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {relatedJobs.map((job, idx) => (
                      <Link
                        key={job.id || idx}
                        href={`/job/${job.slug}`}
                        className="group bg-white border border-slate-200 rounded-md overflow-hidden hover:shadow-md transition duration-200 flex flex-col"
                      >
                        <div className="w-full h-28 sm:h-32 bg-slate-100 overflow-hidden relative">
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
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug">
                            {job.title}
                          </h4>
                          <span className="text-[11px] text-blue-600 font-semibold pt-1">
                            Apply Now →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 12. Professional Author Box Matching Live Reference Image */}
                {article.author && !article.content?.includes('class="author') && (
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

                      {/* Social Links Row */}
                      <div className="flex items-center space-x-2.5 pt-1 text-slate-400">
                        <a href="#" className="hover:text-blue-600 transition" title="Website"><Globe className="w-3.5 h-3.5" /></a>
                        <a href="#" className="hover:text-blue-600 transition" title="Facebook"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                        <a href="#" className="hover:text-sky-500 transition" title="Twitter"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
                        <a href="#" className="hover:text-blue-700 transition" title="LinkedIn"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.262-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg></a>
                      </div>
                    </div>
                  </div>
                )}

              </article>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p>Content unavailable or could not be loaded.</p>
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
                  href="https://whatsapp.com/channel/0029Vb6sjZz0wajwDXcd5B0U"
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
