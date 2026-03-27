import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { ExerciseStore } from '../../state/exercise.store';
import { RoutineStore } from '../../state/routine.store';
import { Exercise, MuscleGroup } from '../../models/exercise.model';
import { RoutineDay, Weekday } from '../../models/routine.model';
import { WEEKDAYS } from '../../shared/weekdays';

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'pecho', label: 'Pecho' },
  { key: 'espalda', label: 'Espalda' },
  { key: 'piernas', label: 'Piernas' },
  { key: 'hombros', label: 'Hombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' }
];

function isWeekday(value: string | null | undefined): value is Weekday {
  return (
    value === 'lunes' ||
    value === 'martes' ||
    value === 'miercoles' ||
    value === 'jueves' ||
    value === 'viernes' ||
    value === 'sabado' ||
    value === 'domingo'
  );
}

@Component({
  selector: 'app-routine-day-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './routine-day.page.html'
})
export class RoutineDayPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineStore = inject(RoutineStore);
  private readonly exerciseStore = inject(ExerciseStore);
  private readonly messageService = inject(MessageService);

  protected readonly muscleGroups = MUSCLE_GROUPS;

  protected readonly day = signal<Weekday>('lunes');
  protected readonly selectedMuscles = signal<MuscleGroup[]>([]);
  protected readonly selectedExercises = signal<Exercise[]>([]);

  protected readonly dayLabel = computed(() => WEEKDAYS.find((d) => d.key === this.day())?.label ?? 'Día');

  protected readonly hasExistingDay = computed(() => this.routineStore.dayMap().has(this.day()));

  protected readonly filteredExercises = computed(() => {
    const muscles = this.selectedMuscles();
    if (muscles.length === 0) return [];

    const selectedIds = new Set(this.selectedExercises().map((e) => e.id));
    const byId = new Map<string, Exercise>();
    for (const muscle of muscles) {
      for (const ex of this.exerciseStore.getByMuscle(muscle)) {
        if (!selectedIds.has(ex.id)) {
          byId.set(ex.id, ex);
        }
      }
    }
    return [...byId.values()];
  });

  protected readonly canSave = computed(() => this.selectedMuscles().length > 0 && this.selectedExercises().length > 0);
  protected readonly selectedMusclesLabel = computed(() => {
    const muscles = this.selectedMuscles();
    if (muscles.length === 0) return 'Elegí uno o más grupos para empezar';
    return muscles.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
  });

  constructor() {
    effect(() => {
      const raw = this.route.snapshot.paramMap.get('day');
      if (!isWeekday(raw)) {
        this.router.navigateByUrl('/rutina');
        return;
      }

      this.day.set(raw);

      const existing = this.routineStore.dayMap().get(raw);
      if (!existing) {
        this.selectedMuscles.set(['pecho']);
        this.selectedExercises.set([]);
        return;
      }

      const muscles = existing.muscles?.length ? existing.muscles : [existing.muscle];
      this.selectedMuscles.set(muscles);
      const exercises = (existing.exerciseIds ?? [])
        .map((id) => this.exerciseStore.getById(id))
        .filter((e): e is Exercise => Boolean(e));
      this.selectedExercises.set(exercises);
    });
  }

  toggleMuscle(muscle: MuscleGroup): void {
    const current = this.selectedMuscles();
    const exists = current.includes(muscle);
    const next = exists ? current.filter((m) => m !== muscle) : [...current, muscle];
    this.selectedMuscles.set(next);

    if (exists) {
      const allowed = new Set(next);
      this.selectedExercises.set(this.selectedExercises().filter((e) => allowed.has(e.musculo)));
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Grupo muscular',
      detail: exists ? 'Grupo removido.' : 'Grupo agregado.',
      life: 1400
    });
  }

  isSelected(exerciseId: string): boolean {
    return this.selectedExercises().some((e) => e.id === exerciseId);
  }

  addExercise(exercise: Exercise): void {
    if (this.isSelected(exercise.id)) return;
    this.selectedExercises.set([...this.selectedExercises(), exercise]);
    this.messageService.add({
      severity: 'success',
      summary: 'Agregado',
      detail: exercise.nombre,
      life: 900
    });
  }

  removeExercise(exerciseId: string): void {
    this.selectedExercises.set(this.selectedExercises().filter((e) => e.id !== exerciseId));
  }

  moveUp(index: number): void {
    if (index <= 0) return;
    const list = [...this.selectedExercises()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.selectedExercises.set(list);
  }

  moveDown(index: number): void {
    const list = [...this.selectedExercises()];
    if (index >= list.length - 1) return;
    [list[index], list[index + 1]] = [list[index + 1], list[index]];
    this.selectedExercises.set(list);
  }

  async removeDay(): Promise<void> {
    await this.routineStore.removeDay(this.day());
    this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Día quitado de la rutina', life: 1200 });
    this.router.navigateByUrl('/rutina');
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    (img.nextElementSibling as HTMLElement)?.style.setProperty('display', '');
  }

  async save(): Promise<void> {
    const muscles = this.selectedMuscles();
    if (muscles.length === 0) return;

    const payload: RoutineDay = {
      day: this.day(),
      muscle: muscles[0],
      muscles,
      exerciseIds: this.selectedExercises().map((e) => e.id)
    };

    await this.routineStore.upsertDay(payload);
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Rutina del día guardada', life: 1200 });
    this.router.navigateByUrl('/rutina');
  }
}

