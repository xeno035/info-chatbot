import type { ResumeData } from './types';

export function generateResponse(resumeData: ResumeData, userQuestion: string): string {
  const lowerQuestion = userQuestion.toLowerCase();

  if (lowerQuestion.includes('skill') || lowerQuestion.includes('technolog') || lowerQuestion.includes('tech stack')) {
    return generateSkillsResponse(resumeData);
  }

  if (lowerQuestion.includes('experience') || lowerQuestion.includes('work') || lowerQuestion.includes('job')) {
    return generateExperienceResponse(resumeData);
  }

  if (lowerQuestion.includes('education') || lowerQuestion.includes('degree') || lowerQuestion.includes('university') || lowerQuestion.includes('college')) {
    return generateEducationResponse(resumeData);
  }

  if (lowerQuestion.includes('project')) {
    return generateProjectsResponse(resumeData);
  }

  if (lowerQuestion.includes('certification') || lowerQuestion.includes('certificate')) {
    return generateCertificationsResponse(resumeData);
  }

  if (lowerQuestion.includes('contact') || lowerQuestion.includes('email') || lowerQuestion.includes('phone')) {
    return generateContactResponse(resumeData);
  }

  if (lowerQuestion.includes('summar') || lowerQuestion.includes('overview') || lowerQuestion.includes('about')) {
    return generateSummaryResponse(resumeData);
  }

  if (lowerQuestion.includes('language')) {
    return generateLanguagesResponse(resumeData);
  }

  return generateGeneralResponse(resumeData, userQuestion);
}

function generateSkillsResponse(data: ResumeData): string {
  if (!data.skills_or_tech_stack || data.skills_or_tech_stack.length === 0) {
    return "The resume does not contain this information.";
  }

  const skills = data.skills_or_tech_stack;
  let response = "Based on the resume, here are the technical skills and technologies:\n\n";

  skills.forEach((skill, index) => {
    response += `• ${skill}\n`;
  });

  response += `\nTotal: ${skills.length} skills identified.`;
  return response;
}

function generateExperienceResponse(data: ResumeData): string {
  if (!data.experience || data.experience.length === 0) {
    return "The resume does not contain this information.";
  }

  let response = "Here's a summary of the work experience:\n\n";

  data.experience.forEach((exp, index) => {
    response += `${index + 1}. `;
    if (exp.position) response += `${exp.position}`;
    if (exp.company) response += ` at ${exp.company}`;
    response += '\n';

    if (exp.duration) response += `   Duration: ${exp.duration}\n`;

    if (exp.responsibilities && exp.responsibilities.length > 0) {
      response += '   Key Responsibilities:\n';
      exp.responsibilities.forEach(resp => {
        response += `   • ${resp}\n`;
      });
    }

    response += '\n';
  });

  return response.trim();
}

function generateEducationResponse(data: ResumeData): string {
  if (!data.education || data.education.length === 0) {
    return "The resume does not contain this information.";
  }

  let response = "Educational background:\n\n";

  data.education.forEach((edu, index) => {
    response += `${index + 1}. `;
    if (edu.degree) response += `${edu.degree}`;
    if (edu.field) response += ` in ${edu.field}`;
    response += '\n';

    if (edu.institution) response += `   Institution: ${edu.institution}\n`;
    if (edu.year) response += `   Year: ${edu.year}\n`;
    if (edu.details) response += `   ${edu.details}\n`;

    response += '\n';
  });

  return response.trim();
}

function generateProjectsResponse(data: ResumeData): string {
  if (!data.projects || data.projects.length === 0) {
    return "The resume does not contain this information.";
  }

  let response = "Projects listed in the resume:\n\n";

  data.projects.forEach((project, index) => {
    response += `${index + 1}. `;
    if (project.name) response += `${project.name}\n`;

    if (project.description) response += `   ${project.description}\n`;

    if (project.technologies && project.technologies.length > 0) {
      response += `   Technologies: ${project.technologies.join(', ')}\n`;
    }

    response += '\n';
  });

  return response.trim();
}

function generateCertificationsResponse(data: ResumeData): string {
  if (!data.certifications || data.certifications.length === 0) {
    return "The resume does not contain this information.";
  }

  let response = "Certifications:\n\n";

  data.certifications.forEach((cert, index) => {
    response += `${index + 1}. ${cert}\n`;
  });

  return response.trim();
}

function generateContactResponse(data: ResumeData): string {
  if (!data.contact_information) {
    return "The resume does not contain this information.";
  }

  const contact = data.contact_information;
  let response = "Contact Information:\n\n";

  if (contact.name) response += `Name: ${contact.name}\n`;
  if (contact.email) response += `Email: ${contact.email}\n`;
  if (contact.phone) response += `Phone: ${contact.phone}\n`;
  if (contact.location) response += `Location: ${contact.location}\n`;

  if (response === "Contact Information:\n\n") {
    return "The resume does not contain this information.";
  }

  return response.trim();
}

function generateSummaryResponse(data: ResumeData): string {
  if (data.objective_or_summary) {
    return `Professional Summary:\n\n${data.objective_or_summary}`;
  }

  let response = "Based on the resume:\n\n";
  let hasInfo = false;

  if (data.contact_information?.name) {
    response += `Candidate: ${data.contact_information.name}\n`;
    hasInfo = true;
  }

  if (data.skills_or_tech_stack && data.skills_or_tech_stack.length > 0) {
    response += `\nKey Skills: ${data.skills_or_tech_stack.slice(0, 5).join(', ')}`;
    if (data.skills_or_tech_stack.length > 5) {
      response += ` and ${data.skills_or_tech_stack.length - 5} more`;
    }
    response += '\n';
    hasInfo = true;
  }

  if (data.experience && data.experience.length > 0) {
    response += `\nWork Experience: ${data.experience.length} position(s)\n`;
    hasInfo = true;
  }

  if (data.education && data.education.length > 0) {
    response += `Education: ${data.education.length} qualification(s)\n`;
    hasInfo = true;
  }

  if (!hasInfo) {
    return "The resume does not contain this information.";
  }

  return response.trim();
}

function generateLanguagesResponse(data: ResumeData): string {
  if (!data.languages || data.languages.length === 0) {
    return "The resume does not contain this information.";
  }

  let response = "Languages:\n\n";

  data.languages.forEach((lang, index) => {
    response += `${index + 1}. ${lang}\n`;
  });

  return response.trim();
}

function generateGeneralResponse(data: ResumeData, question: string): string {
  return "I can help you with information from this resume. Try asking about:\n\n• Skills and technologies\n• Work experience\n• Education background\n• Projects\n• Certifications\n• Contact information\n• Professional summary";
}
