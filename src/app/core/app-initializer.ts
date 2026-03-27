import { APP_INITIALIZER, Provider, inject } from '@angular/core';

import { MetricsStore } from '../state/metrics.store';
import { RoutineStore } from '../state/routine.store';
import { WorkoutStore } from '../state/workout.store';

export function provideAppInitializer(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: () => {
      const routineStore = inject(RoutineStore);
      const workoutStore = inject(WorkoutStore);
      const metricsStore = inject(MetricsStore);

      return async () => {
        await Promise.all([routineStore.init(), workoutStore.init(), metricsStore.init()]);
      };
    }
  };
}
