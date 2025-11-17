import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Vite
// Use local worker file from public folder for better reliability
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface FileUploadProps {
  onFileUpload: (file: File, text: string, imageData?: string) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|docx)$/i)) {
      alert('Please upload a TXT, PDF, or DOCX file');
      return;
    }

    try {
      let text = '';
      let imageData: string | undefined;

      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'docx') {
        // Handle DOCX files
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        
        // Note: For full LayoutLM support with images, we'd need to:
        // 1. Convert DOCX pages to images using a library like html2canvas
        // 2. Send those images to LayoutLM model
        // For now, we use text-based parsing which works well
      } else if (fileExtension === 'pdf') {
        // Handle PDF files
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            useWorkerFetch: false,
            verbosity: 0 // Reduce console output
          }).promise;
          const numPages = pdf.numPages;
          const textParts: string[] = [];

          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            textParts.push(pageText);
          }

          text = textParts.join('\n\n');
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF document.');
        }

        // For LayoutLM, we could render PDF pages as images
        // This would require canvas rendering
      } else {
        // Handle TXT files
        text = await file.text();
      }

      // Remove null bytes and other problematic Unicode characters
      const sanitizedText = text.replace(/\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
      
      onFileUpload(file, sanitizedText, imageData);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Resume Analysis AI</h1>
          <p className="text-lg text-slate-600">
            Upload your resume and chat with an intelligent assistant that understands every detail
          </p>
        </div>

        <form
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="relative"
        >
          <input
            type="file"
            id="file-upload"
            onChange={handleChange}
            accept=".txt,.pdf,.docx"
            className="hidden"
            disabled={isLoading}
          />

          <label
            htmlFor="file-upload"
            className={`
              flex flex-col items-center justify-center
              border-2 border-dashed rounded-2xl
              bg-white p-12 cursor-pointer
              transition-all duration-200
              ${dragActive
                ? 'border-blue-600 bg-blue-50 scale-105'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-600' : 'text-slate-400'}`} />

            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {isLoading ? 'Processing your resume...' : 'Drop your resume here'}
            </h3>

            <p className="text-slate-500 mb-4">
              {isLoading ? 'Please wait while we analyze the document' : 'or click to browse'}
            </p>

            <div className="flex gap-2 text-sm text-slate-400">
              <span className="px-3 py-1 bg-slate-100 rounded-full">TXT</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full">PDF</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full">DOCX</span>
            </div>
          </label>
        </form>

        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">What you can ask:</h3>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>What are the candidate's technical skills?</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Summarize their work experience</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>What projects have they worked on?</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Tell me about their education background</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
