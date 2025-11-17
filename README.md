# AI Resume Analysis System

A modern web application for analyzing resumes using AI-powered document understanding with LayoutLM integration via HuggingFace.

## Features

- 📄 **Multi-format Support**: Upload and parse TXT, PDF, and DOCX resume files with proper text extraction
- 🤖 **AI-Powered Parsing**: Uses HuggingFace's LayoutLM model for accurate document understanding (with intelligent fallback)
- 💬 **Interactive Chat**: Ask questions about resumes using Google Gemini 2.0 Flash with RAG (Retrieval Augmented Generation) for intelligent, context-aware responses
- 🎨 **Modern UI**: Beautiful, responsive interface with improved alignment, spacing, and visual design
- 💾 **Session Management**: Save and manage multiple resume analysis sessions with persistent storage
- 🔍 **Smart Extraction**: Advanced parsing that extracts skills, experience, education, projects, and contact information
- 🛡️ **Data Sanitization**: Automatic cleaning of invalid characters and null bytes for database compatibility
- 📊 **Flexible Queries**: Natural language queries like "skill", "experience", "education" with intelligent keyword matching

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: 
  - Google Gemini 2.0 Flash (RAG-based chatbot responses)
  - HuggingFace Inference API (LayoutLMv3 for document parsing)
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

# HuggingFace API Key (Optional - for LayoutLMv3)
# Get your API key from: https://huggingface.co/settings/tokens
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key

# Google Gemini API Key (Optional - for AI chatbot)
# Get your API key from: https://aistudio.google.com/app/apikey
# If not provided, the system will use a deterministic fallback
VITE_GEMINI_API_KEY=your_gemini_api_key
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

**Note**: The app will work without the HuggingFace API key, but will use a simpler text-based parsing method. LayoutLMv3 provides more accurate document understanding with unified text and image processing.

### 5. Get Google Gemini API Key (Optional)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to your `.env` file

**Note**: The app will work without the Gemini API key, but will use a deterministic fallback that matches keywords to sections. Gemini provides more intelligent, context-aware responses using RAG (Retrieval Augmented Generation) where the entire resume text is used as context.

### 6. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Upload a Resume**: Drag and drop or click to upload a TXT, PDF, or DOCX file
2. **View Parsed Data**: The resume information is automatically extracted and displayed in structured format
3. **Chat with AI**: Ask questions about the resume using natural language:
   - "skill" or "skills" - View all technical skills and technologies
   - "experience" or "work" - Get work experience summary
   - "education" or "degree" - View educational background
   - "projects" - See all projects listed
   - "certifications" - View certifications and licenses
   - "contact" - Get contact information
   - "summary" - Get an overview of the resume

### Example Queries:
- "What are the candidate's technical skills?"
- "Summarize their work experience"
- "What projects have they worked on?"
- "Tell me about their education background"
- "skill" (single word queries also work!)

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx    # Chat UI with improved alignment
│   │   ├── FileUpload.tsx        # File upload with DOCX/PDF support
│   │   ├── ResumeInfo.tsx        # Resume data display
│   │   └── SessionSidebar.tsx    # Session management sidebar
│   ├── lib/                 # Core libraries
│   │   ├── chatbot.ts            # Intelligent chat response generation (with Gemini RAG)
│   │   ├── gemini.ts             # Google Gemini 2.0 Flash integration (RAG)
│   │   ├── layoutlmParser.ts     # LayoutLM-based parsing (HuggingFace)
│   │   ├── resumeParser.ts       # Enhanced text-based parsing
│   │   ├── supabase.ts           # Supabase client configuration
│   │   └── types.ts              # TypeScript type definitions
│   └── App.tsx              # Main application component
├── public/
│   └── pdf.worker.min.mjs   # PDF.js worker file (for PDF parsing)
├── supabase/
│   └── migrations/          # Database migrations
│       └── 20251117181145_create_resume_analysis_schema.sql
└── package.json
```

## How It Works

### Document Parsing Pipeline

1. **Document Upload**: User uploads a resume (TXT, PDF, or DOCX)
2. **Text Extraction**: 
   - **DOCX**: Uses Mammoth library to extract text content
   - **PDF**: Uses PDF.js to extract text from all pages
   - **TXT**: Direct text reading
3. **Data Sanitization**: Removes null bytes and invalid Unicode characters
4. **LayoutLMv3 Processing** (if API key is provided):
   - Document is sent to HuggingFace's LayoutLMv3 model
   - Model analyzes document structure, layout, and visual elements
   - Uses unified text and image masking for better accuracy
   - Returns structured information with improved document understanding
5. **Enhanced Text Parsing** (fallback or primary):
   - Intelligent section detection (Skills, Experience, Education, etc.)
   - Extracts structured data from text content
   - Stores raw section content for exact retrieval
6. **Data Storage**: Parsed data and original text are stored in Supabase

### Chat Response Generation (RAG)

1. **User Question**: User asks a question about the resume
2. **Gemini RAG** (if API key is provided):
   - The entire original resume text is sent as context to Gemini 2.0 Flash
   - Gemini analyzes the question in the context of the full resume content
   - Generates intelligent, context-aware responses
   - Can answer complex questions that require understanding multiple sections
3. **Deterministic Fallback** (if no Gemini API key):
   - Matches keywords to specific sections
   - Returns structured data from parsed JSON
   - Provides exact content from raw sections when available

## Recent Improvements

- ✅ **Google Gemini 2.0 Flash Integration**: RAG-based chatbot using the entire resume text as context for intelligent, context-aware responses
- ✅ **Enhanced Chat UI**: Improved alignment, spacing, rounded avatars, better message bubbles with shadows
- ✅ **Proper DOCX/PDF Parsing**: Fixed garbled text issues using Mammoth (DOCX) and PDF.js (PDF)
- ✅ **LayoutLMv3 Integration**: Added HuggingFace API integration with LayoutLMv3 for accurate document understanding
- ✅ **Advanced Resume Parsing**: 
  - Intelligent section detection with multiple keyword variations
  - Smart skills extraction with 50+ tech keyword recognition
  - Flexible format handling (comma, bullets, pipes, line-by-line)
  - Better experience and education extraction
  - Stores original resume text for RAG
- ✅ **Improved Chatbot**: 
  - Gemini RAG for intelligent responses (with deterministic fallback)
  - Single-word query support ("skill", "experience")
  - Fallback skill extraction from projects and experience sections
  - Context-aware error messages
  - Shows available data when information is missing
- ✅ **Data Sanitization**: Automatic removal of null bytes and invalid Unicode characters
- ✅ **PDF.js Worker**: Local worker file configuration for reliable PDF parsing
- ✅ **Error Handling**: Better error messages and graceful fallbacks

## Troubleshooting

### "Table not found" Error
- Make sure you've run the Supabase migration SQL file
- Check that your Supabase project is correctly configured
- Verify your Supabase URL and anon key in `.env`

### DOCX Files Showing Garbled Text
- ✅ Fixed with Mammoth library integration
- Ensure you're using the latest version of the app
- If issues persist, try converting DOCX to PDF or TXT

### PDF Parsing Issues
- The PDF.js worker file is included in the `public/` folder
- If you see worker errors, ensure `public/pdf.worker.min.mjs` exists
- PDF parsing works without worker (slightly slower but functional)

### Skills/Experience Not Being Found
- The parser looks for section headers like "Skills", "Technical Skills", "Experience", etc.
- Try formatting your resume with clear section headers
- The chatbot will search in other sections if dedicated sections aren't found
- Check browser console to see what data was parsed

### LayoutLMv3 Not Working
- Check that your HuggingFace API key is correctly set in `.env`
- Verify the API key has proper permissions (Read access)
- The app will automatically fall back to enhanced text-based parsing if LayoutLMv3 fails
- LayoutLMv3 is optional - the app works well without it
- Model name: `microsoft/layoutlmv3-base`

### Chatbot Not Responding Correctly
- Try rephrasing your question (e.g., "skill" instead of "what skills")
- Check if the resume was parsed correctly by viewing the Resume Info panel
- The chatbot provides helpful messages if information is missing

### Gemini Not Working
- Check that your Gemini API key is correctly set in `.env` as `VITE_GEMINI_API_KEY`
- Verify the API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- The app will automatically fall back to deterministic responses if Gemini fails
- Gemini is optional - the app works well with the deterministic fallback
- Model used: `gemini-2.0-flash-exp` (latest fast model)

## Dependencies

### Core Dependencies
- `react` & `react-dom` - UI framework
- `@supabase/supabase-js` - Database and backend
- `@google/generative-ai` - Google Gemini AI integration
- `lucide-react` - Icon library
- `mammoth` - DOCX file parsing
- `pdfjs-dist` - PDF file parsing

### Development Dependencies
- `vite` - Build tool and dev server
- `typescript` - Type safety
- `tailwindcss` - Styling
- `eslint` - Code linting

## Environment Variables

Required:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional:
- `VITE_HUGGINGFACE_API_KEY` - HuggingFace API token for LayoutLM (improves parsing accuracy)
- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI-powered chatbot responses (RAG)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check TypeScript files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

