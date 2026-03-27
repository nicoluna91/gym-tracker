import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { ExerciseStore } from '../../state/exercise.store';
import { RoutineStore } from '../../state/routine.store';
import { WEEKDAYS } from '../../shared/weekdays';

@Component({
  selector: 'app-week-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: './week.page.html'
})
export class WeekPage {
  private readonly routineStore = inject(RoutineStore);
  private readonly exerciseStore = inject(ExerciseStore);

  protected readonly weekdays = WEEKDAYS;

  protected readonly dayInfo = computed(() => {
    const map = this.routineStore.dayMap();

    return (day: (typeof WEEKDAYS)[number]['key']) => {
      const d = map.get(day);
      if (!d) return { hasRoutine: false, muscle: '', exerciseCount: 0 };

      const muscles = d.muscles?.length ? d.muscles : [d.muscle];
      const label = muscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');

      return {
        hasRoutine: true,
        muscle: label,
        exerciseCount: d.exerciseIds.length
      };
    };
  })();

  protected dayLink(day: (typeof WEEKDAYS)[number]['key']): any[] {
    const d = this.routineStore.dayMap().get(day);
    return d ? ['/entrenamiento', day] : ['/rutina'];
  }
}
