
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extract & Reorder PDF Pages Online Free | fenrirPDF',
  description: 'Extract specific pages from a PDF, reorder them, and delete unwanted pages. Download your perfectly organized PDF instantly. 100% free, browser-only, 100% private.',
  alternates: {
    canonical: '/extract',
  },
  openGraph: {
    title: 'Extract & Reorder PDF Pages Online Free | fenrirPDF',
    description: 'Extract, reorder, and delete PDF pages easily. Download your organized PDF instantly. Free and private.',
    url: '/extract',
  },
  twitter: {
    title: 'Extract & Reorder PDF Pages Online Free | fenrirPDF',
    description: 'Extract, reorder, and delete PDF pages easily. Download your organized PDF instantly. Free and private.',
  },
};

export default function ExtractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
