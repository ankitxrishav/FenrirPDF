import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

const siteConfig = {
  name: 'fenrirPDF',
  url: 'https://fenrirpdf.netlify.app',
  description: 'Your everyday PDF tool – lightweight, fast, no signup. Merge multiple PDFs into one, or extract and reorder pages from a single PDF. All done locally in your browser for ultimate privacy.',
};

export const metadata: Metadata = {
  title: 'Free Online PDF Tools - Merge, Extract & Reorder | fenrirPDF',
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Free Online PDF Tools - Merge, Extract & Reorder | fenrirPDF',
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
     title: 'Free Online PDF Tools - Merge, Extract & Reorder | fenrirPDF',
    description: siteConfig.description,
  }
};

const JsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": siteConfig.url,
  "name": "fenrirPDF",
  "description": siteConfig.description,
  "potentialAction": [
    {
      "@type": "Action",
      "name": "Merge PDF Files",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/merge`
      }
    },
    {
      "@type": "Action",
      "name": "Extract PDF Pages",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/extract`
      }
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "fenrirPDF",
    "logo": {
      "@type": "ImageObject",
      "url": `${siteConfig.url}/apple-touch-icon.png`
    }
  }
};

const MergeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 2H12C10.9 2 10.01 2.9 10.01 4L10 38C10 39.1 10.9 40 12 40H30C31.1 40 32 39.1 32 38V4C32 2.9 31.1 2 30 2ZM28 32H24V28H20V32H16V20H28V32Z" fill="currentColor"/>
      <path d="M36 8H34V42C34 43.1 33.1 44 32 44H14V46H32C34.21 46 36 44.21 36 42V8Z" fill="currentColor" className="opacity-70"/>
    </svg>
);

const ExtractIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 2H12C9.79 2 8 3.79 8 6V42C8 44.21 9.79 46 12 46H36C38.21 46 40 44.21 40 42V10L32 2ZM28 28H16V24H28V28ZM28 20H16V16H28V20ZM30 12V4H38L30 12Z" fill="currentColor"/>
    </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col h-full font-sans bg-background">
       <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JsonLd) }}
        />
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden animated-border">
            <div className="p-8 md:p-12 md:py-20">
                <div className="mb-10 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight tracking-tighter">
                    Merge. Extract. Done.
                  </h1>
                  <p className="mt-4 text-lg text-foreground/80">
                    Your everyday PDF tool – lightweight, fast, no signup.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/merge">
                    <div className="text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <MergeIcon />
                      <p className="mt-4 font-bold text-xl text-primary">Merge PDFs</p>
                    </div>
                  </Link>
                  <Link href="/extract">
                    <div className="text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center">
                      <ExtractIcon />
                      <p className="mt-4 font-bold text-xl text-primary">Extract & Reorder</p>
                    </div>
                  </Link>
                </div>
                
                <p className="mt-10 text-center text-sm text-foreground/60">
                    All processing is done locally in your browser.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
