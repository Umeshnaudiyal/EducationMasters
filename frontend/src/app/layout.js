import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  title: "Education Masters - #1 Govt Job Prep, MCQs, Current Affairs & Mock Tests",
  description: "India's leading guide for government jobs exam preparation, 15 Million+ student trust platform for MCQs, Syllabus, Admit Cards, Results, Current Affairs, and Typing Tests.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.className} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

