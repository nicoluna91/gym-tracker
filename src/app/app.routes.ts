import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'semana',
        loadComponent: () => import('./features/week/week.page').then((m) => m.WeekPage)
      },
      {
        path: 'rutina',
        loadComponent: () => import('./features/routine/routine.page').then((m) => m.RoutinePage)
      },
      {
        path: 'rutina/dia/:day',
        loadComponent: () => import('./features/routine/routine-day.page').then((m) => m.RoutineDayPage)
      },
      {
        path: 'entrenamiento',
        loadComponent: () => import('./features/workout/workout.page').then((m) => m.WorkoutPage)
      },
      {
        path: 'entrenamiento/:day',
        loadComponent: () => import('./features/workout/workout-day.page').then((m) => m.WorkoutDayPage)
      },
      {
        path: 'metricas',
        loadComponent: () => import('./features/metrics/metrics.page').then((m) => m.MetricsPage)
      },
      {
        path: 'calendario',
        loadComponent: () => import('./features/calendar/calendar.page').then((m) => m.CalendarPage)
      }
    ]
  }
];
