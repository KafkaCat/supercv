import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './components/Icon';
import { LandingPage } from './components/LandingPage';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { FormEditor } from './components/FormEditor';
import { ResumePreview } from './components/ResumePreview';
import { DiffView } from './components/DiffView';
import { FitScoreModal } from './components/FitScoreModal';
import { AddSectionModal } from './components/AddSectionModal';
import { INITIAL_DATA_EN, MOCK_HISTORY_LOGS } from './data';
import { ResumeData, AppMode, VersionLog, Session } from './types';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  
  // Session State
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'session-default',
      name: 'General Resume',
      jd: '',
      data: JSON.parse(JSON.stringify(INITIAL_DATA_EN)),
      history: MOCK_HISTORY_LOGS,
      lastSaved: 'Just now'
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session-default');
  
  // Derived state helper
  const currentSession = sessions.find(s => s.id === currentSessionId)!;
  const resumeData = currentSession.data;
  
  // UI State
  const [activeLogDiff, setActiveLogDiff] = useState<VersionLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFitModal, setShowFitModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Helper to update current session data
  const updateCurrentSession = (newData: Partial<ResumeData> | ((prev: ResumeData) => ResumeData)) => {
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === currentSessionId) {
        const updatedData = typeof newData === 'function' ? newData(session.data) : { ...session.data, ...newData };
        return { ...session, data: updatedData };
      }
      return session;
    }));
  };

  // Auto-Save Logic
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    setIsSaving(true);
    autoSaveTimerRef.current = setTimeout(() => {
      // Perform save "API call"
      setIsSaving(false);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
           return { ...s, lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        }
        return s;
      }));
    }, 2000); // Save 2 seconds after last change (debounce)

    return () => {
       if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [resumeData]);

  // Handle Dark Mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleGenerate = (jd: string) => {
    // Create new session
    const newSessionId = `session-${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      name: `Target: ${jd.split(' ').slice(0, 3).join(' ')}...`,
      jd: jd,
      data: JSON.parse(JSON.stringify(INITIAL_DATA_EN)), // Start with fresh copy
      history: [],
      lastSaved: 'Just created'
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
    setAppMode('editor');
  };

  const handleDataChange = (sectionId: string, itemId: string | null, field: string, value: any) => {
    updateCurrentSession(prev => {
      const newData = { ...prev };
      const section = newData.sections[sectionId];
      
      if (!section) return prev;

      if (itemId && section.items) {
        const itemIndex = section.items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
          section.items[itemIndex] = { ...section.items[itemIndex], [field]: value };
        }
      } else {
        (section as any)[field] = value;
      }
      return newData;
    });
  };

  const handleManualSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const newLog: VersionLog = {
        id: `v-${Date.now()}`,
        title: 'Manual Save',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: 'You',
        isActive: true,
        color: 'bg-blue-500',
        details: 'Saved current changes.',
        snapshot: JSON.parse(JSON.stringify(resumeData)) // Save snapshot
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
             ...s, 
             history: [newLog, ...s.history.map(h => ({...h, isActive: false}))],
             lastSaved: 'Saved just now'
          };
        }
        return s;
      }));
    }, 800);
  };

  const handleRestore = () => {
    if (!activeLogDiff?.snapshot) {
      alert("Cannot restore this version (Snapshot missing).");
      return;
    }
    
    // Restore data
    updateCurrentSession(activeLogDiff.snapshot);
    setActiveLogDiff(null);
    
    // Add a log entry for the restore
    const restoreLog: VersionLog = {
       id: `v-restore-${Date.now()}`,
       title: `Restored: ${activeLogDiff.title}`,
       timestamp: 'Just now',
       author: 'System',
       isActive: true,
       color: 'bg-orange-500',
       details: `Restored to version from ${activeLogDiff.timestamp}`,
       snapshot: activeLogDiff.snapshot
    };

    setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
             ...s, 
             history: [restoreLog, ...s.history.map(h => ({...h, isActive: false}))]
          };
        }
        return s;
    }));
  };

  const handleAddSection = (type: string, title: string) => {
    const newId = `custom-${Date.now()}`;
    const newSection = {
      id: newId,
      type: type as any,
      title: title,
      items: []
    };

    updateCurrentSession(prev => ({
      ...prev,
      sections: { ...prev.sections, [newId]: newSection },
      order: [...prev.order, newId]
    }));
    setShowAddSectionModal(false);
  };

  const handleSmartFit = () => {
    // Simple heuristic to toggle between "Compact" and "Comfortable"
    const currentSize = resumeData.layout.fontSize;
    const isCompact = currentSize < 10.5;

    updateCurrentSession(prev => ({
      ...prev,
      layout: isCompact ? {
        fontSize: 10.5,
        lineHeight: 1.5,
        margin: 40,
        fontFamily: 'sans'
      } : {
        fontSize: 9.5,
        lineHeight: 1.3,
        margin: 30,
        fontFamily: 'sans'
      }
    }));
  };

  const handleAiAssistant = () => {
    setShowFitModal(true);
  };

  if (appMode === 'landing') {
    return <LandingPage onGenerate={handleGenerate} />;
  }

  return (
    <div className="h-screen flex flex-col font-body bg-slate-900 text-slate-100 overflow-hidden">
      <FitScoreModal isOpen={showFitModal} onClose={() => setShowFitModal(false)} />
      <AddSectionModal 
        isOpen={showAddSectionModal} 
        onClose={() => setShowAddSectionModal(false)}
        onAdd={handleAddSection}
      />
      
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded-lg transition-colors" onClick={() => setAppMode('landing')}>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
               <Icon name="description" className="text-sm text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Resume.ai</span>
          </div>
          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          
          {/* Session Switcher */}
          <div className="relative group">
             <button className="flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
               {currentSession.name}
               <Icon name="expand_more" className="text-[16px]" />
             </button>
             <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                   {sessions.map(s => (
                     <button 
                       key={s.id}
                       onClick={() => setCurrentSessionId(s.id)}
                       className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${currentSessionId === s.id ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                     >
                       <span className="truncate">{s.name}</span>
                       {currentSessionId === s.id && <Icon name="check" className="text-[14px]" />}
                     </button>
                   ))}
                   <div className="h-px bg-slate-700 my-1"></div>
                   <button onClick={() => setAppMode('landing')} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-700 flex items-center gap-2">
                      <Icon name="add" className="text-[14px]" /> New Resume
                   </button>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Smart Fit Button */}
           <button 
             onClick={handleSmartFit}
             className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all mr-2"
             title="Toggle One-Page Fit"
           >
             <Icon name="straighten" className="text-[16px]" />
             Smart Fit
           </button>

           <span className="text-xs text-slate-500 mr-2 flex items-center gap-1 min-w-[80px] justify-end">
             {isSaving ? <Icon name="sync" className="animate-spin text-xs" /> : <Icon name="cloud_done" className="text-xs" />}
             {isSaving ? 'Saving...' : currentSession.lastSaved}
           </span>
           <button 
             onClick={handleManualSave}
             className="px-4 py-1.5 bg-primary hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
           >
             Save Version
           </button>
           <button 
              onClick={() => window.print()}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Icon name="download" />
           </button>
        </div>
      </header>

      {/* Main Workspace - Split Screen */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar 
           onAddSection={() => setShowAddSectionModal(true)}
           onAiAssistantClick={handleAiAssistant}
           onTemplatesClick={handleSmartFit} // Reusing Smart Fit logic as "Layout Template" for demo
           onSettingsClick={() => alert("Global Settings: \n- Language: English\n- Theme: Dark")}
        />
        
        {/* Left: Form Editor (40% width) */}
        <div className="w-[450px] xl:w-[500px] flex-shrink-0 flex flex-col border-r border-slate-800 z-10">
           <FormEditor 
             data={resumeData} 
             onChange={handleDataChange}
             onAddSection={() => setShowAddSectionModal(true)}
           />
        </div>

        {/* Right: Preview (Auto width) */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 shadow-sm z-10 flex items-center gap-2 pointer-events-none">
              <Icon name="visibility" className="text-xs" /> Live Preview
           </div>
           <ResumePreview data={resumeData} scale={0.85} />
        </div>

        {/* Far Right: History Sidebar */}
        <RightSidebar 
          logs={currentSession.history} 
          activeLogId={activeLogDiff?.id || null}
          onLogClick={(log) => setActiveLogDiff(log)}
        />

        {/* Diff Overlay Panel */}
        {activeLogDiff && (
          <DiffView 
            log={activeLogDiff} 
            onClose={() => setActiveLogDiff(null)}
            onRestore={handleRestore}
          />
        )}
      </div>
    </div>
  );
};

export default App;