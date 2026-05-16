import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Resume } from '../types';
import { importResumesFromJson } from './importFromJson';

vi.mock('../db', () => ({
  saveResumes: vi.fn(),
}));

const sampleJson = JSON.stringify([
  {
    id: 'old-1',
    updatedAt: 1700000000000,
    title: 'Resume A',
    language: 'zh',
    profile: { fullName: '张三', email: 'zs@x.com', phone: '139' },
    educations: [],
    experiences: [],
    projects: [],
    skills: { content: '' },
    customSections: [],
  },
  {
    id: 'old-2',
    updatedAt: 1700000000001,
    title: 'Resume B',
    language: 'en',
    profile: { fullName: 'John', email: 'j@x.com', phone: '139' },
    educations: [],
    experiences: [],
    projects: [],
    skills: { content: '' },
    customSections: [],
  },
] as Resume[]);

describe('importResumesFromJson', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses JSON and saves all rows in a single batch', async () => {
    const { saveResumes } = await import('../db');
    (saveResumes as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'old-1' },
      { id: 'old-2' },
    ]);

    const result = await importResumesFromJson(sampleJson);
    expect(saveResumes).toHaveBeenCalledTimes(1);
    expect((saveResumes as ReturnType<typeof vi.fn>).mock.calls[0][0]).toHaveLength(2);
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('rejects invalid JSON', async () => {
    await expect(importResumesFromJson('not json{')).rejects.toThrow(/invalid json/i);
  });

  it('rejects when payload is not an array', async () => {
    await expect(importResumesFromJson('{"x": 1}')).rejects.toThrow(/array/i);
  });

  it('rejects empty array', async () => {
    await expect(importResumesFromJson('[]')).rejects.toThrow(/empty/i);
  });

  it('filters out entries missing required fields', async () => {
    const { saveResumes } = await import('../db');
    (saveResumes as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'ok-1' }]);

    const mixed = JSON.stringify([
      { id: 'ok-1', title: 'OK', language: 'zh', profile: { fullName: '', email: '', phone: '' }, educations: [], experiences: [], projects: [], skills: { content: '' }, customSections: [], updatedAt: 1 },
      { id: 'bad-no-title' }, // missing fields
      'not an object',
    ]);

    const result = await importResumesFromJson(mixed);
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(2);
    expect((saveResumes as ReturnType<typeof vi.fn>).mock.calls[0][0]).toHaveLength(1);
  });
});
