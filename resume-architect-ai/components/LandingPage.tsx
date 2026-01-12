import React, { useState } from 'react';
import { Icon } from './Icon';

interface LandingPageProps {
  onGenerate: (jd: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGenerate }) => {
  const [jd, setJd] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI processing time
    setTimeout(() => {
      onGenerate(jd);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>

      <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-4">
          <Icon name="auto_awesome" className="text-4xl text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Targeted Resume</span> in seconds.
        </h1>
        
        <p className="text-lg text-slate-400 max-w-lg">
          Paste the job description below. Our AI will analyze keywords, format your experience, and tailor a perfect resume for the role.
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
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex gap-2 text-slate-500">
                <button type="button" className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Icon name="attach_file" /></button>
                <button type="button" className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Icon name="mic" /></button>
              </div>
              <button 
                type="submit"
                disabled={isGenerating || !jd.trim()}
                className={`bg-white text-slate-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isGenerating ? 'opacity-80' : 'hover:scale-105 active:scale-95'}`}
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Generate
                    <Icon name="arrow_forward" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="flex gap-8 text-slate-500 text-sm font-medium">
          <span className="flex items-center gap-2"><Icon name="check_circle" className="text-green-500" /> ATS Friendly</span>
          <span className="flex items-center gap-2"><Icon name="check_circle" className="text-green-500" /> AI Tailored</span>
          <span className="flex items-center gap-2"><Icon name="check_circle" className="text-green-500" /> PDF Export</span>
        </div>
      </div>
    </div>
  );
};