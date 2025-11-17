import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Award, FolderGit } from 'lucide-react';
import type { ResumeData } from '../lib/types';

interface ResumeInfoProps {
  data: ResumeData;
}

export default function ResumeInfo({ data }: ResumeInfoProps) {
  const { contact_information, objective_or_summary, skills_or_tech_stack, education, experience, projects, certifications } = data;

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        {contact_information && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
            </div>

            <div className="space-y-3">
              {contact_information.name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{contact_information.name}</span>
                </div>
              )}
              {contact_information.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{contact_information.email}</span>
                </div>
              )}
              {contact_information.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{contact_information.phone}</span>
                </div>
              )}
              {contact_information.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{contact_information.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {objective_or_summary && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Professional Summary</h2>
            <p className="text-slate-700 leading-relaxed">{objective_or_summary}</p>
          </div>
        )}

        {skills_or_tech_stack && skills_or_tech_stack.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Skills & Technologies</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills_or_tech_stack.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {experience && experience.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Work Experience</h2>
            </div>

            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  {exp.position && (
                    <h3 className="font-semibold text-slate-900">{exp.position}</h3>
                  )}
                  {exp.company && (
                    <p className="text-blue-600 font-medium">{exp.company}</p>
                  )}
                  {exp.duration && (
                    <p className="text-sm text-slate-500 mb-2">{exp.duration}</p>
                  )}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  )}
                  {exp.details && (
                    <p className="text-slate-700 mt-2">{exp.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {education && education.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            </div>

            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  {edu.institution && (
                    <h3 className="font-semibold text-slate-900">{edu.institution}</h3>
                  )}
                  {edu.degree && (
                    <p className="text-blue-600">{edu.degree}</p>
                  )}
                  {edu.field && (
                    <p className="text-slate-600">{edu.field}</p>
                  )}
                  {edu.year && (
                    <p className="text-sm text-slate-500">{edu.year}</p>
                  )}
                  {edu.details && (
                    <p className="text-slate-700 mt-2">{edu.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FolderGit className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
            </div>

            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={index} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  {project.name && (
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  )}
                  {project.description && (
                    <p className="text-slate-700 mt-1">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
            </div>

            <ul className="space-y-2">
              {certifications.map((cert, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-slate-700">{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
