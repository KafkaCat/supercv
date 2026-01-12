import React, { useEffect, useState } from 'react';
import { Activity, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { useResumeStore } from '../store/useResumeStore';
import { ChangeLogItem } from '../types';

interface RightSidebarProps {
  onLogClick?: (resume: any) => void;
}

const LogItemPreview: React.FC<{ log: ChangeLogItem }> = ({ log }) => {
  const { previousContent, type } = log;
  if (!previousContent) return null;

  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
        return <div className="italic text-slate-500">{content.length} items</div>;
    }
    if (typeof content === 'object' && content !== null) {
        return (
            <div className="space-y-1">
                {Object.entries(content).map(([k, v]) => {
                    if (k === 'id' || k === 'description' || v === null || v === undefined || v === '') return null;
                    return (
                        <div key={k} className="flex gap-2">
                            <span className="font-medium text-slate-500 capitalize w-16 shrink-0 truncate" title={k}>{k}:</span>
                            <span className="text-slate-700 dark:text-slate-300 truncate">{String(v)}</span>
                        </div>
                    );
                })}
                {content.description && (
                    <div className="mt-1 pt-1 border-t border-slate-200/50">
                        <div className="font-medium text-slate-500 text-[10px] mb-0.5">Description:</div>
                        <div className="text-slate-600 dark:text-slate-400 line-clamp-2 text-[10px]" dangerouslySetInnerHTML={{__html: content.description}}></div>
                    </div>
                )}
            </div>
        );
    }
    return <span>{String(content)}</span>;
  };

  if (type === 'delete') {
      return (
          <div className="mt-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded p-2 text-xs">
             <div className="font-semibold text-red-700 dark:text-red-400 mb-1 text-[10px] uppercase tracking-wider">Deleted Item Snapshot</div>
             {renderContent(previousContent)}
          </div>
      );
  }

  if (type === 'update') {
      return (
           <div className="mt-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded p-2 text-xs">
             <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1 text-[10px] uppercase tracking-wider">Previous State</div>
             {renderContent(previousContent)}
          </div>
      );
  }

  return (
      <div className="mt-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded p-2 text-xs">
         <pre className="whitespace-pre-wrap break-all text-slate-600 dark:text-slate-400 text-[10px]">
           {JSON.stringify(previousContent, null, 2)}
         </pre>
      </div>
  );
};

export const RightSidebar: React.FC<RightSidebarProps> = () => {
  const { currentResume, restoreFromLog } = useResumeStore();
  const [logs, setLogs] = useState(currentResume.changeLog || []);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setLogs(currentResume.changeLog || []);
  }, [currentResume.changeLog]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl z-20 transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 transition-colors h-16">
        <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Activity className="text-primary" size={20} />
          Version History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            No history recorded.
          </div>
        )}
        
        {logs.map((log) => {
           const dateStr = new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
           const isExpanded = expandedLogId === log.id;
           
           return (
            <div key={log.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
              <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${
                log.type === 'add' ? 'bg-green-500' : log.type === 'delete' ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
              
              <div 
                className="mb-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded p-1 -ml-1 flex items-center justify-between group"
                onClick={() => toggleExpand(log.id)}
              >
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {log.section}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">{dateStr}</span>
                </div>
                {log.previousContent && (
                  <div className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                     {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                {log.description}
                
                {isExpanded && log.previousContent && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <div className="text-slate-400 font-semibold text-[10px]">Details:</div>
                    {log.type === 'delete' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Restore this item?')) {
                                    restoreFromLog(log);
                                }
                            }}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-[10px]"
                        >
                            <RotateCcw size={12} /> Restore
                        </button>
                    )}
                </div>
                <LogItemPreview log={log} />
              </div>
            )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
