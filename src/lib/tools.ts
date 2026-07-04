/**
 * Single source of truth for all FenrirPDF tools.
 * Used by the homepage feature cards and the sitemap.
 * Add new tools here first – the rest of the UI picks them up automatically.
 */

export interface Tool {
  slug: string;
  title: string;
  description: string;
  /** Lucide icon name (imported separately in each page that needs it) */
  iconName: string;
  /** Sitemap priority (0–1) */
  priority: number;
  /** Short description for SEO meta */
  metaDescription: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'four-in-one',
    title: 'Combine PDF Pages',
    description: 'Arrange multiple pages onto a single sheet.',
    iconName: 'Grid',
    priority: 0.9,
    metaDescription: 'Combine multiple PDF pages onto a single sheet. Free, fast, and 100% private — no uploads, no sign-up.',
  },
  {
    slug: 'invert',
    title: 'Invert PDF Colors',
    description: 'Selectively invert the colors of specific pages.',
    iconName: 'RefreshCcw',
    priority: 0.9,
    metaDescription: 'Invert colors of specific PDF pages for dark-mode printing or night reading. Free, browser-only tool.',
  },
  {
    slug: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert images into a single PDF.',
    iconName: 'Image',
    priority: 0.9,
    metaDescription: 'Convert JPG and PNG images to PDF instantly. Drag to reorder, choose layout. Free, private, browser-side only.',
  },
  {
    slug: 'merge',
    title: 'Merge PDFs',
    description: 'Combine multiple PDFs into one.',
    iconName: 'Merge',
    priority: 0.8,
    metaDescription: 'Merge multiple PDF files into one document online. Free PDF merger — no uploads, no sign-up, 100% private.',
  },
  {
    slug: 'extract',
    title: 'Extract & Reorder',
    description: 'Reorder and delete pages from your PDF.',
    iconName: 'Scissors',
    priority: 0.8,
    metaDescription: 'Extract specific pages from a PDF, reorder them, and delete unwanted pages. Free, browser-only, 100% private.',
  },
  {
    slug: 'rotate',
    title: 'Rotate Pages',
    description: 'Rotate PDF pages clockwise or counter-clockwise.',
    iconName: 'RotateCw',
    priority: 0.8,
    metaDescription: 'Rotate individual pages in your PDF document. Free, browser-only, 100% private.',
  },
  {
    slug: 'number',
    title: 'Add Page Numbers',
    description: 'Insert page numbers into your PDF.',
    iconName: 'Baseline',
    priority: 0.7,
    metaDescription: 'Add page numbers to your PDF documents online. Customize position and style. Free, private, no server uploads.',
  },
  {
    slug: 'watermark',
    title: 'Add Watermark',
    description: 'Stamp text or an image over your PDF.',
    iconName: 'Droplet',
    priority: 0.7,
    metaDescription: 'Add a custom text or image watermark to your PDF. Live preview, customizable rotation and opacity. Free and private.',
  },
  {
    slug: 'inspect',
    title: 'PDF Inspector',
    description: 'View document metadata, fonts, version, and edit details.',
    iconName: 'Info',
    priority: 0.7,
    metaDescription: 'Inspect PDF metadata, fonts, version details, and easily edit PDF title or author. 100% private.',
  },
  {
    slug: 'ocr',
    title: 'OCR Searchable PDF',
    description: 'Recognize text and add a searchable text layer to scans.',
    iconName: 'FileSearch',
    priority: 0.8,
    metaDescription: 'Make scanned PDFs searchable with client-side OCR. Selectable text and invisible overlays. 100% private.',
  },
  {
    slug: 'extract-images',
    title: 'Extract Images',
    description: 'Pull embedded raster image assets out of your PDF.',
    iconName: 'DownloadCloud',
    priority: 0.7,
    metaDescription: 'Extract embedded PNG and JPG images from any PDF document. Save individually or as a ZIP. 100% private.',
  },
  {
    slug: 'long-image',
    title: 'PDF to Long Image',
    description: 'Stitch PDF pages together into one tall vertical image.',
    iconName: 'FileImage',
    priority: 0.7,
    metaDescription: 'Stitch all PDF pages vertically into one long PNG/JPG file. Ideal for sharing. 100% private.',
  },
  {
    slug: 'clean',
    title: 'Clean PDF Pages',
    description: 'Find and remove blank or duplicate pages.',
    iconName: 'FileSpreadsheet',
    priority: 0.7,
    metaDescription: 'Analyze your PDF to find blank or duplicate pages, and remove them instantly. 100% private.',
  },
  {
    slug: 'compare',
    title: 'Compare PDFs',
    description: 'Upload two PDF documents and inspect text changes.',
    iconName: 'BookOpen',
    priority: 0.7,
    metaDescription: 'Compare the text content of two PDF documents and view highlighted differences. 100% private.',
  },
  {
    slug: 'protect',
    title: 'Protect PDF',
    description: 'Encrypt your PDF with a password to restrict access.',
    iconName: 'Lock',
    priority: 0.8,
    metaDescription: 'Add password protection and strong encryption to your PDF document. Secure PDF files 100% locally in your browser.',
  },
];

export const BASE_URL = 'https://fenrirpdf.netlify.app';
