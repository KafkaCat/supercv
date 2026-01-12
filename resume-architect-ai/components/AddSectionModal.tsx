import React from 'react';
import { Icon } from './Icon';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: string, title: string) => void;
}

const SECTION_TYPES = [
  { id: 'projects', icon: 'rocket_launch', label: 'Projects', desc: 'Showcase your work' },
  { id: 'custom', icon: 'star', label: 'Custom Section', desc: 'Awards, Certifications, etc.' },
  { id: 'skills', icon: 'psychology', label: 'Skills', desc: 'Languages, Frameworks' },
  { id: 'education', icon: 'school', label: 'Education', desc: 'Degrees and courses' },
  { id: 'experience', icon: 'work', label: 'Experience', desc: 'Work history' },
  { id: 'languages', icon: 'translate', label: 'Languages', desc: 'Spoken languages' },
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({ isOpen, onClose, onAdd }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Icon name="playlist_add" className="text-primary" />
            Add Section
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded transition-colors">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {SECTION_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => onAdd(type.id === 'languages' ? 'custom' : type.id, type.label)}
              className="flex flex-col items-start p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-primary/50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-slate-900 text-primary mb-2 group-hover:scale-110 transition-transform">
                <Icon name={type.icon} />
              </div>
              <span className="text-sm font-bold text-slate-200">{type.label}</span>
              <span className="text-[10px] text-slate-500">{type.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};