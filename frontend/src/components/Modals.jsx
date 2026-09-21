'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Keyboard,
  FileText,
  CheckCircle2,
  RotateCcw,
  Play,
  Clock,
  Zap,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Share2,
  Flame,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const PARAGRAPHS = [
  "Government examinations evaluate typing accuracy and speed for clerical, secretarial, and assistant grade posts. Consistent practice with proper finger placement on home row keys helps maintain accuracy and high words-per-minute performance during timed exams.",
  "Staff Selection Commission CGL and CHSL typing test requires candidates to achieve thirty-five words per minute in English or thirty words per minute in Hindi. Accuracy plays a crucial role as negative marks are calculated for keying mistakes and missing words.",
  "Railway Recruitment Board NTPC CBT-2 skill test measures speed and precision under exam pressure. Focus on maintaining a steady rhythm, reducing backspacing, and completing the full passage within the allotted ten-minute window."
];

export function TypingTestModal({ isOpen, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(60); // 60 seconds
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentTextIdx, setCurrentTextIdx] = useState(0);

  const [wpm, setWpm] = useState(0);
  const [netWpm, setNetWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [mistakes, setMistakes] = useState(0);

  const inputRef = useRef(null);
  const textToType = PARAGRAPHS[currentTextIdx];

  // Auto focus input when test opens
  useEffect(() => {
    if (isOpen) {
      handleReset();
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const modalStartTimeRef = useRef(null);

  // Countdown timer effect
  useEffect(() => {
    let timer = null;
    if (isActive) {
      if (!modalStartTimeRef.current) {
        modalStartTimeRef.current = Date.now();
      }

      timer = setInterval(() => {
        if (!modalStartTimeRef.current) return;
        const elapsed = Math.floor((Date.now() - modalStartTimeRef.current) / 1000);
        const remaining = Math.max(0, selectedDuration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          setIsActive(false);
          setIsFinished(true);
          clearInterval(timer);
        }
      }, 200);
    } else {
      modalStartTimeRef.current = null;
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, selectedDuration]);

  // Real-time WPM and Accuracy Calculation
  const handleInputChange = (e) => {
    if (isFinished) return;

    const value = e.target.value;

    // Start timer on first character typed
    if (!isActive && value.length === 1 && timeLeft > 0) {
      setIsActive(true);
    }

    setUserInput(value);

    // Calculate mistakes
    let errs = 0;
    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === textToType[i]) {
        correctChars++;
      } else {
        errs++;
      }
    }
    setMistakes(errs);

    // Calculate WPM: (all typed characters / 5) / (elapsed time in minutes)
    const timeElapsedSec = selectedDuration - timeLeft;
    const timeElapsedMin = timeElapsedSec > 0 ? timeElapsedSec / 60 : 0.01;

    const grossWpm = Math.round((value.length / 5) / timeElapsedMin);
    const calculatedNetWpm = Math.max(0, Math.round(((value.length - errs) / 5) / timeElapsedMin));

    setWpm(grossWpm);
    setNetWpm(calculatedNetWpm);

    const acc = value.length > 0 ? Math.round((correctChars / value.length) * 100) : 100;
    setAccuracy(acc);

    // Auto finish if completed full paragraph
    if (value.length >= textToType.length) {
      setIsActive(false);
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    modalStartTimeRef.current = null;
    setUserInput('');
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(selectedDuration);
    setWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setMistakes(0);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDurationChange = (sec) => {
    setSelectedDuration(sec);
    setTimeLeft(sec);
    setUserInput('');
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setMistakes(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col justify-between p-6 sm:p-10 font-sans text-white overflow-hidden animate-in fade-in duration-300">

      {/* 1. TOP NAVIGATION TOOLBAR */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-5 shrink-0">

        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Education Masters</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                Full Screen Typing Arena
              </span>
            </div>
            <p className="text-xs text-slate-400">SSC CGL, CHSL & Railway NTPC Exam Benchmark (35 WPM Target)</p>
          </div>
        </div>

        {/* Time Selector & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            {[30, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => handleDurationChange(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedDuration === sec
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentTextIdx((prev) => (prev + 1) % PARAGRAPHS.length)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Change Paragraph</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Exit Full Screen Arena"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* 2. REAL-TIME STATS DASHBOARD */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 shrink-0">

        {/* Gross WPM Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
          <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight block">
            {wpm}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Gross WPM
          </span>
        </div>

        {/* Net WPM Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
          <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight block">
            {netWpm}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Net WPM (Speed)
          </span>
        </div>

        {/* Accuracy Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
          <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight block">
            {accuracy}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Accuracy Rate
          </span>
        </div>

        {/* Time Left Countdown Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden group">
          <span className={`text-3xl sm:text-4xl font-black tracking-tight block ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-purple-400'}`}>
            {timeLeft}s
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
            Time Remaining
          </span>
        </div>

      </div>

      {/* 3. INTERACTIVE FULL-SCREEN TYPING CANVAS */}
      <div
        onClick={() => inputRef.current && inputRef.current.focus()}
        className="max-w-4xl w-full mx-auto flex-1 bg-slate-900/50 border border-slate-800/90 rounded-3xl p-6 sm:p-10 flex flex-col justify-center relative cursor-text shadow-2xl overflow-y-auto"
      >

        {/* Hidden Input Layer */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          className="absolute opacity-0 top-0 left-0 w-full h-full cursor-text"
          disabled={isFinished}
          autoFocus
        />

        {/* Display Text Characters with Character-by-Character Highlighting */}
        <div className="text-lg sm:text-2xl font-mono leading-relaxed sm:leading-loose text-slate-500 select-none tracking-wide">
          {textToType.split('').map((char, index) => {
            let charStyle = "text-slate-500";

            if (index < userInput.length) {
              if (userInput[index] === char) {
                charStyle = "text-emerald-400 font-semibold bg-emerald-500/10 rounded-xs";
              } else {
                charStyle = "text-rose-400 bg-rose-500/25 font-bold rounded-xs underline underline-offset-4 decoration-rose-500";
              }
            } else if (index === userInput.length && !isFinished) {
              charStyle = "text-white bg-cyan-500/30 border-b-2 border-cyan-400 animate-pulse font-bold";
            }

            return (
              <span key={index} className={`transition-colors duration-100 ${charStyle}`}>
                {char}
              </span>
            );
          })}
        </div>

        {/* Start Typing Hint */}
        {!isActive && !isFinished && userInput.length === 0 && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs rounded-3xl flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-bold flex items-center gap-2 animate-bounce">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Click anywhere & start typing to launch timer!</span>
            </div>
          </div>
        )}

      </div>

      {/* 4. BOTTOM ACTION TOOLBAR */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pt-4 border-t border-slate-800 shrink-0 text-xs">
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Typed: {userInput.length} chars
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Errors: {mistakes}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold flex items-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Reset Test</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition"
          >
            Exit Test
          </button>
        </div>
      </div>

      {/* 5. POST-TEST SCORECARD MODAL */}
      {isFinished && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6 relative">

            {/* Header Icon & Status */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 mx-auto shadow-xl">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white">Test Completed!</h3>
              <p className="text-xs text-slate-400">Official Education Masters Performance Scorecard</p>
            </div>

            {/* Performance Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <span className="text-3xl font-black text-cyan-400">{netWpm}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Net WPM</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <span className="text-3xl font-black text-emerald-400">{accuracy}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Accuracy Rate</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <span className="text-3xl font-black text-amber-400">{wpm}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Gross WPM</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <span className="text-3xl font-black text-rose-400">{mistakes}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Key Errors</span>
              </div>
            </div>

            {/* Exam Qualification Status */}
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${netWpm >= 35
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
              {netWpm >= 35 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>QUALIFIED for SSC CGL / CHSL Typing Standard (35 WPM Target)!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Keep practicing! SSC & Railway target speed is 35 WPM.</span>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close Arena
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export function MockTestModal({ isOpen, onClose }) {
  const [selectedExam, setSelectedExam] = useState('SSC CGL Tier 1');

  const mockExams = [
    { title: 'SSC CGL Tier 1 Full Length Mock', duration: '60 Mins', qCount: '100 Qs', difficulty: 'Moderate' },
    { title: 'UPSC IAS Prelims GS Paper-1', duration: '120 Mins', qCount: '100 Qs', difficulty: 'Hard' },
    { title: 'SBI PO Prelims Full Mock 2026', duration: '60 Mins', qCount: '100 Qs', difficulty: 'Hard' },
    { title: 'RRB NTPC CBT-1 Practice Set', duration: '90 Mins', qCount: '100 Qs', difficulty: 'Easy' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b132b]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1c2541] border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-white">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Mock Test Simulator</h3>
              <p className="text-xs text-slate-400">Real Exam Interface with Timer & Negative Marking</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection List */}
        <div className="space-y-3">
          {mockExams.map((exam, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedExam(exam.title)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${selectedExam === exam.title
                  ? 'border-amber-500 bg-amber-500/15 text-white font-semibold shadow-md'
                  : 'border-slate-800 bg-[#0b132b]/80 text-slate-300 hover:border-slate-700'
                }`}
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{exam.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span>⏱️ {exam.duration}</span>
                  <span>📝 {exam.qCount}</span>
                  <span className="text-amber-400 font-bold">⚡ {exam.difficulty}</span>
                </div>
              </div>

              {selectedExam === exam.title && (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Starting ${selectedExam}...`);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Test Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Logging in as ${username || 'User'}...`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Modal Container with login.webp background */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md text-white flex flex-col items-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('/login.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo (logo.webp) */}
        <div className="flex flex-col items-center mb-6 z-10">
          <img 
            src="/logo.webp" 
            alt="Education Masters" 
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 z-10 max-w-xs sm:max-w-sm">
          
          {/* Username or Email */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none text-xs">👤</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              className="w-full bg-zinc-900/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded border border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
            />
          </div>

          {/* Password */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none text-xs">🔑</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-900/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded border border-zinc-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer p-0.5"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember me & Login Button Row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="submit"
              className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded transition shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              Login
            </button>
          </div>

          {/* Account Link */}
          <div className="text-center pt-2">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert("Redirecting to Registration..."); }}
              className="text-xs text-slate-300 hover:text-white hover:underline transition"
            >
              Don't have an account?
            </a>
          </div>

        </form>

        {/* Modal Footer Copyright */}
        <div className="text-center pt-8 text-[10px] sm:text-xs text-slate-400 space-y-0.5 z-10">
          <p>©{new Date().getFullYear()} Education Masters</p>
          <p className="font-semibold text-slate-300">DigitArtTech</p>
        </div>

      </div>
    </div>
  );
}
