import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Experience } from '../../types';

export const ExperienceEditor: React.FC = () => {
  const { currentResume, updateSection } = useResumeStore();
  const { experiences } = currentResume;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const addExperience = () => {
    const newExp: Experience = {
      id: uuidv4(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateSection('experiences', [newExp, ...experiences]); 
    setExpandedId(newExp.id);
  };

  const removeExperience = (id: string) => {
    updateSection('experiences', experiences.filter(exp => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    const updated = experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    updateSection('experiences', updated);
  };

  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = experiences.findIndex(exp => exp.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;
    const next = [...experiences];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateSection('experiences', next);
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">工作经历</h2>
        <button 
          onClick={addExperience}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> 添加经历
        </button>
      </div>

      <div className="space-y-4">
        {experiences.map((exp, index) => (
          <div key={exp.id} className="border border-gray-200 rounded-md overflow-hidden">
            <div 
              className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
            >
              <div className="font-medium text-gray-700 truncate flex-1">
                {exp.company || '新工作经历'} {exp.position ? `- ${exp.position}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, 'up'); }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed"
                  title="上移"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, 'down'); }}
                  disabled={index === experiences.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed"
                  title="下移"
                >
                  <ArrowDown size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
                {expandedId === exp.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedId === exp.id && (
              <div className="p-4 space-y-4 bg-white border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      placeholder="2022.09"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      placeholder="至今"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <RichTextEditor 
                  label="工作内容" 
                  value={exp.description || ''} 
                  onChange={(val) => updateExperience(exp.id, 'description', val)} 
                />
              </div>
            )}
          </div>
        ))}
        {experiences.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            暂无工作经历，点击右上角添加
          </div>
        )}
      </div>
    </section>
  );
};
