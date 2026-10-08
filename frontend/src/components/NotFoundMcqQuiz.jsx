'use client';

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { fireConfetti } from '@/utils/confetti';

const POP_QUIZ_QUESTIONS = [
  {
    id: 1,
    category: "Indian Polity",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    question: "Which Article of the Indian Constitution is referred to as the 'Heart and Soul of the Constitution' by Dr. B.R. Ambedkar?",
    options: [
      { id: 'A', text: 'Article 14 (Right to Equality)' },
      { id: 'B', text: 'Article 19 (Right to Freedom)' },
      { id: 'C', text: 'Article 32 (Right to Constitutional Remedies)' },
      { id: 'D', text: 'Article 21 (Right to Life & Personal Liberty)' },
    ],
    correct: 'C',
    explanation: "Dr. B.R. Ambedkar called Article 32 the 'Heart and Soul of the Constitution' because it empowers citizens to directly approach the Supreme Court to enforce fundamental rights via Writs."
  },
  {
    id: 2,
    category: "General Science",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    question: "Which gas is primarily responsible for the greenhouse effect on planet Earth?",
    options: [
      { id: 'A', text: 'Nitrogen' },
      { id: 'B', text: 'Water Vapour & Carbon Dioxide' },
      { id: 'C', text: 'Helium' },
      { id: 'D', text: 'Oxygen' },
    ],
    correct: 'B',
    explanation: "Water vapour and Carbon Dioxide (CO2) are the principal greenhouse gases in Earth's atmosphere, trapping heat radiated from the surface."
  },
  {
    id: 3,
    category: "Indian History",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    question: "Who was the Viceroy of India during the Partition of Bengal in 1905?",
    options: [
      { id: 'A', text: 'Lord Curzon' },
      { id: 'B', text: 'Lord Dalhousie' },
      { id: 'C', text: 'Lord Mountbatten' },
      { id: 'D', text: 'Lord Canning' },
    ],
    correct: 'A',
    explanation: "Lord Curzon announced the Partition of Bengal in July 1905, leading to the massive Swadeshi Movement across the nation."
  },
  {
    id: 4,
    category: "Geography",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    question: "Which is the highest peak in the Western Ghats (Sahyadri)?",
    options: [
      { id: 'A', text: 'Doda Betta' },
      { id: 'B', text: 'Anamudi' },
      { id: 'C', text: 'Kalsubai' },
      { id: 'D', text: 'Guru Shikhar' },
    ],
    correct: 'B',
    explanation: "Anamudi, located in the Anamalai Hills of Kerala (elevation 2,695 metres), is the highest peak in both the Western Ghats and all of South India."
  },
  {
    id: 5,
    category: "Indian Economy",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    question: "In India, who determines the Monetary Policy Repo Rate?",
    options: [
      { id: 'A', text: 'Ministry of Finance' },
      { id: 'B', text: 'NITI Aayog' },
      { id: 'C', text: 'Monetary Policy Committee (MPC) of RBI' },
      { id: 'D', text: 'State Bank of India' },
    ],
    correct: 'C',
    explanation: "The Monetary Policy Committee (MPC) of the Reserve Bank of India (RBI), headed by the RBI Governor, decides policy repo rates to maintain price stability while sustaining growth."
  },
  {
    id: 6,
    category: "Current Affairs & GK",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    question: "Which Indian space mission successfully achieved a soft landing near the Moon's South Pole in 2023?",
    options: [
      { id: 'A', text: 'Mangalyaan-2' },
      { id: 'B', text: 'Chandrayaan-3' },
      { id: 'C', text: 'Gaganyaan' },
      { id: 'D', text: 'Aditya-L1' },
    ],
    correct: 'B',
    explanation: "ISRO's Chandrayaan-3 lander 'Vikram' made historic soft landing on August 23, 2023, making India the 1st nation to land near lunar south pole."
  }
];

const NotFoundMcqQuiz = forwardRef(function NotFoundMcqQuiz(props, ref) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const containerRef = React.useRef(null);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }));

  const currentQ = POP_QUIZ_QUESTIONS[currentIndex];

  const handleSelectOption = (optionId, e) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(optionId);
    setTotalAnswered(prev => prev + 1);

    if (optionId === currentQ.correct) {
      setScore(prev => prev + 2);
      setStreak(prev => prev + 1);
      fireConfetti(e?.clientX, e?.clientY);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    let nextIdx = (currentIndex + 1) % POP_QUIZ_QUESTIONS.length;
    setCurrentIndex(nextIdx);
  };

  const handleRandomQuestion = () => {
    setSelectedOption(null);
    let randIdx = Math.floor(Math.random() * POP_QUIZ_QUESTIONS.length);
    if (randIdx === currentIndex) {
      randIdx = (randIdx + 1) % POP_QUIZ_QUESTIONS.length;
    }
    setCurrentIndex(randIdx);
  };

  return (
    <section ref={containerRef} className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Container Card */}
      <div className="bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-900 rounded-3xl p-6 sm:p-10 border border-blue-900/50 shadow-2xl text-white relative overflow-hidden">
        
        {/* Background Decorative Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Streak & Score */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Lost Scholar Pop-Quiz
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-400/40 text-[10px] font-mono text-blue-300">
                  Q {currentIndex + 1} of {POP_QUIZ_QUESTIONS.length}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Turn This 404 into +2 Marks!
              </h3>
            </div>
          </div>

          {/* Gamified Score Badges */}
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-amber-500/30 text-xs font-bold text-amber-300 shadow-inner">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
              <span>Streak: {streak}</span>
            </div>

            {/* Total Score */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/30 text-xs font-bold text-blue-200">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Score: {score} pts</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="mt-6 relative z-10">
          
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-blue-900/60 border border-blue-400/30 text-blue-200 mb-3">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{currentQ.category}</span>
          </div>

          {/* Question Text */}
          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-100 leading-snug mb-6">
            {currentQ.question}
          </p>

          {/* 4 Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectAnswer = opt.id === currentQ.correct;
              const hasAnswered = selectedOption !== null;

              let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';
              let badgeStyle = 'bg-slate-700 text-slate-300';

              if (hasAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/50';
                  badgeStyle = 'bg-emerald-500 text-slate-950 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/90 border-rose-400 text-rose-100 ring-2 ring-rose-400/50';
                  badgeStyle = 'bg-rose-500 text-white font-bold';
                } else {
                  btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={hasAnswered}
                  onClick={(e) => handleSelectOption(opt.id, e)}
                  className={`group relative flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${btnStyle} ${
                    !hasAnswered ? 'hover:-translate-y-0.5 active:translate-y-0 shadow-md' : ''
                  }`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${badgeStyle}`}>
                    {opt.id}
                  </span>
                  
                  <span className="text-sm font-semibold leading-snug flex-1">
                    {opt.text}
                  </span>

                  {hasAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-scale" />
                  )}
                  {hasAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner (Shows upon answering) */}
          {selectedOption !== null && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 mb-6 ${
              selectedOption === currentQ.correct
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/30'
                : 'bg-blue-950/60 border-blue-500/40 text-blue-200 shadow-lg shadow-blue-950/30'
            }`}>
              <div className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 shrink-0 mt-0.5 ${
                  selectedOption === currentQ.correct ? 'text-emerald-400' : 'text-amber-400'
                }`} />
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="font-bold flex items-center gap-2">
                    {selectedOption === currentQ.correct ? (
                      <span className="text-emerald-300 font-extrabold">🎉 Brilliant! Correct Answer (+2 Marks)</span>
                    ) : (
                      <span className="text-amber-300 font-extrabold">💡 Note: Correct Answer is Option ({currentQ.correct})</span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            
            <div className="flex items-center gap-2">
              {selectedOption !== null ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-lg shadow-amber-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRandomQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Random Question</span>
                </button>
              )}
            </div>

            {/* Link to Full MCQ Portal */}
            <Link
              href="/mcq-questions"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition group cursor-pointer"
            >
              <span>Practice 50,000+ Full MCQs</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
});

export default NotFoundMcqQuiz;
