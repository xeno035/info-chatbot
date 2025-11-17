import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { ResumeSession } from '../lib/types';

interface SessionSidebarProps {
  sessions: ResumeSession[];
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Analysis
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Recent Sessions
        </h2>

        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-all cursor-pointer ${
                  currentSessionId === session.id
                    ? 'bg-slate-800'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div
                  onClick={() => onSelectSession(session.id)}
                  className="p-3 pr-10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <h3 className="font-medium text-sm truncate">{session.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{session.file_name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(session.created_at)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          AI Resume Analysis System
        </div>
      </div>
    </div>
  );
}
