import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';
import { Merge, Scissors, FileSignature, ListOrdered } from 'lucide-react';

const siteConfig = {
  name: 'fenrirPDF',
  url: 'https://fenrirpdf.netlify.app',
  description: 'Your everyday PDF tool – lightweight, fast, no signup. Merge and extract pages. All done locally in your browser for ultimate privacy.',
};

export const metadata: Metadata = {
  title: 'Free Online PDF Tools - Merge, Extract, Watermark & Number Pages | fenrirPDF',
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Free Online PDF Tools - Merge & Extract | fenrirPDF',
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
     title: 'Free Online PDF Tools - Merge & Extract | fenrirPDF',
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
    },
    {
      "@type": "Action",
      "name": "Add Page Numbers to PDF",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/number`
      }
    },
    {
      "@type": "Action",
      "name": "Watermark PDF",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/watermark`
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

export default function Home() {
  return (
    <div className="flex flex-col h-full font-sans bg-background">
       <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JsonLd) }}
        />
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden animated-border">
            <div className="p-8 md:p-12">
                <div className="mb-10 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight tracking-tighter">
                    Simple, Private, Free PDF Tools
                  </h1>
                  <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
                    Your everyday PDF tool – lightweight, fast, no signup. All processing is done locally in your browser.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/merge" className="flex">
                    <div className="h-full text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center w-full">
                      <Merge className="w-12 h-12" />
                      <p className="mt-4 font-bold text-xl text-primary">Merge PDFs</p>
                      <p className="mt-2 text-sm text-foreground/70">Combine multiple PDFs into one.</p>
                    </div>
                  </Link>
                  <Link href="/extract" className="flex">
                    <div className="h-full text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center w-full">
                      <Scissors className="w-12 h-12" />
                      <p className="mt-4 font-bold text-xl text-primary">Extract & Reorder</p>
                      <p className="mt-2 text-sm text-foreground/70">Reorder, rotate, and delete pages.</p>
                    </div>
                  </Link>
                   <Link href="/number" className="flex">
                    <div className="h-full text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center w-full">
                      <ListOrdered className="w-12 h-12" />
                      <p className="mt-4 font-bold text-xl text-primary">Add Page Numbers</p>
                      <p className="mt-2 text-sm text-foreground/70">Insert page numbers into your PDF.</p>
                    </div>
                  </Link>
                  <Link href="/watermark" className="flex">
                    <div className="h-full text-primary bg-card/80 p-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center w-full">
                      <FileSignature className="w-12 h-12" />
                      <p className="mt-4 font-bold text-xl text-primary">Add Watermark</p>
                      <p className="mt-2 text-sm text-foreground/70">Stamp text or an image over your PDF.</p>
                    </div>
                  </Link>
                </div>
                
                <p className="mt-10 text-center text-sm text-foreground/60">
                    All processing is done locally in your browser for 100% privacy.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
