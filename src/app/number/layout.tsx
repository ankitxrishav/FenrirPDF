
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Page Numbers to PDF Online Free | fenrirPDF',
  description: 'Insert page numbers into your PDF documents online. Customize position and style. 100% free, private, and browser-only — your files never leave your device.',
  alternates: {
    canonical: '/number',
  },
  openGraph: {
    title: 'Add Page Numbers to PDF Online Free | fenrirPDF',
    description: 'Insert page numbers into your PDF online. Customizable position and style. Free and 100% private.',
    url: '/number',
  },
  twitter: {
    title: 'Add Page Numbers to PDF Online Free | fenrirPDF',
    description: 'Insert page numbers into your PDF online. Customizable position and style. Free and 100% private.',
  },
};

export default function NumberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
