import React, { useEffect, useState, useRef } from 'react';
import { db } from '../db';
import { Resume } from '../types';
import { FileText, Plus, Settings, Edit2, Check, Trash2, Wand2, Upload } from 'lucide-react';
import { useResumeStore } from '../store/useResumeStore';

interface SessionSidebarProps {
  onSelectSession: (resume: Resume) => void;
  onNewSession: () => void;
  onImportClick?: () => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({ onSelectSession, onNewSession, onImportClick }) => {
  const [sessions, setSessions] = useState<Resume[]>([]);
  const { currentResume, deleteResume, optimizeLayout } = useResumeStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const loadSessions = async () => {
    const all = await db.resumes.orderBy('updatedAt').reverse().toArray();
    setSessions(all);
  };

  useEffect(() => {
    loadSessions();
  }, [currentResume.id, currentResume.updatedAt]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (e: React.MouseEvent, session: Resume) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || '');
  };

  const handleSaveTitle = async (id: string) => {
    if (editTitle.trim()) {
      await db.resumes.update(id, { title: editTitle.trim() });
      if (currentResume.id === id) {
         // Trigger reload logic via parent or store if needed, mostly handled by useEffect deps
      }
      loadSessions();
    }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this resume?')) {
      await deleteResume(id);
      loadSessions();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full z-30 shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-200 font-bold flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Resumes
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={onImportClick}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Import Resume"
          >
            <Upload size={16} />
          </button>
          <button 
            onClick={onNewSession}
            className="p-1.5 bg-primary text-white rounded hover:bg-blue-600 transition-colors"
            title="New Resume"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map(session => {
          const isActive = session.id === currentResume.id;
          const isEditing = editingId === session.id;
          const lang = session.language === 'zh' ? '中文' : 'English';

          return (
            <div 
              key={session.id}
              onClick={() => !isEditing && onSelectSession(session)}
              className={`p-3 rounded-lg cursor-pointer transition-colors group flex items-start gap-3 ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <FileText size={18} className={`mt-0.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-600'}`} />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={editInputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => handleSaveTitle(session.id)}
                      className="w-full bg-slate-900 text-white text-xs px-1 py-0.5 rounded border border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="group/item relative pr-6">
                    <div className="font-medium text-sm truncate">
                      {session.title || 'Untitled Resume'}
                    </div>
                    
                    <div className="absolute right-[-24px] top-0 opacity-0 group-hover/item:opacity-100 flex gap-1 bg-slate-800/80 backdrop-blur rounded px-1 transition-opacity">
                      <button 
                        onClick={(e) => handleStartEdit(e, session)}
                        className="text-slate-400 hover:text-white p-1"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, session.id)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang}
                      </span>
                      <div className="text-xs text-slate-500 truncate flex-1">
                        {session.jobDescription ? 'Targeted' : 'General'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
        <button 
          onClick={optimizeLayout}
          className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors text-xs font-bold"
        >
          <Wand2 size={14} />
          Smart Fit Layout
        </button>
      </div>
    </div>
  );
};
