import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import SessionSidebar from './components/SessionSidebar';
import ResumeInfo from './components/ResumeInfo';
import { supabase } from './lib/supabase';
import { parseResumeText } from './lib/resumeParser';
import { parseResumeWithLayoutLM } from './lib/layoutlmParser';
import { answerFromParsed, normalizeParsed } from './lib/chatbot';
import type { ResumeSession, ChatMessage } from './lib/types';

function App() {
  const [sessions, setSessions] = useState<ResumeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ResumeSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('resume_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    setSessions(data || []);
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  // Sanitize data to remove null bytes and invalid Unicode characters
  const sanitizeData = (data: any): any => {
    if (typeof data === 'string') {
      return data.replace(/\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    }
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeData(value);
      }
      return sanitized;
    }
    return data;
  };

  const handleFileUpload = async (file: File, text: string, imageData?: string) => {
    setIsUploading(true);

    try {
      // Use LayoutLM parser if available, otherwise fallback to text-based
      let parsedData;
      try {
        parsedData = await parseResumeWithLayoutLM(text, imageData);
      } catch (error) {
        console.warn('LayoutLM parsing failed, using fallback:', error);
        parsedData = parseResumeText(text);
      }
      
      // Normalize parsed data to ensure consistent structure
      const normalizedData = normalizeParsed(parsedData);
      // Store original resume text for RAG (Gemini)
      normalizedData._raw_text = text;
      const sanitizedData = sanitizeData(normalizedData);

      const title = sanitizedData.contact_information?.name
        ? `${sanitizedData.contact_information.name}'s Resume`
        : file.name.replace(/\.[^/.]+$/, '');

      // Sanitize title as well
      const sanitizedTitle = sanitizeData(title);

      const { data: session, error } = await supabase
        .from('resume_sessions')
        .insert({
          title: sanitizedTitle,
          file_name: file.name,
          file_type: file.name.split('.').pop() || 'txt',
          parsed_data: sanitizedData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        alert('Failed to create session. Please try again.');
        return;
      }

      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);

      const welcomeMessage = `Hello! I've analyzed the resume for ${sanitizedData.contact_information?.name || 'this candidate'}. I can answer questions about their skills, experience, education, projects, and more. What would you like to know?`;
      const sanitizedWelcomeMessage = sanitizeData(welcomeMessage);

      await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          role: 'assistant',
          content: sanitizedWelcomeMessage,
        });

      await loadMessages(session.id);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    setIsChatLoading(true);

    try {
      const sanitizedContent = sanitizeData(content);
      
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          role: 'user',
          content: sanitizedContent,
        });

      if (userError) throw userError;

      // Get original resume text from parsed data for RAG
      const resumeText = currentSession.parsed_data._raw_text || '';
      const response = await answerFromParsed(currentSession.parsed_data, sanitizedContent, resumeText);
      const sanitizedResponse = sanitizeData(response);

      const { error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          role: 'assistant',
          content: sanitizedResponse,
        });

      if (assistantError) throw assistantError;

      await loadMessages(currentSession.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setMessages([]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    const { error } = await supabase
      .from('resume_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session.');
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));

    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setMessages([]);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex h-screen">
        {sessions.length > 0 && (
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSession?.id}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
        <div className="flex-1">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isUploading} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSession.id}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex">
        <div className="w-1/2 bg-white border-r border-slate-200">
          <div className="h-16 border-b border-slate-200 flex items-center px-6">
            <h1 className="text-lg font-semibold text-slate-900">{currentSession.title}</h1>
          </div>
          <ResumeInfo data={currentSession.parsed_data} />
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="h-16 border-b border-slate-200 flex items-center px-6 bg-white">
            <h2 className="text-lg font-semibold text-slate-900">Chat Assistant</h2>
          </div>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
