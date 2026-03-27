import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { RoutineStore } from '../../state/routine.store';
import { Weekday } from '../../models/routine.model';
import { WEEKDAYS } from '../../shared/weekdays';

@Component({
  selector: 'app-routine-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './routine.page.html'
})
export class RoutinePage {
  private readonly routineStore = inject(RoutineStore);

  protected readonly weekdays = WEEKDAYS;

  protected readonly selectedCount = computed(() => this.routineStore.days().length);

  protected readonly totalSelectedExercises = computed(() =>
    this.routineStore.days().reduce((count, d) => count + (d.exerciseIds?.length ?? 0), 0)
  );

  hasDay(day: Weekday): boolean {
    return this.routineStore.dayMap().has(day);
  }

  dayExerciseCount(day: Weekday): number {
    return this.routineStore.dayMap().get(day)?.exerciseIds?.length ?? 0;
  }

  getDayMuscleLabel(day: Weekday): string {
    const dayData = this.routineStore.dayMap().get(day);
    if (!dayData) return '—';

    const muscles = dayData.muscles?.length ? dayData.muscles : [dayData.muscle];
    return muscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
  }
}
