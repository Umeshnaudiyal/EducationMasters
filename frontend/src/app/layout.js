import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: false,
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

const globalOrganizationAndWebsiteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://educationmasters.in/#organization',
      'name': 'Education Masters',
      'url': 'https://educationmasters.in/',
      'sameAs': [
        'https://www.facebook.com/educationmasters.in',
        'https://twitter.com/educationmasters',
        'https://t.me/educationmasters'
      ],
      'logo': {
        '@type': 'ImageObject',
        '@id': 'https://educationmasters.in/#logo',
        'url': 'https://educationmasters.in/assets/img/defaults/logo_full.png',
        'contentUrl': 'https://educationmasters.in/assets/img/defaults/logo_full.png',
        'width': 1200,
        'height': 480,
        'caption': 'Education Masters'
      },
      'image': {
        '@id': 'https://educationmasters.in/#logo'
      },
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'contactType': 'Customer Support',
          'email': 'support@educationmasters.in',
          'availableLanguage': ['English', 'Hindi']
        }
      ]
    },
    {
      '@type': 'WebSite',
      '@id': 'https://educationmasters.in/#website',
      'url': 'https://educationmasters.in/',
      'name': 'Education Masters',
      'inLanguage': 'en-IN',
      'description': "India's leading guide for government jobs exam preparation, MCQs, Syllabus, Admit Cards, Results, Current Affairs, and Typing Tests.",
      'publisher': {
        '@id': 'https://educationmasters.in/#organization'
      },
      'potentialAction': [
        {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://educationmasters.in/search?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      ]
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.className} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalOrganizationAndWebsiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-800 font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


