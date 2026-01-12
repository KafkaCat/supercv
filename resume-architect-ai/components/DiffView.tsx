import React from 'react';
import { Icon } from './Icon';
import { VersionLog } from '../types';

interface DiffViewProps {
  log: VersionLog;
  onClose: () => void;
  onRestore: () => void;
}

export const DiffView: React.FC<DiffViewProps> = ({ log, onClose, onRestore }) => {
  return (
    <div className="absolute inset-y-0 right-96 z-30 w-[600px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
           <div className={`w-3 h-3 rounded-full ${log.color}`}></div>
           <div>
             <h3 className="font-bold text-slate-800 dark:text-white text-sm">{log.title}</h3>
             <p className="text-xs text-slate-500">{log.timestamp} • {log.author}</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={onRestore}
             className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
           >
             Restore
           </button>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
             <Icon name="close" />
           </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/30">
        {log.diff && log.diff.length > 0 ? (
          <div className="space-y-8">
            {log.diff.map((diffItem, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Icon name="edit_note" className="text-slate-400 text-sm" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{diffItem.sectionTitle}</span>
                 </div>
                 <div className="p-4 font-mono text-xs leading-relaxed space-y-1">
                    {diffItem.changes.map((part, idx) => (
                      <div key={idx} className={`
                        ${part.type === 'added' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-2 border-green-500 pl-2' : ''}
                        ${part.type === 'removed' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-2 border-red-500 pl-2 line-through decoration-red-400/50' : ''}
                        ${part.type === 'unchanged' ? 'text-slate-500 dark:text-slate-400 pl-2.5' : ''}
                        block py-1
                      `}>
                         <span className="select-none text-slate-300 dark:text-slate-600 mr-3 w-4 inline-block text-right">{part.type === 'added' ? '+' : part.type === 'removed' ? '-' : ''}</span>
                         {part.value}
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Icon name="difference" className="text-4xl mb-2 opacity-50" />
            <p className="text-sm">No visual differences recorded for this version.</p>
          </div>
        )}
      </div>
    </div>
  );
};