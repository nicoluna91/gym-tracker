import { Injectable } from '@angular/core';

import { getDb } from '../db/app-db';
import { WorkoutSet } from '../../models/workout.model';

@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  async addSet(set: WorkoutSet): Promise<void> {
    const db = await getDb();
    await db.put('sets', set);
  }

  async deleteSet(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('sets', id);
  }

  async getSetsByDate(date: string): Promise<WorkoutSet[]> {
    const db = await getDb();
    return await db.getAllFromIndex('sets', 'by-date', date);
  }

  async getSetsByExercise(exerciseId: string): Promise<WorkoutSet[]> {
    const db = await getDb();
    return await db.getAllFromIndex('sets', 'by-exerciseId', exerciseId);
  }

  async getAllSets(): Promise<WorkoutSet[]> {
    const db = await getDb();
    return await db.getAll('sets');
  }

  async clearAllSets(): Promise<void> {
    const db = await getDb();
    await db.clear('sets');
  }
}
