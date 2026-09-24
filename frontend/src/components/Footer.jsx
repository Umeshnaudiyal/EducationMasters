'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white text-slate-800 font-sans border-t border-slate-200">

      {/* 1. TOP WHITE SECTION (FULL SCREEN WIDTH & ENHANCED HEADING FONT SIZES) */}
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16 items-start justify-between">

          {/* Column 1: Reduced Logo (No Cap), Description, Socials & DMCA Badge */}
          <div className="space-y-4">

            {/* Official Brand Logo Image (logo.webp) */}
            <Link href="/" className="inline-block hover:opacity-95 transition cursor-pointer">
              <img 
                src="/logo.webp" 
                alt="Education Masters" 
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>

            {/* Accent Line */}
            <div className="w-12 h-0.5 bg-slate-300" />

            {/* Description Text */}
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-semibold">
              Gk in Hindi | General Knowledge In Hindi | GK Notes in Hindi | All subject wise notes for Govt. job.
            </p>

            {/* Follow Us */}
            <div className="space-y-2.5 pt-2">
              <h4 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">Follow us:</h4>
              <div className="flex items-center gap-2.5">

                {/* Telegram */}
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border-2 border-blue-400 bg-white text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition shadow-xs"
                  title="Telegram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border-2 border-emerald-400 bg-white text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition shadow-xs"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.18 8.18 0 01-5.82 2.42c-1.42 0-2.81-.37-4.04-1.09l-.29-.17-3.01.79.8-2.93-.19-.3a8.17 8.17 0 01-1.25-4.34c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.58c-.19-.1-.13-.3-1.04-.75s-1.07-.44-1.22-.22c-.15.22-.58.73-.71.88-.13.15-.26.17-.48.07a6.04 6.04 0 01-1.78-1.1 6.64 6.64 0 01-1.23-1.53c-.13-.22-.01-.34.09-.44.09-.09.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39s-.58-1.4-.8-1.92c-.21-.5-.43-.43-.59-.44l-.5-.01c-.17 0-.44.06-.67.31s-.88.86-.88 2.1c0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79 2.52 1.09 2.52.73 2.97.68.45-.04 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.42-.26z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border-2 border-blue-400 bg-white text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition shadow-xs"
                  title="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34V21.9C18.34 21.12 22 16.99 22 12z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl border-2 border-blue-400 bg-white text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition shadow-xs"
                  title="LinkedIn"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.66a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                  </svg>
                </a>

              </div>
            </div>

            {/* Official DMCA Protected Badge Graphic (Matching Screenshot 2) */}
            <div className="pt-2">
              <Link
                href="/disclaimer"
                className="inline-flex items-center cursor-pointer hover:opacity-95 transition no-underline"
                title="DMCA & Copyright Protection Policy"
              >
                {/* Circle Lock Container */}
                <div className="w-11 h-11 rounded-full border-[4px] border-[#65a30d] bg-white flex items-center justify-center shrink-0 z-10 -mr-2.5 shadow-2xs">
                  <svg className="w-6 h-6 fill-[#65a30d]" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
                {/* Filled Green Rectangle Badge */}
                <div className="bg-[#65a30d] text-white pl-5 pr-4 py-2 rounded-r-md flex flex-col justify-center leading-none shadow-2xs">
                  <span className="text-lg font-black tracking-wider text-white font-sans uppercase">DMCA</span>
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-widest -mt-0.5">PROTECTED</span>
                </div>
              </Link>
            </div>

          </div>

          {/* Column 2: Popular Exam */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-xl sm:text-2xl tracking-tight">
              Popular Exam
            </h3>
            <div className="w-14 h-1 bg-slate-400 -mt-2" />

            <ul className="space-y-3 text-base sm:text-lg font-semibold">
              <li><Link href="/category/railway" className="text-blue-600 hover:text-blue-800 hover:underline transition">Railway</Link></li>
              <li><Link href="/category/upsc" className="text-blue-600 hover:text-blue-800 hover:underline transition">UPSC</Link></li>
              <li><Link href="/category/defence" className="text-blue-600 hover:text-blue-800 hover:underline transition">Defence</Link></li>
              <li><Link href="/category/ssc" className="text-blue-600 hover:text-blue-800 hover:underline transition">SSC</Link></li>
              <li><Link href="/category/bank" className="text-blue-600 hover:text-blue-800 hover:underline transition">Bank</Link></li>
            </ul>
          </div>

          {/* Column 3: Important Links */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-xl sm:text-2xl tracking-tight">
              Important Links
            </h3>
            <div className="w-14 h-1 bg-slate-400 -mt-2" />

            <ul className="space-y-3 text-base sm:text-lg font-semibold">
              <li><Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline transition">Home</Link></li>
              <li><Link href="/disclaimer" className="text-blue-600 hover:text-blue-800 hover:underline transition">Disclaimer</Link></li>
              <li><Link href="/terms-of-service#contact" className="text-blue-600 hover:text-blue-800 hover:underline transition">Contact Us</Link></li>
              <li><Link href="/syllabus" className="text-blue-600 hover:text-blue-800 hover:underline transition">Syllabus</Link></li>
              <li><Link href="/terms-of-service" className="text-blue-600 hover:text-blue-800 hover:underline transition">Terms of Service</Link></li>
            </ul>
          </div>


          {/* Column 4: Our Partners & Authentic Payment Logos */}
          <div className="space-y-5">
            <h3 className="font-black text-slate-900 text-xl sm:text-2xl tracking-tight">
              Our Partners
            </h3>
            <div className="w-14 h-1 bg-slate-400 -mt-3" />

            {/* Authentic Partners Logos */}
            <div className="space-y-4">

              {/* EXACT AUTHENTIC DSOM LOGO */}
              <a 
                href="https://dsom.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-start hover:opacity-95 transition no-underline"
              >
                <div className="flex items-center gap-2">
                  {/* 3D Shiny Blue Globe Sphere */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 via-sky-400 to-cyan-200 shadow-md flex items-center justify-center border border-sky-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)]" />
                    <div className="w-6 h-6 border border-white/60 rounded-full" />
                  </div>
                  {/* Dark Blue DSOM Text */}
                  <span className="text-2xl font-black text-[#1e3a8a] tracking-wider font-serif">
                    DSOM
                  </span>
                </div>
                {/* Yellow/Orange Banner Subtext */}
                <div className="bg-[#f97316] text-white text-[9px] font-bold px-2 py-0.5 rounded-xs mt-1 tracking-tight">
                  Dehradun School of Online Marketing
                </div>
              </a>

              {/* EXACT AUTHENTIC ADXVENTURE LOGO */}
              <a 
                href="https://adxventure.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex flex-col items-start hover:opacity-95 transition pt-1 no-underline"
              >
                <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight">
                  <span className="text-black">Ad</span>
                  <span className="text-[#007bff] font-extrabold mx-[1px]">x</span>
                  <span className="bg-[#007bff] text-white px-1.5 py-0.5 rounded-xs font-black">Venture</span>
                </div>
                <span className="text-[10px] text-slate-700 font-semibold tracking-tight ml-0.5">
                  Business to Brand
                </span>
              </a>

            </div>

            {/* EXACT AUTHENTIC PAYMENT CARDS LOGOS ROW (MATCHING SCREENSHOT 2) */}
            <div className="pt-2">
              <div className="flex items-center gap-3 flex-wrap">

                {/* Authentic MasterCard Logo (Overlapping Red & Yellow Circles) */}
                <div className="h-8 px-2.5 bg-white rounded border border-slate-200/90 shadow-2xs flex items-center justify-center" title="MasterCard">
                  <svg className="h-5 w-8" viewBox="0 0 36 24">
                    <circle cx="13" cy="12" r="9" fill="#EB001B" />
                    <circle cx="23" cy="12" r="9" fill="#F79E1B" />
                    <path d="M18 5.68a8.96 8.96 0 0 1 3.16 6.32c0 2.53-1.15 4.8-3.16 6.32a8.96 8.96 0 0 1-3.16-6.32c0-2.53 1.15-4.8 3.16-6.32z" fill="#FF5F00" />
                  </svg>
                </div>

                {/* Authentic VISA Logo (Italic Dark Blue with Gold Slash) */}
                <div className="h-8 px-2.5 bg-white rounded border border-slate-200/90 shadow-2xs flex items-center justify-center" title="VISA">
                  <span className="text-base font-black italic tracking-tighter text-[#1a1f71] flex items-center">
                    <span className="text-[#f7b600] font-black -mr-[1px] font-sans">V</span>ISA
                  </span>
                </div>

                {/* Authentic Maestro Logo (Overlapping Blue & Red Circles) */}
                <div className="h-8 px-2.5 bg-white rounded border border-slate-200/90 shadow-2xs flex items-center justify-center" title="Maestro">
                  <svg className="h-5 w-8" viewBox="0 0 36 24">
                    <circle cx="13" cy="12" r="9" fill="#0099DF" />
                    <circle cx="23" cy="12" r="9" fill="#EB001B" />
                    <path d="M18 5.68a8.96 8.96 0 0 1 3.16 6.32c0 2.53-1.15 4.8-3.16 6.32a8.96 8.96 0 0 1-3.16-6.32c0-2.53 1.15-4.8 3.16-6.32z" fill="#7362AA" />
                  </svg>
                </div>

                {/* Authentic Visa Electron Logo */}
                <div className="h-8 px-2 bg-[#1a1f71] rounded text-white flex flex-col justify-center items-center shadow-2xs leading-tight" title="Visa Electron">
                  <span className="text-[10px] font-black tracking-tighter text-white uppercase italic">VISA</span>
                  <span className="text-[7px] font-bold tracking-widest text-sky-300 uppercase -mt-0.5">Electron</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. MIDDLE DARK BLUE SANSKRIT SLOKA BAR */}
      <div className="bg-[#264356] text-white py-6 px-4 sm:px-6 text-center border-t border-b border-slate-700/60 shadow-inner">
        <div className="max-w-6xl mx-auto space-y-2">
          <p className="text-base sm:text-lg md:text-xl font-bold tracking-wide text-amber-300 font-serif leading-relaxed drop-shadow-xs">
            विद्या ददाति विनयं विनयाद् याति पात्रताम् । पात्रत्वात् धनमाप्नोति धनात् धर्मं ततः सुखम् ॥
          </p>
          <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium pt-0.5">
            अर्थ–विद्या विनय (विनम्रता) देती है, विनय से पात्रता (योग्यता) आती है, पात्रता से धन आता है, धन से धर्म होता है, और धर्म से सुख प्राप्त होता है।
          </p>
        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT & POWERED BY BAR */}
      <div className="bg-white text-slate-600 text-xs py-4 px-6 sm:px-10 lg:px-16 border-t border-slate-100">
        <div className="w-full max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600 text-[11px] sm:text-xs">
            © {new Date().getFullYear()} Education Masters. All rights reserved
          </p>

          <div className="font-medium text-slate-600 text-[11px] sm:text-xs flex items-center gap-1">
            <span>Powered by:</span>
            <a href="https://adxventure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Adxventure</a>
          </div>
        </div>
      </div>

    </footer>
  );
}

