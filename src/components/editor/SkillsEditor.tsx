import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { useTranslation } from 'react-i18next';

export const SkillsEditor: React.FC = () => {
  const { t } = useTranslation();
  const { currentResume, updateSection } = useResumeStore();
  const { skills } = currentResume;

  const handleChange = (val: string) => {
    updateSection('skills', { ...skills, content: val });
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{t('sections.skills')}</h2>
      <div>
         <RichTextEditor 
           label={t('sections.skills')}
           value={skills.content || ''} 
           onChange={handleChange} 
         />
      </div>
    </section>
  );
};
