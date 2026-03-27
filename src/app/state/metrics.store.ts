import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { WorkoutRepository } from '../core/persistence/workout.repository';
import { WorkoutSet } from '../models/workout.model';

type MetricsState = {
  sets: WorkoutSet[];
  loading: boolean;
};

const initialState: MetricsState = {
  sets: [],
  loading: false
};

export const MetricsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ sets }) => ({
    prMaxWeightByExercise: computed(() => {
      const map = new Map<string, number>();
      for (const s of sets()) {
        const current = map.get(s.exerciseId) ?? 0;
        if (s.peso > current) map.set(s.exerciseId, s.peso);
      }
      return map;
    }),

    prMaxSessionVolumeByExercise: computed(() => {
      const byExerciseDate = new Map<string, number>();
      for (const s of sets()) {
        const key = `${s.exerciseId}|${s.date}`;
        const current = byExerciseDate.get(key) ?? 0;
        byExerciseDate.set(key, current + s.peso * s.repeticiones);
      }

      const best = new Map<string, number>();
      for (const [key, volume] of byExerciseDate.entries()) {
        const exerciseId = key.split('|')[0];
        const current = best.get(exerciseId) ?? 0;
        if (volume > current) best.set(exerciseId, volume);
      }

      return best;
    }),

    volumeByDate: computed(() => {
      const map = new Map<string, number>();
      for (const s of sets()) {
        const current = map.get(s.date) ?? 0;
        map.set(s.date, current + s.peso * s.repeticiones);
      }
      return map;
    })
  })),
  withMethods((store, repo = inject(WorkoutRepository)) => ({
    async init(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const sets = await repo.getAllSets();
        patchState(store, { sets });
      } finally {
        patchState(store, { loading: false });
      }
    }
  }))
);
