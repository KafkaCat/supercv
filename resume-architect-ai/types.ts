import React from 'react';

export type Language = 'en' | 'de';
export type AppMode = 'landing' | 'editor';

export interface ResumeLayout {
  fontSize: number; // in pt
  lineHeight: number; // multiplier
  margin: number; // in px
  fontFamily: 'sans' | 'serif' | 'mono';
}

export interface ResumeSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  date?: string;
  location?: string;
  description?: string[]; // Bullet points
  tags?: string[];
}

export interface ResumeSectionData {
  id: string;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'custom';
  title: string;
  items?: ResumeSectionItem[]; // For lists like experience
  content?: string; // For summary
  contacts?: { type: string; value: string; icon: string }[]; // For header
}

export interface ResumeData {
  language: Language;
  layout: ResumeLayout;
  sections: { [key: string]: ResumeSectionData };
  order: string[];
}

export interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface VersionLog {
  id: string;
  title: string;
  timestamp: string;
  author: string;
  isActive: boolean;
  color: string;
  details?: string;
  snapshot?: ResumeData; // The full state at this point
  diff?: {
    sectionTitle: string;
    changes: DiffPart[];
  }[];
}

export interface Session {
  id: string;
  name: string; // e.g., "Target: Google"
  jd: string;
  data: ResumeData;
  history: VersionLog[];
  lastSaved: string;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}