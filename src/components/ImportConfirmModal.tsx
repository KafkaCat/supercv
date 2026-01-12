import React, { useState, useEffect, useRef } from 'react';
import { Resume, Profile, CustomSection } from '../types';
import { X, Check, AlertCircle, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

interface ImportConfirmModalProps {
  parsedResume: Partial<Resume>;
  onConfirm: (resume: Partial<Resume>) => void;
  onCancel: () => void;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({ parsedResume, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Partial<Profile>>({ ...parsedResume.profile });
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize state with parsed data
  const [summary, setSummary] = useState(parsedResume.profile?.summary || '');
  const [skills, setSkills] = useState(parsedResume.skills?.content || '');
  const [customSections, setCustomSections] = useState<CustomSection[]>(parsedResume.customSections || []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    onConfirm({
      ...parsedResume,
      profile: { ...profile, summary } as Profile,
      skills: { content: skills },
      customSections
    });
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: string) => {
    setCustomSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(section => section.id !== id));
  };

  const toggleSectionVisibility = (section: string) => {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleAddSection = (type: string) => {
    if (['experience', 'education', 'skills', 'summary'].includes(type)) {
      setHiddenSections(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    } else if (type === 'academic_experience') {
      setCustomSections([...customSections, { 
        id: uuidv4(), 
        title: 'Academic Experience', 
        content: '' 
      }]);
    } else if (type === 'custom') {
      setCustomSections([...customSections, { 
        id: uuidv4(), 
        title: 'Custom Section', 
        content: '' 
      }]);
    }
    setShowAddMenu(false);
  };

  console.log('ImportConfirmModal rendered, showAddMenu:', showAddMenu);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Check size={20} className="text-green-600"/> 
              Confirm Content
            </h3>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors font-bold"
                style={{ border: '1px solid #93c5fd' }}
              >
                <Plus size={16} />
                Add Section
                <ChevronDown size={14} />
              </button>
              
              {showAddMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b mb-1">Select Section</div>
                  {!hiddenSections.has('summary') && summary ? null : (
                    <button onClick={() => handleAddSection('summary')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Summary
                    </button>
                  )}
                  <button onClick={() => handleAddSection('experience')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Experience
                  </button>
                  <button onClick={() => handleAddSection('education')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Education
                  </button>
                  <button onClick={() => handleAddSection('skills')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Skills
                  </button>
                  <div className="border-t my-1"></div>
                  <button onClick={() => handleAddSection('academic_experience')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Academic Experience
                  </button>
                  <button onClick={() => handleAddSection('custom')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Custom Section
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-6 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>
              Please verify the extracted content below. You can edit or remove sections before importing.
            </p>
          </div>

          {/* Basic Info */}
          <section className="mb-6">
            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">Basic Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                <input 
                  type="text" 
                  value={profile.fullName || ''} 
                  onChange={e => setProfile({...profile, fullName: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">电话</label>
                <input 
                  type="text" 
                  value={profile.phone || ''} 
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">邮箱</label>
                <input 
                  type="text" 
                  value={profile.email || ''} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">链接</label>
                <input 
                  type="text" 
                  value={profile.link || ''} 
                  onChange={e => setProfile({...profile, link: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Skills Section */}
          {!hiddenSections.has('skills') && (
            <section className="relative group">
              <div className="flex justify-between items-center border-b pb-1 mb-3">
                <h4 className="font-bold text-gray-700">Skills / Keywords</h4>
                <button 
                  onClick={() => toggleSectionVisibility('skills')}
                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-opacity"
                  title="Remove Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full h-32 p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter skills..."
              />
              <p className="text-xs text-gray-400 mt-1">* Skills will support rich text editing after import</p>
            </section>
          )}

          {/* Academic Experience (Custom) */}
          {customSections.map((section, index) => (
            <section key={section.id} className="relative group mt-6">
              <div className="flex justify-between items-center border-b pb-1 mb-3">
                <input 
                  type="text" 
                  value={section.title} 
                  onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)}
                  className="font-bold text-gray-700 border-none bg-transparent focus:ring-0 p-0"
                />
                <button 
                  onClick={() => removeCustomSection(section.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)}
                className="w-full h-32 p-3 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Content..."
              />
            </section>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t mt-6 gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Check size={18} />
            Import
          </button>
        </div>
      </div>
    </div>
  );
};
