import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { RoutineRepository } from '../core/persistence/routine.repository';
import { createId } from '../core/utils/id.util';
import { MuscleGroup } from '../models/exercise.model';
import { RoutineDay, Weekday, WeeklyRoutine } from '../models/routine.model';

type RoutineState = {
  routine: WeeklyRoutine | null;
  loading: boolean;
};

const initialState: RoutineState = {
  routine: null,
  loading: false
};

export const RoutineStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ routine }) => ({
    days: computed(() => routine()?.days ?? []),
    hasRoutine: computed(() => (routine()?.days?.length ?? 0) > 0),
    dayMap: computed(() => {
      const map = new Map<Weekday, RoutineDay>();
      for (const d of routine()?.days ?? []) map.set(d.day, d);
      return map;
    })
  })),
  withMethods((store, repo = inject(RoutineRepository)) => {
    const persistDays = async (days: RoutineDay[]): Promise<void> => {
      const now = Date.now();
      const current = store.routine();
      const routine: WeeklyRoutine = {
        id: current?.id ?? createId('routine'),
        days,
        createdAt: current?.createdAt ?? now,
        updatedAt: now
      };

      patchState(store, { routine });
      await repo.saveRoutine(routine);
    };

    return {
    async init(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const routine = await repo.getRoutine();
        patchState(store, { routine });
      } finally {
        patchState(store, { loading: false });
      }
    },

    async saveWeeklyRoutine(days: RoutineDay[]): Promise<void> {
      await persistDays(days);
    },

    async upsertDay(day: RoutineDay): Promise<void> {
      const current = store.routine();
      const days = [...(current?.days ?? [])];
      const idx = days.findIndex((d) => d.day === day.day);
      if (idx >= 0) days[idx] = day;
      else days.push(day);
      await persistDays(days);
    },

    async removeDay(weekday: Weekday): Promise<void> {
      const current = store.routine();
      const nextDays = (current?.days ?? []).filter((d) => d.day !== weekday);
      if (nextDays.length === 0) {
        patchState(store, { routine: null });
        await repo.clearRoutine();
        return;
      }
      await persistDays(nextDays);
    },

    async clear(): Promise<void> {
      patchState(store, { routine: null });
      await repo.clearRoutine();
    },

    buildDay(day: Weekday, muscles: MuscleGroup[], exerciseIds: string[]): RoutineDay {
      return { day, muscle: muscles[0], muscles, exerciseIds };
    }
  };
  })
);
