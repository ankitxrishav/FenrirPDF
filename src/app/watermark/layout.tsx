
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Watermark to PDF Online Free | fenrirPDF',
  description: 'Stamp a text or image watermark onto your PDF files. Customize rotation, opacity, and size with a live preview. 100% free, private, browser-only — no server uploads.',
  alternates: {
    canonical: '/watermark',
  },
  openGraph: {
    title: 'Add Watermark to PDF Online Free | fenrirPDF',
    description: 'Add text or image watermarks to PDF with live preview. Customize rotation and opacity. Free and private.',
    url: '/watermark',
  },
  twitter: {
    title: 'Add Watermark to PDF Online Free | fenrirPDF',
    description: 'Add text or image watermarks to PDF with live preview. Customize rotation and opacity. Free and private.',
  },
};

export default function WatermarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
