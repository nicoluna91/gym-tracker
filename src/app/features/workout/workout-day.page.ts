import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';

import { Weekday } from '../../models/routine.model';
import { WEEKDAYS } from '../../shared/weekdays';
import { ExerciseStore } from '../../state/exercise.store';
import { RoutineStore } from '../../state/routine.store';
import { WorkoutStore } from '../../state/workout.store';

@Component({
  selector: 'app-workout-day-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputNumberModule],
  templateUrl: './workout-day.page.html'
})
export class WorkoutDayPage {
  protected readonly routineStore = inject(RoutineStore);
  protected readonly exerciseStore = inject(ExerciseStore);
  protected readonly workoutStore = inject(WorkoutStore);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly selectedWeekday = signal<Weekday>(this.resolveDayFromRoute());
  protected readonly selectedWeekdayLabel = computed(() => this.getDayLabel(this.selectedWeekday()));

  protected readonly dayExercises = computed(() => {
    const d = this.routineStore.dayMap().get(this.selectedWeekday());
    const ids = d?.exerciseIds ?? [];
    return ids
      .map((id) => this.exerciseStore.getById(id))
      .filter(Boolean)
      .map((e) => e!);
  });

  addSetVisible = false;
  private exerciseIdForSet: string | null = null;

  protected readonly peso = signal<number | null>(null);
  protected readonly reps = signal<number | null>(null);

  goBack(): void {
    void this.router.navigate(['/entrenamiento']);
  }

  openAddSet(exerciseId: string): void {
    this.exerciseIdForSet = exerciseId;
    this.peso.set(null);
    this.reps.set(null);
    this.addSetVisible = true;
  }

  async saveSet(): Promise<void> {
    if (!this.exerciseIdForSet) return;
    const peso = this.peso();
    const reps = this.reps();
    if (peso == null || reps == null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Completá peso y repeticiones'
      });
      return;
    }

    await this.workoutStore.addSet(this.exerciseIdForSet, peso, reps);
    this.addSetVisible = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Serie guardada correctamente'
    });
  }

  volumeForExercise(exerciseId: string): number {
    return this.workoutStore
      .sets()
      .filter((s) => s.exerciseId === exerciseId)
      .reduce((acc, s) => acc + s.peso * s.repeticiones, 0);
  }

  setCountForExercise(exerciseId: string): number {
    return this.workoutStore.sets().filter((s) => s.exerciseId === exerciseId).length;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    (img.nextElementSibling as HTMLElement)?.style.setProperty('display', '');
  }

  private resolveDayFromRoute(): Weekday {
    const candidate = this.route.snapshot.paramMap.get('day');
    const day = WEEKDAYS.find((d) => d.key === candidate);
    return day?.key ?? 'lunes';
  }

  private getDayLabel(day: Weekday): string {
    return WEEKDAYS.find((d) => d.key === day)?.label ?? 'Día';
  }
}
