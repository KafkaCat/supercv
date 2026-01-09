import React from 'react';
import { ProfileEditor } from './editor/ProfileEditor';
import { ExperienceEditor } from './editor/ExperienceEditor';
import { EducationEditor } from './editor/EducationEditor';
import { SkillsEditor } from './editor/SkillsEditor';
import { ResumePreview } from './preview/ResumePreview';
import { Download, Save, History, Plus, Languages, Copy, Upload, Wand2, ChevronUp, ChevronDown } from 'lucide-react';
import { useResumeStore } from '../store/useResumeStore';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { VersionHistory } from './VersionHistory';
import { translations } from '../i18n';
import { extractTextFromPdf, parseResumeFromText } from '../utils/pdfImport';
import { ImportFallbackModal } from './ImportFallbackModal';
import { ImportConfirmModal } from './ImportConfirmModal';
import { Resume } from '../types';

export const Layout: React.FC = () => {
  const { saveResume, createNewResume, translateToLanguage, isSaving, currentResume, updateSection, setResume, appLanguage, setAppLanguage, sectionOrder, moveSection } = useResumeStore();
  const [showHistory, setShowHistory] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [showImportFallback, setShowImportFallback] = React.useState(false);
  const [showImportConfirm, setShowImportConfirm] = React.useState(false);
  const [fallbackText, setFallbackText] = React.useState('');
  const [pendingResume, setPendingResume] = React.useState<Partial<Resume> | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Use appLanguage for UI translation, but currentResume.language for resume content
  const t = translations[appLanguage];
  const resumeLanguage = currentResume.language || appLanguage;
  const sectionTranslations = translations[resumeLanguage];
  const sectionLabels = {
    education: sectionTranslations.education,
    experience: sectionTranslations.experience,
    skills: sectionTranslations.skills
  };
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
  const defaultLayoutStrings = {
    fontSize: `${defaultLayout.fontSize}px`,
    lineHeight: `${defaultLayout.lineHeight}`,
    margin: `${defaultLayout.margin}mm`
  };

  const handleLanguageToggle = () => {
     const newLang: Resume['language'] = resumeLanguage === 'zh' ? 'en' : 'zh';
     const currentLayout = currentResume.layout || defaultLayoutStrings;
     const storedLayouts = currentResume.layoutByLanguage || {};
     const nextLayout = storedLayouts[newLang] || currentLayout;
     updateSection('layoutByLanguage', { ...storedLayouts, [resumeLanguage]: currentLayout });
     updateSection('layout', nextLayout);
     setAppLanguage(newLang);
     updateSection('language', newLang);
  };

  const handleTranslateResume = async () => {
    const targetLang: Resume['language'] = resumeLanguage === 'zh' ? 'en' : 'zh';
    const found = await translateToLanguage(targetLang);
    setAppLanguage(targetLang);
    if (!found) {
      alert('未找到目标语言版本，已复制当前内容，请手动翻译。');
    }
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
        [resumeLanguage]: nextLayout
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
    // Reset value to allow selecting same file again
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

    if (!confirm('导入 PDF 将覆盖当前未保存的内容（建议先保存），是否继续？')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      // Create a timeout promise to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('导入超时，请重试')), 10000)
      );
      
      const text = await Promise.race([
        extractTextFromPdf(file),
        timeoutPromise
      ]) as string;
      
      console.log('Extracted text length:', text?.length);

      if (!text || text.trim().length === 0) {
        throw new Error('提取的文本为空');
      }

      if (text.length < 50) { // Increased threshold slightly
          // Instead of just returning, offer manual entry
          if (confirm('提示：提取的文本内容过少，该 PDF 可能是纯图片扫描件。是否尝试手动粘贴文本进行解析？')) {
             setFallbackText(text); // Pass whatever little text we got
             setShowImportFallback(true);
          }
          setIsImporting(false);
          return;
      }

      const partialResume = parseResumeFromText(text);
      
      // Instead of applying directly, show confirm modal
      setPendingResume(partialResume);
      setShowImportConfirm(true);
      
    } catch (error: any) {
      console.error('PDF Import failed:', error);
      let msg = '导入失败，可能是 PDF 格式不支持。';
      let shouldOfferFallback = true;

      if (error.message === '提取的文本为空') {
          msg = '导入失败：无法从 PDF 中提取文本，该文件可能由图片组成。';
      } else if (error.name === 'MissingPDFException') {
          msg = '导入失败：文件读取错误。';
          shouldOfferFallback = false;
      } else if (error.message === '导入超时，请重试') {
          msg = '导入超时，请重试。';
      }
      
      if (shouldOfferFallback) {
        if (confirm(`${msg}\n是否尝试手动粘贴文本进行解析？`)) {
            setShowImportFallback(true);
        }
      } else {
        alert(msg);
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = (finalResume: Partial<Resume>) => {
    // Merge with default structure to ensure validity
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
    alert('导入成功！');
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: '我的简历.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-center sticky top-0 z-20 shadow-sm gap-4 md:gap-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">W</div>
          <h1 className="text-xl font-bold text-gray-800">WonderCV Local</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
           {/* Actions */}
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept="application/pdf" 
             className="hidden" 
           />
           <button onClick={handleImportClick} disabled={isImporting} className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title="导入 PDF 简历">
             <Upload size={16} /> <span className="hidden sm:inline">{isImporting ? '导入中...' : '导入'}</span>
           </button>

           <button onClick={() => createNewResume()} className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors" title={t.new_resume}>
             <Plus size={16} /> <span className="hidden sm:inline">新建</span>
           </button>
           
           <button
             onClick={handleLanguageToggle}
             className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
             title="切换简历语言"
           >
             <Languages size={16} />
             <span>简历: {resumeLanguage === 'zh' ? '中文' : 'English'}</span>
           </button>

           <button onClick={handleOptimizeLayout} className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="智能一页排版">
             <Wand2 size={16} /> <span className="hidden sm:inline">智能一页</span>
           </button>

           <button
             onClick={handleTranslateResume}
             className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
             title={resumeLanguage === 'zh' ? '创建英文副本' : '创建中文副本'}
           >
              <Copy size={16} /> <span className="hidden sm:inline">{resumeLanguage === 'zh' ? '转译为英文' : '转译为中文'}</span>
           </button>

           <button onClick={() => setShowHistory(true)} className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
             <History size={16} /> <span className="hidden sm:inline">版本</span>
           </button>
           <button onClick={() => saveResume()} disabled={isSaving} className="flex items-center gap-1 md:gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors">
             <Save size={16} /> {isSaving ? '保存中...' : '保存'}
           </button>
           <button onClick={handleDownloadPdf} className="flex items-center gap-1 md:gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors">
             <Download size={16} /> 导出 PDF
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Editor Column */}
        <div className="space-y-6 overflow-y-auto pb-20">
          <section className="space-y-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">区块排序</h2>
            <div className="space-y-2">
              {sectionOrder.map((section, index) => (
                <div key={section} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{sectionLabels[section]}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(section, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section, 'down')}
                      disabled={index === sectionOrder.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ProfileEditor />
          {sectionOrder.map((section) => (
            <React.Fragment key={section}>
              {section === 'education' && <EducationEditor />}
              {section === 'experience' && <ExperienceEditor />}
              {section === 'skills' && <SkillsEditor />}
            </React.Fragment>
          ))}
        </div>

        {/* Preview Column */}
        <div className="hidden lg:block sticky top-24 overflow-hidden rounded shadow-lg border border-gray-200 bg-gray-500/10 p-4 flex justify-center">
           <ResumePreview />
        </div>
        
        {/* Mobile Preview Button or Modal? For now just hidden on small screens or stacked below */}
        <div className="lg:hidden block bg-white p-4 rounded shadow border border-gray-200 overflow-x-auto">
          <h3 className="text-lg font-bold mb-4 text-center">预览</h3>
          <div className="min-w-[210mm] transform scale-50 origin-top-left h-[150mm]">
             <ResumePreview />
          </div>
        </div>
      </main>

      {/* Version History Sidebar */}
      {showHistory && <VersionHistory onClose={() => setShowHistory(false)} />}
      
      {/* Import Fallback Modal */}
      {showImportFallback && (
        <ImportFallbackModal 
          onClose={() => setShowImportFallback(false)} 
          initialText={fallbackText}
        />
      )}

      {/* Import Confirm Modal */}
      {showImportConfirm && pendingResume && (
        <ImportConfirmModal
          parsedResume={pendingResume}
          onConfirm={handleConfirmImport}
          onCancel={() => {
            setShowImportConfirm(false);
            setPendingResume(null);
          }}
        />
      )}
    </div>
  );
};
