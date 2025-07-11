import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

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

const FeatureCard = ({ href, icon: Icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) => (
    <Link href={href} className="flex-1">
        <div className="h-full bg-card/80 p-6 rounded-2xl border border-transparent hover:border-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center w-full">
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
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight tracking-tighter">
                FenrirPDF: Your Free &amp; Private PDF Toolkit
              </h1>
              <p className="mt-3 text-base text-foreground/80 max-w-2xl mx-auto">
                Merge, Extract, and More. No Uploads. Ever.
              </p>
            </div>
            
            <div className="p-2 rounded-3xl animated-border-container">
              <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <FeatureCard 
                        href="/merge" 
                        title="Merge PDFs" 
                        description="Combine multiple PDFs into one."
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} 
                      />
                      <FeatureCard 
                        href="/extract" 
                        title="Extract & Reorder" 
                        description="Reorder, rotate, and delete pages." 
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      />
                      <FeatureCard 
                        href="/number" 
                        title="Add Page Numbers" 
                        description="Insert page numbers into your PDF." 
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12H10.5C11.3284 12 12 12.6716 12 13.5V13.5C12 14.3284 11.3284 15 10.5 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 15V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 18H15.5C16.3284 18 17 17.3284 17 16.5V13.5C17 12.6716 16.3284 12 15.5 12H14V18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      />
                      <FeatureCard 
                        href="/watermark" 
                        title="Add Watermark" 
                        description="Stamp text or an image over your PDF."
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.125 18C10.8351 16.9942 11.1649 15.0058 11.875 14C12.5518 15.0053 12.8795 16.9922 13.5625 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
