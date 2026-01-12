import { useState } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { useResumeStore } from './store/useResumeStore';

type AppMode = 'landing' | 'editor';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  const { createNewResume, setJobDescription } = useResumeStore();

  const handleGenerate = (jd: string) => {
    createNewResume();
    setJobDescription(jd);
    setAppMode('editor');
  };

  if (appMode === 'landing') {
    return (
      <LandingPage 
        onGenerate={handleGenerate} 
        onResumeSelect={() => setAppMode('editor')}
      />
    );
  }

  return (
    <Layout onBackToLanding={() => setAppMode('landing')} />
  );
}

export default App;
