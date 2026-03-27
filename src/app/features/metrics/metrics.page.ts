import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

import { MuscleGroup } from '../../models/exercise.model';
import { ExerciseStore } from '../../state/exercise.store';
import { MetricsStore } from '../../state/metrics.store';

@Component({
  selector: 'app-metrics-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ChartModule, RouterLink],
  templateUrl: './metrics.page.html'
})
export class MetricsPage {
  protected readonly metricsStore = inject(MetricsStore);
  protected readonly exerciseStore = inject(ExerciseStore);

  protected readonly selectedMuscle = signal<MuscleGroup | null>(this.exerciseStore.muscles()[0] ?? null);

  protected readonly muscles = computed(() => this.exerciseStore.muscles().slice().sort());

  protected readonly prRows = computed(() => {
    const prs = this.metricsStore.prMaxWeightByExercise();
    const rows: { id: string; name: string; value: number }[] = [];

    for (const [exerciseId, value] of prs.entries()) {
      const e = this.exerciseStore.getById(exerciseId);
      rows.push({ id: exerciseId, name: e?.nombre ?? exerciseId, value });
    }

    return rows.sort((a, b) => b.value - a.value).slice(0, 8);
  });

  protected readonly volumeChartDataByMuscle = computed(() => {
    const muscle = this.selectedMuscle();
    const exercises = muscle ? this.exerciseStore.getByMuscle(muscle) : [];
    const exerciseIds = new Set(exercises.map((e) => e.id));

    const byExerciseDate = new Map<string, number>(); // `${exerciseId}|${date}` -> volume
    const datesSet = new Set<string>();
    for (const s of this.metricsStore.sets()) {
      if (!exerciseIds.has(s.exerciseId)) continue;
      datesSet.add(s.date);
      const key = `${s.exerciseId}|${s.date}`;
      const current = byExerciseDate.get(key) ?? 0;
      byExerciseDate.set(key, current + s.peso * s.repeticiones);
    }

    const dates = Array.from(datesSet).sort();

    return {
      labels: dates,
      datasets: exercises.map((e) => ({
        label: e.nombre,
        data: dates.map((d) => byExerciseDate.get(`${e.id}|${d}`) ?? 0)
      }))
    };
  });

  chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  };

  protected labelMuscle(m: MuscleGroup): string {
    // Simple capitalización
    return m.charAt(0).toUpperCase() + m.slice(1);
  }
}
