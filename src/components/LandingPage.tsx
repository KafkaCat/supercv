import React, { useState, useRef } from 'react';
import { Sparkles, Paperclip, Mic, ArrowRight, CheckCircle, FileText, Upload } from 'lucide-react';
import { SessionSidebar } from './SessionSidebar';
import { Resume } from '../types';
import { useResumeStore } from '../store/useResumeStore';
import { extractTextFromPdf, parseResumeFromText } from '../utils/pdfImport';

interface LandingPageProps {
  onGenerate: (jd: string) => void;
  onResumeSelect?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGenerate, onResumeSelect }) => {
  const [jd, setJd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setResume, createNewResume, currentResume } = useResumeStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd.trim() && !uploadedFile) return;
    
    setIsGenerating(true);

    try {
      // 1. If file uploaded, parse it
      let parsedData: Partial<Resume> = {};
      if (uploadedFile) {
        const text = await extractTextFromPdf(uploadedFile);
        if (text) {
           // We assume english for now or detect from text, defaulting to 'en'
           parsedData = parseResumeFromText(text, 'en'); 
        }
      }

      // 2. Create new resume session with parsed data + JD
      createNewResume();
      // Need to get the newly created resume from store state, but createNewResume is sync.
      // However, we need to update it with parsed data.
      // We can use a small timeout or assume createNewResume updates store immediately (it does).
      
      // Update the newly created resume (which is now currentResume in store)
      useResumeStore.setState(state => ({
        currentResume: {
          ...state.currentResume,
          ...parsedData,
          jobDescription: jd,
          title: parsedData.profile?.fullName ? `${parsedData.profile.fullName}'s Resume` : 'Targeted Resume',
          profile: { ...state.currentResume.profile, ...parsedData.profile },
          skills: { ...state.currentResume.skills, ...parsedData.skills },
          customSections: [...(state.currentResume.customSections || []), ...(parsedData.customSections || [])]
        }
      }));
      
      // 3. Navigate
      onGenerate(jd); // This switches mode to 'editor' in App.tsx

    } catch (error) {
      console.error("Build failed", error);
      alert("Failed to process. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex relative overflow-hidden">
      {/* Background Gradients - now behind everything but we want sidebar on top */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Sidebar - Visible on Landing Page */}
      <SessionSidebar 
        onSelectSession={(resume) => {
          setResume(resume);
          onResumeSelect?.();
        }} 
        onNewSession={createNewResume}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-4">
            <Sparkles className="text-white" size={32} />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Super Resume</span> in seconds.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-lg">
            Upload your current resume and paste the job description. Our AI will tailor a perfect resume for the role.
          </p>

          <form onSubmit={handleSubmit} className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
            <div className="relative bg-slate-950 rounded-2xl p-2 flex flex-col gap-2">
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste Job Description here (e.g. 'Senior React Engineer at Google...')"
                className="w-full h-32 bg-transparent text-slate-200 p-4 resize-none outline-none placeholder:text-slate-600 font-medium"
              />
              
              {uploadedFile && (
                <div className="px-4 py-2 bg-slate-900 mx-2 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-blue-400 flex items-center gap-2">
                    <FileText size={14} />
                    {uploadedFile.name}
                  </span>
                  <button type="button" onClick={() => setUploadedFile(null)} className="text-slate-500 hover:text-white">×</button>
                </div>
              )}

              <div className="flex justify-between items-center px-2 pb-1">
                <div className="flex gap-2 text-slate-500">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf" 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-400 hover:text-white"
                    title="Upload Resume PDF"
                  >
                    <Paperclip size={20} />
                    <span className="text-xs font-medium hidden sm:inline">Attach Resume</span>
                  </button>
                  <button type="button" className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Mic size={20} /></button>
                </div>
                <button 
                  type="submit"
                  disabled={isGenerating || (!jd.trim() && !uploadedFile)}
                  className={`bg-white text-slate-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isGenerating ? 'opacity-80' : 'hover:scale-105 active:scale-95'}`}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                      Building...
                    </>
                  ) : (
                    <>
                      Build
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="flex gap-8 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-2"><CheckCircle className="text-green-500" size={16} /> ATS Friendly</span>
            <span className="flex items-center gap-2"><CheckCircle className="text-green-500" size={16} /> AI Tailored</span>
            <span className="flex items-center gap-2"><CheckCircle className="text-green-500" size={16} /> PDF Export</span>
          </div>
        </div>
      </div>
    </div>
  );
};
