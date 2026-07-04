import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Protect PDF with Password | FenrirPDF',
  description: 'Encrypt your PDF with a password to restrict unauthorized access. Client-side RC4 128-bit security handler runs 100% in your browser.',
};

export default function ProtectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
