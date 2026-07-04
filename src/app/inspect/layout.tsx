import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Inspector & Metadata Editor | FenrirPDF',
  description: 'View PDF metadata, version details, technical specifications, and edit PDF fields (Title, Author, Subject, Keywords) 100% locally in your browser.',
};

export default function InspectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
