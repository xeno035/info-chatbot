import type { ResumeData } from './types';

export function parseResumeText(text: string): ResumeData {
  const originalText = text; // Keep original for fallback search
  const lines = text.split('\n').filter(line => line.trim());

  const parsed: ResumeData = {
    skills_or_tech_stack: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    languages: [],
    contact_information: {
      name: "",
      email: "",
      phone: "",
      location: "",
    }
  };

  let currentSection = '';
  let buffer: string[] = [];

  const sectionKeywords = {
    objective: ['objective', 'summary', 'profile', 'about', 'professional summary'],
    skills: ['skills', 'technical skills', 'tech stack', 'technologies', 'competencies', 'expertise', 'core competencies', 'technical expertise', 'programming languages', 'tools', 'software'],
    education: ['education', 'academic', 'qualification', 'degree', 'university', 'college', 'academic background'],
    experience: ['experience', 'work history', 'employment', 'professional experience', 'work experience', 'career', 'employment history'],
    projects: ['projects', 'personal projects', 'portfolio', 'project experience', 'key projects', 'project', 'side projects', 'academic projects', 'notable projects'],
    certifications: ['certifications', 'certificates', 'licenses', 'certification', 'credentials'],
    languages: ['languages', 'language proficiency', 'language skills', 'spoken languages']
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
      // More flexible header detection
      const isHeader = 
        // Exact match or starts with keyword
        keywords.some(keyword => 
          lowerLine === keyword || 
          lowerLine === keyword + ':' ||
          lowerLine.startsWith(keyword + ':') || 
          lowerLine.startsWith(keyword + ' -') ||
          lowerLine.startsWith(keyword + ' ') ||
          // Contains keyword and looks like a header (short, or all caps, or has colon)
          (lowerLine.includes(keyword) && (
            line.length < 60 || 
            line.match(/^[A-Z\s:]+$/) ||
            line.includes(':') ||
            (line.length < 100 && !line.includes(',') && !line.includes('.'))
          ))
        );
      
      if (isHeader) {
        if (buffer.length > 0) {
          processSectionBuffer(parsed, currentSection, buffer);
          buffer = [];
        }
        currentSection = section;
        foundSection = true;
        // Don't add the header line itself to buffer, but continue to next iteration
        continue;
      }
    }

    if (!foundSection && line.length > 0) {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    processSectionBuffer(parsed, currentSection, buffer);
  }

  // Fallback: If no skills were found but we have text, try to extract skills from entire document
  if ((!parsed.skills_or_tech_stack || parsed.skills_or_tech_stack.length === 0) && 
      (!parsed._raw_sections?.skills || parsed._raw_sections.skills.trim().length === 0)) {
    // Search for skills section in all lines (including empty lines for better detection)
    const allLines = originalText.split('\n');
    let skillsStartIndex = -1;
    
    // First pass: look for section header
    for (let i = 0; i < allLines.length; i++) {
      const lowerLine = allLines[i].toLowerCase().trim();
      // More lenient check - just needs to contain keyword and be reasonably short
      if (sectionKeywords.skills.some(keyword => 
        lowerLine.includes(keyword) && 
        (allLines[i].length < 150 || lowerLine === keyword || lowerLine.startsWith(keyword))
      )) {
        skillsStartIndex = i;
        break;
      }
    }
    
    if (skillsStartIndex >= 0) {
      // Collect lines until next section or end
      const skillsLines: string[] = [];
      for (let i = skillsStartIndex + 1; i < allLines.length; i++) {
        const line = allLines[i].trim();
        if (!line) {
          // Allow one empty line, but if we have content and hit another empty line, might be end
          if (skillsLines.length > 0) {
            // Check if next non-empty line is a new section
            let nextNonEmpty = '';
            for (let j = i + 1; j < allLines.length; j++) {
              if (allLines[j].trim()) {
                nextNonEmpty = allLines[j].trim();
                break;
              }
            }
            if (nextNonEmpty) {
              const lowerNext = nextNonEmpty.toLowerCase();
              let isNewSection = false;
              for (const [section, keywords] of Object.entries(sectionKeywords)) {
                if (section === 'skills') continue;
                if (keywords.some(keyword => lowerNext.includes(keyword) && nextNonEmpty.length < 100)) {
                  isNewSection = true;
                  break;
                }
              }
              if (isNewSection) break;
            }
          }
          continue;
        }
        
        // Check if this is a new section
        let isNewSection = false;
        for (const [section, keywords] of Object.entries(sectionKeywords)) {
          if (section === 'skills') continue;
          const lowerLine = line.toLowerCase();
          if (keywords.some(keyword => lowerLine.includes(keyword) && line.length < 100)) {
            isNewSection = true;
            break;
          }
        }
        
        if (isNewSection) break;
        skillsLines.push(line);
      }
      
      if (skillsLines.length > 0) {
        const skillsContent = skillsLines.join('\n');
        if (!parsed._raw_sections) parsed._raw_sections = {};
        parsed._raw_sections.skills = skillsContent;
        const extractedSkills = extractSkills(skillsLines);
        parsed.skills_or_tech_stack = extractedSkills;
      }
    } else {
      // Last resort: search entire document for common tech keywords and extract them
      const techKeywords = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
        'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes'
      ];
      
      const foundSkills: string[] = [];
      for (const keyword of techKeywords) {
        // Escape special regex characters in keyword
        const escapedKeyword = keyword.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
        // Look for keyword in context (not just as substring of another word)
        // For special cases like c++, use a simpler pattern
        let regex: RegExp;
        if (keyword === 'c++') {
          regex = /\bc\+\+/gi;
        } else if (keyword === 'c#') {
          regex = /\bc#/gi;
        } else {
          regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        }
        
        if (regex.test(originalText)) {
          // Find the actual casing from original text
          let match: RegExpMatchArray | null = null;
          if (keyword === 'c++') {
            match = originalText.match(/\bc\+\+/i);
          } else if (keyword === 'c#') {
            match = originalText.match(/\bc#/i);
          } else {
            match = originalText.match(new RegExp(`\\b${escapedKeyword}\\b`, 'i'));
          }
          if (match) {
            foundSkills.push(match[0]);
          }
        }
      }
      
      if (foundSkills.length > 0) {
        if (!parsed._raw_sections) parsed._raw_sections = {};
        parsed._raw_sections.skills = foundSkills.join(', ');
        parsed.skills_or_tech_stack = foundSkills;
      }
    }
  }

  return parsed;
}

function processSectionBuffer(parsed: ResumeData, section: string, buffer: string[]) {
  const content = buffer.join('\n');

  // Store raw content for exact extraction (like Adobe AI)
  if (!parsed._raw_sections) {
    parsed._raw_sections = {};
  }

  switch (section) {
    case 'objective':
      parsed.objective_or_summary = content;
      parsed._raw_sections.objective = content;
      break;

    case 'skills':
      // Store raw content first
      parsed._raw_sections.skills = content;
      // Also extract structured skills
      const skills = extractSkills(buffer);
      parsed.skills_or_tech_stack = skills;
      break;

    case 'education':
      parsed._raw_sections.education = content;
      parsed.education = extractEducation(buffer);
      break;

    case 'experience':
      parsed._raw_sections.experience = content;
      parsed.experience = extractExperience(buffer);
      break;

    case 'projects':
      parsed._raw_sections.projects = content;
      parsed.projects = extractProjects(buffer);
      break;

    case 'certifications':
      parsed._raw_sections.certifications = content;
      parsed.certifications = buffer.filter(line => line.trim().length > 0);
      break;

    case 'languages':
      parsed._raw_sections.languages = content;
      parsed.languages = buffer.filter(line => line.trim().length > 0);
      break;
  }
}

function extractSkills(lines: string[]): string[] {
  const skills: Set<string> = new Set();
  
  // Common tech keywords to identify
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    'html', 'css', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'material-ui',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'linux', 'windows', 'macos', 'unix',
    'agile', 'scrum', 'devops', 'ci/cd', 'microservices', 'rest', 'graphql', 'api'
  ];

  for (const line of lines) {
    // Skip lines that look like section headers
    if (line.length < 30 && /^[A-Z\s:]+$/.test(line)) {
      continue;
    }

    // Split by common delimiters
    const parts = line.split(/[,|•·\n\t]/);
    
    for (const part of parts) {
      let trimmed = part.trim();
      
      // Remove leading bullets, dashes, numbers
      trimmed = trimmed.replace(/^[-•·\d.)\s]+/, '').trim();
      
      if (trimmed.length > 1 && trimmed.length < 100) {
        // Check if it's a known tech keyword (case-insensitive)
        const lowerTrimmed = trimmed.toLowerCase();
        if (techKeywords.some(keyword => lowerTrimmed.includes(keyword) || keyword.includes(lowerTrimmed))) {
          skills.add(trimmed);
        } else if (trimmed.length > 2) {
          // Add any non-empty string that looks like a skill
          // Filter out common non-skill words
          const nonSkillWords = ['and', 'or', 'the', 'with', 'using', 'experience', 'years', 'proficient'];
          if (!nonSkillWords.includes(lowerTrimmed)) {
            skills.add(trimmed);
          }
        }
      }
    }
  }

  // If we didn't find many skills, be less strict and include more
  if (skills.size < 3) {
    const allSkills: string[] = [];
    for (const line of lines) {
      if (line.length < 30 && /^[A-Z\s:]+$/.test(line)) {
        continue;
      }
      const parts = line.split(/[,|•·\n\t]/);
      for (const part of parts) {
        const trimmed = part.replace(/^[-•·\d.)\s]+/, '').trim();
        if (trimmed.length > 1 && trimmed.length < 50) {
          const lowerTrimmed = trimmed.toLowerCase();
          const nonSkillWords = ['and', 'or', 'the', 'with', 'using', 'experience', 'years', 'proficient', 'skills', 'technical'];
          if (!nonSkillWords.includes(lowerTrimmed) && !lowerTrimmed.match(/^\d+$/)) {
            allSkills.push(trimmed);
          }
        }
      }
    }
    // Return unique skills, prioritizing the ones we found
    return Array.from(new Set([...Array.from(skills), ...allSkills]));
  }

  return Array.from(skills);
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
  const entries: any[] = [];
  let currentEntry: any = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this looks like a new project entry
    // Could be: bullet point, numbered, or a line that looks like a title
    const isNewProject = 
      trimmedLine.startsWith('-') || 
      trimmedLine.startsWith('•') || 
      trimmedLine.startsWith('*') ||
      /^\d+[.)]\s/.test(trimmedLine) || // Numbered list (1. 2. etc.)
      (trimmedLine.length < 80 && !trimmedLine.includes(',') && !trimmedLine.match(/^\d{4}/)); // Short line that might be a title

    if (isNewProject) {
      // Save previous entry if it has content
      if (currentEntry.name || currentEntry.description) {
        entries.push(currentEntry);
      }
      // Start new entry
      const cleanLine = trimmedLine.replace(/^[-•*\d.)\s]+/, '').trim();
      if (cleanLine) {
        currentEntry = { name: cleanLine };
      } else {
        currentEntry = {};
      }
    } else if (currentEntry.name) {
      // This is continuation of current project
      if (!currentEntry.description) {
        // First continuation line is description
        currentEntry.description = trimmedLine;
      } else if (!currentEntry.technologies) {
        // Check if this line looks like technologies
        const techPattern = /(javascript|python|java|react|node|sql|html|css|typescript|angular|vue|docker|aws|azure|git|mongodb|postgresql|mysql|redis|linux|windows|api|rest|graphql)/i;
        if (techPattern.test(trimmedLine) || trimmedLine.includes(',') || trimmedLine.includes('|')) {
          currentEntry.technologies = trimmedLine.split(/[,|]/).map(t => t.trim()).filter(Boolean);
        } else {
          // Append to description
          currentEntry.description += ' ' + trimmedLine;
        }
      } else {
        // Append to description
        currentEntry.description += ' ' + trimmedLine;
      }
    } else {
      // No current entry, but we have a line - might be a project name without bullet
      if (trimmedLine.length < 100 && !trimmedLine.match(/^\d{4}/) && trimmedLine.length > 5) {
        currentEntry = { name: trimmedLine };
      }
    }
  }

  // Don't forget the last entry
  if (currentEntry.name || currentEntry.description) {
    entries.push(currentEntry);
  }

  // If we didn't find structured projects, try to extract any project-like content
  if (entries.length === 0 && lines.length > 0) {
    // Look for lines that might be projects (not dates, not headers)
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10 && trimmed.length < 200) {
        // Skip if it looks like a header, date, or contact info
        if (!trimmed.match(/^\d{4}/) && 
            !trimmed.match(/^[A-Z\s:]+$/) && 
            !trimmed.match(/@/) &&
            trimmed.length > 10) {
          entries.push({ name: trimmed, description: '' });
        }
      }
    }
  }

  return entries;
}
