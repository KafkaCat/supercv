import type { Resume, Profile, Education, Experience, Project, SkillSection, CustomSection, ChangeLogItem } from './types';
import { supabase } from './lib/supabase';

/**
 * Row shape as stored in Supabase Postgres.
 * Columns: id, user_id, title, language, updated_at, created_at.
 * data (jsonb) holds everything ELSE from the Resume type — never duplicate columnized fields here.
 */
export interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  language: 'zh' | 'en';
  updated_at: string;
  created_at: string;
  data: ResumeData;
}

export interface ResumeData {
  profile: Profile;
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: SkillSection;
  customSections: CustomSection[];
  layout?: Resume['layout'];
  layoutByLanguage?: Resume['layoutByLanguage'];
  changeLog?: ChangeLogItem[];
  jobDescription?: string;
  translationGroupId?: string;
}

export interface ArchiveRow {
  id: string;
  user_id: string;
  original_resume_id: string | null;
  type: 'education' | 'experience';
  data: unknown;
  deleted_at: string;
}

/**
 * Map Resume (app) → ResumeRow (insert payload).
 * Strips columnized fields from the jsonb `data` blob to keep a single source of truth.
 */
export function toRow(resume: Resume, userId: string): Omit<ResumeRow, 'updated_at' | 'created_at'> {
  return {
    id: resume.id,
    user_id: userId,
    title: resume.title,
    language: resume.language,
    data: {
      profile: resume.profile,
      educations: resume.educations,
      experiences: resume.experiences,
      projects: resume.projects,
      skills: resume.skills,
      customSections: resume.customSections,
      layout: resume.layout,
      layoutByLanguage: resume.layoutByLanguage,
      changeLog: resume.changeLog,
      jobDescription: resume.jobDescription,
      translationGroupId: resume.translationGroupId,
    },
  };
}

/** Map ResumeRow (from Supabase) → Resume (app). */
export function fromRow(row: ResumeRow): Resume {
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    updatedAt: new Date(row.updated_at).getTime(),
    profile: row.data.profile,
    educations: row.data.educations ?? [],
    experiences: row.data.experiences ?? [],
    projects: row.data.projects ?? [],
    skills: row.data.skills ?? { content: '' },
    customSections: row.data.customSections ?? [],
    layout: row.data.layout,
    layoutByLanguage: row.data.layoutByLanguage,
    changeLog: row.data.changeLog,
    jobDescription: row.data.jobDescription,
    translationGroupId: row.data.translationGroupId,
  };
}

/** List all resumes for the current user, ordered newest first. RLS filters by user_id automatically. */
export async function listResumes(): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('id,user_id,title,language,updated_at,created_at,data')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as ResumeRow[] | null ?? []).map(fromRow);
}

/** Lightweight list for metadata-only views (Issue 4 optimization). */
export async function listResumeSummaries(): Promise<Array<{ id: string; title: string; language: 'zh' | 'en'; updatedAt: number }>> {
  const { data, error } = await supabase
    .from('resumes')
    .select('id,title,language,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: { id: string; title: string; language: 'zh' | 'en'; updated_at: string }) => ({
    id: r.id,
    title: r.title,
    language: r.language,
    updatedAt: new Date(r.updated_at).getTime(),
  }));
}

export async function loadResume(id: string): Promise<Resume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .select('id,user_id,title,language,updated_at,created_at,data')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return fromRow(data as ResumeRow);
}

export async function saveResume(resume: Resume): Promise<Resume> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes.user) throw new Error('not authenticated');

  const row = toRow(resume, userRes.user.id);
  const { data, error } = await supabase
    .from('resumes')
    .upsert(row, { onConflict: 'id' })
    .select('id,user_id,title,language,updated_at,created_at,data')
    .single();
  if (error) throw error;
  return fromRow(data as ResumeRow);
}

/**
 * Batch upsert — used by duplicateCurrentResume etc to avoid double roundtrip.
 * Issue 4 regression guard.
 */
export async function saveResumes(resumes: Resume[]): Promise<Resume[]> {
  if (resumes.length === 0) return [];
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userRes.user) throw new Error('not authenticated');

  const rows = resumes.map((r) => toRow(r, userRes.user!.id));
  const { data, error } = await supabase
    .from('resumes')
    .upsert(rows, { onConflict: 'id' })
    .select('id,user_id,title,language,updated_at,created_at,data');
  if (error) throw error;
  return (data as ResumeRow[]).map(fromRow);
}

export async function deleteResume(id: string): Promise<void> {
  const { error } = await supabase.from('resumes').delete().eq('id', id);
  if (error) throw error;
}

/** Find candidates for a different language by metadata only — Issue 4 regression guard. */
export async function findResumeCandidatesByLanguage(language: 'zh' | 'en', excludeId?: string): Promise<Array<{ id: string; title: string; language: 'zh' | 'en'; updatedAt: number }>> {
  let query = supabase
    .from('resumes')
    .select('id,title,language,updated_at')
    .eq('language', language)
    .order('updated_at', { ascending: false });
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: { id: string; title: string; language: 'zh' | 'en'; updated_at: string }) => ({
    id: r.id,
    title: r.title,
    language: r.language,
    updatedAt: new Date(r.updated_at).getTime(),
  }));
}

/** Fetch full resumes filtered by language server-side — Issue 4 regression guard. */
export async function listResumesByLanguage(language: 'zh' | 'en', excludeId?: string): Promise<Resume[]> {
  let query = supabase
    .from('resumes')
    .select('id,user_id,title,language,updated_at,created_at,data')
    .eq('language', language)
    .order('updated_at', { ascending: false });
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as ResumeRow[] | null ?? []).map(fromRow);
}
