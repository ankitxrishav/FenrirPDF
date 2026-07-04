import { Header } from '@/components/Header';
import type { Metadata } from 'next';
import HomeDashboard from '@/components/HomeDashboard';

const siteConfig = {
  name: 'fenrirPDF',
  url: 'https://fenrirpdf.netlify.app',
  description: 'Your everyday PDF tool – lightweight, fast, no signup. Merge, extract, reorder, watermark, invert colors, and combine pages. All done locally in your browser for ultimate privacy.',
};

export const metadata: Metadata = {
  title: 'Free Online PDF Tools - Merge, Extract, Watermark & More | fenrirPDF',
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Free Online PDF Tools - Merge, Extract & More | fenrirPDF',
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
     title: 'Free Online PDF Tools - Merge, Extract & More | fenrirPDF',
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
      "name": "Combine PDF Pages",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/four-in-one`
      }
    },
    {
      "@type": "Action",
      "name": "Invert PDF Colors",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/invert`
      }
    },
    {
      "@type": "Action",
      "name": "Convert Image to PDF",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/image-to-pdf`
      }
    },
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
    <div className="flex flex-col min-h-screen bg-background">
       <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JsonLd) }}
        />
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                fenrirPDF
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Lightweight, browser-side tools to organize, convert, and edit PDFs.
                <span className="block font-semibold mt-1 text-foreground">100% free. No server uploads. Ever.</span>
              </p>
            </div>
            
            <HomeDashboard />
            
            <p className="text-center text-xs text-muted-foreground">
                All processing is done locally in your browser for 100% privacy.
            </p>
        </div>
      </main>
    </div>
  );
}
