import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';
import {
  Merge,
  Scissors,
  Baseline,
  Droplet,
  Grid,
  InvertColors,
} from 'lucide-react';

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
      "name": "Combine 4 pages into 1",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.url}/four-in-one`
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

const FeatureCard = ({ href, icon: Icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) => (
    <Link href={href} className="flex-1">
        <div className="h-full bg-card p-6 rounded-2xl flex flex-col items-center text-center w-full border hover:border-accent hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="bg-primary/10 text-primary rounded-full p-3">
                {Icon}
            </div>
            <p className="mt-4 font-bold text-primary text-lg">{title}</p>
            <p className="mt-2 text-sm text-foreground/70">{description}</p>
        </div>
    </Link>
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
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight tracking-tighter">
                FenrirPDF: Your Free &amp; Private PDF Toolkit
              </h1>
              <p className="mt-3 text-base text-foreground/80 max-w-2xl mx-auto">
                Merge, Extract, and More. No Uploads. Ever.
              </p>
            </div>
            
            <div className="p-2 rounded-3xl animated-border">
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FeatureCard 
                        href="/merge" 
                        title="Merge PDFs" 
                        description="Combine multiple PDFs into one."
                        icon={<Merge size={24} />} 
                      />
                      <FeatureCard 
                        href="/extract" 
                        title="Extract & Reorder" 
                        description="Reorder, rotate, and delete pages." 
                        icon={<Scissors size={24} />}
                      />
                      <FeatureCard 
                        href="/number" 
                        title="Add Page Numbers" 
                        description="Insert page numbers into your PDF." 
                        icon={<Baseline size={24} />}
                      />
                      <FeatureCard 
                        href="/watermark" 
                        title="Add Watermark" 
                        description="Stamp text or an image over your PDF."
                        icon={<Droplet size={24} />}
                      />
                      <FeatureCard 
                        href="/invert" 
                        title="Invert Colors" 
                        description="Invert the colors of your PDF."
                        icon={<InvertColors size={24} />}
                      />
                       <FeatureCard 
                        href="/four-in-one" 
                        title="4-in-1 Pages" 
                        description="Combine 4 pages into a single page."
                        icon={<Grid size={24} />}
                      />
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-center text-xs text-foreground/60">
                All processing is done locally in your browser for 100% privacy.
            </p>
        </div>
      </div>
    </div>
  );
}
