'use client';

import { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RefreshCw, BookOpen, Sparkles } from 'lucide-react';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    exam: 'SSC CGL / General Knowledge',
    question: 'Which element is known as the "King of Chemicals"?',
    options: ['Nitric Acid (HNO3)', 'Sulfuric Acid (H2SO4)', 'Hydrochloric Acid (HCl)', 'Acetic Acid (CH3COOH)'],
    correct: 1,
    explanation: 'Sulfuric acid (H2SO4) is called the "King of Chemicals" because it is used directly or indirectly in almost all industrial processes.'
  },
  {
    id: 2,
    exam: 'UPSC IAS / Indian Polity',
    question: 'Under which Article of the Indian Constitution is the Financial Emergency declared?',
    options: ['Article 352', 'Article 356', 'Article 360', 'Article 370'],
    correct: 2,
    explanation: 'Article 360 empowers the President to declare a Financial Emergency if he is satisfied that a situation has arisen whereby financial stability or credit of India is threatened.'
  },
  {
    id: 3,
    exam: 'Banking & Finance / Current Affairs',
    question: 'What is the full form of IFSC code used in digital money transfers?',
    options: [
      'Indian Financial System Code',
      'International Financial Settlement Code',
      'Indian Financial Security Code',
      'Integrated Financial System Code'
    ],
    correct: 0,
    explanation: 'IFSC stands for Indian Financial System Code. It is an 11-character alphanumeric code used to identify bank branches participating in online fund transfers (NEFT/RTGS/IMPS).'
  }
];

export default function DailyMcqWidget() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = SAMPLE_QUESTIONS[currentIdx];

  const handleSelect = (index) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setCurrentIdx((prev) => (prev + 1) % SAMPLE_QUESTIONS.length);
  };

  return (
    <section className="py-14 bg-slate-50 relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Quiz Sandbox</span>
            </div>

            <h2 className="text-3xl font-extrabold text-[#23384e] tracking-tight leading-snug">
              Test Your Knowledge <br />
              <span className="text-[#007bff]">
                Daily MCQ Practice
              </span>
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              Practice hand-picked questions updated daily by expert faculty. Sharpen your accuracy for upcoming SSC, UPSC, Banking, and Railway examinations.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-xl font-bold text-emerald-600">1,000+</span>
                <p className="text-xs text-slate-500 font-medium">Curated MCQs Available</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-xl font-bold text-amber-600">Instant</span>
                <p className="text-xs text-slate-500 font-medium">Detailed Explanations</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
              
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {currentQ.exam}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Score:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                    {score} Pts
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((opt, idx) => {
                  let optStyle = "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50";
                  
                  if (selectedOption === idx) {
                    optStyle = "border-blue-500 bg-blue-50 text-blue-800 font-semibold shadow-sm";
                  }

                  if (isSubmitted) {
                    if (idx === currentQ.correct) {
                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                    } else if (selectedOption === idx) {
                      optStyle = "border-rose-500 bg-rose-50 text-rose-800 font-semibold";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs sm:text-sm ${optStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isSubmitted && idx === currentQ.correct && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isSubmitted && selectedOption === idx && idx !== currentQ.correct && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Solution */}
              {isSubmitted && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 text-xs space-y-2 mb-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-bold text-blue-700">
                    <BookOpen className="w-4 h-4" />
                    <span>Explanation & Solution:</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className={`px-5 py-2 rounded-xl font-bold text-xs transition shadow-sm ${
                      selectedOption !== null
                        ? 'bg-[#007bff] hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 rounded-xl bg-[#007bff] hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                  title="Skip to next"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
