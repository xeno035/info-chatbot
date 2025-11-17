import type { ResumeData } from './types';

// HuggingFace API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const LAYOUTLM_MODEL = 'microsoft/layoutlm-base-uncased'; // You can use layoutlmv3 or other variants

/**
 * Parse resume using LayoutLM via HuggingFace Inference API
 * Note: This requires a HuggingFace API token in environment variables
 */
export async function parseResumeWithLayoutLM(
  text: string,
  imageData?: string
): Promise<ResumeData> {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // If no API key, fall back to text-based parsing
  if (!apiKey) {
    console.warn('HuggingFace API key not found. Using text-based parsing.');
    return parseResumeTextFallback(text);
  }

  try {
    // For LayoutLM, we need to send the document as an image
    // If imageData is provided, use it; otherwise, we'll use text-based approach
    if (imageData) {
      const response = await fetch(`${HUGGINGFACE_API_URL}/${LAYOUTLM_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageData, // Base64 encoded image
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      const result = await response.json();
      return parseLayoutLMResult(result, text);
    } else {
      // Use a text-based model or fallback
      return parseResumeTextFallback(text);
    }
  } catch (error) {
    console.error('Error with LayoutLM parsing:', error);
    // Fallback to text-based parsing
    return parseResumeTextFallback(text);
  }
}

/**
 * Parse LayoutLM model output into structured resume data
 */
function parseLayoutLMResult(layoutlmOutput: any, originalText: string): ResumeData {
  // LayoutLM returns tokens with bounding boxes and labels
  // We'll extract structured information from the output
  const parsed: ResumeData = {
    skills_or_tech_stack: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    languages: [],
    contact_information: {},
  };

  // Extract text from LayoutLM tokens
  let extractedText = '';
  if (layoutlmOutput.tokens) {
    extractedText = layoutlmOutput.tokens
      .map((token: any) => token.word || token.text || '')
      .join(' ');
  }

  // Use the extracted text for parsing
  const textToParse = extractedText || originalText;
  return parseResumeTextFallback(textToParse);
}

/**
 * Fallback text-based parsing (enhanced version)
 */
function parseResumeTextFallback(text: string): ResumeData {
  const lines = text.split('\n').filter(line => line.trim());

  const parsed: ResumeData = {
    skills_or_tech_stack: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    languages: [],
    contact_information: {},
  };

  let currentSection = '';
  let buffer: string[] = [];

  const sectionKeywords = {
    objective: ['objective', 'summary', 'profile', 'about', 'professional summary'],
    skills: ['skills', 'technical skills', 'tech stack', 'technologies', 'competencies', 'expertise'],
    education: ['education', 'academic', 'qualification', 'degree', 'university', 'college'],
    experience: ['experience', 'work history', 'employment', 'professional experience', 'work', 'career'],
    projects: ['projects', 'personal projects', 'portfolio', 'project experience'],
    certifications: ['certifications', 'certificates', 'licenses', 'certification'],
    languages: ['languages', 'language proficiency', 'language skills'],
  };

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const lowerLine = line.toLowerCase();

    // Extract contact information
    if (i < 5) { // Usually in first few lines
      const emailMatch = line.match(emailRegex);
      if (emailMatch && !parsed.contact_information?.email) {
        parsed.contact_information!.email = emailMatch[0];
      }

      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch && !parsed.contact_information?.phone) {
        parsed.contact_information!.phone = phoneMatch[0];
      }

      const linkedinMatch = line.match(linkedinRegex);
      if (linkedinMatch && !parsed.contact_information?.location) {
        parsed.contact_information!.location = linkedinMatch[0];
      }
    }

    // Extract name (usually first non-empty line)
    if (i === 0 && !parsed.contact_information?.name) {
      // Skip if it looks like a section header
      if (!Object.values(sectionKeywords).flat().some(keyword => lowerLine.includes(keyword))) {
        parsed.contact_information!.name = line;
      }
    }

    // Detect section headers
    let foundSection = false;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword) && line.length < 50)) {
        if (buffer.length > 0) {
          processSectionBuffer(parsed, currentSection, buffer);
          buffer = [];
        }
        currentSection = section;
        foundSection = true;
        break;
      }
    }

    if (!foundSection && line.length > 0) {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    processSectionBuffer(parsed, currentSection, buffer);
  }

  return parsed;
}

function processSectionBuffer(parsed: ResumeData, section: string, buffer: string[]) {
  const content = buffer.join('\n');

  switch (section) {
    case 'objective':
      parsed.objective_or_summary = content;
      break;

    case 'skills':
      const skills = extractSkills(buffer);
      parsed.skills_or_tech_stack = skills;
      break;

    case 'education':
      parsed.education = extractEducation(buffer);
      break;

    case 'experience':
      parsed.experience = extractExperience(buffer);
      break;

    case 'projects':
      parsed.projects = extractProjects(buffer);
      break;

    case 'certifications':
      parsed.certifications = buffer.filter(line => line.trim().length > 0);
      break;

    case 'languages':
      parsed.languages = buffer.filter(line => line.trim().length > 0);
      break;
  }
}

function extractSkills(lines: string[]): string[] {
  const skills: string[] = [];
  const skillPatterns = /[,|•·\n]/;

  for (const line of lines) {
    const parts = line.split(skillPatterns);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 1 && trimmed.length < 50) {
        skills.push(trimmed);
      }
    }
  }

  return [...new Set(skills)]; // Remove duplicates
}

function extractEducation(lines: string[]) {
  const entries = [];
  let currentEntry: any = {};

  for (const line of lines) {
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(currentEntry);
      }
      currentEntry = { year: yearMatch[0], details: line };
    } else if (!currentEntry.institution && line.length > 3) {
      currentEntry.institution = line;
    } else if (!currentEntry.degree && line.length > 3) {
      currentEntry.degree = line;
    } else if (currentEntry.degree) {
      currentEntry.details = (currentEntry.details || '') + ' ' + line;
    }
  }

  if (Object.keys(currentEntry).length > 0) {
    entries.push(currentEntry);
  }

  return entries;
}

function extractExperience(lines: string[]) {
  const entries = [];
  let currentEntry: any = {};
  const responsibilities: string[] = [];

  for (const line of lines) {
    const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\b\d{4}\s*[-–—]\s*(present|current|\d{4})\b/i;
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      if (Object.keys(currentEntry).length > 0) {
        currentEntry.responsibilities = [...responsibilities];
        entries.push(currentEntry);
        responsibilities.length = 0;
      }
      currentEntry = { duration: line };
    } else if (line.match(/^[-•·]\s*/)) {
      responsibilities.push(line.replace(/^[-•·]\s*/, '').trim());
    } else if (!currentEntry.company && line.length > 2) {
      currentEntry.company = line;
    } else if (!currentEntry.position && line.length > 2) {
      currentEntry.position = line;
    } else if (line.trim().length > 0) {
      currentEntry.details = (currentEntry.details || '') + ' ' + line;
    }
  }

  if (Object.keys(currentEntry).length > 0) {
    currentEntry.responsibilities = [...responsibilities];
    entries.push(currentEntry);
  }

  return entries;
}

function extractProjects(lines: string[]) {
  const entries = [];
  let currentEntry: any = {};

  for (const line of lines) {
    if (line.match(/^[-•·]\s*/)) {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(currentEntry);
      }
      currentEntry = { name: line.replace(/^[-•·]\s*/, '').trim() };
    } else if (currentEntry.name && !currentEntry.description) {
      currentEntry.description = line;
    } else if (currentEntry.description) {
      if (!currentEntry.technologies) {
        currentEntry.technologies = [];
      }
      const techs = line.split(/[,|]/).map(t => t.trim()).filter(t => t.length > 0);
      currentEntry.technologies.push(...techs);
    }
  }

  if (Object.keys(currentEntry).length > 0) {
    entries.push(currentEntry);
  }

  return entries;
}

