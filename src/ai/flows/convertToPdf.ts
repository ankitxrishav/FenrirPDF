/**
 * @fileOverview A flow for converting various file types to PDF.
 *
 * - convertToPdf - A function that handles the file conversion process.
 * - ConvertToPdfInput - The input type for the convertToPdf function.
 * - ConvertToPdfOutput - The return type for the convertToPdf function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const FileInputSchema = z.object({
  filename: z.string().describe('The name of the file.'),
  dataUri: z
    .string()
    .describe(
      "The file content as a data URI, including a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const ConvertToPdfInputSchema = z.object({
  files: z.array(FileInputSchema).describe('An array of files to convert.'),
});
export type ConvertToPdfInput = z.infer<typeof ConvertToPdfInputSchema>;

const ConvertToPdfOutputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The resulting PDF file as a data URI, including a MIME type and Base64 encoding."
    ),
});
export type ConvertToPdfOutput = z.infer<typeof ConvertToPdfOutputSchema>;


// This is the main function that will be called from the client.
export async function convertToPdf(input: ConvertToPdfInput): Promise<ConvertToPdfOutput> {
  return convertToPdfFlow(input);
}

const conversionPrompt = ai.definePrompt({
    name: 'pdfConversionPrompt',
    input: { schema: ConvertToPdfInputSchema },
    output: { schema: z.object({ content: z.string().describe("The combined text content of all files, formatted for a PDF.") }) },
    prompt: `You are a document conversion service. Your task is to take the content from the following files and combine them into a single, clean text document, ready to be placed into a PDF.

    Combine the text from all provided files into a single string. Preserve the order of the files. Add a clear separator, like "--- NEW FILE: [filename] ---", between the content of each file.

    Files:
    {{#each files}}
    - Filename: {{{this.filename}}}
      Content: {{{this.dataUri}}}
    {{/each}}
    `,
});


const convertToPdfFlow = ai.defineFlow(
  {
    name: 'convertToPdfFlow',
    inputSchema: ConvertToPdfInputSchema,
    outputSchema: ConvertToPdfOutputSchema,
  },
  async (input) => {
    console.log(`Starting conversion for ${input.files.length} files.`);
    
    // For this implementation, we will extract the text content from the data URIs.
    // A more advanced version would use tools to parse different file types.
    const textFiles = input.files.map(file => {
        const base64Content = file.dataUri.split(',')[1];
        const textContent = Buffer.from(base64Content, 'base64').toString('utf-8');
        return {
            filename: file.filename,
            content: textContent
        };
    });
    
    const combinedContent = textFiles
        .map(file => `--- NEW FILE: ${file.filename} ---\n\n${file.content}`)
        .join('\n\n\n');

    // Sanitize the content to remove characters not supported by WinAnsi encoding.
    // This regex removes control characters except for newline, carriage return, and tab.
    const sanitizedContent = combinedContent.replace(/[^\x20-\x7E\x0A\x0D\x09]/g, '');


    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    const margin = 50;
    const x = margin;
    let y = height - margin;

    const lines = sanitizedContent.split('\n');

    for (const line of lines) {
        if (y < margin) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
        page.drawText(line, {
            x,
            y,
            font: timesRomanFont,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
        y -= fontSize * 1.2;
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

    return {
      pdfDataUri: pdfDataUri,
    };
  }
);
