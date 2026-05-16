import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resume } from './types';
import { toRow, fromRow, listResumes, loadResume, saveResume, deleteResume, type ResumeRow } from './db';

vi.mock('./lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: undefined,
  };
  return {
    supabase: {
      from: vi.fn(() => chain),
      auth: { getUser: vi.fn() },
    },
    __chain: chain,
  };
});

const sampleResume: Resume = {
  id: 'resume-1',
  updatedAt: 1700000000000,
  title: '我的简历',
  language: 'zh',
  jobDescription: 'Senior SWE',
  translationGroupId: 'group-1',
  layout: { fontSize: '14px', lineHeight: '1.5', margin: '15mm' },
  layoutByLanguage: { zh: { fontSize: '14px', lineHeight: '1.5', margin: '15mm' } },
  changeLog: [{ id: 'log-1', date: 1, type: 'update', section: 'profile', description: 'init' }],
  profile: { fullName: '张三', email: 'zs@x.com', phone: '13800000000', summary: '<p>summary</p>' },
  educations: [{ id: 'edu-1', school: '清华', degree: '硕士', startDate: '2018', endDate: '2021' }],
  experiences: [{ id: 'exp-1', company: '大厂', position: 'SWE', startDate: '2021', endDate: '2024' }],
  projects: [{ id: 'proj-1', name: 'WonderCV', role: 'solo', startDate: '2026', endDate: 'now' }],
  skills: { content: '<p>Go, TS</p>' },
  customSections: [{ id: 'cs-1', title: 'Awards', content: '<p>none</p>' }],
};

describe('toRow / fromRow', () => {
  it('toRow splits columns and data correctly', () => {
    const row = toRow(sampleResume, 'user-xyz');
    expect(row.id).toBe('resume-1');
    expect(row.user_id).toBe('user-xyz');
    expect(row.title).toBe('我的简历');
    expect(row.language).toBe('zh');
    // columnized fields must NOT appear in jsonb data
    const dataBag = row.data as unknown as Record<string, unknown>;
    expect(dataBag.id).toBeUndefined();
    expect(dataBag.title).toBeUndefined();
    expect(dataBag.language).toBeUndefined();
    expect(dataBag.updatedAt).toBeUndefined();
    // rich fields live in jsonb data
    expect(row.data.profile.fullName).toBe('张三');
    expect(row.data.educations).toHaveLength(1);
    expect(row.data.experiences).toHaveLength(1);
    expect(row.data.projects).toHaveLength(1);
    expect(row.data.skills.content).toContain('Go');
    expect(row.data.customSections).toHaveLength(1);
    expect(row.data.layout?.fontSize).toBe('14px');
    expect(row.data.changeLog).toHaveLength(1);
    expect(row.data.jobDescription).toBe('Senior SWE');
    expect(row.data.translationGroupId).toBe('group-1');
  });

  it('fromRow reconstitutes identical Resume', () => {
    const row: ResumeRow = {
      id: 'resume-1',
      user_id: 'user-xyz',
      title: '我的简历',
      language: 'zh',
      updated_at: '2023-11-14T22:13:20.000Z',
      created_at: '2023-11-14T22:13:20.000Z',
      data: {
        profile: sampleResume.profile,
        educations: sampleResume.educations,
        experiences: sampleResume.experiences,
        projects: sampleResume.projects,
        skills: sampleResume.skills,
        customSections: sampleResume.customSections,
        layout: sampleResume.layout,
        layoutByLanguage: sampleResume.layoutByLanguage,
        changeLog: sampleResume.changeLog,
        jobDescription: sampleResume.jobDescription,
        translationGroupId: sampleResume.translationGroupId,
      },
    };
    const resume = fromRow(row);
    expect(resume.id).toBe('resume-1');
    expect(resume.title).toBe('我的简历');
    expect(resume.language).toBe('zh');
    expect(resume.updatedAt).toBe(new Date(row.updated_at).getTime());
    expect(resume.profile.fullName).toBe('张三');
    expect(resume.educations).toHaveLength(1);
    expect(resume.skills.content).toContain('Go');
    expect(resume.changeLog).toHaveLength(1);
  });

  it('fromRow handles missing optional jsonb fields', () => {
    const row: ResumeRow = {
      id: 'r2',
      user_id: 'u1',
      title: 'Minimal',
      language: 'en',
      updated_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      data: {
        profile: { fullName: '', email: '', phone: '' },
        educations: [],
        experiences: [],
        projects: [],
        skills: { content: '' },
        customSections: [],
      },
    };
    const resume = fromRow(row);
    expect(resume.layout).toBeUndefined();
    expect(resume.changeLog).toBeUndefined();
    expect(resume.educations).toEqual([]);
  });

  it('toRow then fromRow is a near-identity (preserves all content)', () => {
    const row = toRow(sampleResume, 'u1');
    const rehydrated = fromRow({
      ...row,
      updated_at: new Date(sampleResume.updatedAt).toISOString(),
      created_at: new Date(sampleResume.updatedAt).toISOString(),
    });
    expect(rehydrated.id).toBe(sampleResume.id);
    expect(rehydrated.title).toBe(sampleResume.title);
    expect(rehydrated.language).toBe(sampleResume.language);
    expect(rehydrated.profile).toEqual(sampleResume.profile);
    expect(rehydrated.educations).toEqual(sampleResume.educations);
    expect(rehydrated.experiences).toEqual(sampleResume.experiences);
    expect(rehydrated.projects).toEqual(sampleResume.projects);
    expect(rehydrated.skills).toEqual(sampleResume.skills);
    expect(rehydrated.customSections).toEqual(sampleResume.customSections);
  });
});

describe('listResumes / loadResume / saveResume / deleteResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listResumes selects user rows ordered by updated_at desc', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    const rowA: ResumeRow = {
      id: 'a',
      user_id: 'u1',
      title: 'A',
      language: 'zh',
      updated_at: '2024-02-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      data: { profile: { fullName: '', email: '', phone: '' }, educations: [], experiences: [], projects: [], skills: { content: '' }, customSections: [] },
    };
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [rowA], error: null }),
      }),
    });

    const result = await listResumes();
    expect(supabase.from).toHaveBeenCalledWith('resumes');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
    expect(result[0].title).toBe('A');
  });

  it('loadResume fetches single row by id', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    const row: ResumeRow = {
      id: 'r1',
      user_id: 'u1',
      title: 'R1',
      language: 'en',
      updated_at: '2024-02-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      data: { profile: { fullName: '', email: '', phone: '' }, educations: [], experiences: [], projects: [], skills: { content: '' }, customSections: [] },
    };
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    });

    const result = await loadResume('r1');
    expect(result?.id).toBe('r1');
  });

  it('loadResume returns null when not found', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await loadResume('missing');
    expect(result).toBeNull();
  });

  it('saveResume upserts row with current user id', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-xyz' } }, error: null });
    const upsertReturn: ResumeRow = {
      ...toRow(sampleResume, 'user-xyz'),
      updated_at: '2024-02-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };
    const singleFn = vi.fn().mockResolvedValue({ data: upsertReturn, error: null });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const upsertFn = vi.fn().mockReturnValue({ select: selectFn });
    supabase.from.mockReturnValueOnce({ upsert: upsertFn });

    const saved = await saveResume(sampleResume);
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'resume-1', user_id: 'user-xyz', title: '我的简历' }),
      expect.objectContaining({ onConflict: 'id' }),
    );
    expect(saved.id).toBe('resume-1');
  });

  it('saveResume throws when no authenticated user', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveResume(sampleResume)).rejects.toThrow(/not authenticated/i);
  });

  it('deleteResume deletes by id', async () => {
    const { supabase } = (await import('./lib/supabase')) as any;
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn });
    supabase.from.mockReturnValueOnce({ delete: deleteFn });

    await deleteResume('r1');
    expect(supabase.from).toHaveBeenCalledWith('resumes');
    expect(eqFn).toHaveBeenCalledWith('id', 'r1');
  });
});
