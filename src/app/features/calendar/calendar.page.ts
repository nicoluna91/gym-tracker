import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { PrimeTemplate } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';

import { dateMetaToUtcYmd, dateToUtcYmd } from '../../core/utils/date.util';
import { WorkoutRepository } from '../../core/persistence/workout.repository';
import { ExerciseStore } from '../../state/exercise.store';
import { MetricsStore } from '../../state/metrics.store';
import { WorkoutSet } from '../../models/workout.model';

type SetDetail = { peso: number; repeticiones: number; volume: number };

type ExerciseSessionRow = {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: SetDetail[];
  totalVolume: number;
};

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, CardModule, DatePickerModule, DialogModule, ButtonModule, PrimeTemplate],
  templateUrl: './calendar.page.html',
  styles: [
    `
      :host ::ng-deep .app-calendar-wrap .p-datepicker {
        display: block !important;
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100%;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-panel-inline {
        display: block;
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-calendar-container {
        width: 100%;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-calendar {
        width: 100%;
        table-layout: fixed;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day-view {
        width: 100%;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day-view thead tr,
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day-view tbody tr {
        width: 100%;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-weekday-cell,
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day-cell {
        width: calc(100% / 7);
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day-cell {
        padding: 0.15rem;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-day {
        min-height: 2.5rem;
        width: 100%;
        border-radius: 0.5rem;
      }
      :host ::ng-deep .app-calendar-wrap .p-datepicker-header {
        padding-bottom: 0.75rem;
      }
    `
  ]
})
export class CalendarPage implements OnInit {
  protected readonly metricsStore = inject(MetricsStore);
  private readonly exerciseStore = inject(ExerciseStore);
  private readonly repo = inject(WorkoutRepository);
  private readonly messageService = inject(MessageService);

  protected detailVisible = false;
  protected readonly selectedIso = signal<string | null>(null);

  protected readonly dialogTitle = computed(() => {
    const iso = this.selectedIso();
    if (!iso) return 'Sesión';
    return this.formatDateLong(iso);
  });

  protected readonly sessionRows = computed((): ExerciseSessionRow[] => {
    const iso = this.selectedIso();
    if (!iso) return [];
    const sets = this.metricsStore.sets().filter((s) => s.date === iso);
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const s of sets) {
      const arr = byExercise.get(s.exerciseId) ?? [];
      arr.push(s);
      byExercise.set(s.exerciseId, arr);
    }

    const rows: ExerciseSessionRow[] = [];
    for (const [exerciseId, list] of byExercise) {
      const ex = this.exerciseStore.getById(exerciseId);
      const setsDetail: SetDetail[] = list.map((s) => ({
        peso: s.peso,
        repeticiones: s.repeticiones,
        volume: s.peso * s.repeticiones
      }));
      const totalVolume = list.reduce((acc, s) => acc + s.peso * s.repeticiones, 0);
      rows.push({
        exerciseId,
        name: ex?.nombre ?? exerciseId,
        muscle: ex?.musculo ?? '',
        sets: setsDetail,
        totalVolume
      });
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  });

  protected readonly dayTotalVolume = computed(() => {
    const iso = this.selectedIso();
    if (!iso) return 0;
    return this.metricsStore
      .sets()
      .filter((s) => s.date === iso)
      .reduce((acc, s) => acc + s.peso * s.repeticiones, 0);
  });

  ngOnInit(): void {
    void this.metricsStore.init();
  }

  protected hasSession(date: { year: number; month: number; day: number }): boolean {
    const iso = dateMetaToUtcYmd(date);
    return this.metricsStore.sets().some((s) => s.date === iso);
  }

  protected onDateSelect(d: Date): void {
    this.selectedIso.set(dateToUtcYmd(d));
    this.detailVisible = true;
  }

  protected async deleteExerciseSets(exerciseId: string): Promise<void> {
    const iso = this.selectedIso();
    if (!iso) return;

    const exName = this.exerciseStore.getById(exerciseId)?.nombre ?? exerciseId;
    const ok = window.confirm(`¿Borrar todas las series de "${exName}" del ${iso}?`);
    if (!ok) return;

    const ids = this.metricsStore
      .sets()
      .filter((s) => s.date === iso && s.exerciseId === exerciseId)
      .map((s) => s.id);

    if (!ids.length) return;

    await Promise.all(ids.map((id) => this.repo.deleteSet(id)));
    await this.metricsStore.init();

    this.messageService.add({
      severity: 'success',
      summary: 'Borrado',
      detail: `Se borraron ${ids.length} series`
    });
  }

  protected trackByExercise(_: number, row: ExerciseSessionRow): string {
    return row.exerciseId;
  }

  private formatDateLong(iso: string): string {
    const [y, m, d] = iso.split('-').map((x) => Number(x));
    if (!y || !m || !d) return iso;
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}
