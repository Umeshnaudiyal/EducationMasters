'use client';

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';

export default function ExcelQuestionImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Generate and download sample Excel template
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
      'State',
      'Exam',
      'Language',
      'Difficulty',
      'Explanation',
      'Marks',
      'Negative Marks',
    ];

    const sampleRows = [
      [
        'Who was the first President of India?',
        'Dr. Rajendra Prasad',
        'Dr. S. Radhakrishnan',
        'Jawaharlal Nehru',
        'Mahatma Gandhi',
        '',
        '',
        'A',
        'History',
        'Bihar',
        'UPSC Civil Services',
        'English',
        'Easy',
        'Dr. Rajendra Prasad served as the first President of India from 1950 to 1962.',
        '1',
        '0.25',
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
        'Karnataka',
        'SSC CGL',
        'Hindi',
        'Medium',
        'बेंगलुरु भारत का प्रमुख आईटी हब होने के कारण सिलिकॉन वैली कहलाता है।',
        '1',
        '0.33',
      ],
      [
        'Which Article of Indian Constitution deals with Fundamental Duties?',
        'Article 51A',
        'Article 48',
        'Article 21A',
        'Article 32',
        '',
        '',
        'A',
        'Polity',
        '',
        'UPSC Civil Services',
        'English',
        'Medium',
        'Fundamental Duties were incorporated into Article 51A by the 42nd Amendment Act.',
        '2',
        '0.5',
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
      { wch: 18 }, // Subject
      { wch: 18 }, // State
      { wch: 22 }, // Exam
      { wch: 12 }, // Language
      { wch: 12 }, // Difficulty
      { wch: 45 }, // Explanation
      { wch: 10 }, // Marks
      { wch: 15 }, // Negative Marks
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'EducationMasters_MCQ_Template.xlsx');
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
            content: row.Question || row.question || row.Content || row.content || '',
            option_a: row['Option A'] || row['Option 1'] || row.option_a || row.option1 || row.A || '',
            option_b: row['Option B'] || row['Option 2'] || row.option_b || row.option2 || row.B || '',
            option_c: row['Option C'] || row['Option 3'] || row.option_c || row.option3 || row.C || '',
            option_d: row['Option D'] || row['Option 4'] || row.option_d || row.option4 || row.D || '',
            option_e: row['Option E'] || row['Option 5'] || row.option_e || row.option5 || row.E || '',
            option_f: row['Option F'] || row['Option 6'] || row.option_f || row.option6 || row.F || '',
            correct_answer: row['Correct Answer'] || row.Answer || row.answer || row.correct_answer || 'A',
            subject: row.Subject || row.subject || '',
            state: row.State || row.state || '',
            exam: row.Exam || row.exam || row.Examination || '',
            language: row.Language || row.language || 'Hindi',
            level: row.Difficulty || row.difficulty || row.Level || row.level || 'Medium',
            ans_info: row.Explanation || row.explanation || row.ans_info || '',
            marks: row.Marks || row.marks || 1,
            negative: row['Negative Marks'] || row.negative || 0,
            status: 'Published',
          }));

          setParsedRows(normalized);
          setStatusMessage({
            type: 'success',
            text: `Successfully parsed ${normalized.length} questions from ${selectedFile.name}. Ready to import.`,
          });
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        setStatusMessage({
          type: 'error',
          text: 'Error reading file format. Please ensure it is a valid .xlsx or .xls file.',
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

  // Upload parsed questions to backend
  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/questions/import-excel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ questions: parsedRows }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bulk Import Questions from Excel
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload `.xlsx` / `.xls` spreadsheets to import hundreds of MCQs instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
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

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) processFile(droppedFile);
              }}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <Upload size={22} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">
                  Click to browse or drag & drop Excel file here
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported formats: .xlsx, .xls, .csv (Max 10,000 rows per file)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Card */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={20} className="text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">{file.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} questions parsed
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAll}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Data Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Previewing first {Math.min(5, parsedRows.length)} rows:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Total: {parsedRows.length} questions
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56 custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                          <th className="p-2 w-8">#</th>
                          <th className="p-2">Question</th>
                          <th className="p-2">Opt A</th>
                          <th className="p-2">Opt B</th>
                          <th className="p-2">Opt C</th>
                          <th className="p-2">Opt D</th>
                          <th className="p-2 text-center">Ans</th>
                          <th className="p-2">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-800 max-w-xs truncate">
                              {row.content}
                            </td>
                            <td className="p-2 text-slate-600 truncate max-w-[100px]">{row.option_a}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[100px]">{row.option_b}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[100px]">{row.option_c}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[100px]">{row.option_d}</td>
                            <td className="p-2 text-center font-bold text-emerald-700">
                              {row.correct_answer}
                            </td>
                            <td className="p-2 text-slate-500">{row.subject || '—'}</td>
                          </tr>
                        ))}
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
  );
}
