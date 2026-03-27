import { computed } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { EXERCISES } from '../data/exercises/exercise.data-source';
import { Exercise, MuscleGroup } from '../models/exercise.model';

type ExerciseState = {
  exercises: Exercise[];
};

const initialState: ExerciseState = {
  exercises: EXERCISES
};

export const ExerciseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ exercises }) => ({
    muscles: computed(() => {
      const set = new Set<MuscleGroup>();
      for (const e of exercises()) set.add(e.musculo);
      return Array.from(set);
    })
  })),
  withMethods((store) => ({
    getById(id: string): Exercise | undefined {
      return store.exercises().find((e) => e.id === id);
    },

    getByMuscle(muscle: MuscleGroup): Exercise[] {
      return store.exercises().filter((e) => e.musculo === muscle);
    },

    setExercises(exercises: Exercise[]): void {
      patchState(store, { exercises });
    }
  }))
);
