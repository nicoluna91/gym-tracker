import { MuscleGroup } from './exercise.model';

export type Weekday =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface RoutineDay {
  day: Weekday;
  muscle: MuscleGroup;
  muscles?: MuscleGroup[];
  exerciseIds: string[];
}

export interface WeeklyRoutine {
  id: string;
  days: RoutineDay[];
  createdAt: number;
  updatedAt: number;
}
