import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Extract Images from PDF | FenrirPDF',
  description: 'Extract all embedded PNG and JPG images from any PDF document at native resolution. Free, private, and runs entirely in your browser.',
};

export default function ExtractImagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
