import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Education } from '../../types';

export const EducationEditor: React.FC = () => {
  const { currentResume, updateSection } = useResumeStore();
  const { educations } = currentResume;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const addEducation = () => {
    const newEdu: Education = {
      id: uuidv4(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateSection('educations', [newEdu, ...educations]);
    setExpandedId(newEdu.id);
  };

  const removeEducation = (id: string) => {
    updateSection('educations', educations.filter(edu => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    const updated = educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    updateSection('educations', updated);
  };

  const moveEducation = (id: string, direction: 'up' | 'down') => {
    const index = educations.findIndex(edu => edu.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= educations.length) return;
    const next = [...educations];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    updateSection('educations', next);
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">教育经历</h2>
        <button 
          onClick={addEducation}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> 添加教育
        </button>
      </div>

      <div className="space-y-4">
        {educations.map((edu, index) => (
          <div key={edu.id} className="border border-gray-200 rounded-md overflow-hidden">
            <div 
              className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
            >
              <div className="font-medium text-gray-700 truncate flex-1">
                {edu.school || '新教育经历'} {edu.degree ? `- ${edu.degree}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); moveEducation(edu.id, 'up'); }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed"
                  title="上移"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveEducation(edu.id, 'down'); }}
                  disabled={index === educations.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:text-gray-200 disabled:cursor-not-allowed"
                  title="下移"
                >
                  <ArrowDown size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeEducation(edu.id); }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
                {expandedId === edu.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedId === edu.id && (
              <div className="p-4 space-y-4 bg-white border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学历/学位</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      placeholder="2018.09"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      placeholder="2022.06"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <RichTextEditor 
                  label="在校经历/描述" 
                  value={edu.description || ''} 
                  onChange={(val) => updateEducation(edu.id, 'description', val)} 
                />
              </div>
            )}
          </div>
        ))}
        {educations.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            暂无教育经历，点击右上角添加
          </div>
        )}
      </div>
    </section>
  );
};
