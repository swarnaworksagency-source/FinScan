import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

// Initialize PDF.js worker (use local package instead of CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function extractTextFromClient(file: File, onProgress?: (message: string) => void): Promise<string> {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (onProgress) onProgress(`Starting extraction for ${fileType}...`);

    try {
        if (fileType === 'pdf') {
            return await extractPdfText(file, onProgress);
        }
        else if (fileType === 'docx') {
            return await extractDocxText(file);
        }
        else if (['jpg', 'jpeg', 'png'].includes(fileType || '')) {
            return await extractImageText(file, onProgress);
        }

        throw new Error('Unsupported file type');
    } catch (error: any) {
        console.error('Extraction failed:', error);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
}

async function extractPdfText(file: File, onProgress?: (msg: string) => void): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) onProgress(`Parsing PDF page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

async function extractDocxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

async function extractImageText(file: File, onProgress?: (msg: string) => void): Promise<string> {
    if (onProgress) onProgress('Initializing OCR engine...');

    const worker = await Tesseract.createWorker('eng');

    if (onProgress) onProgress('Recognizing text in image...');
    const ret = await worker.recognize(file);

    await worker.terminate();
    return ret.data.text;
}
