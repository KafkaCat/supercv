import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Education } from '../../types';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../ui/SortableItem';

export const EducationEditor: React.FC = () => {
  const { t } = useTranslation();
  const { currentResume, updateSection, reorderItems } = useResumeStore();
  const { educations } = currentResume;
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = educations.findIndex((item) => item.id === active.id);
      const newIndex = educations.findIndex((item) => item.id === over?.id);
      reorderItems('educations', oldIndex, newIndex);
    }
  };

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
    const item = educations.find(e => e.id === id);
    if (item) {
        const newList = educations.filter(e => e.id !== id);
        updateSection('educations', newList);
        useResumeStore.getState().logChange('delete', 'education', `Deleted education: ${item.school}`, item);
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    const updated = educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    updateSection('educations', updated);
  };

  const focusValueRef = React.useRef<string>('');

  const handleFocus = (value: string) => {
    focusValueRef.current = value;
  };

  const handleBlur = (field: keyof Education, currentValue: string, item: Education) => {
    if (focusValueRef.current !== currentValue) {
      const previousItem = { ...item, [field]: focusValueRef.current };
      useResumeStore.getState().logChange(
        'update', 
        'education', 
        `Updated ${field} in ${item.school || 'Education'}`, 
        previousItem
      );
    }
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('sections.education')}</h2>
        <button 
          onClick={addEducation}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus size={16} /> {t('common.add')}
        </button>
      </div>

      <div className="space-y-4">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={educations} 
            strategy={verticalListSortingStrategy}
          >
            {educations.map((edu) => (
              <SortableItem key={edu.id} id={edu.id}>
                <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors pl-10"
                    onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
                  >
                    <div className="font-medium text-gray-700 truncate flex-1">
                      {edu.school || t('common.new')} {edu.degree ? `- ${edu.degree}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeEducation(edu.id); }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title={t('common.delete')}
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.school')}</label>
                          <input
                            type="text"
                            value={edu.school}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('school', e.target.value, edu)}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.degree')}</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('degree', e.target.value, edu)}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.startDate')}</label>
                          <input
                            type="text"
                            value={edu.startDate}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('startDate', e.target.value, edu)}
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                            placeholder="2018.09"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.endDate')}</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('endDate', e.target.value, edu)}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                            placeholder="2022.06"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <RichTextEditor 
                        label={t('fields.description')}
                        value={edu.description || ''} 
                        onFocus={() => handleFocus(edu.description || '')}
                        onBlur={() => handleBlur('description', edu.description || '', edu)}
                        onChange={(val) => updateEducation(edu.id, 'description', val)} 
                      />
                    </div>
                  )}
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        
        {educations.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            {t('common.add')}
          </div>
        )}
      </div>
    </section>
  );
};
