import React from 'react';
import { Icon } from './Icon';
import { VersionLog } from '../types';

interface RightSidebarProps {
  logs: VersionLog[];
  activeLogId: string | null;
  onLogClick: (log: VersionLog) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ logs, activeLogId, onLogClick }) => {
  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl z-20 transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 transition-colors h-16">
        <h2 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Icon name="history" className="text-primary" />
          Version History
        </h2>
        <div className="flex gap-1">
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1" title="Filter">
            <Icon name="filter_list" className="text-[20px]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${log.color} shadow-sm z-10`}></div>
            
            <div 
              onClick={() => onLogClick(log)}
              className={`cursor-pointer group p-3 rounded-lg border transition-all ${
                activeLogId === log.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold transition-colors ${activeLogId === log.id ? 'text-primary' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                  {log.title}
                </span>
                {log.isActive && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">Current</span>}
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                 <span>{log.timestamp}</span>
                 <span>•</span>
                 <span>{log.author}</span>
              </div>

              {log.details && (
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                  {log.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};