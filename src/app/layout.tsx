import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/Footer';

const siteConfig = {
  name: 'fenrirPDF',
  url: 'https://fenrirpdf.netlify.app',
  ogImage: 'https://fenrirpdf.netlify.app/og-image.png',
  description: 'Merge, extract, reorder, watermark, and combine PDF files with ease. Your free, fast, and private online PDF tool for all your document needs.',
  author: 'Fenrir',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: Free & Fast Online PDF Tools - Merge, Extract, Watermark`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'PDF tools', 
    'Merge PDF', 
    'Extract PDF', 
    'Reorder PDF',
    'Watermark PDF',
    'Number PDF',
    'Invert PDF colors',
    '4 in 1 page pdf',
    'Combine PDF pages',
    'Online PDF Editor', 
    'Free PDF tool',
    'PDF merger',
    'PDF extractor',
    'PDF combiner',
    'PDF page remover',
    'fenrirpdf',
  ],
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    url: siteConfig.url,
    title: {
        default: `${siteConfig.name}: Free & Fast Online PDF Tools`,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Banner for ${siteConfig.name}`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
        default: `${siteConfig.name}: Free & Fast Online PDF Tools`,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: `@${siteConfig.author}`,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    // Add your Google Search Console verification tag here
    // google: 'your-google-verification-code',
  },
  category: 'Productivity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#293B5F" />
      </head>
      <body className="font-body antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
