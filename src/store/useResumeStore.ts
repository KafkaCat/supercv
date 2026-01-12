import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Resume, Education, Experience, Project, ChangeLogItem } from '../types';
import { db } from '../db';
import { AISuggestion, analyzeContent } from '../services/ai';

interface AIState {
  isOpen: boolean;
  isLoading: boolean;
  suggestions: AISuggestion[];
  onApply?: (newText: string) => void;
}

interface ResumeState {
  currentResume: Resume;
  appLanguage: 'zh' | 'en';
  sectionOrder: SectionKey[];
  isLoading: boolean;
  isSaving: boolean;
  isModified: boolean;
  
  aiState: AIState;
  openAIAnalysis: (text: string, onApply: (newText: string) => void) => void;
  closeAI: () => void;
  dismissSuggestion: (id: string) => void;

  setResume: (resume: Resume) => void;
  setJobDescription: (jd: string) => void;
  setAppLanguage: (lang: 'zh' | 'en') => void;
  updateProfile: (profile: Partial<Resume['profile']>) => void;
  updateSection: <K extends keyof Resume>(section: K, data: Resume[K]) => void;
  reorderSection: (newOrder: SectionKey[]) => void;
  reorderItems: (section: 'educations' | 'experiences' | 'projects', oldIndex: number, newIndex: number) => void;
  
  restoreFromLog: (logItem: ChangeLogItem) => void;

  loadResume: (id: string) => Promise<void>;
  saveResume: () => Promise<void>;
  createNewResume: () => void;
  duplicateAsEnglish: () => void;
  duplicateAsLanguage: (language: Resume['language']) => void;
  translateToLanguage: (language: Resume['language']) => Promise<boolean>;
  translateContent: (targetLang: Resume['language']) => Promise<void>;
  exportAllData: () => Promise<void>;
  optimizeLayout: () => void;
deleteResume: (id: string) => Promise<void>;
  logChange: (type: 'update' | 'add' | 'delete', section: string, description: string, previousContent?: any) => void;
}

export type SectionKey = 'education' | 'experience' | 'projects' | 'skills' | string;

const defaultSectionOrder: SectionKey[] = ['education', 'experience', 'projects', 'skills'];
const titleSuffixPattern = /\s*\((English|中文)\)\s*$/i;

const getStoredSectionOrder = (): SectionKey[] => {
  const stored = localStorage.getItem('sectionOrder');
  if (!stored) return defaultSectionOrder;
  try {
    const parsed = JSON.parse(stored) as SectionKey[];
    if (Array.isArray(parsed) && parsed.length === defaultSectionOrder.length) {
      return parsed;
    }
  } catch {
    // Fallback to default order
  }
  return defaultSectionOrder;
};

const getBaseTitle = (title: string) => title.replace(titleSuffixPattern, '').trim();
const normalizeValue = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, '');
const normalizeLink = (value: string) => value.trim().toLowerCase().replace(/\/+$/, '');

const scoreResumeMatch = (source: Resume, candidate: Resume) => {
  let score = 0;
  const sourceProfile = source.profile;
  const candidateProfile = candidate.profile;
  if (sourceProfile.email && candidateProfile.email) {
    if (normalizeValue(sourceProfile.email) === normalizeValue(candidateProfile.email)) {
      score += 6;
    }
  }
  if (sourceProfile.phone && candidateProfile.phone) {
    if (normalizePhone(sourceProfile.phone) === normalizePhone(candidateProfile.phone)) {
      score += 6;
    }
  }
  if (sourceProfile.fullName && candidateProfile.fullName) {
    if (normalizeValue(sourceProfile.fullName) === normalizeValue(candidateProfile.fullName)) {
      score += 2;
    }
  }
  if (sourceProfile.link && candidateProfile.link) {
    if (normalizeLink(sourceProfile.link) === normalizeLink(candidateProfile.link)) {
      score += 2;
    }
  }
  if (getBaseTitle(source.title) && getBaseTitle(source.title) === getBaseTitle(candidate.title)) {
    score += 1;
  }
  return score;
};

const initialResume: Resume = {
  id: uuidv4(),
  updatedAt: Date.now(),
  title: '我的简历',
  language: 'zh',
  layout: {
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '15mm'
  },
  profile: {
    fullName: '',
    email: '',
    phone: '',
  },
  educations: [],
  experiences: [],
  projects: [],
  skills: { content: '' },
  customSections: []
};

// Simple dictionary for basic translation
const dictionary: Record<string, Record<string, string>> = {
  'zh': {
    'Bachelor': '学士',
    'Master': '硕士',
    'PhD': '博士',
    'Manager': '经理',
    'Engineer': '工程师',
    'Developer': '开发人员',
    'University': '大学',
    'School': '学校'
  },
  'en': {
    '学士': 'Bachelor',
    '硕士': 'Master',
    '博士': 'PhD',
    '经理': 'Manager',
    '工程师': 'Engineer',
    '开发人员': 'Developer',
    '大学': 'University',
    '学校': 'School'
  }
};

const simpleTranslate = (text: string, lang: 'zh' | 'en') => {
  if (!text) return text;
  let result = text;
  const dict = dictionary[lang] || {};
  Object.entries(dict).forEach(([key, value]) => {
     // Simple replace, case insensitive for keys if English
     const regex = new RegExp(key, 'gi');
     result = result.replace(regex, value);
  });
  return result;
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  currentResume: initialResume,
  appLanguage: (localStorage.getItem('appLanguage') as 'zh' | 'en') || 'en',
  sectionOrder: getStoredSectionOrder(),
  isLoading: false,
  isSaving: false,
  isModified: false,
  
  aiState: { isOpen: false, isLoading: false, suggestions: [] },

  openAIAnalysis: async (text, onApply) => {
    set({ aiState: { isOpen: true, isLoading: true, suggestions: [], onApply } });
    try {
      const suggestions = await analyzeContent(text);
      set(state => ({ aiState: { ...state.aiState, isLoading: false, suggestions } }));
    } catch (error) {
      console.error(error);
      set(state => ({ aiState: { ...state.aiState, isLoading: false, suggestions: [] } }));
    }
  },

  closeAI: () => {
    set(state => ({ aiState: { ...state.aiState, isOpen: false } }));
  },
  
  dismissSuggestion: (id) => {
    set(state => ({
      aiState: {
        ...state.aiState,
        suggestions: state.aiState.suggestions.filter(s => s.id !== id)
      }
    }));
  },

  setResume: (resume) => set({ currentResume: resume, isModified: false }),
  
  setJobDescription: (jd) => set((state) => ({
    currentResume: { ...state.currentResume, jobDescription: jd },
    isModified: true
  })),

  setAppLanguage: (lang) => {
    localStorage.setItem('appLanguage', lang);
    set({ appLanguage: lang, isModified: true });
  },
  
  updateProfile: (profile) => set((state) => ({
    currentResume: {
      ...state.currentResume,
      profile: { ...state.currentResume.profile, ...profile }
    },
    isModified: true
  })),

  updateSection: (section, data) => set((state) => ({
    currentResume: { ...state.currentResume, [section]: data },
    isModified: true
  })),

  reorderSection: (newOrder) => {
    localStorage.setItem('sectionOrder', JSON.stringify(newOrder));
    set({ sectionOrder: newOrder, isModified: true });
  },

  reorderItems: (section, oldIndex, newIndex) => set((state) => {
    const list = [...(state.currentResume[section] as any[] || [])];
    if (list.length === 0) return {};
    const [moved] = list.splice(oldIndex, 1);
    list.splice(newIndex, 0, moved);
    return {
      currentResume: {
        ...state.currentResume,
        [section]: list
      },
      isModified: true
    };
  }),

  restoreFromLog: (logItem) => {
    const { currentResume, updateSection, reorderSection, sectionOrder } = get();
    const { section, previousContent } = logItem;
    
    if (!previousContent) return;

    const logRestore = (desc: string) => {
         get().logChange('add', section, desc, null);
    };

    if (Array.isArray(previousContent)) {
        // Restoring a whole section list
        if (!sectionOrder.includes(section)) {
            reorderSection([...sectionOrder, section]);
        }
        updateSection(section as any, previousContent);
        logRestore(`Restored section ${section}`);
    } else if (typeof previousContent === 'object') {
        // Restoring a single item
        let listKey: keyof Resume | null = null;
        if (section === 'education' || section === 'educations') listKey = 'educations';
        else if (section === 'experience' || section === 'experiences') listKey = 'experiences';
        else if (section === 'projects' || section === 'project') listKey = 'projects';
        
        if (listKey) {
            const list = currentResume[listKey] as any[];
            if (Array.isArray(list)) {
                if (!list.find((i: any) => i.id === previousContent.id)) {
                    updateSection(listKey, [previousContent, ...list]);
                    logRestore(`Restored item to ${section}`);
                }
            }
        } else {
             // Try custom sections
             const customSections = currentResume.customSections || [];
             if (previousContent.id && previousContent.title && (previousContent.content !== undefined)) {
                 if (!customSections.find(s => s.id === previousContent.id)) {
                     updateSection('customSections', [...customSections, previousContent]);
                     if (!sectionOrder.includes(previousContent.id)) {
                        reorderSection([...sectionOrder, previousContent.id]);
                     }
                     logRestore(`Restored custom section ${previousContent.title}`);
                 }
             }
        }
    }
  },

  loadResume: async (id) => {
    set({ isLoading: true });
    try {
      const resume = await db.resumes.get(id);
      if (resume) {
        // Ensure new fields exist by merging with initial structure
        const merged = { ...initialResume, ...resume };
        // Explicitly ensure arrays exist if not in initialResume somehow or overwritten
        if (!merged.projects) merged.projects = [];
        if (!merged.customSections) merged.customSections = [];
        
        set({ currentResume: merged, isModified: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  saveResume: async () => {
    set({ isSaving: true });
    try {
      const { currentResume } = get();
      const updated = { ...currentResume, updatedAt: Date.now() };
      await db.resumes.put(updated);
      set({ currentResume: updated });
    } finally {
      set({ isSaving: false });
    }
  },
  
  createNewResume: () => {
    const { appLanguage } = get();
    set({ 
      currentResume: { 
        ...initialResume, 
        id: uuidv4(), 
        updatedAt: Date.now(),
        language: appLanguage,
        translationGroupId: uuidv4()
      } 
    });
  },

  duplicateAsEnglish: () => {
    get().duplicateAsLanguage('en');
  },

  duplicateAsLanguage: (language) => {
    const { currentResume } = get();
    const baseTitle = getBaseTitle(currentResume.title) || currentResume.title;
    const suffix = language === 'en' ? ' (English)' : ' (中文)';
    const newResume: Resume = {
      ...currentResume,
      id: uuidv4(),
      updatedAt: Date.now(),
      title: `${baseTitle}${suffix}`,
      language,
      translationGroupId: currentResume.translationGroupId || uuidv4()
    };
    set({ currentResume: newResume });
  },

  translateToLanguage: async (language) => {
    const { currentResume } = get();
    const baseTitle = getBaseTitle(currentResume.title);
    const candidates = (await db.resumes.toArray()).filter((resume) => (
      resume.id !== currentResume.id && resume.language === language
    ));
    const pickLatest = (list: Resume[]) => list.reduce((latest, item) => (
      item.updatedAt > latest.updatedAt ? item : latest
    ), list[0]);
    const groupMatches = currentResume.translationGroupId
      ? candidates.filter((resume) => resume.translationGroupId === currentResume.translationGroupId)
      : [];
    const titleMatches = candidates.filter((resume) => getBaseTitle(resume.title) === baseTitle);
    const scoredMatches = candidates
      .map((candidate) => ({ candidate, score: scoreResumeMatch(currentResume, candidate) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.candidate.updatedAt - a.candidate.updatedAt);
    const matched = groupMatches.length > 0
      ? pickLatest(groupMatches)
      : (titleMatches.length > 0
        ? pickLatest(titleMatches)
        : (scoredMatches[0]?.candidate || (candidates.length === 1 ? candidates[0] : undefined)));
    if (matched) {
      set({ currentResume: matched });
      return true;
    }
    get().duplicateAsLanguage(language);
    return false;
  },

  translateContent: async (targetLang) => {
    const { currentResume } = get();
    // 1. Duplicate
    get().duplicateAsLanguage(targetLang);
    const { currentResume: newResume } = get();
    
    // 2. Mock Translation (Heuristic)
    // In a real app, this would call an API.
    // Here we do simple keyword replacement for offline demo.
    
    const translatedProfile = { ...newResume.profile };
    // translatedProfile.summary = simpleTranslate(translatedProfile.summary || '', targetLang); // Don't touch HTML for now, risky

    const translatedEducations = newResume.educations.map(edu => ({
      ...edu,
      degree: simpleTranslate(edu.degree, targetLang),
      school: simpleTranslate(edu.school, targetLang)
    }));

    const translatedExperiences = newResume.experiences.map(exp => ({
      ...exp,
      position: simpleTranslate(exp.position, targetLang)
    }));
    
    set({
      currentResume: {
        ...newResume,
        educations: translatedEducations,
        experiences: translatedExperiences,
        // profile: translatedProfile
      }
    });
    
    // Save immediately
    await get().saveResume();
  },

  exportAllData: async () => {
    const allResumes = await db.resumes.toArray();
    const dataStr = JSON.stringify(allResumes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wondercv_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  optimizeLayout: () => {
    const { currentResume } = get();
    // A simple heuristic: if content is long, reduce size; if short, increase or keep default.
    // In a real browser environment, we'd measure height. Since we are in store, we might just toggle modes.
    // For "Smart One Page", let's try a compact set of values.
    
    const isCompact = currentResume.layout?.fontSize === '12px';
    
    const newLayout = isCompact ? {
      fontSize: '14px',
      lineHeight: '1.5',
      margin: '15mm'
    } : {
      fontSize: '12px',
      lineHeight: '1.3',
      margin: '10mm'
    };
    
    set({
      currentResume: {
        ...currentResume,
        layout: newLayout
      }
    });
    get().logChange('update', 'Layout', 'Optimized layout settings');
  },

  deleteResume: async (id: string) => {
    await db.resumes.delete(id);
    const { currentResume } = get();
    if (currentResume.id === id) {
       // If deleting current, load another or create new
       const others = await db.resumes.toArray();
       if (others.length > 0) {
         set({ currentResume: others[0] });
       } else {
         get().createNewResume();
       }
    }
  },

  logChange: (type, section, description, previousContent) => {
    const { currentResume } = get();
    const newItem = {
      id: uuidv4(),
      date: Date.now(),
      type,
      section,
      description,
      previousContent
    };
    const newLog = [newItem, ...(currentResume.changeLog || [])].slice(0, 50); // Keep last 50
    set({
      currentResume: {
        ...currentResume,
        changeLog: newLog
      },
      isModified: true
    });
    // Don't auto-save just for log to avoid loops, but usually actions trigger save
  }
}));
