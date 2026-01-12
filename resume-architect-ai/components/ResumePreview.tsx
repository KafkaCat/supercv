import React from 'react';
import { Icon } from './Icon';
import { ResumeData, ResumeSectionData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  scale?: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, scale = 1 }) => {
  const { layout } = data;
  
  // Dynamic styles based on layout config
  const pageStyle = {
    padding: `${layout.margin}px`,
    fontSize: `${layout.fontSize}pt`,
    lineHeight: layout.lineHeight,
    fontFamily: layout.fontFamily === 'serif' ? 'Georgia, serif' : layout.fontFamily === 'mono' ? 'Courier New, monospace' : 'inherit'
  };

  const renderSection = (section: ResumeSectionData) => {
    switch (section.type) {
      case 'header':
        return (
          <div key={section.id} className="mb-6 pb-6 border-b border-slate-200" style={{ borderColor: 'rgba(226, 232, 240, 1)' }}>
            <h1 className="font-bold tracking-tight mb-2 text-slate-900 uppercase" style={{ fontSize: '2.5em', lineHeight: 1.1 }}>
              {section.title}
            </h1>
            <p className="font-medium mb-4 text-slate-600" style={{ fontSize: '1.1em' }}>
              {section.content}
            </p>
            <div className="flex flex-wrap gap-4 text-slate-600" style={{ fontSize: '0.9em' }}>
              {section.contacts?.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-slate-400 flex items-center"><Icon name={contact.icon} className="text-[1.1em]" /></span>
                  <span>{contact.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'summary':
        return (
          <div key={section.id} className="mb-6">
             <h3 className="font-bold text-primary mb-2 uppercase tracking-[0.2em] flex items-center gap-2" style={{ fontSize: '0.9em' }}>
               {section.title}
             </h3>
             <p className="text-slate-800 text-justify">
               {section.content}
             </p>
          </div>
        );

      case 'experience':
      case 'education':
      case 'projects':
      case 'custom':
        return (
          <div key={section.id} className="mb-6">
            <h3 className="font-bold text-primary mb-3 uppercase tracking-[0.2em] pb-1 border-b border-slate-100" style={{ fontSize: '0.9em' }}>
              {section.title}
            </h3>
            <div className="space-y-4">
              {section.items?.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-bold text-slate-900" style={{ fontSize: '1.05em' }}>{item.title}</h4>
                    <span className="font-medium text-slate-500 whitespace-nowrap font-mono" style={{ fontSize: '0.85em' }}>{item.date}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <p className="font-semibold text-slate-700" style={{ fontSize: '0.95em' }}>{item.subtitle}</p>
                    {item.location && <span className="text-slate-400" style={{ fontSize: '0.8em' }}>{item.location}</span>}
                  </div>
                  {item.description && (
                    <ul className="text-slate-700 list-disc pl-4 marker:text-slate-400">
                      {item.description.map((desc, idx) => (
                        <li key={idx} className="pl-1 mb-0.5 last:mb-0">{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div key={section.id} className="mb-6">
            <h3 className="font-bold text-primary mb-2 uppercase tracking-[0.2em] pb-1 border-b border-slate-100" style={{ fontSize: '0.9em' }}>
              {section.title}
            </h3>
            <div className="grid grid-cols-1 gap-y-2">
              {section.items?.map((item) => (
                <div key={item.id} className="flex items-baseline">
                  <h4 className="font-bold text-slate-700 w-24 flex-shrink-0 uppercase" style={{ fontSize: '0.85em' }}>{item.title}</h4>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {item.tags?.map((tag, idx) => (
                      <span key={idx} className="text-slate-600">
                        {tag}{idx < (item.tags?.length || 0) - 1 && ","}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-slate-100 dark:bg-slate-950/50 p-8 overflow-y-auto flex justify-center no-scrollbar">
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          ...pageStyle
        }}
        className="bg-white shadow-2xl min-h-[1123px] w-[794px] text-slate-900 print:shadow-none print:m-0 transition-all duration-500 ease-in-out"
      >
        {renderSection(data.sections['header'])}
        {data.order.map(sectionId => {
            if (sectionId === 'header') return null;
            return renderSection(data.sections[sectionId]);
        })}
      </div>
    </div>
  );
};