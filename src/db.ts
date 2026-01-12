import Dexie, { type Table } from 'dexie';
import type { Resume } from './types';

export interface ArchivedItem {
  id: string;
  type: 'education' | 'experience';
  data: any;
  originalResumeId: string;
  deletedAt: number;
}

export class ResumeDatabase extends Dexie {
  resumes!: Table<Resume>;
  archives!: Table<ArchivedItem>;

  constructor() {
    super('WonderCVDB');
    this.version(1).stores({
      resumes: 'id, updatedAt, title'
    });
    this.version(2).stores({
      resumes: 'id, updatedAt, title',
      archives: 'id, type, originalResumeId, deletedAt'
    });
  }
}

export const db = new ResumeDatabase();
