import { Injectable } from '@angular/core';

import { getDb } from '../db/app-db';
import { WeeklyRoutine } from '../../models/routine.model';

const ROUTINE_KEY = 'weekly-routine';

@Injectable({ providedIn: 'root' })
export class RoutineRepository {
  async getRoutine(): Promise<WeeklyRoutine | null> {
    const db = await getDb();
    return (await db.get('routine', ROUTINE_KEY)) ?? null;
  }

  async saveRoutine(routine: WeeklyRoutine): Promise<void> {
    const db = await getDb();
    await db.put('routine', routine, ROUTINE_KEY);
  }

  async clearRoutine(): Promise<void> {
    const db = await getDb();
    await db.delete('routine', ROUTINE_KEY);
  }
}
