import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { useTranslation } from 'react-i18next';

export const ProfileEditor: React.FC = () => {
  const { t } = useTranslation();
  const { currentResume, updateProfile } = useResumeStore();
  const { profile } = currentResume;

  const handleChange = (field: keyof typeof profile, value: string) => {
    updateProfile({ [field]: value });
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{t('sections.profile')}</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.fullName')}</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('fields.fullName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.location')}</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('fields.location')}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.email')}</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.phone')}</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="13800138000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.link')}</label>
          <input
            type="text"
            value={profile.link || ''}
            onChange={(e) => handleChange('link', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="GitHub / LinkedIn / Blog"
          />
        </div>

        <div>
           <RichTextEditor 
             label={t('fields.summary')}
             value={profile.summary || ''} 
             onChange={(val) => handleChange('summary', val)} 
           />
        </div>
      </div>
    </section>
  );
};
