import React, { useState, useRef } from 'react';
import { ProfileEditor } from './editor/ProfileEditor';
import { ExperienceEditor } from './editor/ExperienceEditor';
import { EducationEditor } from './editor/EducationEditor';
import { ProjectEditor } from './editor/ProjectEditor';
import { SkillsEditor } from './editor/SkillsEditor';
import { ResumePreview } from './preview/ResumePreview';
import { Download, Plus, Languages, Wand2, FileText, Check, Cloud } from 'lucide-react';
import { useResumeStore, SectionKey } from '../store/useResumeStore';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { AISuggestionsPanel } from './ui/AISuggestionsPanel';
import { extractTextFromPdf, parseResumeFromText } from '../utils/pdfImport';
import { ImportFallbackModal } from './ImportFallbackModal';
import { ImportConfirmModal } from './ImportConfirmModal';
import { Resume } from '../types';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './ui/SortableItem';

import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { SessionSidebar } from './SessionSidebar';
import { FitScoreModal } from './FitScoreModal';
import { AddSectionModal } from './AddSectionModal';

import { CustomSectionEditor } from './editor/CustomSectionEditor';

interface LayoutProps {
  onBackToLanding: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onBackToLanding }) => {
  const { t, i18n } = useTranslation();
  const { 
    saveResume, createNewResume, translateToLanguage, translateContent, 
    isSaving, isModified, currentResume, updateSection, setResume, 
    appLanguage, setAppLanguage, sectionOrder, reorderSection,
    aiState, closeAI, dismissSuggestion
  } = useResumeStore();

  // Auto-save hook
  React.useEffect(() => {
    const interval = setInterval(() => {
      saveResume();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [saveResume]);

  const [isImporting, setIsImporting] = useState(false);
  const [showImportFallback, setShowImportFallback] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false); // State for AddSectionModal
  const [fallbackText, setFallbackText] = useState('');
  const [pendingResume, setPendingResume] = useState<Partial<Resume> | null>(null);
  const [showFitModal, setShowFitModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultLayout = {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 15
  };
  const layoutLimits = {
    fontSize: { min: 11, max: 16 },
    lineHeight: { min: 1.15, max: 1.7 },
    margin: { min: 8, max: 22 }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionKey);
      const newIndex = sectionOrder.indexOf(over?.id as SectionKey);
      reorderSection(arrayMove(sectionOrder, oldIndex, newIndex));
    }
  };

  const handleLanguageToggle = () => {
     const newLang = appLanguage === 'zh' ? 'en' : 'zh';
     setAppLanguage(newLang);
     i18n.changeLanguage(newLang);
  };

  const handleTranslateResume = async () => {
    if (!confirm(t('messages.translate_confirm'))) return;
    const targetLang: Resume['language'] = currentResume.language === 'zh' ? 'en' : 'zh';
    await translateContent(targetLang);
  };

  const handleAddSection = (type: string, title: string) => {
    // Basic mapping or direct addition logic
    if (['education', 'experience', 'projects', 'skills'].includes(type)) {
       // Just ensure it's in order
       if (!sectionOrder.includes(type as SectionKey)) {
         reorderSection([...sectionOrder, type as SectionKey]);
         // Log change
         useResumeStore.getState().logChange('add', type, `Enabled ${title} section`);
       }
       // Auto-scroll to section logic could go here
    } else {
       // Custom section
       const newId = `custom-${Date.now()}`;
       const newSection = {
         id: newId,
         title: title,
         content: ''
       };
       updateSection('customSections', [...(currentResume.customSections || []), newSection]);
       // Add to order
       reorderSection([...sectionOrder, newId]);
       useResumeStore.getState().logChange('add', 'Custom Section', `Added new section: ${title}`);
    }
    setShowAddSectionModal(false);
  };

  const handleRemoveSection = (sectionId: SectionKey) => {
    // Snapshot the section content before deleting
    let previousContent: any = null;
    const { currentResume } = useResumeStore.getState();
    
    if (sectionId === 'education') previousContent = currentResume.educations;
    else if (sectionId === 'experience') previousContent = currentResume.experiences;
    else if (sectionId === 'projects') previousContent = currentResume.projects;
    else if (sectionId === 'skills') previousContent = currentResume.skills;
    else if (sectionId.startsWith('custom-')) {
       previousContent = currentResume.customSections?.find(s => s.id === sectionId);
    }

    const newOrder = sectionOrder.filter(id => id !== sectionId);
    reorderSection(newOrder);
    
    // If it's a custom section, maybe remove from data too?
    if (sectionId.startsWith('custom-')) {
        const newCustom = (currentResume.customSections || []).filter(s => s.id !== sectionId);
        updateSection('customSections', newCustom);
    }
    useResumeStore.getState().logChange('delete', sectionId, `Removed section`, previousContent);
  };

  const handleOptimizeLayout = async () => {
    const previewElements = Array.from(document.querySelectorAll<HTMLElement>('#resume-preview'));
    const previewElement = previewElements.find((element) => element.offsetParent !== null);
    if (!previewElement) return;

    const measurePageHeight = () => {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.height = '297mm';
      document.body.appendChild(probe);
      const height = probe.offsetHeight;
      document.body.removeChild(probe);
      return height;
    };

    const pageHeight = measurePageHeight();
    const parseNumber = (value: string | undefined, fallback: number) => {
      const parsed = Number.parseFloat(value ?? '');
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const waitForLayout = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    let fontSize = parseNumber(currentResume.layout?.fontSize, defaultLayout.fontSize);
    let lineHeight = parseNumber(currentResume.layout?.lineHeight, defaultLayout.lineHeight);
    let margin = parseNumber(currentResume.layout?.margin, defaultLayout.margin);

    const applyLayout = () => {
      const nextLayout = {
        fontSize: `${fontSize.toFixed(1)}px`,
        lineHeight: lineHeight.toFixed(2),
        margin: `${margin.toFixed(1)}mm`
      };
      updateSection('layout', nextLayout);
      updateSection('layoutByLanguage', {
        ...(currentResume.layoutByLanguage || {}),
        [currentResume.language]: nextLayout
      });
    };

    const getHeight = () => Math.max(previewElement.offsetHeight, previewElement.scrollHeight);
    const tolerance = 1;

    const currentHeight = getHeight();
    if (Math.abs(currentHeight - pageHeight) <= tolerance) {
      return;
    }

    const ratio = pageHeight / currentHeight;
    const scaleDirection = ratio >= 1 ? 'up' : 'down';
    fontSize = clamp(fontSize * ratio, layoutLimits.fontSize.min, layoutLimits.fontSize.max);
    lineHeight = clamp(lineHeight * ratio, layoutLimits.lineHeight.min, layoutLimits.lineHeight.max);
    margin = clamp(margin * ratio, layoutLimits.margin.min, layoutLimits.margin.max);
    applyLayout();
    await waitForLayout();

    let attempts = 0;
    while (attempts < 12) {
      const height = getHeight();
      if (scaleDirection === 'down' && height <= pageHeight + tolerance) {
        break;
      }
      if (scaleDirection === 'up' && height >= pageHeight - tolerance) {
        break;
      }
      const stepFont = scaleDirection === 'down' ? -0.3 : 0.3;
      const stepLine = scaleDirection === 'down' ? -0.03 : 0.03;
      const stepMargin = scaleDirection === 'down' ? -0.5 : 0.5;
      const nextFontSize = clamp(fontSize + stepFont, layoutLimits.fontSize.min, layoutLimits.fontSize.max);
      const nextLineHeight = clamp(lineHeight + stepLine, layoutLimits.lineHeight.min, layoutLimits.lineHeight.max);
      const nextMargin = clamp(margin + stepMargin, layoutLimits.margin.min, layoutLimits.margin.max);
      if (nextFontSize === fontSize && nextLineHeight === lineHeight && nextMargin === margin) {
        break;
      }
      fontSize = nextFontSize;
      lineHeight = nextLineHeight;
      margin = nextMargin;
      applyLayout();
      await waitForLayout();
      attempts += 1;
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('请上传 PDF 文件');
      return;
    }

    if (!confirm(t('messages.import_confirm'))) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const text = await Promise.race([
        extractTextFromPdf(file),
        timeoutPromise
      ]) as string;
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty text');
      }

      if (text.length < 50) {
          if (confirm('Text extraction minimal. Probably scanned PDF. Try manual paste?')) {
             setFallbackText(text);
             setShowImportFallback(true);
          }
          setIsImporting(false);
          return;
      }

      const partialResume = parseResumeFromText(text, appLanguage);
      setPendingResume(partialResume);
      setShowImportConfirm(true);
      
    } catch (error: any) {
      console.error('PDF Import failed:', error);
      if (error.message === 'Empty text') {
        alert(t('messages.import_fail_empty') + (error.details ? ` (${error.details})` : ''));
      } else {
        alert(t('messages.import_fail') + ` ${error.message || ''}`);
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = (finalResume: Partial<Resume>) => {
    const newResume = {
      ...currentResume,
      ...finalResume,
      id: currentResume.id, 
      updatedAt: Date.now(),
      profile: {
        ...currentResume.profile,
        ...finalResume.profile
      }
    };
    
    setResume(newResume as any);
    setShowImportConfirm(false);
    setPendingResume(null);
    alert(t('messages.import_success'));
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: 'resume.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const sectionLabels: Record<string, string> = {
    education: t('sections.education'),
    experience: t('sections.experience'),
    skills: t('sections.skills')
  };

  return (
    <div className="h-screen flex font-body bg-slate-900 text-slate-100 overflow-hidden">
      <FitScoreModal isOpen={showFitModal} onClose={() => setShowFitModal(false)} />
      
      {/* Global Sidebar - Leftmost Column */}
      <SessionSidebar 
          onSelectSession={(resume) => setResume(resume)} 
          onNewSession={createNewResume}
          onImportClick={handleImportClick}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
      
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded-lg transition-colors" onClick={onBackToLanding}>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                <FileText className="text-sm text-white" size={16} />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Resume.ai</span>
            </div>
            <div className="h-4 w-px bg-slate-700 mx-2"></div>
            
            <div className="relative group">
              <span className="flex items-center gap-2 text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                {currentResume.title || 'Untitled'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="application/pdf" 
              className="hidden" 
            />
            
            <button onClick={() => createNewResume()} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title={t('common.new')}>
              <Plus size={18} />
            </button>

            <button onClick={handleLanguageToggle} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title={t('header.switch_language')}>
              <Languages size={18} />
            </button>
            
            <button onClick={handleOptimizeLayout} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all mr-2">
              <Wand2 size={16} /> Smart Fit
            </button>

            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1 min-w-[80px] justify-end">
              {isSaving ? (
                <>
                   <Cloud className="animate-pulse text-xs" size={14} />
                   Saving...
                </>
              ) : isModified ? (
                <>
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   Unsaved
                </>
              ) : (
                <>
                   <Check className="text-xs" size={14} />
                   Saved
                </>
              )}
            </span>
            
            <button 
              onClick={() => saveResume()}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 ${
                isModified ? 'bg-primary hover:bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Save
            </button>
            
            <button 
                onClick={handleDownloadPdf}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={18} />
            </button>
          </div>
        </header>

        {/* Main Workspace - Split Screen */}
        <div className="flex-1 flex overflow-hidden relative">
          
          <LeftSidebar 
            onAddSection={() => setShowAddSectionModal(true)} 
            onAiAssistantClick={() => setShowFitModal(true)}
          />
          
          {/* Left: Form Editor (40% width) */}
          <div className="w-[450px] xl:w-[500px] flex-shrink-0 flex flex-col border-r border-slate-800 z-10 bg-slate-900/50">
            <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
                <section className="space-y-3 p-4 bg-slate-800/50 rounded-lg shadow-sm border border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-2">{t('sections.order')}</h2>
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={sectionOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                      {sectionOrder.map((section) => (
                        <SortableItem key={section} id={section} onRemove={() => handleRemoveSection(section)}>
                          <div className="flex items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 cursor-grab active:cursor-grabbing text-slate-300 hover:bg-slate-600">
                            <span className="text-sm font-medium ml-6">{sectionLabels[section] || (currentResume.customSections?.find(s => s.id === section)?.title) || 'Custom Section'}</span>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                    </SortableContext>
                  </DndContext>
                </section>

                {/* Editors - wrapped to look better in dark mode if needed, but keeping them as is (likely white cards) */}
                <div className="space-y-6 [&_input]:bg-white [&_textarea]:bg-white [&_select]:bg-white text-slate-800">
                  <ProfileEditor />
                  {sectionOrder.map((section) => {
                    if (section === 'education') return <EducationEditor key={section} />;
                    if (section === 'experience') return <ExperienceEditor key={section} />;
                    if (section === 'projects') return <ProjectEditor key={section} />;
                    if (section === 'skills') return <SkillsEditor key={section} />;
                    // For custom sections (projects, languages, etc. mapped to custom IDs)
                    return <CustomSectionEditor key={section} sectionId={section} />;
                  })}
                </div>
            </div>
          </div>

          {/* Right: Preview (Auto width) */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-800 shadow-sm z-10 flex items-center gap-2 pointer-events-none">
                <FileText size={12} /> Live Preview
            </div>
            
            <div className="transform scale-90 origin-top shadow-2xl">
                <ResumePreview />
            </div>
          </div>

          {/* Far Right: History Sidebar */}
          <RightSidebar 
            onLogClick={(resume) => {
              if(confirm('Load this version? Unsaved changes will be lost.')) {
                  setResume(resume);
              }
            }}
          />

      {/* Import Fallback Modal */}
      {showImportFallback && (
        <ImportFallbackModal 
          onClose={() => setShowImportFallback(false)} 
          initialText={fallbackText}
        />
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <AddSectionModal
          isOpen={showAddSectionModal}
          onClose={() => setShowAddSectionModal(false)}
          onAdd={handleAddSection}
        />
      )}

      {/* Import Confirm Modal */}
      {showImportConfirm && (
        <ImportConfirmModal
          parsedResume={pendingResume || currentResume} // Reuse for adding sections
          onConfirm={handleConfirmImport}
          onCancel={() => {
            setShowImportConfirm(false);
            setPendingResume(null);
          }}
        />
      )}

          {/* AI Suggestions Panel */}
          {aiState.isOpen && (
            <AISuggestionsPanel
              suggestions={aiState.suggestions}
              isLoading={aiState.isLoading}
              onAccept={(sugg) => {
                if (aiState.onApply) {
                  aiState.onApply(sugg.improved);
                }
                closeAI();
              }}
              onReject={(id) => {
                dismissSuggestion(id);
              }}
              onClose={closeAI}
            />
          )}
        </div>
      </div>


    </div>
  );
};
