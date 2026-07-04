import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OCR & Make Searchable PDF | FenrirPDF',
  description: 'Make scanned, image-only PDF documents fully searchable and selectable in your browser. 100% client-side WebAssembly character recognition.',
};

export default function OcrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
