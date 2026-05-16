import type { Resume } from '../types';
import { saveResumes } from '../db';

export interface ImportResult {
  imported: number;
  failed: number;
  failedDetails: string[];
}

function isValidResume(x: unknown): x is Resume {
  if (!x || typeof x !== 'object') return false;
  const r = x as Partial<Resume>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    (r.language === 'zh' || r.language === 'en') &&
    typeof r.profile === 'object' &&
    Array.isArray(r.educations) &&
    Array.isArray(r.experiences) &&
    Array.isArray(r.projects) &&
    typeof r.skills === 'object' &&
    Array.isArray(r.customSections)
  );
}

/**
 * One-time migration helper: import Resume JSON (from exportAllData) into Supabase.
 * Uses batch upsert so entire set goes in one roundtrip.
 */
export async function importResumesFromJson(jsonText: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`invalid JSON: ${(e as Error).message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('expected an array of resumes');
  }
  if (parsed.length === 0) {
    throw new Error('array is empty, nothing to import');
  }

  const valid: Resume[] = [];
  const failedDetails: string[] = [];
  parsed.forEach((item, idx) => {
    if (isValidResume(item)) {
      valid.push(item);
    } else {
      failedDetails.push(`Entry ${idx} missing required fields or wrong type`);
    }
  });

  if (valid.length === 0) {
    return { imported: 0, failed: failedDetails.length, failedDetails };
  }

  const saved = await saveResumes(valid);
  return { imported: saved.length, failed: failedDetails.length, failedDetails };
}
