'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { TypingTestModal, MockTestModal } from '@/components/Modals';
import {
  RotateCcw,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Share2,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Layers,
  Zap,
  Globe,
  Sliders
} from 'lucide-react';

// 6 DIVERSE WORD BANKS / CATEGORIES
const WORD_BANKS = {
  general: [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
    "that", "for", "they", "with", "as", "not", "on", "she", "at", "by",
    "this", "we", "you", "do", "but", "from", "or", "which", "one", "would",
    "all", "will", "there", "say", "who", "make", "when", "can", "more", "if",
    "no", "man", "out", "other", "so", "what", "time", "up", "go", "about",
    "than", "into", "could", "state", "only", "new", "year", "some", "take", "come",
    "these", "know", "see", "use", "get", "like", "then", "first", "any", "work",
    "now", "may", "such", "give", "over", "think", "most", "even", "find", "day",
    "also", "after", "way", "many", "must", "look", "before", "great", "back", "through",
    "long", "where", "much", "should", "well", "people", "down", "own", "just", "because",
    "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little",
    "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become",
    "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under",
    "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin",
    "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form",
    "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest",
    "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again"
  ],
  ssc: [
    "Government examinations evaluate typing accuracy and speed for clerical, secretarial, and assistant grade posts.",
    "Staff Selection Commission CGL and CHSL typing test requires candidates to achieve thirty-five words per minute in English.",
    "Precision and speed are equally essential for qualifying government competitive typing benchmarks across India.",
    "India Railway Recruitment Board NTPC typing test assesses candidate speed under timed environment with strict standards.",
    "Candidates preparing for clerical grade examinations must practice proper finger placement on standard QWERTY keyboards.",
    "Speed typing tests measure words per minute calculation based on standard five character word length formulas."
  ],
  tech: [
    "algorithm", "bandwidth", "compiler", "database", "encryption", "framework", "hardware", "interface",
    "javascript", "kernel", "logic", "memory", "network", "operating", "protocol", "quantum",
    "repository", "software", "terminal", "utility", "virtual", "webmaster", "xml", "yield",
    "cybersecurity", "cloud", "artificial", "intelligence", "neural", "computation", "server", "microservice"
  ],
  polity: [
    "constitution", "democracy", "parliament", "judiciary", "sovereignty", "preamble", "republic", "legislature",
    "fundamental", "rights", "duties", "directive", "principles", "amendment", "governor", "president",
    "federation", "secularism", "franchise", "cabinet", "bureaucracy", "electoral", "jurisdiction", "statute"
  ],
  current_affairs: [
    "economy", "inflation", "sustainability", "diplomacy", "infrastructure", "renewable", "summit", "bilateral",
    "biosphere", "demographics", "monetary", "fiscal", "stimulus", "exports", "logistics", "semiconductor",
    "geopolitics", "monsoon", "urbanization", "digitization", "innovation", "satellite", "gdp", "trade"
  ],
  quotes: [
    "Education is the most powerful weapon which you can use to change the world.",
    "The mind is not a vessel to be filled, but a fire to be kindled.",
    "Success is no accident. It is hard work, perseverance, learning, studying, and sacrifice.",
    "Strive for continuous improvement instead of perfection in your typing journey.",
    "Focus on accuracy first and speed will follow naturally through muscle memory."
  ]
};

const PUNCTUATIONS = [".", ",", "!", "?", ";", ":", "-"];
const NUMBERS = ["12", "45", "99", "2026", "35", "100", "7", "88", "150", "2024"];

export default function TypingTestPage() {
  // Navigation Modals
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  // Options
  const [mode, setMode] = useState('time'); // 'time' | 'words'
  const [categoryBank, setCategoryBank] = useState('general');
  const [duration, setDuration] = useState(30); // 15, 30, 60, 120
  const [wordCountOption, setWordCountOption] = useState(25); // 10, 25, 50, 100
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Engine State
  const [words, setWords] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currWordIdx, setCurrWordIdx] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'typing' | 'finished'

  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Real-time tracking history for graph
  const [historyData, setHistoryData] = useState([]);
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState(null);

  // Detailed Character Breakdown
  const [correctCharsCount, setCorrectCharsCount] = useState(0);
  const [errorCharsCount, setErrorCharsCount] = useState(0);
  const [extraCharsCount, setExtraCharsCount] = useState(0);
  const [missedCharsCount, setMissedCharsCount] = useState(0);

  // Smooth vertical scrolling line offset
  const [lineTranslateY, setLineTranslateY] = useState(0);

  const inputRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const activeWordRef = useRef(null);
  const timerRef = useRef(null);

  // Mechanical Key Sound Effect
  const playClickSound = (isError = false) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isError ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isError ? 180 : 560, ctx.currentTime);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) {
      // ignore audio context restrictions
    }
  };

  // Helper to generate a batch of randomized words
  const generateWordBatch = (count = 120, bankKey = categoryBank) => {
    const source = WORD_BANKS[bankKey] || WORD_BANKS.general;
    let generated = [];

    if (bankKey === 'ssc' || bankKey === 'quotes') {
      while (generated.length < count) {
        const sentence = source[Math.floor(Math.random() * source.length)];
        const sentenceWords = sentence.split(' ');
        generated.push(...sentenceWords);
      }
    } else {
      for (let i = 0; i < count; i++) {
        let word = source[Math.floor(Math.random() * source.length)];
        if (includePunctuation && Math.random() < 0.25) {
          const p = PUNCTUATIONS[Math.floor(Math.random() * PUNCTUATIONS.length)];
          word += p;
        }
        if (includeNumbers && Math.random() < 0.2) {
          const num = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
          word = num;
        }
        generated.push(word);
      }
    }
    return generated;
  };

  const startTimeRef = useRef(null);
  const statsRef = useRef({ correct: 0, error: 0, extra: 0 });

  // Sync statsRef for graph logging without triggering timer restarts
  useEffect(() => {
    statsRef.current = {
      correct: correctCharsCount,
      error: errorCharsCount,
      extra: extraCharsCount
    };
  }, [correctCharsCount, errorCharsCount, extraCharsCount]);

  // Reset Test
  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = null;
    setStatus('idle');
    setUserInput('');
    setCurrWordIdx(0);
    setTimeLeft(duration);
    setElapsedSeconds(0);
    setHistoryData([]);
    setCorrectCharsCount(0);
    setErrorCharsCount(0);
    setExtraCharsCount(0);
    setMissedCharsCount(0);
    setHoveredGraphPoint(null);
    setLineTranslateY(0);

    const initialBatch = generateWordBatch(180, categoryBank);
    setWords(initialBatch);

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  useEffect(() => {
    resetTest();
  }, [mode, duration, wordCountOption, categoryBank, includePunctuation, includeNumbers]);

  // Smooth line scrolling offset monitor
  useEffect(() => {
    if (activeWordRef.current && wordsContainerRef.current) {
      const activeTop = activeWordRef.current.offsetTop;
      if (activeTop > 45) {
        setLineTranslateY(-(activeTop - 30));
      } else {
        setLineTranslateY(0);
      }
    }
  }, [currWordIdx]);

  // Rock-Solid Continuous Timer & Performance Logger (Immune to typing speed)
  useEffect(() => {
    if (status === 'typing') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsedSec);

        const { correct, error, extra } = statsRef.current;
        const totalTyped = correct + error + extra;
        const timeInMin = Math.max(0.01, elapsedSec / 60);
        const currentWpm = Math.round((correct / 5) / timeInMin) || 0;
        const currentRawWpm = Math.round((totalTyped / 5) / timeInMin) || 0;

        setHistoryData((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].sec === elapsedSec) {
            return prev;
          }
          return [
            ...prev,
            {
              sec: elapsedSec,
              wpm: currentWpm,
              rawWpm: currentRawWpm,
              errors: error
            }
          ];
        });

        if (mode === 'time') {
          const remaining = Math.max(0, duration - elapsedSec);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            setStatus('finished');
          }
        }
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode, duration]);

  // Keyboard listener: Tab to restart, and auto-start timer on first keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        resetTest();
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (status === 'finished') return;

      // Auto-focus input if not in a control button/input
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'button' && activeTag !== 'select') {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }

      // Immediately start timer on first keypress
      if (status === 'idle' && (e.key.length === 1 || e.key === 'Backspace')) {
        setStatus('typing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Handle Input Typing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);

    // Immediately start timer on first character
    if (status === 'idle' && value.length > 0) {
      setStatus('typing');
    }

    if (status === 'finished') return;

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const targetWord = words[currWordIdx] || '';

      let wordCorrect = 0;
      let wordError = 0;

      for (let i = 0; i < targetWord.length; i++) {
        if (i < typedWord.length) {
          if (typedWord[i] === targetWord[i]) {
            wordCorrect++;
          } else {
            wordError++;
          }
        } else {
          setMissedCharsCount((m) => m + 1);
        }
      }

      if (typedWord.length > targetWord.length) {
        setExtraCharsCount((ex) => ex + (typedWord.length - targetWord.length));
      }

      setCorrectCharsCount((c) => c + wordCorrect + 1);
      setErrorCharsCount((e) => e + wordError);

      playClickSound(wordError > 0);

      if (mode === 'words' && currWordIdx + 1 >= wordCountOption) {
        setStatus('finished');
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        if (currWordIdx + 15 >= words.length) {
          const newWords = generateWordBatch(100, categoryBank);
          setWords((prev) => [...prev, ...newWords]);
        }
        setCurrWordIdx((idx) => idx + 1);
        setUserInput('');
      }
    } else {
      const targetWord = words[currWordIdx] || '';
      const isError = value.length > 0 && targetWord[value.length - 1] !== value[value.length - 1];
      playClickSound(isError);
    }
  };

  // Metrics Calculation
  const actualTimeTaken = mode === 'time' ? duration : Math.max(1, elapsedSeconds);
  const finalTimeMin = Math.max(0.01, actualTimeTaken / 60);
  const totalTypedCharacters = correctCharsCount + errorCharsCount + extraCharsCount;
  const netWpm = Math.max(0, Math.round((correctCharsCount / 5) / finalTimeMin));
  const rawWpm = Math.max(0, Math.round((totalTypedCharacters / 5) / finalTimeMin));
  const accuracy = totalTypedCharacters > 0 ? Math.min(100, Math.round((correctCharsCount / totalTypedCharacters) * 100)) : 100;
  const consistency = useMemo(() => {
    if (historyData.length < 2) return 95;
    const wpms = historyData.map((d) => d.wpm);
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    if (mean === 0) return 100;
    const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(50, Math.min(100, Math.round(100 - (stdDev / mean) * 50)));
  }, [historyData]);

  const isSscQualified = netWpm >= 35 && accuracy >= 95;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* 1. Header Navigation */}
      <Header
        onOpenTypingModal={() => setIsTypingModalOpen(true)}
        onOpenMockModal={() => setIsMockModalOpen(true)}
      />

      {/* 60VH VIEWPORT CONTAINER */}
      <main className="h-[60vh] min-h-[480px] w-full px-4 sm:px-8 lg:px-12 py-4 flex flex-col justify-between">

        {/* Top Control Toolbar - SLEEK & FRAMELESS */}
        {status !== 'finished' && (
          <div className="w-full bg-slate-100/70 p-2 sm:p-2.5 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 px-1.5">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>CATEGORY:</span>
              </span>

              {[
                { id: 'general', label: 'General English' },
                { id: 'ssc', label: 'SSC CGL / Railway' },
                { id: 'tech', label: 'Tech & Code' },
                { id: 'polity', label: 'Polity & Admin' },
                { id: 'current_affairs', label: 'Current Affairs' },
                { id: 'quotes', label: 'Famous Quotes' }
              ].map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => setCategoryBank(bank.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${categoryBank === bank.id
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {bank.label}
                </button>
              ))}
            </div>

            {/* Mode & Punctuation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIncludePunctuation(!includePunctuation)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${includePunctuation ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span>@ punctuation</span>
              </button>

              <button
                onClick={() => setIncludeNumbers(!includeNumbers)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${includeNumbers ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span># numbers</span>
              </button>

              <div className="h-3.5 w-px bg-slate-300 mx-1" />

              <button
                onClick={() => setMode('time')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 ${mode === 'time' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Clock className="w-3 h-3" />
                <span>time</span>
              </button>

              <button
                onClick={() => setMode('words')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition flex items-center gap-1 ${mode === 'words' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span>A words</span>
              </button>

              {mode === 'time' && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 pl-1">
                  {[15, 30, 60, 120].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setDuration(sec)}
                      className={`px-2 py-0.5 rounded transition ${duration === sec ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-slate-900'
                        }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition ${soundEnabled ? 'text-amber-600' : 'text-slate-400'
                  }`}
                title="Toggle Mechanical Key Sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>
        )}

        {/* 2. Monkeytype Active Typing Canvas */}
        {status !== 'finished' ? (
          <div className="flex-1 flex flex-col justify-center my-2 w-full">

            {/* Live Timer Indicator */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-amber-500 font-mono tracking-tight">
                  {mode === 'time' ? timeLeft : elapsedSeconds}
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  {mode === 'time' ? `seconds remaining` : 'seconds elapsed'}
                </span>
              </div>

              {status === 'typing' && (
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="text-slate-400 text-xs mr-1">Live WPM:</span>
                    <span className="text-amber-600 font-bold font-mono text-lg">{netWpm}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs mr-1">Accuracy:</span>
                    <span className="text-emerald-600 font-bold font-mono text-lg">{accuracy}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* SLEEK FRAMELESS CANVAS */}
            <div
              onClick={() => inputRef.current && inputRef.current.focus()}
              className="w-full bg-white/80 border border-slate-200/60 rounded-2xl p-6 sm:p-8 cursor-text shadow-sm relative h-[200px] sm:h-[220px] overflow-hidden flex flex-col justify-start transition-all duration-200"
            >
              {/* Hidden Input Catching Keystrokes */}
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-text z-10"
                autoFocus
              />

              {/* SMOOTH SCROLLING WORDS CONTAINER */}
              <div
                ref={wordsContainerRef}
                style={{ transform: `translateY(${lineTranslateY}px)` }}
                className="flex flex-wrap gap-x-3 gap-y-3.5 text-xl sm:text-2xl font-mono leading-relaxed select-none text-slate-400 transition-transform duration-300 ease-out"
              >
                {words.map((word, wordIdx) => {
                  const isCurrentWord = wordIdx === currWordIdx;
                  const isTypedWord = wordIdx < currWordIdx;

                  return (
                    <div
                      key={wordIdx}
                      ref={isCurrentWord ? activeWordRef : null}
                      className={`relative flex items-center rounded px-0.5 transition-colors ${isCurrentWord ? 'bg-amber-50/60' : ''
                        }`}
                    >
                      {word.split('').map((char, charIdx) => {
                        let charStyle = "text-slate-400"; // default untyped

                        if (isTypedWord) {
                          charStyle = "text-slate-800 font-semibold";
                        } else if (isCurrentWord) {
                          if (charIdx < userInput.length) {
                            if (userInput[charIdx] === char) {
                              charStyle = "text-amber-600 font-bold";
                            } else {
                              charStyle = "text-red-500 font-bold bg-red-100/80 rounded-xs px-0.5";
                            }
                          }
                        }

                        const isCaretHere = isCurrentWord && charIdx === userInput.length;

                        return (
                          <span key={charIdx} className={`relative ${charStyle}`}>
                            {/* Caret */}
                            {isCaretHere && (
                              <span className="absolute -left-0.5 top-0.5 bottom-0.5 w-[2.5px] bg-amber-500 rounded-full animate-pulse" />
                            )}
                            {char}
                          </span>
                        );
                      })}

                      {/* Extra typed characters */}
                      {isCurrentWord && userInput.length > word.length && (
                        <span className="text-red-600 font-bold bg-red-100/80 rounded-xs px-0.5 relative">
                          <span className="absolute -right-0.5 top-0.5 bottom-0.5 w-[2.5px] bg-amber-500 rounded-full animate-pulse" />
                          {userInput.slice(word.length)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-semibold text-slate-400 bg-gradient-to-t from-white via-white/80 to-transparent py-1 pointer-events-none">
                Click canvas or press any key to focus
              </div>
            </div>

            {/* Restart Control Button */}
            <div className="flex flex-col items-center justify-center mt-4 gap-1">
              <button
                onClick={resetTest}
                className="p-2.5 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-amber-600 hover:border-amber-400 hover:shadow-xs transition group"
                title="Restart Test (Tab + Enter)"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                press <kbd className="px-1 py-0.5 bg-slate-200/80 rounded text-slate-700 font-bold">tab</kbd> + <kbd className="px-1 py-0.5 bg-slate-200/80 rounded text-slate-700 font-bold">enter</kbd> to restart
              </span>
            </div>

          </div>
        ) : (
          /* 3. MONKEYTYPE RESULT SCREEN - CLEAN, FRAMELESS, BALANCED FONTS */
          <div className="w-full space-y-6 my-2 animate-in fade-in zoom-in-95 duration-300">

            {/* Top WPM & Qualification Row - FRAMELESS & BALANCED FONTS */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 py-2 px-1">

              {/* Primary WPM & Acc Hero Numbers (MODERATE BALANCED FONT SIZES) */}
              <div className="flex items-center gap-8 sm:gap-12">
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">wpm</div>
                  <div className="text-4xl sm:text-5xl font-black text-amber-500 font-mono tracking-tight">
                    {netWpm}
                  </div>
                </div>

                <div className="h-12 w-px bg-slate-200" />

                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">acc</div>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-500 font-mono tracking-tight">
                    {accuracy}%
                  </div>
                </div>
              </div>

              {/* Qualification Status Badge - CLEAN FRAMELESS PILL */}
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200/60 rounded-2xl px-4 py-2.5">
                {isSscQualified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <span className={`text-xs sm:text-sm font-extrabold block ${isSscQualified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isSscQualified ? 'QUALIFIED FOR SSC CGL' : 'PRACTICE NEEDED FOR 35 WPM'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Target: 35 WPM @ 95% Acc</span>
                </div>
              </div>

            </div>

            {/* PERFORMANCE SVG GRAPH - SLEEK FRAMELESS CARD */}
            <div className="w-full bg-white/70 border border-slate-200/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Performance Over Time</span>
                </h3>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> WPM
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-dashed stroke-slate-600 inline-block" /> Raw WPM
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Errors
                  </span>
                </div>
              </div>

              {/* REFINED TALL SVG GRAPH CANVAS */}
              <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-50/60 rounded-xl p-3 border border-slate-100 overflow-hidden flex flex-col justify-end">
                {historyData.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 50, 100, 150].map((val) => {
                      const y = 260 - (val / 150) * 220;
                      return (
                        <g key={val}>
                          <line x1="0" y1={y} x2="1000" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                          <text x="6" y={y - 4} fill="#94a3b8" fontSize="11" fontWeight="bold">
                            {val} wpm
                          </text>
                        </g>
                      );
                    })}

                    {(() => {
                      const maxWpm = Math.max(100, ...historyData.map((d) => Math.max(d.wpm, d.rawWpm)));
                      const pointsWpm = historyData.map((d, idx) => {
                        const x = (idx / (historyData.length - 1)) * 1000;
                        const y = 260 - (d.wpm / maxWpm) * 220;
                        return { x, y, data: d };
                      });

                      const pointsRaw = historyData.map((d, idx) => {
                        const x = (idx / (historyData.length - 1)) * 1000;
                        const y = 260 - (d.rawWpm / maxWpm) * 220;
                        return { x, y };
                      });

                      const pathWpmStr = pointsWpm.reduce((acc, p, i, a) => {
                        if (i === 0) return `M ${p.x} ${p.y}`;
                        const prev = a[i - 1];
                        const cx = (prev.x + p.x) / 2;
                        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
                      }, '');

                      const pathRawStr = pointsRaw.reduce((acc, p, i, a) => {
                        if (i === 0) return `M ${p.x} ${p.y}`;
                        const prev = a[i - 1];
                        const cx = (prev.x + p.x) / 2;
                        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
                      }, '');

                      const areaStr = `${pathWpmStr} L 1000 260 L 0 260 Z`;

                      return (
                        <>
                          <path d={areaStr} fill="url(#wpmGradient)" />
                          <path d={pathRawStr} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
                          <path d={pathWpmStr} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                          {pointsWpm.map((p, idx) => (
                            <g key={idx}>
                              {p.data.errors > 0 && (
                                <circle cx={p.x} cy="260" r="4" fill="#ef4444" />
                              )}
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredGraphPoint?.sec === p.data.sec ? "6" : "3"}
                                fill="#f59e0b"
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredGraphPoint(p.data)}
                              />
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                    Complete test session to view performance graph
                  </div>
                )}

                {hoveredGraphPoint && (
                  <div className="absolute top-3 right-3 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-0.5 animate-in fade-in duration-150">
                    <div className="font-bold text-amber-400">Second {hoveredGraphPoint.sec}s</div>
                    <div>WPM: <span className="font-bold">{hoveredGraphPoint.wpm}</span></div>
                    <div>Raw WPM: <span className="font-bold text-slate-300">{hoveredGraphPoint.rawWpm}</span></div>
                    <div>Errors: <span className="font-bold text-red-400">{hoveredGraphPoint.errors}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* SECONDARY STATS - FRAMELESS INLINE ROW (NO BOXY BORDERS!) */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-2 border-t border-b border-slate-200/60 font-mono text-xs text-slate-600">

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">raw wpm</span>
                <span className="text-base font-extrabold text-slate-800">{rawWpm}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">consistency</span>
                <span className="text-base font-extrabold text-slate-800">{consistency}%</span>
              </div>

              {/* INLINE CHARACTER BREAKDOWN */}
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">characters</span>
                <div className="text-sm font-extrabold flex items-center gap-1.5 pt-0.5">
                  <span className="text-emerald-600" title="Correct">{correctCharsCount}</span>/
                  <span className="text-red-500" title="Wrong">{errorCharsCount}</span>/
                  <span className="text-amber-600" title="Extra">{extraCharsCount}</span>/
                  <span className="text-slate-400" title="Lost">{missedCharsCount}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">test type</span>
                <span className="text-xs font-extrabold text-slate-700 capitalize">{mode} {duration}s</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">time taken</span>
                <span className="text-base font-extrabold text-slate-800">{actualTimeTaken}s</span>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={resetTest}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition hover:scale-105"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Next Test</span>
              </button>

              <button
                onClick={resetTest}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Repeat Test</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`I scored ${netWpm} WPM with ${accuracy}% accuracy on Education Masters typing benchmark!`);
                  alert('Result copied to clipboard!');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Result</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Global Footer */}
      <Footer />

      {/* Navigation Modals */}
      <TypingTestModal isOpen={isTypingModalOpen} onClose={() => setIsTypingModalOpen(false)} />
      <MockTestModal isOpen={isMockModalOpen} onClose={() => setIsMockModalOpen(false)} />
    </div>
  );
}
