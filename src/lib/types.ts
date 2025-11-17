export interface ResumeData {
  objective_or_summary?: string;
  skills_or_tech_stack?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  languages?: string[];
  contact_information?: ContactInfo;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string;
  details?: string;
}

export interface ExperienceEntry {
  company?: string;
  position?: string;
  duration?: string;
  responsibilities?: string[];
  details?: string;
}

export interface ProjectEntry {
  name?: string;
  description?: string;
  technologies?: string[];
  details?: string;
}

export interface ResumeSession {
  id: string;
  user_id?: string;
  title: string;
  file_name: string;
  file_type: string;
  parsed_data: ResumeData;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      resume_sessions: {
        Row: ResumeSession;
        Insert: Omit<ResumeSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ResumeSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
    };
  };
}
