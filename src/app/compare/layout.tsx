import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare PDF Text | FenrirPDF',
  description: 'Compare the text contents of two PDF documents and inspect additions and deletions highlighted side-by-side. 100% private, client-side PDF comparison.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
