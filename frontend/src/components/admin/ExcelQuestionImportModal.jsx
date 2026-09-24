'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Landmark,
  BookOpen,
  GraduationCap,
  Sliders,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getAuthToken } from '@/utils/auth';

export default function ExcelQuestionImportModal({ isOpen, onClose, onSuccess }) {
  const { data: session } = useSession();
  // File & parsing state
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  // Guide accordion state
  const [showGuide, setShowGuide] = useState(false);

  // Dropdown list data
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [examsList, setExamsList] = useState([]);

  // Batch Defaults (Optional selection applied to imported questions)
  const [batchState, setBatchState] = useState('');
  const [batchDistrict, setBatchDistrict] = useState('');
  const [batchCity, setBatchCity] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [batchTopic, setBatchTopic] = useState('');
  const [batchExaminations, setBatchExaminations] = useState([]);
  const [batchLanguage, setBatchLanguage] = useState('Hindi');
  const [batchLevel, setBatchLevel] = useState('Medium');
  const [batchStatus, setBatchStatus] = useState('Published');
  const [batchMarks, setBatchMarks] = useState(1);
  const [batchNegative, setBatchNegative] = useState(0);

  // Search filter for examinations checklist
  const [examSearch, setExamSearch] = useState('');

  // Fetch dropdown data on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      try {
        const [stRes, subRes, exRes, topRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/states?all=true`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/subjects?limit=200`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/exams?limit=200`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/topics?limit=300`),
        ]);

        const [stData, subData, exData, topData] = await Promise.all([
          stRes.json(),
          subRes.json(),
          exRes.json(),
          topRes.json(),
        ]);

        if (stData.success) setStatesList(stData.data || []);
        if (subData.success) setSubjectsList(subData.data || []);
        if (exData.success) setExamsList(exData.data || []);
        if (topData.success) setTopicsList(topData.data || []);
      } catch (err) {
        console.error('Error fetching modal options:', err);
      }
    };

    fetchInitialData();
  }, [isOpen]);

  // Dynamic fetch districts when batchState changes
  useEffect(() => {
    if (!batchState) {
      setDistrictsList([]);
      setBatchDistrict('');
      return;
    }

    const fetchDistricts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/states/districts?stateId=${batchState}`
        );
        const data = await res.json();
        if (data.success) {
          setDistrictsList(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };

    fetchDistricts();
  }, [batchState]);

  // Filtered topics based on batchSubject
  const filteredTopics = useMemo(() => {
    if (!batchSubject) return topicsList;
    return topicsList.filter((t) => {
      const sId = t.subject?._id ? String(t.subject._id) : String(t.subject || '');
      return sId === String(batchSubject);
    });
  }, [topicsList, batchSubject]);

  // Filtered exams for checklist
  const filteredExams = useMemo(() => {
    if (!examSearch.trim()) return examsList;
    const q = examSearch.toLowerCase();
    return examsList.filter(
      (e) => e.name?.toLowerCase().includes(q) || e.slug?.toLowerCase().includes(q)
    );
  }, [examsList, examSearch]);

  // Toggle examination selection
  const toggleExamSelection = (examId) => {
    setBatchExaminations((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    );
  };

  const selectAllExams = () => {
    setBatchExaminations(examsList.map((e) => e._id));
  };

  const clearAllExams = () => {
    setBatchExaminations([]);
  };

  // Selected names helpers
  const selectedStateObj = statesList.find((s) => String(s._id) === String(batchState));
  const selectedDistrictObj = districtsList.find((d) => String(d._id) === String(batchDistrict));
  const selectedSubjectObj = subjectsList.find((s) => String(s._id) === String(batchSubject));
  const selectedTopicObj = topicsList.find((t) => String(t._id) === String(batchTopic));
  const selectedExamNames = examsList
    .filter((e) => batchExaminations.includes(e._id))
    .map((e) => e.name);

  // Download comprehensive Excel template with full guides & sample rows
  const handleDownloadTemplate = () => {
    const headers = [
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Option E',
      'Option F',
      'Correct Answer',
      'Subject',
      'Topic',
      'State',
      'District',
      'City',
      'Exam',
      'Language',
      'Difficulty',
      'Explanation',
      'Marks',
      'Negative Marks',
      'Status',
    ];

    const sampleRows = [
      [
        'Who was the first President of Independent India?',
        'Dr. Rajendra Prasad',
        'Dr. S. Radhakrishnan',
        'Jawaharlal Nehru',
        'Mahatma Gandhi',
        '',
        '',
        'A',
        'History',
        'Modern India',
        'Bihar',
        'Patna',
        'Patna',
        'UPSC Civil Services, SSC CGL',
        'English',
        'Easy',
        'Dr. Rajendra Prasad served as the first President of India from 1950 to 1962.',
        '1',
        '0.25',
        'Published',
      ],
      [
        'भारत की सिलिकॉन वैली (Silicon Valley) किसे कहा जाता है?',
        'मुंबई',
        'बेंगलुरु',
        'हैदराबाद',
        'चेन्नई',
        '',
        '',
        'B',
        'Geography',
        'Indian Industries',
        'Karnataka',
        'Bengaluru Urban',
        'Bengaluru',
        'SSC CGL, Police',
        'Hindi',
        'Medium',
        'बेंगलुरु भारत का प्रमुख आईटी और सॉफ्टवेयर हब होने के कारण सिलिकॉन वैली कहलाता है।',
        '1',
        '0.33',
        'Published',
      ],
      [
        'उत्तराखंड राज्य का गठन किस वर्ष हुआ था?',
        '9 नवंबर 2000',
        '1 नवंबर 2000',
        '15 नवंबर 2000',
        '26 जनवरी 2001',
        '',
        '',
        'A',
        'Uttarakhand GK',
        'State Formation',
        'Uttarakhand',
        'Dehradun',
        'Dehradun',
        'UKPSC, Police',
        'Hindi',
        'Easy',
        'उत्तराखंड (पूर्व नाम उत्तरांचल) 9 नवंबर 2000 को भारत के 27वें राज्य के रूप में गठित हुआ था।',
        '1',
        '0.25',
        'Published',
      ],
      [
        'Which Article of Indian Constitution deals with the Right to Constitutional Remedies?',
        'Article 14',
        'Article 19',
        'Article 21',
        'Article 32',
        'Article 226',
        '',
        'D',
        'Polity',
        'Fundamental Rights',
        '',
        '',
        '',
        'UPSC Civil Services, UKPSC',
        'English',
        'Medium',
        'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul of the Constitution".',
        '2',
        '0.5',
        'Published',
      ],
      [
        'हिमाचल प्रदेश की शीतकालीन राजधानी कौन सी है?',
        'शिमला',
        'धर्मशाला',
        'मंडी',
        'कुल्लू',
        '',
        '',
        'B',
        'General Knowledge',
        'Capitals',
        'Himachal Pradesh',
        'Kangra',
        'Dharamshala',
        'Police',
        'Hindi',
        'Easy',
        'धर्मशाला हिमाचल प्रदेश की दूसरी (शीतकालीन) राजधानी है।',
        '1',
        '0',
        'Published',
      ],
      [
        'Example of minimal question (Omitted fields will automatically inherit Batch Defaults selected in the import modal):',
        'First Option Text',
        'Second Option Text',
        'Third Option Text',
        'Fourth Option Text',
        '',
        '',
        'C',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Missing metadata columns in Excel will inherit your selected Batch Defaults!',
        '',
        '',
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Set column widths
    ws['!cols'] = [
      { wch: 45 }, // Question
      { wch: 25 }, // Option A
      { wch: 25 }, // Option B
      { wch: 25 }, // Option C
      { wch: 25 }, // Option D
      { wch: 20 }, // Option E
      { wch: 20 }, // Option F
      { wch: 15 }, // Correct Answer
      { wch: 20 }, // Subject
      { wch: 20 }, // Topic
      { wch: 20 }, // State
      { wch: 20 }, // District
      { wch: 18 }, // City
      { wch: 26 }, // Exam
      { wch: 14 }, // Language
      { wch: 14 }, // Difficulty
      { wch: 45 }, // Explanation
      { wch: 10 }, // Marks
      { wch: 15 }, // Negative Marks
      { wch: 12 }, // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'EducationMasters_MCQ_Import_Template.xlsx');
  };

  // Parse dropped or selected file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setIsParsing(true);
    setStatusMessage(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'The selected Excel spreadsheet is empty or has no readable rows.',
          });
          setParsedRows([]);
        } else {
          // Normalize column headers
          const normalized = data.map((row) => ({
            content: String(
              row.Question ||
                row.question ||
                row['Question Text'] ||
                row['question text'] ||
                row.Content ||
                row.content ||
                ''
            ).trim(),
            option_a: String(
              row['Option A'] ||
                row['Option 1'] ||
                row.option_a ||
                row.option1 ||
                row.OptionA ||
                row.Option1 ||
                row.A ||
                ''
            ).trim(),
            option_b: String(
              row['Option B'] ||
                row['Option 2'] ||
                row.option_b ||
                row.option2 ||
                row.OptionB ||
                row.Option2 ||
                row.B ||
                ''
            ).trim(),
            option_c: String(
              row['Option C'] ||
                row['Option 3'] ||
                row.option_c ||
                row.option3 ||
                row.OptionC ||
                row.Option3 ||
                row.C ||
                ''
            ).trim(),
            option_d: String(
              row['Option D'] ||
                row['Option 4'] ||
                row.option_d ||
                row.option4 ||
                row.OptionD ||
                row.Option4 ||
                row.D ||
                ''
            ).trim(),
            option_e: String(
              row['Option E'] ||
                row['Option 5'] ||
                row.option_e ||
                row.option5 ||
                row.OptionE ||
                row.Option5 ||
                row.E ||
                ''
            ).trim(),
            option_f: String(
              row['Option F'] ||
                row['Option 6'] ||
                row.option_f ||
                row.option6 ||
                row.OptionF ||
                row.Option6 ||
                row.F ||
                ''
            ).trim(),
            correct_answer: String(
              row['Correct Answer'] ||
                row['correct answer'] ||
                row.CorrectAnswer ||
                row.Answer ||
                row.answer ||
                row.correct_answer ||
                'A'
            ).trim(),
            subject: String(row.Subject || row.subject || '').trim(),
            topic: String(row.Topic || row.topic || '').trim(),
            state: String(row.State || row.state || '').trim(),
            district: String(row.District || row.district || '').trim(),
            city: String(row.City || row.city || row.Location || row.location || '').trim(),
            exam: String(
              row.Exam ||
                row.exam ||
                row.Examination ||
                row.examination ||
                row.Examinations ||
                row.examinations ||
                ''
            ).trim(),
            language: String(row.Language || row.language || '').trim(),
            level: String(
              row.Difficulty ||
                row.difficulty ||
                row.Level ||
                row.level ||
                ''
            ).trim(),
            ans_info: String(
              row.Explanation ||
                row.explanation ||
                row.ans_info ||
                row.Solution ||
                row.solution ||
                ''
            ).trim(),
            marks: row.Marks || row.marks || '',
            negative: row['Negative Marks'] || row.negative || '',
            status: String(row.Status || row.status || '').trim(),
          }));

          setParsedRows(normalized);
          setStatusMessage({
            type: 'success',
            text: `Successfully parsed ${normalized.length} questions from ${selectedFile.name}. Review below and click Import.`,
          });
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        setStatusMessage({
          type: 'error',
          text: 'Error reading file format. Please ensure it is a valid .xlsx, .xls, or .csv file.',
        });
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      setStatusMessage({ type: 'error', text: 'Failed to read file from disk.' });
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Upload parsed questions to backend along with batchDefaults
  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);

      const token = getAuthToken(session);

      // Bundle batch defaults
      const batchDefaults = {
        state: batchState,
        state_name: selectedStateObj ? selectedStateObj.name : '',
        district: batchDistrict,
        district_name: selectedDistrictObj ? selectedDistrictObj.name : '',
        city: batchCity.trim(),
        subject: batchSubject,
        subject_name: selectedSubjectObj ? selectedSubjectObj.name : '',
        topic: batchTopic,
        topic_name: selectedTopicObj ? selectedTopicObj.name : '',
        examinations: batchExaminations,
        examination_names: selectedExamNames,
        language: batchLanguage,
        level: batchLevel,
        status: batchStatus,
        marks: Number(batchMarks) || 1,
        negative: Number(batchNegative) || 0,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/import-excel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            questions: parsedRows,
            batchDefaults,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setImportSummary(data);
        setStatusMessage({
          type: 'success',
          text: data.message || `Successfully imported ${data.imported} questions!`,
        });
        if (onSuccess) onSuccess();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Error occurred during questions bulk import.',
        });
      }
    } catch (err) {
      console.error('Import request error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Network error communicating with server.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setParsedRows([]);
    setStatusMessage(null);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Bulk Import Questions from Excel
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Fast MCQ Importer
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload spreadsheets to import hundreds of MCQs with customizable batch defaults.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Download pre-formatted Excel spreadsheet template with examples"
            >
              <Download size={13} />
              <span>Download Excel Template</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
          {/* Notification Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Section 1: Excel Format & Column Requirements Guide */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Info size={15} className="text-[#2271b1]" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Excel Column Requirements & Format Guide
                </span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full border border-rose-200">
                  4 Required
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                  13 Optional
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>{showGuide ? 'Hide Column Guide' : 'View What Fields Are Required & Optional'}</span>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {/* Quick summary strip always visible */}
            <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-100">
              <div className="p-2.5 bg-rose-50/50 border border-rose-200/80 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  REQUIRED COLUMNS (Must be present in spreadsheet)
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 bg-white border border-rose-300 font-bold text-slate-800 rounded">
                    Question
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-rose-300 font-bold text-slate-800 rounded">
                    Option A
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-rose-300 font-bold text-slate-800 rounded">
                    Option B
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-rose-300 font-bold text-slate-800 rounded">
                    Correct Answer (A/B/C/D or 1/2/3/4)
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/50 border border-blue-200/80 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  OPTIONAL COLUMNS (Inherits Batch Defaults below if omitted)
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-700">
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Option C - F</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Subject</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Topic</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">State</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">District</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">City</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Exam</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Language</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Difficulty</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Explanation</span>
                  <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">Marks</span>
                </div>
              </div>
            </div>

            {/* Detailed Table when expanded */}
            {showGuide && (
              <div className="p-4 bg-slate-50 space-y-3 border-t border-slate-200 animate-in fade-in duration-150">
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                        <th className="p-2.5">Column Header</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Accepted Values / Format</th>
                        <th className="p-2.5">Batch Default Fallback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Question</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Required</span></td>
                        <td className="p-2.5 text-slate-600">The MCQ question content / stem text in English or Hindi.</td>
                        <td className="p-2.5 text-slate-400 italic">Row skipped if missing</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Option A & Option B</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Required</span></td>
                        <td className="p-2.5 text-slate-600">First 2 choices (every MCQ requires at least 2 choices).</td>
                        <td className="p-2.5 text-slate-400 italic">Row skipped if &lt; 2 options</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Correct Answer</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Required</span></td>
                        <td className="p-2.5 text-slate-600"><code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">A, B, C, D, E, F</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">1, 2, 3, 4, 5, 6</code> or matching option text.</td>
                        <td className="p-2.5 text-slate-500">Defaults to Option A (1)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Option C, D, E, F</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Additional options. Up to 6 options supported per question.</td>
                        <td className="p-2.5 text-slate-400 italic">Omitted if blank</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Subject</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Subject name (e.g. History, Polity, General Knowledge, Uttarakhand GK).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Selected Batch Subject</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Topic</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Topic name (e.g. Modern India, Rivers, Vedic Age, Articles).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Selected Batch Topic</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">State & District</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">State name (e.g. Uttarakhand, Himachal Pradesh) and District name (e.g. Dehradun, Shimla).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Selected State & District</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">City / Location Tag</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">City or sub-location (e.g. Dharamshala, Rishikesh).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Batch City Tag</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Exam / Examinations</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Target exam name(s). Supports multiple comma-separated exams (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">UKPSC, Police, SSC CGL</code>).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Selected Batch Examinations</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Language</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600"><code className="bg-slate-100 px-1 py-0.5 rounded">Hindi</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">English</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Sanskrit</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Bilingual</code>.</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Batch Language (Default: Hindi)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Difficulty</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600"><code className="bg-slate-100 px-1 py-0.5 rounded">Easy</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Medium</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded">Hard</code>.</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Batch Difficulty (Default: Medium)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Explanation / Solution</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Detailed answer explanation or hint shown after submission.</td>
                        <td className="p-2.5 text-slate-400 italic">Empty if not provided</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">Marks & Negative Marks</td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Optional</span></td>
                        <td className="p-2.5 text-slate-600">Positive marks (e.g. 1, 2) and negative penalty marks (e.g. 0.25, 0.33).</td>
                        <td className="p-2.5 text-emerald-700 font-medium">Batch Marks & Negative</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Optional Batch Defaults Selection (Matching UI screenshot) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-[#2271b1]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Apply Batch Defaults (Optional)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Auto-assigned to any spreadsheet row where these fields are left empty
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: State & Location + Subject & Topic (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                {/* State & Location Box */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <Landmark size={14} className="text-[#2271b1]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      State & Location
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select State
                      </label>
                      <select
                        value={batchState}
                        onChange={(e) => setBatchState(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                      >
                        <option value="">National / All India (None)</option>
                        {statesList.map((st) => (
                          <option key={st._id} value={st._id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {batchState && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Select District
                        </label>
                        <select
                          value={batchDistrict}
                          onChange={(e) => setBatchDistrict(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                        >
                          <option value="">All Districts in State</option>
                          {districtsList.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        City / Location Tag
                      </label>
                      <input
                        type="text"
                        value={batchCity}
                        onChange={(e) => setBatchCity(e.target.value)}
                        placeholder="e.g. Dharamshala, Dehradun"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject & Topic Box */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <BookOpen size={14} className="text-[#2271b1]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Subject & Topic Defaults
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Subject
                      </label>
                      <select
                        value={batchSubject}
                        onChange={(e) => {
                          setBatchSubject(e.target.value);
                          setBatchTopic('');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                      >
                        <option value="">None (Use Excel per row)</option>
                        {subjectsList.map((sub) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Topic
                      </label>
                      <select
                        value={batchTopic}
                        onChange={(e) => setBatchTopic(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                      >
                        <option value="">None (Use Excel per row)</option>
                        {filteredTopics.map((top) => (
                          <option key={top._id} value={top._id}>
                            {top.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Examinations Checklist & MCQ Defaults (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                {/* Select Examinations Widget Box (Matching Screenshot) */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#2271b1]" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Select Examinations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                        {batchExaminations.length} selected
                      </span>
                      {batchExaminations.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllExams}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exam search input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      placeholder="Search exams..."
                      className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:border-[#2271b1] outline-hidden text-slate-800"
                    />
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {/* Scrollable Checkbox List */}
                  <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-lg p-2 space-y-1 bg-white">
                    {filteredExams.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        No examinations found
                      </p>
                    ) : (
                      filteredExams.map((ex) => {
                        const isChecked = batchExaminations.includes(ex._id);
                        return (
                          <label
                            key={ex._id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-50/80 font-bold text-[#2271b1]'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleExamSelection(ex._id)}
                              className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                            />
                            <span className="text-[11px] truncate">{ex.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* MCQ Settings Defaults (Language, Difficulty, Status, Marks) */}
                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <Layers size={14} className="text-[#2271b1]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      MCQ Parameters
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Language
                      </label>
                      <select
                        value={batchLanguage}
                        onChange={(e) => setBatchLanguage(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium"
                      >
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Sanskrit">Sanskrit</option>
                        <option value="Bilingual">Bilingual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Difficulty
                      </label>
                      <select
                        value={batchLevel}
                        onChange={(e) => setBatchLevel(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Status
                      </label>
                      <select
                        value={batchStatus}
                        onChange={(e) => setBatchStatus(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Marks / Neg.
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={batchMarks}
                          onChange={(e) => setBatchMarks(Number(e.target.value) || 1)}
                          title="Marks"
                          className="w-1/2 px-1.5 py-1 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium text-center"
                        />
                        <input
                          type="number"
                          step="0.25"
                          value={batchNegative}
                          onChange={(e) => setBatchNegative(Number(e.target.value) || 0)}
                          title="Negative Penalty"
                          className="w-1/2 px-1.5 py-1 text-xs bg-white border border-slate-300 rounded focus:border-[#2271b1] outline-hidden text-slate-800 font-medium text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Upload Dropzone & Live Preview */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) processFile(droppedFile);
              }}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition-transform">
                <Upload size={22} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">
                  Click to browse or drag & drop Excel file here
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported formats: .xlsx, .xls, .csv (Max 10,000 rows per batch)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Card */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={22} className="text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{file.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB •{' '}
                      <span className="font-bold text-emerald-800">
                        {parsedRows.length} questions parsed
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAll}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Remove file"
                >
                  <Trash2 size={13} />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Data Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        Previewing first {Math.min(5, parsedRows.length)} of {parsedRows.length} rows:
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        ✓ Ready to import
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Batch defaults will be applied to missing cells
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56 custom-scrollbar bg-white">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                          <th className="p-2 w-8 text-center">#</th>
                          <th className="p-2 min-w-[200px]">Question</th>
                          <th className="p-2 min-w-[90px]">Opt A</th>
                          <th className="p-2 min-w-[90px]">Opt B</th>
                          <th className="p-2 min-w-[90px]">Opt C</th>
                          <th className="p-2 min-w-[90px]">Opt D</th>
                          <th className="p-2 text-center w-12">Ans</th>
                          <th className="p-2 min-w-[100px]">Subject</th>
                          <th className="p-2 min-w-[100px]">State / Location</th>
                          <th className="p-2 min-w-[120px]">Exam(s)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parsedRows.slice(0, 5).map((row, idx) => {
                          const resolvedSubject =
                            row.subject || (selectedSubjectObj ? selectedSubjectObj.name : '—');
                          const resolvedState =
                            row.state ||
                            (selectedStateObj
                              ? `${selectedStateObj.name}${
                                  selectedDistrictObj ? ` (${selectedDistrictObj.name})` : ''
                                }`
                              : row.city || batchCity || '—');
                          const resolvedExams =
                            row.exam ||
                            (selectedExamNames.length > 0 ? selectedExamNames.join(', ') : '—');

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-2 font-medium text-slate-800 max-w-xs truncate" title={row.content}>
                                {row.content || <span className="text-rose-500 font-bold">Missing Question</span>}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[100px]" title={row.option_a}>
                                {row.option_a || '—'}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[100px]" title={row.option_b}>
                                {row.option_b || '—'}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[100px]" title={row.option_c}>
                                {row.option_c || '—'}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[100px]" title={row.option_d}>
                                {row.option_d || '—'}
                              </td>
                              <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/50">
                                {row.correct_answer || 'A'}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[110px]">
                                {row.subject ? (
                                  <span>{row.subject}</span>
                                ) : selectedSubjectObj ? (
                                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {selectedSubjectObj.name}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[110px]">
                                {row.state ? (
                                  <span>{row.state}</span>
                                ) : selectedStateObj ? (
                                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {selectedStateObj.name}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[130px]">
                                {row.exam ? (
                                  <span>{row.exam}</span>
                                ) : selectedExamNames.length > 0 ? (
                                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {selectedExamNames.join(', ')}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Errors Log */}
              {importSummary?.errors?.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  <span className="font-bold text-rose-800 block">
                    Skipped Rows ({importSummary.errors.length}):
                  </span>
                  <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 text-[11px] text-rose-700">
                    {importSummary.errors.map((err, i) => (
                      <div key={i}>
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleImport}
                disabled={isUploading || isParsing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Importing {parsedRows.length} Questions...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Import {parsedRows.length} Questions Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
