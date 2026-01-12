import React from 'react';
import { FileText, PenSquare, ListPlus, LayoutGrid, Settings } from 'lucide-react';

interface LeftSidebarProps {
  onAddSection: () => void;
  onAiAssistantClick: () => void;
  onTemplatesClick?: () => void;
  onSettingsClick?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  onAddSection, 
  onAiAssistantClick, 
  onTemplatesClick,
  onSettingsClick 
}) => {
  return (
    <aside className="w-16 flex flex-col items-center py-4 gap-4 border-r border-slate-800 bg-slate-900 z-20">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4 cursor-pointer hover:bg-blue-600 transition-colors">
        <FileText size={24} />
      </div>

      <div className="flex flex-col gap-3 w-full px-2">
        <button className="p-3 bg-blue-900/30 text-blue-400 rounded-xl flex flex-col items-center gap-1 group relative w-full border border-blue-500/30 transition-all" title="Content Editor">
          <PenSquare size={20} />
        </button>
        
        <button 
          onClick={onAddSection}
          className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl flex flex-col items-center gap-1 transition-colors w-full" 
          title="Add Section"
        >
          <ListPlus size={20} />
        </button>
      </div>

      <div className="mt-auto w-full px-2 flex flex-col gap-3">
        <button 
          onClick={onSettingsClick}
          className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors" 
          title="Settings"
        >
          <Settings size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden mx-auto mt-2 border border-slate-600 hover:border-slate-400 transition-colors cursor-pointer" title="Switch Profile">
           <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVmMoU3pMoWsCoTJtd46V2MW_3IN6P5quBxN4EFgxL8w5xPW0GB6tqv82d-QP9XGLlDYcs6eeczgucm0DPI1T84KEGy_DZr6FpSHQp97g8VuSVcpG33aCOgmNm9rS-3riFejfdk9Hx4GjOqXes4-EmHIRy21E3W4iybIk13Dka6T5pSd84ik1CC7SucyDCCnRpxkDM6deOMk1l51C6ERZMVhbeQZ5Lf1av7glZJw29bbRqm8nAOPcC97cS6xosUPTJirnUalP8Zeg" className="w-full h-full object-cover" alt="User" />
        </div>
      </div>
    </aside>
  );
};
