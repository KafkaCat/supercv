import React from 'react';
import { Icon } from './Icon';
import { ResumeData, ResumeSectionData } from '../types';

interface FormEditorProps {
  data: ResumeData;
  onChange: (sectionId: string, itemId: string | null, field: string, value: any) => void;
  onAddSection: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({ data, onChange, onAddSection }) => {
  
  const renderHeaderForm = (section: ResumeSectionData) => (
    <div key={section.id} className="space-y-4 mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon name="badge" className="text-base" />
        Personal Info
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
           <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
           <input 
            type="text" 
            value={section.title}
            onChange={(e) => onChange(section.id, null, 'title', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
           />
        </div>
        <div className="col-span-2">
           <label className="block text-xs font-medium text-slate-500 mb-1">Headline</label>
           <input 
            type="text" 
            value={section.content}
            onChange={(e) => onChange(section.id, null, 'content', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
           />
        </div>
        {section.contacts?.map((contact, idx) => (
          <div key={idx} className="col-span-1">
             <label className="block text-xs font-medium text-slate-500 mb-1 capitalize">{contact.type}</label>
             <div className="relative">
                <input 
                  type="text" 
                  value={contact.value}
                  // Simplified change handler for nested array for demo
                  onChange={(e) => {
                     const newContacts = [...(section.contacts || [])];
                     newContacts[idx] = { ...newContacts[idx], value: e.target.value };
                     onChange(section.id, null, 'contacts', newContacts);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
                <Icon name={contact.icon} className="absolute left-2.5 top-2.5 text-slate-500 text-[16px]" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListSectionForm = (section: ResumeSectionData) => (
    <div key={section.id} className="space-y-4 mb-8 border-t border-slate-800 pt-6">
       <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Icon name={section.id === 'experience' ? 'work' : section.id === 'projects' ? 'rocket_launch' : 'school'} className="text-base" />
          {section.title}
        </h3>
        <button className="text-xs text-primary hover:text-blue-400 font-bold flex items-center gap-1 transition-colors">
          <Icon name="add" className="text-sm" /> Add Item
        </button>
      </div>

      <div className="space-y-6">
        {section.items?.map((item, index) => (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3 relative group">
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
               <button className="p-1 hover:text-red-400 text-slate-500 transition-colors"><Icon name="delete" className="text-sm" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input 
                  type="text" 
                  value={item.title} 
                  onChange={(e) => onChange(section.id, item.id, 'title', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 pb-1 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
                  placeholder="Title (e.g. Senior Designer)"
                />
              </div>
              <div className="col-span-1">
                <input 
                  type="text" 
                  value={item.subtitle} 
                  onChange={(e) => onChange(section.id, item.id, 'subtitle', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 pb-1 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
                  placeholder="Company / Institution"
                />
              </div>
               <div className="col-span-1 text-right">
                <input 
                  type="text" 
                  value={item.date} 
                  onChange={(e) => onChange(section.id, item.id, 'date', e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 pb-1 text-xs text-slate-400 text-right placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
                  placeholder="Date Range"
                />
              </div>
            </div>

            {item.description && (
              <div className="mt-2">
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description (Bullet points)</label>
                 <textarea 
                    value={item.description.join('\n')}
                    onChange={(e) => onChange(section.id, item.id, 'description', e.target.value.split('\n'))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 min-h-[100px] outline-none focus:ring-1 focus:ring-primary/50 resize-y leading-relaxed"
                    placeholder="• Achieved X results..."
                 />
              </div>
            )}
            
            {item.tags && (
              <div className="mt-2">
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Skills (Comma separated)</label>
                 <input 
                    type="text"
                    value={item.tags.join(', ')}
                    onChange={(e) => onChange(section.id, item.id, 'tags', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-primary/50"
                 />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-900 overflow-y-auto no-scrollbar border-r border-slate-800 flex flex-col">
       <div className="p-6 pb-32">
          {data.sections['header'] && renderHeaderForm(data.sections['header'])}
          
          {data.order.map(sectionId => {
            if (sectionId === 'header') return null;
            const section = data.sections[sectionId];
            if (section.type === 'summary') {
              return (
                <div key={section.id} className="space-y-4 mb-8 border-t border-slate-800 pt-6">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icon name="short_text" className="text-base" />
                    Summary
                  </h3>
                   <textarea 
                      value={section.content}
                      onChange={(e) => onChange(section.id, null, 'content', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 min-h-[120px] outline-none focus:ring-2 focus:ring-primary/50 leading-relaxed"
                   />
                </div>
              );
            }
            return renderListSectionForm(section);
          })}

          <button 
            onClick={onAddSection}
            className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 font-bold text-sm hover:border-primary hover:text-primary hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="add_circle_outline" />
            Add New Section
          </button>
       </div>
    </div>
  );
};