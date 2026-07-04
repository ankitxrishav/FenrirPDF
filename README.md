# 🐺 fenrirPDF — Private & Local Online PDF Tools

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss" alt="Tailwind CSS">
  <a href="https://fenrirpdf.netlify.app">
    <img src="https://img.shields.io/badge/deployed_on-Netlify-00C7B7?logo=netlify" alt="Deployed on Netlify">
  </a>
</p>

<p align="center">
  <strong>Live Site → <a href="https://fenrirpdf.netlify.app">fenrirpdf.netlify.app</a></strong>
</p>

---

**fenrirPDF** is a lightweight, fast, and privacy-first suite of PDF utilities that runs entirely in your browser. All document manipulation, rendering, OCR, and password encryption is processed 100% locally on your machine. Your files never leave your computer.

---

## ✨ Key Features

### 🛠️ PDF Editing & Layout
- **Merge PDFs**: Combine multiple PDF files into one seamless document.
- **Extract & Reorder**: Reorder, delete, and extract specific pages. Supports multi-level Undo/Redo history.
- **Rotate Pages**: Rotate individual pages or bulk rotate the entire document.
- **Combine Pages**: Arrange pages onto a single sheet (supports 2-in-1, 4-in-1, and 8-in-1 layouts).
- **Invert PDF Colors**: Selectively invert page colors for night reading or dark-mode printing.

### ✍️ Branding & Formatting
- **Add Page Numbers**: Stamp page numbers with customizable positions, offsets, and formats. Supports saving local settings presets.
- **Add Watermark**: Apply custom text or image watermarks with controllable opacity, rotation, and size. Supports saving local settings presets.

### 🧠 Document Intelligence & Analysis
- **PDF Inspector**: View PDF version details, encryption status, interactive forms, JavaScript warnings, and edit metadata (Title, Author, Subject, Keywords).
- **Clean PDF Pages**: Auto-scan documents to identify and bulk-remove blank pages (via pixel variance) or duplicate pages (via average perceptual hashing).
- **Compare PDFs**: Extract text contents and view highlighted word diffs side-by-side.

### 🔄 Content Conversion & Security
- **OCR Searchable PDF**: Add a searchable, selectable text layer to scanned PDFs locally using Tesseract WebAssembly.
- **Protect PDF**: Secure your documents by encrypting them with user/owner passwords locally (RC4 128-bit encryption).
- **Extract Images**: Pull raw embedded image files out of your PDF at native resolution and save as PNGs or a single ZIP.
- **PDF to Long Image**: Stitch all pages vertically into one long PNG/JPEG for easy social-media sharing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **PDF Processing**: 
  - [pdf-lib](https://pdf-lib.js.org/) (for creating/modifying/saving PDFs)
  - [pdf.js](https://mozilla.github.io/pdf.js/) (for page rendering and text extraction)
  - [@pdfsmaller/pdf-encrypt-lite](https://github.com/smither777/pdfsmaller-pdfencryptlite) (for client-side PDF encryption)
- **OCR Engine**: [Tesseract.js](https://github.com/naptha/tesseract.js) (WASM-compiled on-device character recognition)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Drag & Drop**: [@dnd-kit/core](https://dndkit.com/) & [@dnd-kit/sortable](https://dndkit.com/)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
