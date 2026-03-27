import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Weekday } from '../../models/routine.model';
import { WEEKDAYS } from '../../shared/weekdays';

@Component({
  selector: 'app-workout-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workout.page.html'
})
export class WorkoutPage {
  private readonly router = inject(Router);
  protected readonly weekdays = WEEKDAYS;
  protected readonly today: Weekday = this.resolveToday();

  selectDay(day: Weekday): void {
    void this.router.navigate(['/entrenamiento', day]);
  }

  private resolveToday(): Weekday {
    const map: Record<number, Weekday> = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado',
      0: 'domingo'
    };
    return map[new Date().getDay()];
  }
}
