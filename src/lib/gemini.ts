import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeData } from './types';

/**
 * Initialize Gemini AI client
 */
function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate response using Gemini 2.5 Flash with RAG approach
 * The resume text is included as context in the prompt
 */
export async function generateGeminiResponse(
  resumeText: string,
  parsedData: ResumeData,
  userQuestion: string
): Promise<string> {
  const client = getGeminiClient();
  
  if (!client) {
    // Fallback to deterministic response if no API key
    return null;
  }

  try {
    // Use Gemini 2.0 Flash (latest fast model)
    // Note: If 2.0 is not available, it will throw an error and we'll catch it
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Create a comprehensive prompt with the resume content as context
    const prompt = `You are an AI assistant helping to analyze resumes. Below is the extracted text from a resume document.

RESUME CONTENT:
${resumeText}

USER QUESTION: ${userQuestion}

INSTRUCTIONS:
- Answer the question based ONLY on the information provided in the resume content above
- Be specific and accurate
- If the information is not in the resume, say "The resume does not contain this information."
- For skills questions, list all skills mentioned in the resume
- For experience questions, provide details from the work experience section
- Format your response clearly with bullet points or structured text
- Do not make up or infer information that is not explicitly stated in the resume

Please provide a helpful and accurate answer based on the resume content:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Error with Gemini API:', error);
    // Return null to fallback to deterministic response
    return null;
  }
}

/**
 * Check if Gemini is available (has API key)
 */
export function isGeminiAvailable(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

