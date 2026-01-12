import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { CustomSection } from '../../types';

interface CustomSectionEditorProps {
  sectionId: string;
}

export const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({ sectionId }) => {
  const { currentResume, updateSection } = useResumeStore();
  const section = currentResume.customSections?.find(s => s.id === sectionId);

  if (!section) return null;

  const handleChange = (content: string) => {
    const updatedSections = currentResume.customSections.map(s => 
      s.id === sectionId ? { ...s, content } : s
    );
    updateSection('customSections', updatedSections);
  };

  const handleTitleChange = (title: string) => {
    const updatedSections = currentResume.customSections.map(s => 
      s.id === sectionId ? { ...s, title } : s
    );
    updateSection('customSections', updatedSections);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center border-b pb-4">
        <input 
          type="text"
          value={section.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-lg font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0"
        />
      </div>
      
      <div className="space-y-4">
        <textarea
          value={section.content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Enter details for ${section.title}...`}
          className="w-full h-32 p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
        <p className="text-xs text-gray-400">
          Tip: You can use markdown or simple text. Bullet points are recommended.
        </p>
      </div>
    </div>
  );
};
