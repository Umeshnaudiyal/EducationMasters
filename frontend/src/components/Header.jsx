'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Search, Keyboard, FileText, ChevronDown, User, LogIn, LogOut, BookOpen, Layers, Award, Sparkles } from 'lucide-react';
import { LoginModal } from './Modals';

const CATEGORIES = [
  'Select Category',
  'G.K.',
  'Latest Jobs',
  'Current Affair',
  'Defence',
  'Biography',
  'Results',
  'Bank',
  'SSC',
  'Railways',
  'Teaching'
];

const SEARCH_SUGGESTIONS = [
  { title: 'SSC CGL Tier 1 Mock Test 2026', category: 'SSC' },
  { title: 'UPSC IAS Prelims Current Affairs MCQ', category: 'Current Affair' },
  { title: 'SBI PO 2026 Syllabus & Exam Pattern', category: 'Bank' },
  { title: 'RRB NTPC CBT-2 Admit Card Download', category: 'Railways' },
  { title: 'English Speed Typing Test (35 WPM)', category: 'Typing Test' },
  { title: 'NDA & CDS Physical Fitness & GK Questions', category: 'Defence' }
];

export default function Header({ onOpenTypingModal, onOpenMockModal }) {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('Select Category');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="bg-[#213547] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">

          {/* 1. LEFT: Hamburger Menu Button + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-white hover:bg-slate-700/60 transition flex items-center justify-center cursor-pointer group"
              aria-label="Open Sidebar Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Brand Logo */}
            <a href="/" className="font-bold text-lg sm:text-2xl text-white tracking-tight hover:opacity-95 transition flex items-center gap-2">
              <span className="whitespace-nowrap">Education Masters</span>
            </a>
          </div>

          {/* 2. CENTER: Central Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2" ref={searchRef}>
            <div className="relative flex w-full bg-white rounded overflow-hidden shadow-sm border border-slate-200">

              {/* Category Selector Dropdown */}
              <div className="relative shrink-0 border-r border-slate-300 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="h-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
                >
                  <span>{selectedCategory}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCatDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-xl py-1 z-50">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition ${selectedCategory === cat ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="What are you searching for?"
                  className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Search Button */}
              <button
                className="bg-[#007bff] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1 transition shrink-0"
              >
                <span>Search</span>
              </button>

              {/* Predictive Autocomplete */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-b shadow-xl z-50 p-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Popular Searches
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSearchQuery(item.title);
                            setIsSearchFocused(false);
                          }}
                          className="px-2 py-2 hover:bg-blue-50 rounded cursor-pointer transition flex items-center justify-between"
                        >
                          <span className="text-xs text-slate-700 font-medium">{item.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                            {item.category}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-2 py-3 text-xs text-slate-400 text-center">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 3. RIGHT: Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Typing Test */}
            <a
              href="/typing-test"
              className="bg-[#00c4d6] hover:bg-[#00b2c3] text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1 sm:gap-1.5 shadow-sm transition hover:scale-105"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Typing Test</span>
            </a>

            {/* Mock Test */}
            <button
              onClick={onOpenMockModal}
              className="bg-[#ffb800] hover:bg-[#eaa800] text-slate-900 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center gap-1 sm:gap-1.5 shadow-sm transition hover:scale-105 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-900" />
              <span className="whitespace-nowrap">Mock Test</span>
            </button>

            {/* NextAuth Login / Profile Button */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                  <User className="w-3.5 h-3.5" />
                  {session.user.name || 'Student'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1.5 rounded flex items-center gap-1 transition shadow-sm cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <a
                href="/edu-login"
                className="bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs px-3 sm:px-4 py-1.5 rounded flex items-center gap-1 shadow-sm transition hover:scale-105 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </a>
            )}

          </div>

        </div>
      </header>

      {/* 4. ANIMATED LEFT HAMBURGER SIDEBAR DRAWER */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/65 backdrop-blur-xs z-[60] transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside 
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-88 bg-[#162534] text-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#111e2b]">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="Education Masters" className="h-10 w-auto object-contain" />
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                Main Menu
              </h4>

              <a 
                href="/" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Home Page</span>
              </a>

              <a 
                href="/jobs" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Latest Jobs (/jobs)</span>
              </a>

              <a 
                href="/admit-cards" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 transition"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Admit Cards (/admit-cards)</span>
              </a>

              <a 
                href="/results" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Exam Results (/results)</span>
              </a>

              <a 
                href="/typing-test" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-cyan-600/20 hover:text-cyan-300 transition"
              >
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span>Typing Test</span>
              </a>

              <a 
                href="/edu-login" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Login / Register Portal</span>
              </a>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#111e2b] space-y-3">
          {session?.user ? (
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout ({session.user.name})</span>
            </button>
          ) : (
            <a
              href="/edu-login"
              className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Portal</span>
            </a>
          )}

          <p className="text-[10px] text-center text-slate-400 font-medium">
            © {new Date().getFullYear()} Education Masters | DigitArtTech
          </p>
        </div>

      </aside>
    </>
  );
}
