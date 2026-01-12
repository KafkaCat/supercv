import React, { useState } from 'react';
import { Icon } from './Icon';
import { ResumeData, ResumeSectionData } from '../types';

interface ResumeEditorProps {
  data: ResumeData;
  setData: (data: ResumeData) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, setData }) => {
  const [activeSection, setActiveSection] = useState<string>('experience');

  const handleTextChange = (sectionId: string, field: string, value: string, itemId?: string, index?: number) => {
    // In a real app, deeply clone and update state. For this demo, we assume the structure exists.
    // This is a simplified handler to demonstrate intent.
    console.log(`Update ${sectionId} ${itemId ? itemId : ''} ${field}: ${value}`);
  };

  const SectionWrapper: React.FC<{ sectionId: string; children: React.ReactNode }> = ({ sectionId, children }) => {
    const isActive = activeSection === sectionId;
    return (
      <div 
        className={`relative group border-2 rounded-lg p-4 -m-4 transition-all duration-200 ${
          isActive 
            ? 'border-primary/20 bg-blue-50/20 dark:bg-blue-900/10 z-10' 
            : 'border-transparent hover:border-blue-200 dark:hover:border-blue-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
        onClick={() => setActiveSection(sectionId)}
      >
        <div className={`absolute -left-10 top-8 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <Icon name="drag_indicator" className={`${isActive ? 'text-primary/60' : 'text-slate-300'} cursor-grab active:cursor-grabbing`} />
        </div>
        
        {isActive && (
          <div className="absolute -top-3 right-4 flex gap-2">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 animate-in fade-in zoom-in duration-200">
              <Icon name="edit" className="text-[14px]" /> EDITING
            </span>
          </div>
        )}
        {children}
      </div>
    );
  };

  const renderSection = (section: ResumeSectionData) => {
    switch (section.type) {
      case 'header':
        return (
          <div 
            className={`relative group border-2 rounded-lg p-2 -m-2 mb-6 transition-all ${activeSection === 'header' ? 'border-primary/20 bg-blue-50/20 dark:bg-blue-900/10' : 'border-transparent hover:border-blue-200 dark:hover:border-blue-900'}`}
            onClick={() => setActiveSection('header')}
            key={section.id}
          >
            <div className={`absolute -left-10 top-1/2 -translate-y-1/2 transition-opacity ${activeSection === 'header' || 'group-hover:opacity-100'} opacity-0`}>
              <Icon name="drag_indicator" className="text-slate-300 cursor-grab active:cursor-grabbing" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-1 dark:text-white outline-none focus:bg-blue-100/50 rounded px-1" contentEditable suppressContentEditableWarning>
                {section.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium outline-none focus:bg-blue-100/50 rounded px-1" contentEditable suppressContentEditableWarning>
                {section.content}
              </p>
              <div className="mt-3 flex justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                {section.contacts?.map((contact, idx) => (
                  <span key={idx} className="flex items-center gap-1 group/link cursor-pointer hover:text-primary transition-colors">
                    <Icon name={contact.icon} className="text-[14px]" /> 
                    <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-blue-100/50 rounded px-1">{contact.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <SectionWrapper sectionId={section.id} key={section.id}>
             <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
               {section.title}
               <Icon name="notes" className="text-slate-300 text-[16px]" />
             </h3>
             <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded p-1 transition-colors" contentEditable suppressContentEditableWarning>
               {section.content}
             </p>
          </SectionWrapper>
        );

      case 'experience':
      case 'education':
      case 'projects':
        return (
          <SectionWrapper sectionId={section.id} key={section.id}>
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
              {section.title}
              <button className="text-slate-400 hover:text-primary transition-colors" title="Add Item">
                <Icon name="add_circle" className="text-[18px]" />
              </button>
            </h3>
            <div className="space-y-6">
              {section.items?.map((item) => (
                <div key={item.id} className="relative group/item">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold dark:text-slate-100 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded px-1" contentEditable suppressContentEditableWarning>{item.title}</h4>
                    <span className="text-sm text-slate-500 whitespace-nowrap outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded px-1" contentEditable suppressContentEditableWarning>{item.date}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded px-1" contentEditable suppressContentEditableWarning>{item.subtitle}</p>
                    {item.location && <span className="text-xs text-slate-400 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded px-1" contentEditable suppressContentEditableWarning>{item.location}</span>}
                  </div>
                  {item.description && (
                    <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4 marker:text-slate-400">
                      {item.description.map((desc, idx) => (
                        <li key={idx} className="pl-1 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 rounded" contentEditable suppressContentEditableWarning>
                          {desc}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="absolute -right-6 top-0 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col gap-1">
                    <button className="text-slate-300 hover:text-red-500"><Icon name="delete" className="text-[16px]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'skills':
        return (
          <SectionWrapper sectionId={section.id} key={section.id}>
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 pb-2">
              {section.title}
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {section.items?.map((item) => (
                <div key={item.id}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    {item.title}
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.tags?.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-medium rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-text outline-none focus:ring-2 focus:ring-primary/20"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {tag}
                      </span>
                    ))}
                    <button className="px-2 py-1 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-[11px] rounded hover:border-primary hover:text-primary transition-colors">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>
        );
      
      default:
        return null;
    }
  };

  return (
    <section className="flex-1 bg-slate-50 dark:bg-slate-950 p-8 overflow-y-auto no-scrollbar relative transition-colors">
      <div className="max-w-[800px] mx-auto scale-100 origin-top pb-20">
        <div className="bg-white dark:bg-slate-900 resume-shadow min-h-[1056px] p-12 flex flex-col gap-6 transition-colors duration-200 relative">
          
          {/* Always render Header first */}
          {renderSection(data.sections['header'])}
          
          {/* Render remaining sections based on order */}
          {data.order.map(sectionId => {
             if (sectionId === 'header') return null;
             return renderSection(data.sections[sectionId]);
          })}

        </div>
        
        {/* Page Break Indicator (Visual only) */}
        <div className="w-full flex items-center gap-4 mt-8 opacity-30">
          <div className="h-px bg-slate-400 flex-1 dashed"></div>
          <span className="text-xs font-mono text-slate-500">PAGE 1 END</span>
          <div className="h-px bg-slate-400 flex-1 dashed"></div>
        </div>
      </div>
    </section>
  );
};