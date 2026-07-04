import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clean PDF Pages | FenrirPDF',
  description: 'Detect and remove blank or duplicate pages in scanned documents. Clean your PDFs 100% locally in your browser with privacy.',
};

export default function CleanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
