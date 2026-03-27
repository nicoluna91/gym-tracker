import { DBSchema, IDBPDatabase, openDB } from 'idb';

import { WeeklyRoutine } from '../../models/routine.model';
import { WorkoutSet } from '../../models/workout.model';

export interface GymTrackerDbSchema extends DBSchema {
  routine: {
    key: string;
    value: WeeklyRoutine;
  };
  sets: {
    key: string;
    value: WorkoutSet;
    indexes: {
      'by-date': string;
      'by-exerciseId': string;
    };
  };
}

const DB_NAME = 'gym-tracker-db';
const DB_VERSION = 1;
const ROUTINE_KEY = 'weekly-routine';

let dbPromise: Promise<IDBPDatabase<GymTrackerDbSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<GymTrackerDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GymTrackerDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('routine')) {
          db.createObjectStore('routine');
        }

        if (!db.objectStoreNames.contains('sets')) {
          const store = db.createObjectStore('sets', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
          store.createIndex('by-exerciseId', 'exerciseId');
        }
      }
    });
  }

  return dbPromise;
}

export type GymTrackerDbDumpV1 = {
  schemaVersion: 1;
  exportedAt: string; // ISO
  data: {
    routine: WeeklyRoutine | null;
    sets: WorkoutSet[];
  };
};

export async function exportDb(): Promise<GymTrackerDbDumpV1> {
  const db = await getDb();
  const [routine, sets] = await Promise.all([
    (await db.get('routine', ROUTINE_KEY)) ?? null,
    db.getAll('sets')
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { routine, sets }
  };
}

export async function importDb(dump: GymTrackerDbDumpV1): Promise<void> {
  if (!dump || dump.schemaVersion !== 1 || !dump.data || !Array.isArray(dump.data.sets)) {
    throw new Error('Formato de backup inválido.');
  }

  const db = await getDb();

  await db.clear('sets');
  await db.delete('routine', ROUTINE_KEY);

  if (dump.data.routine) {
    await db.put('routine', dump.data.routine, ROUTINE_KEY);
  }

  if (dump.data.sets.length > 0) {
    const tx = db.transaction('sets', 'readwrite');
    for (const s of dump.data.sets) {
      await tx.store.put(s);
    }
    await tx.done;
  }
}
