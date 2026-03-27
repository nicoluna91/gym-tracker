import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { RoutineStore } from '../../state/routine.store';
import { MetricsStore } from '../../state/metrics.store';
import { WorkoutStore } from '../../state/workout.store';
import { exportDb, importDb, GymTrackerDbDumpV1 } from '../../core/db/app-db';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './home.page.html'
})
export class HomePage {
  protected readonly routineStore = inject(RoutineStore);
  private readonly workoutStore = inject(WorkoutStore);
  private readonly metricsStore = inject(MetricsStore);

  protected readonly resetting = signal(false);
  protected readonly exporting = signal(false);
  protected readonly importing = signal(false);

  protected async resetDb(): Promise<void> {
    const ok = window.confirm(
      'Esto borrará la rutina y todos los entrenamientos guardados en este dispositivo.\n\n¿Querés continuar?'
    );
    if (!ok) return;

    this.resetting.set(true);
    try {
      await Promise.all([this.routineStore.clear(), this.workoutStore.clearAll()]);
      await Promise.all([this.routineStore.init(), this.workoutStore.init(), this.metricsStore.init()]);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo restablecer la base local. Revisá la consola para más detalle.');
    } finally {
      this.resetting.set(false);
    }
  }

  protected async onExportDb(): Promise<void> {
    this.exporting.set(true);
    try {
      const dump = await exportDb();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-tracker-backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo exportar la base local.');
    } finally {
      this.exporting.set(false);
    }
  }

  protected async onImportDbFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement | null;
    if (!input) return;

    const file = input.files?.[0] ?? null;
    if (!file) return;

    const ok = window.confirm(
      'Esto reemplazará la base local (rutina y entrenamientos) por el contenido del backup.\n\n¿Querés continuar?'
    );
    if (!ok) {
      input.value = '';
      return;
    }

    this.importing.set(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as GymTrackerDbDumpV1;
      await importDb(parsed);
      await Promise.all([this.routineStore.init(), this.workoutStore.init(), this.metricsStore.init()]);
      window.alert('Backup importado correctamente.');
    } catch (e) {
      console.error(e);
      window.alert('No se pudo importar el backup. Asegurate de subir un JSON válido de Gym Tracker.');
    } finally {
      this.importing.set(false);
      input.value = '';
    }
  }
}
