import Dexie, { type Table } from 'dexie';
import type { Resume } from './types';

export class ResumeDatabase extends Dexie {
  resumes!: Table<Resume>;

  constructor() {
    super('WonderCVDB');
    this.version(1).stores({
      resumes: 'id, updatedAt, title'
    });
  }
}

export const db = new ResumeDatabase();
