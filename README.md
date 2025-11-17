# AI Resume Analysis System

A modern web application for analyzing resumes using AI-powered document understanding with LayoutLM integration via HuggingFace.

## Features

- 📄 **Multi-format Support**: Upload and parse TXT, PDF, and DOCX resume files
- 🤖 **AI-Powered Parsing**: Uses HuggingFace's LayoutLM model for accurate document understanding
- 💬 **Interactive Chat**: Ask questions about resumes using an intelligent chatbot
- 🎨 **Modern UI**: Beautiful, responsive interface with improved alignment and styling
- 💾 **Session Management**: Save and manage multiple resume analysis sessions

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: HuggingFace Inference API (LayoutLM)
- **Document Parsing**: Mammoth (DOCX), PDF.js (PDF)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# HuggingFace API Key (Optional - for LayoutLM)
# Get your API key from: https://huggingface.co/settings/tokens
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/20251117181145_create_resume_analysis_schema.sql`

This creates the necessary tables:
- `resume_sessions` - Stores resume analysis sessions
- `chat_messages` - Stores chat messages for each session

### 4. Get HuggingFace API Key (Optional)

1. Sign up at [HuggingFace](https://huggingface.co)
2. Go to [Settings > Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with "Read" permissions
4. Add it to your `.env` file

**Note**: The app will work without the HuggingFace API key, but will use a simpler text-based parsing method. LayoutLM provides more accurate document understanding.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Upload a Resume**: Drag and drop or click to upload a TXT, PDF, or DOCX file
2. **View Parsed Data**: The resume information is automatically extracted and displayed
3. **Chat with AI**: Ask questions about the resume:
   - "What are the candidate's technical skills?"
   - "Summarize their work experience"
   - "What projects have they worked on?"
   - "Tell me about their education background"

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx
│   │   ├── FileUpload.tsx
│   │   ├── ResumeInfo.tsx
│   │   └── SessionSidebar.tsx
│   ├── lib/                 # Core libraries
│   │   ├── chatbot.ts       # Chat response generation
│   │   ├── layoutlmParser.ts # LayoutLM-based parsing
│   │   ├── resumeParser.ts   # Fallback text-based parsing
│   │   ├── supabase.ts       # Supabase client
│   │   └── types.ts          # TypeScript types
│   └── App.tsx              # Main application component
├── supabase/
│   └── migrations/          # Database migrations
└── package.json
```

## How LayoutLM Works

The application uses Microsoft's LayoutLM model via HuggingFace's Inference API for document understanding:

1. **Document Upload**: User uploads a resume (TXT, PDF, or DOCX)
2. **Text Extraction**: The document is parsed to extract text content
3. **LayoutLM Processing** (if API key is provided):
   - Document is sent to HuggingFace's LayoutLM model
   - Model analyzes document structure and layout
   - Returns structured information with better accuracy
4. **Fallback**: If LayoutLM is unavailable, uses enhanced text-based parsing

## Improvements Made

- ✅ **Better Chat UI**: Improved alignment, spacing, and visual design
- ✅ **Proper DOCX/PDF Parsing**: Fixed garbled text issues with proper file parsing
- ✅ **LayoutLM Integration**: Added HuggingFace API integration for accurate document understanding
- ✅ **Enhanced Parsing**: Better extraction of skills, experience, education, and contact information

## Troubleshooting

### "Table not found" Error
- Make sure you've run the Supabase migration SQL file
- Check that your Supabase project is correctly configured

### DOCX Files Showing Garbled Text
- This should be fixed with the new mammoth library integration
- Ensure you're using the latest version of the app

### LayoutLM Not Working
- Check that your HuggingFace API key is correctly set in `.env`
- Verify the API key has proper permissions
- The app will automatically fall back to text-based parsing if LayoutLM fails

## License

MIT

