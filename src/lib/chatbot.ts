import type { ResumeData } from './types';
import { generateGeminiResponse, isGeminiAvailable } from './gemini';

/** Exact fallback required by your rules */
export const FALLBACK = "The resume does not contain this information.";

/** Normalize parsed JSON to safe canonical shape */
export function normalizeParsed(parsed: any): ResumeData {
  return {
    objective_or_summary: parsed.objective_or_summary ?? null,
    skills_or_tech_stack: Array.isArray(parsed.skills_or_tech_stack) 
      ? parsed.skills_or_tech_stack 
      : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    contact_information: parsed.contact_information ?? {
      name: "",
      email: "",
      phone: "",
      location: "",
    },
    // Preserve raw sections for exact content extraction (like Adobe AI)
    _raw_sections: parsed._raw_sections ?? {},
    // Preserve raw text for RAG (Gemini)
    _raw_text: parsed._raw_text ?? undefined,
  };
}

/** Helper: format a bullet list with highlights */
function formatList(items: string[]): string | null {
  if (!items || items.length === 0) return null;
  return items.map((it) => `- **${it}**`).join("\n");
}

/** Extract skill names consistently */
function extractSkillNames(skillsRaw: any[]): string[] {
  if (!Array.isArray(skillsRaw) || skillsRaw.length === 0) return [];
  return skillsRaw
    .map((s) => {
      if (typeof s === "string") return s.trim();
      if (s && typeof s === "object" && typeof s.name === "string") return s.name.trim();
      // fallback: stringify
      return String(s).trim();
    })
    .filter(Boolean);
}

/** Main: answer the user question using Gemini (RAG) or fallback to deterministic parsing */
export async function answerFromParsed(
  parsedIn: any, 
  userQuestionRaw: string,
  resumeText?: string
): Promise<string> {
  const parsed = normalizeParsed(parsedIn);
  const q = String(userQuestionRaw || "").trim().toLowerCase();

  // Try Gemini first if available and resume text is provided
  if (isGeminiAvailable() && resumeText) {
    try {
      const geminiResponse = await generateGeminiResponse(resumeText, parsed, userQuestionRaw);
      if (geminiResponse) {
        return geminiResponse;
      }
    } catch (error) {
      console.warn('Gemini response failed, using fallback:', error);
      // Fall through to deterministic response
    }
  }

  // Fallback to deterministic response based on parsed data
  return answerFromParsedDeterministic(parsed, q);
}

/** Deterministic answer using only parsed JSON (fallback) */
function answerFromParsedDeterministic(parsed: ResumeData, q: string): string {

  // Map simple single-word queries to sections
  const isSkillQuery = ["skill", "skills", "technical skills", "tech", "tech stack", "technologies", "competencies"].some(
    (k) => q === k || q.includes(k)
  );
  const isExperienceQuery = ["experience", "work", "employment", "jobs", "job", "work history", "career"].some(
    (k) => q === k || q.includes(k)
  );
  const isEducationQuery = ["education", "degree", "college", "university", "qualification", "academic"].some(
    (k) => q === k || q.includes(k)
  );
  const isProjectsQuery = ["projects", "project", "portfolio", "what projects"].some((k) => q === k || q.includes(k));
  const isCertificationsQuery = ["certifications", "certificate", "licenses", "certification", "credentials"].some(
    (k) => q === k || q.includes(k)
  );
  const isContactQuery = ["contact", "email", "phone", "contact information", "phone number"].some(
    (k) => q === k || q.includes(k)
  );
  const isSummaryQuery = ["summary", "about", "objective", "overview", "profile"].some((k) => q === k || q.includes(k));
  const isLanguagesQuery = ["languages", "language", "language skills"].some((k) => q === k || q.includes(k));

  // Skills - Return exact content like Adobe AI Assistant
  if (isSkillQuery) {
    // First, try to get raw content (exact text from document)
    const rawSkills = parsed._raw_sections?.skills;
    if (rawSkills && rawSkills.trim().length > 0) {
      // Return the exact content, preserving formatting
      return rawSkills.trim();
    }
    
    // Fallback to structured skills if raw content not available
    const skills = extractSkillNames(parsed.skills_or_tech_stack || []);
    if (skills.length === 0) return FALLBACK;
    const formatted = formatList(skills);
    return formatted || FALLBACK;
  }

  // Experience - Return exact content like Adobe AI Assistant
  if (isExperienceQuery) {
    // First, try to get raw content (exact text from document)
    const rawExperience = parsed._raw_sections?.experience;
    if (rawExperience && rawExperience.trim().length > 0) {
      return rawExperience.trim();
    }
    
    // Fallback to structured experience
    const ex = parsed.experience || [];
    if (!Array.isArray(ex) || ex.length === 0) return FALLBACK;
    const lines = ex.map((e: any) => {
      // Try to normalize available fields
      const title = (e.title || e.role || e.position || "").trim();
      const org = (e.organization || e.company || e.employer || "").trim();
      const start = e.start_date || e.start_year || e.from || e.duration || "";
      const end = e.end_date || e.end_year || e.to || "";
      const dateRange = start || end ? ` — ${start || ""}${start && end ? " to " : ""}${end || ""}` : "";
      const primary = title ? `**${title}**` : org ? `**${org}**` : "";
      const orgText = title && org ? `, ${org}` : org ? `**${org}**` : "";
      const desc = e.description || e.details || "";
      const responsibilities = e.responsibilities || [];
      let respText = "";
      if (Array.isArray(responsibilities) && responsibilities.length > 0) {
        respText = "\n  " + responsibilities.map((r: string) => `• ${r}`).join("\n  ");
      }
      return `- ${primary}${orgText}${dateRange}${desc ? `\n  ${desc}` : ""}${respText}`;
    });
    return lines.join("\n");
  }

  // Education - Return exact content like Adobe AI Assistant
  if (isEducationQuery) {
    const rawEducation = parsed._raw_sections?.education;
    if (rawEducation && rawEducation.trim().length > 0) {
      return rawEducation.trim();
    }
    
    const ed = parsed.education || [];
    if (!Array.isArray(ed) || ed.length === 0) return FALLBACK;
    const lines = ed.map((e: any) => {
      const degree = (e.degree || e.title || "").trim();
      const inst = (e.institution || e.school || "").trim();
      const field = (e.field || "").trim();
      const year = (e.year || e.end_year || "").trim();
      const years = year ? ` — ${year}` : "";
      const fieldText = field ? ` in ${field}` : "";
      if (degree && inst) return `- **${degree}**${fieldText}, ${inst}${years}`;
      if (degree) return `- **${degree}**${fieldText}${years}`;
      if (inst) return `- **${inst}**${years}`;
      if (e.details) return `- ${e.details}${years}`;
      return `- ${JSON.stringify(e)}`;
    });
    return lines.join("\n");
  }

  // Projects - Return exact content like Adobe AI Assistant
  if (isProjectsQuery) {
    const rawProjects = parsed._raw_sections?.projects;
    if (rawProjects && rawProjects.trim().length > 0) {
      return rawProjects.trim();
    }
    
    const pr = parsed.projects || [];
    if (!Array.isArray(pr) || pr.length === 0) return FALLBACK;
    const lines = pr.map((p: any) => {
      const title = (p.title || p.name || "").trim();
      const desc = p.description || p.details || "";
      const techs = p.technologies || [];
      const techText = Array.isArray(techs) && techs.length > 0 ? ` (${techs.join(", ")})` : "";
      if (title) return `- **${title}**${desc ? ` — ${desc}` : ""}${techText}`;
      if (desc) return `- ${desc}${techText}`;
      return `- ${String(p).slice(0, 180)}`;
    });
    return lines.join("\n");
  }

  // Certifications - Return exact content like Adobe AI Assistant
  if (isCertificationsQuery) {
    const rawCertifications = parsed._raw_sections?.certifications;
    if (rawCertifications && rawCertifications.trim().length > 0) {
      return rawCertifications.trim();
    }
    
    const c = parsed.certifications || [];
    if (!Array.isArray(c) || c.length === 0) return FALLBACK;
    const lines = c.map((it: any) => {
      if (typeof it === "string") return `- **${it}**`;
      if (it && typeof it === "object") {
        if (it.title) return `- **${it.title}**${it.issued_by ? `, ${it.issued_by}` : ""}`;
        if (it.name) return `- **${it.name}**`;
      }
      return `- **${String(it)}**`;
    });
    return lines.join("\n");
  }

  // Contact
  if (isContactQuery) {
    const ci = parsed.contact_information || {};
    const parts: string[] = [];
    if (ci.name) parts.push(`- **Name:** ${ci.name}`);
    if (ci.email) parts.push(`- **Email:** ${ci.email}`);
    if (ci.phone) parts.push(`- **Phone:** ${ci.phone}`);
    if (ci.location) parts.push(`- **Location:** ${ci.location}`);
    if (parts.length === 0) return FALLBACK;
    return parts.join("\n");
  }

  // Summary / objective - Return exact content like Adobe AI Assistant
  if (isSummaryQuery) {
    const rawObjective = parsed._raw_sections?.objective;
    if (rawObjective && rawObjective.trim().length > 0) {
      return rawObjective.trim();
    }
    
    const s = parsed.objective_or_summary;
    let text = "";
    if (typeof s === "string") {
      text = s;
    } else if (s && typeof s === "object" && "text" in s) {
      text = String((s as any).text || "");
    }
    if (!text || String(text).trim() === "") return FALLBACK;
    return text.trim();
  }

  // Languages - Return exact content like Adobe AI Assistant
  if (isLanguagesQuery) {
    const rawLanguages = parsed._raw_sections?.languages;
    if (rawLanguages && rawLanguages.trim().length > 0) {
      return rawLanguages.trim();
    }
    
    const langs = parsed.languages || [];
    if (!Array.isArray(langs) || langs.length === 0) return FALLBACK;
    const formatted = formatList(langs.map((l) => (typeof l === "string" ? l : String(l))));
    return formatted || FALLBACK;
  }

  // If the query is empty or not recognized, return fallback
  if (q.length === 0) {
    return "Please ask a question about the resume. Try: 'skills', 'experience', 'education', 'projects', 'contact', or 'summary'.";
  }

  return FALLBACK;
}

/** Legacy function name for backward compatibility */
export async function generateResponse(
  resumeData: ResumeData, 
  userQuestion: string,
  resumeText?: string
): Promise<string> {
  return answerFromParsed(resumeData, userQuestion, resumeText);
}
