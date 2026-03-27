import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { WorkoutRepository } from '../core/persistence/workout.repository';
import { createId } from '../core/utils/id.util';
import { todayISO } from '../core/utils/date.util';
import { WorkoutSet } from '../models/workout.model';
import { MetricsStore } from './metrics.store';

type WorkoutState = {
  selectedDate: string;
  sets: WorkoutSet[];
  loading: boolean;
};

const initialState: WorkoutState = {
  selectedDate: todayISO(),
  sets: [],
  loading: false
};

export const WorkoutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ sets }) => ({
    totalVolume: computed(() => sets().reduce((acc, s) => acc + s.peso * s.repeticiones, 0))
  })),
  withMethods((store, repo = inject(WorkoutRepository), metrics = inject(MetricsStore)) => ({
    async init(): Promise<void> {
      await this.loadByDate(store.selectedDate());
    },

    async loadByDate(date: string): Promise<void> {
      patchState(store, { selectedDate: date, loading: true });
      try {
        const sets = await repo.getSetsByDate(date);
        patchState(store, { sets });
      } finally {
        patchState(store, { loading: false });
      }
    },

    async addSet(exerciseId: string, peso: number, repeticiones: number, date = store.selectedDate()): Promise<void> {
      const set: WorkoutSet = {
        id: createId('set'),
        date,
        exerciseId,
        peso,
        repeticiones,
        createdAt: Date.now()
      };

      patchState(store, { sets: [...store.sets(), set] });
      await repo.addSet(set);
      await metrics.init();
    },

    async clearAll(): Promise<void> {
      patchState(store, { sets: [] });
      await repo.clearAllSets();
      await metrics.init();
    }
  }))
);
