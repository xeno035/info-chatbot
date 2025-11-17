import type { ResumeData } from './types';

export function parseResumeText(text: string): ResumeData {
  const lines = text.split('\n').filter(line => line.trim());

  const parsed: ResumeData = {
    skills_or_tech_stack: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    languages: [],
    contact_information: {}
  };

  let currentSection = '';
  let buffer: string[] = [];

  const sectionKeywords = {
    objective: ['objective', 'summary', 'profile', 'about'],
    skills: ['skills', 'technical skills', 'tech stack', 'technologies', 'competencies'],
    education: ['education', 'academic', 'qualification'],
    experience: ['experience', 'work history', 'employment', 'professional experience'],
    projects: ['projects', 'personal projects', 'portfolio'],
    certifications: ['certifications', 'certificates', 'licenses'],
    languages: ['languages', 'language proficiency']
  };

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    if (i === 0 && !currentSection) {
      parsed.contact_information!.name = line;
      continue;
    }

    const emailMatch = line.match(emailRegex);
    if (emailMatch) {
      parsed.contact_information!.email = emailMatch[0];
    }

    const phoneMatch = line.match(phoneRegex);
    if (phoneMatch) {
      parsed.contact_information!.phone = phoneMatch[0];
    }

    let foundSection = false;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
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

  for (const line of lines) {
    const parts = line.split(/[,|•·]/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        skills.push(trimmed);
      }
    }
  }

  return skills;
}

function extractEducation(lines: string[]) {
  const entries = [];
  let currentEntry: any = {};

  for (const line of lines) {
    if (line.match(/\d{4}/)) {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(currentEntry);
      }
      currentEntry = { details: line };
    } else if (Object.keys(currentEntry).length === 0) {
      currentEntry = { institution: line };
    } else {
      currentEntry.degree = line;
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
    if (line.match(/\d{4}/) || line.match(/present/i)) {
      if (Object.keys(currentEntry).length > 0) {
        currentEntry.responsibilities = [...responsibilities];
        entries.push(currentEntry);
        responsibilities.length = 0;
      }
      currentEntry = { duration: line };
    } else if (line.startsWith('-') || line.startsWith('•')) {
      responsibilities.push(line.replace(/^[-•]\s*/, ''));
    } else if (!currentEntry.company) {
      currentEntry.company = line;
    } else if (!currentEntry.position) {
      currentEntry.position = line;
    } else {
      currentEntry.details = line;
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
    if (line.startsWith('-') || line.startsWith('•')) {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(currentEntry);
      }
      currentEntry = { name: line.replace(/^[-•]\s*/, '') };
    } else if (currentEntry.name && !currentEntry.description) {
      currentEntry.description = line;
    } else if (currentEntry.description) {
      currentEntry.technologies = line.split(/[,|]/).map(t => t.trim());
    }
  }

  if (Object.keys(currentEntry).length > 0) {
    entries.push(currentEntry);
  }

  return entries;
}
