import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Resume } from '../types';
import { db } from '../db';

interface ResumeState {
  currentResume: Resume;
  appLanguage: 'zh' | 'en';
  sectionOrder: SectionKey[];
  isLoading: boolean;
  isSaving: boolean;
  
  setResume: (resume: Resume) => void;
  setAppLanguage: (lang: 'zh' | 'en') => void;
  updateProfile: (profile: Partial<Resume['profile']>) => void;
  updateSection: <K extends keyof Resume>(section: K, data: Resume[K]) => void;
  moveSection: (section: SectionKey, direction: 'up' | 'down') => void;
  
  loadResume: (id: string) => Promise<void>;
  saveResume: () => Promise<void>;
  createNewResume: () => void;
  duplicateAsEnglish: () => void;
  duplicateAsLanguage: (language: Resume['language']) => void;
  translateToLanguage: (language: Resume['language']) => Promise<boolean>;
  exportAllData: () => Promise<void>;
  optimizeLayout: () => void;
}

export type SectionKey = 'education' | 'experience' | 'skills';

const defaultSectionOrder: SectionKey[] = ['education', 'experience', 'skills'];
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
  skills: { content: '' },
  customSections: []
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  currentResume: initialResume,
  appLanguage: (localStorage.getItem('appLanguage') as 'zh' | 'en') || 'en',
  sectionOrder: getStoredSectionOrder(),
  isLoading: false,
  isSaving: false,

  setResume: (resume) => set({ currentResume: resume }),
  
  setAppLanguage: (lang) => {
    localStorage.setItem('appLanguage', lang);
    set({ appLanguage: lang });
  },
  
  updateProfile: (profile) => set((state) => ({
    currentResume: {
      ...state.currentResume,
      profile: { ...state.currentResume.profile, ...profile }
    }
  })),

  updateSection: (section, data) => set((state) => ({
    currentResume: { ...state.currentResume, [section]: data }
  })),

  moveSection: (section, direction) => set((state) => {
    const currentOrder = state.sectionOrder;
    const index = currentOrder.indexOf(section);
    if (index === -1) return state;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return state;
    const nextOrder = [...currentOrder];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    localStorage.setItem('sectionOrder', JSON.stringify(nextOrder));
    return { sectionOrder: nextOrder };
  }),

  loadResume: async (id) => {
    set({ isLoading: true });
    try {
      const resume = await db.resumes.get(id);
      if (resume) {
        set({ currentResume: resume });
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
  }
}));
