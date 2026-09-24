/**
 * Taxonomy Registry for MCQ Pages: Subjects, States, and Exams
 * Provides SEO metadata, category types, and slug mappings.
 */

export const SUBJECTS_LIST = [
  { name: 'English', slug: 'english', category: 'subject' },
  { name: 'Hindi', slug: 'hindi', category: 'subject' },
  { name: 'General Knowledge', slug: 'general-knowledge', category: 'subject' },
  { name: 'Mathematics', slug: 'mathematics', category: 'subject' },
  { name: 'History', slug: 'history', category: 'subject' },
  { name: 'Geography', slug: 'geography', category: 'subject' },
  { name: 'Science', slug: 'science', category: 'subject' },
  { name: 'Reasoning', slug: 'reasoning', category: 'subject' },
  { name: 'Economics', slug: 'economics', category: 'subject' },
  { name: 'Accounts', slug: 'accounts', category: 'subject' },
  { name: 'Business', slug: 'business', category: 'subject' },
  { name: 'Computer', slug: 'computer', category: 'subject' },
  { name: 'Government Scheme', slug: 'government-scheme', category: 'subject' },
  { name: 'Statewise first CM List', slug: 'statewise-first-cm-list', category: 'subject' },
  { name: 'Biology', slug: 'biology', category: 'subject' },
  { name: 'Invention', slug: 'invention', category: 'subject' },
  { name: 'Environment Science', slug: 'environment-science', category: 'subject' },
  { name: 'Polity', slug: 'polity', category: 'subject' },
  { name: 'Sports GK', slug: 'sports-gk', category: 'subject' },
  { name: 'JavaScript', slug: 'javascript', category: 'subject' },
  { name: 'C And C++', slug: 'c-and-c-plus-plus', category: 'subject' },
  { name: 'HTML and CSS', slug: 'html-and-css', category: 'subject' },
  { name: 'Python', slug: 'python', category: 'subject' },
  { name: 'PHP', slug: 'php', category: 'subject' },
  { name: 'MySQL', slug: 'mysql', category: 'subject' },
  { name: 'CTET', slug: 'ctet', category: 'subject' },
  { name: 'UTET', slug: 'utet', category: 'subject' },
  { name: 'Uttarakhand Fair', slug: 'uttarakhand-fair', category: 'subject' },
];

export const STATES_LIST = [
  { name: 'Andaman Nicobar', slug: 'andaman-nicobar', category: 'state' },
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh', category: 'state' },
  { name: 'Arunchal Pradesh', slug: 'arunchal-pradesh', category: 'state' },
  { name: 'Assam', slug: 'assam', category: 'state' },
  { name: 'Bihar', slug: 'bihar', category: 'state' },
  { name: 'Chandigarh', slug: 'chandigarh', category: 'state' },
  { name: 'Chhatisgarh', slug: 'chhatisgarh', category: 'state' },
  { name: 'Delhi', slug: 'delhi', category: 'state' },
  { name: 'Goa', slug: 'goa', category: 'state' },
  { name: 'Gujarat', slug: 'gujarat', category: 'state' },
  { name: 'Haryana', slug: 'haryana', category: 'state' },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh', category: 'state' },
  { name: 'Jammu & Kashmir', slug: 'jammu-kashmir', category: 'state' },
  { name: 'Jharkhand', slug: 'jharkhand', category: 'state' },
  { name: 'Karnataka', slug: 'karnataka', category: 'state' },
  { name: 'Kerala', slug: 'kerala', category: 'state' },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh', category: 'state' },
  { name: 'Maharashtra', slug: 'maharashtra', category: 'state' },
  { name: 'Manipur', slug: 'manipur', category: 'state' },
  { name: 'Meghalaya', slug: 'meghalaya', category: 'state' },
  { name: 'Mizoram', slug: 'mizoram', category: 'state' },
  { name: 'Nagaland', slug: 'nagaland', category: 'state' },
  { name: 'Odisha', slug: 'odisha', category: 'state' },
  { name: 'Punjab', slug: 'punjab', category: 'state' },
  { name: 'Rajasthan', slug: 'rajasthan', category: 'state' },
  { name: 'Sikkim', slug: 'sikkim', category: 'state' },
  { name: 'Tamil Nadu', slug: 'tamil-nadu', category: 'state' },
  { name: 'Telangana', slug: 'telangana', category: 'state' },
  { name: 'Tripura', slug: 'tripura', category: 'state' },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh', category: 'state' },
  { name: 'Uttarakhand', slug: 'uttarakhand', category: 'state' },
  { name: 'West Bengal', slug: 'west-bengal', category: 'state' },
];

export const EXAMS_LIST = [
  { name: 'Group C', slug: 'group-c', category: 'exam', fullExamName: 'UKSSSC / UPSSSC Group C Exam' },
  { name: 'IAS', slug: 'ias', category: 'exam', fullExamName: 'UPSC IAS Civil Services Prelims' },
  { name: 'PCS', slug: 'pcs', category: 'exam', fullExamName: 'State PCS / State Public Service Commission' },
  { name: 'Lower PCS', slug: 'lower-pcs', category: 'exam', fullExamName: 'State Lower Subordinate Services (Lower PCS)' },
  { name: 'Railway', slug: 'railway', category: 'exam', fullExamName: 'Railway RRB NTPC, Group D & ALP' },
  { name: 'SSC', slug: 'ssc', category: 'exam', fullExamName: 'SSC CGL, CHSL, MTS, GD & CPO' },
  { name: 'Bank PO', slug: 'bank-po', category: 'exam', fullExamName: 'Bank PO, Clerk, SBI & IBPS Exam' },
  { name: 'Police', slug: 'police', category: 'exam', fullExamName: 'State Police Constable, SI & Bharti' },
  { name: 'UKPSC', slug: 'ukpsc', category: 'exam', fullExamName: 'Uttarakhand Public Service Commission (UKPSC)' },
  { name: 'CTET', slug: 'ctet', category: 'exam', fullExamName: 'Central Teacher Eligibility Test (CTET Paper 1 & 2)' },
  { name: 'UTET', slug: 'utet', category: 'exam', fullExamName: 'Uttarakhand Teacher Eligibility Test (UTET Paper 1 & 2)' },
  { name: 'B. Ed', slug: 'b-ed', category: 'exam', fullExamName: 'B.Ed Entrance Exam & Teaching Aptitude' },
  { name: 'CAT', slug: 'cat', category: 'exam', fullExamName: 'Common Admission Test (CAT) MBA Entrance' },
  { name: 'CUET', slug: 'cuet', category: 'exam', fullExamName: 'Common University Entrance Test (CUET UG / PG)' },
];

/**
 * Identify taxonomy info and SEO metadata based on slug
 */
export function getTaxonomyInfo(slug) {
  if (!slug) {
    return {
      type: 'subject',
      slug: 'general-knowledge',
      name: 'General Knowledge',
      breadcrumbCategory: 'Subjects',
      breadcrumbCatLink: '/mcq-questions',
      title: 'General Knowledge MCQ Questions with Answers - Education Masters',
      description: 'Practice General Knowledge MCQ questions with answers in English & Hindi for competitive exams like SSC, UPSC, State PCS, Railway, Bank, and Teaching exams.',
      subtitle: 'Practice General Knowledge Multiple Choice Questions with Verified Answers & Detailed Explanations',
      tag: 'Knowledge Hub',
      queryParamKey: 'subject',
    };
  }

  const cleanSlug = slug.toLowerCase().trim();

  // Check Exams
  const foundExam = EXAMS_LIST.find((e) => e.slug === cleanSlug);
  if (foundExam) {
    return {
      type: 'exam',
      slug: foundExam.slug,
      name: `${foundExam.name} MCQ`,
      rawName: foundExam.name,
      breadcrumbCategory: 'Exams',
      breadcrumbCatLink: '/syllabus',
      title: `${foundExam.name} MCQ Questions with Answers | ${foundExam.fullExamName}`,
      description: `Practice ${foundExam.name} MCQ questions with answers and step-by-step explanations in English & Hindi. Solved previous year objective questions for ${foundExam.fullExamName}.`,
      subtitle: `Practice ${foundExam.fullExamName} Multiple Choice Questions with Verified Answers & Detailed Explanations`,
      tag: 'Exam Prep',
      queryParamKey: 'exam',
    };
  }

  // Check States
  const foundState = STATES_LIST.find((s) => s.slug === cleanSlug);
  if (foundState) {
    return {
      type: 'state',
      slug: foundState.slug,
      urlPath: `/state/${foundState.slug}/mcq-questions`,
      name: `${foundState.name} GK`,
      rawName: foundState.name,
      breadcrumbCategory: 'State GK',
      breadcrumbCatLink: '/mcq-questions',
      title: `${foundState.name} GK Questions with Answers | State MCQ Quiz`,
      description: `Practice ${foundState.name} GK MCQ questions with answers in English & Hindi for State Govt Exams, PSC, Police Bharti, and Competitive Tests.`,
      subtitle: `Practice ${foundState.name} General Knowledge Multiple Choice Questions with Answers & Explanations`,
      tag: 'State Preparation',
      queryParamKey: 'state',
    };
  }

  // Check Subjects
  const foundSub = SUBJECTS_LIST.find((s) => s.slug === cleanSlug);
  if (foundSub) {
    return {
      type: 'subject',
      slug: foundSub.slug,
      name: foundSub.name,
      rawName: foundSub.name,
      breadcrumbCategory: 'Subjects',
      breadcrumbCatLink: '/mcq-questions',
      title: `${foundSub.name} MCQ Questions with Answers - Education Masters`,
      description: `Practice ${foundSub.name} MCQ questions with answers and detailed explanations in English & Hindi for competitive exams like SSC, UPSC, State PCS, Railway, Bank, and Teaching exams.`,
      subtitle: `Practice ${foundSub.name} Multiple Choice Questions with Answers & Explanations`,
      tag: 'Subject Prep',
      queryParamKey: 'subject',
    };
  }

  // Fallback Formatted
  const formatted = cleanSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    type: 'subject',
    slug: cleanSlug,
    name: formatted,
    rawName: formatted,
    breadcrumbCategory: 'Subjects',
    breadcrumbCatLink: '/mcq-questions',
    title: `${formatted} MCQ Questions with Answers - Education Masters`,
    description: `Practice ${formatted} MCQ questions with answers in English & Hindi for competitive exams.`,
    subtitle: `Practice ${formatted} Multiple Choice Questions with Answers & Explanations`,
    tag: 'Educational Resources',
    queryParamKey: 'subject',
  };
}
