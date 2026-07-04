
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merge PDF Files Online Free | fenrirPDF',
  description: 'Combine multiple PDF files into a single organized document. Drag and drop pages to set order, then download instantly. 100% free, private, no uploads to any server.',
  alternates: {
    canonical: '/merge',
  },
  openGraph: {
    title: 'Merge PDF Files Online Free | fenrirPDF',
    description: 'Combine multiple PDF files into one document. Drag and drop to reorder pages. Free and private.',
    url: '/merge',
  },
  twitter: {
    title: 'Merge PDF Files Online Free | fenrirPDF',
    description: 'Combine multiple PDF files into one document. Drag and drop to reorder pages. Free and private.',
  },
};

export default function MergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
