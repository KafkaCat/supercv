import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Project } from '../../types';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../ui/SortableItem';

export const ProjectEditor: React.FC = () => {
  const { t } = useTranslation();
  const { currentResume, updateSection, reorderItems } = useResumeStore();
  const projects = currentResume.projects || [];
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
      const oldIndex = projects.findIndex((item) => item.id === active.id);
      const newIndex = projects.findIndex((item) => item.id === over?.id);
      reorderItems('projects', oldIndex, newIndex);
    }
  };

  const addProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateSection('projects', [newProject, ...projects]);
    setExpandedId(newProject.id);
  };

  const removeProject = (id: string) => {
    const item = projects.find(e => e.id === id);
    if (item) {
        // No confirm dialog
        const newList = projects.filter(e => e.id !== id);
        updateSection('projects', newList);
        useResumeStore.getState().logChange('delete', 'projects', `Deleted project: ${item.name}`, item);
    }
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    const updated = projects.map(proj => 
      proj.id === id ? { ...proj, [field]: value } : proj
    );
    updateSection('projects', updated);
  };

  const focusValueRef = React.useRef<string>('');

  const handleFocus = (value: string) => {
    focusValueRef.current = value;
  };

  const handleBlur = (field: keyof Project, currentValue: string, item: Project) => {
    if (focusValueRef.current !== currentValue) {
      const previousItem = { ...item, [field]: focusValueRef.current };
      useResumeStore.getState().logChange(
        'update', 
        'projects', 
        `Updated ${field} in ${item.name || 'Projects'}`, 
        previousItem
      );
    }
  };

  return (
    <section className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
        <button 
          onClick={addProject}
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
            items={projects} 
            strategy={verticalListSortingStrategy}
          >
            {projects.map((proj) => (
              <SortableItem key={proj.id} id={proj.id}>
                <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors pl-10"
                    onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id)}
                  >
                    <div className="font-medium text-gray-700 truncate flex-1">
                      {proj.name || t('common.new')} {proj.role ? `- ${proj.role}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeProject(proj.id); }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                      {expandedId === proj.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expandedId === proj.id && (
                    <div className="p-4 space-y-4 bg-white border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('name', e.target.value, proj)}
                            onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            type="text"
                            value={proj.role}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('role', e.target.value, proj)}
                            onChange={(e) => updateProject(proj.id, 'role', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.startDate')}</label>
                          <input
                            type="text"
                            value={proj.startDate}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('startDate', e.target.value, proj)}
                            onChange={(e) => updateProject(proj.id, 'startDate', e.target.value)}
                            placeholder="2023.01"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.endDate')}</label>
                          <input
                            type="text"
                            value={proj.endDate}
                            onFocus={(e) => handleFocus(e.target.value)}
                            onBlur={(e) => handleBlur('endDate', e.target.value, proj)}
                            onChange={(e) => updateProject(proj.id, 'endDate', e.target.value)}
                            placeholder={t('fields.present')}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <RichTextEditor 
                        label={t('fields.description')}
                        value={proj.description || ''} 
                        onFocus={() => handleFocus(proj.description || '')}
                        onBlur={() => handleBlur('description', proj.description || '', proj)}
                        onChange={(val) => updateProject(proj.id, 'description', val)} 
                      />
                    </div>
                  )}
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        
        {projects.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            {t('common.add')}
          </div>
        )}
      </div>
    </section>
  );
};
