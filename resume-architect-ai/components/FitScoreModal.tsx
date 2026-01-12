import React from 'react';
import { Icon } from './Icon';

interface FitScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FitScoreModal: React.FC<FitScoreModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Icon name="analytics" className="text-primary" />
              Resume Fit Analysis
            </h2>
            <p className="text-sm text-slate-500 mt-1">Target Job: <strong className="text-slate-700 dark:text-slate-300">Senior Product Designer</strong></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto no-scrollbar">
          <div className="flex gap-8 items-center mb-8">
            <div className="relative w-32 h-32 flex-shrink-0">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                 <circle className="text-slate-200 dark:text-slate-700 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                 <circle className="text-green-500 progress-ring__circle stroke-current" strokeWidth="10" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="20"></circle>
               </svg>
               <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                 <span className="text-3xl font-bold text-slate-800 dark:text-white">92</span>
                 <span className="text-xs font-bold text-slate-400 uppercase">Score</span>
               </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Keywords</span>
                  <span className="text-green-600">High</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Impact & Quantifiable Metrics</span>
                  <span className="text-blue-600">Good</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Brevity & Formatting</span>
                  <span className="text-orange-500">Needs Improvement</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-orange-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Icon name="recommend" className="text-primary" />
              AI Recommendations
            </h3>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg flex gap-3">
              <Icon name="check_circle" className="text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-green-800 dark:text-green-400">Great Job Keywords</h4>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">Your resume includes critical industry terms like "Design System", "User Retention", and "Figma".</p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg flex gap-3">
              <Icon name="lightbulb" className="text-orange-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400">Action Required: Summary Length</h4>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Your summary is slightly long (52 words). Recruiters prefer summaries under 40 words. Consider removing generic adjectives.</p>
                <button className="mt-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow">
                  Auto-Fix with AI
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg flex gap-3">
               <Icon name="add_task" className="text-blue-500 mt-0.5" />
               <div>
                 <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400">Missing Skill: Motion Design</h4>
                 <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">70% of "Senior Product Designer" roles in San Francisco currently list "Motion Design" or "After Effects" as a nice-to-have.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};