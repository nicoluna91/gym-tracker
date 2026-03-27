export type MuscleGroup = 'pecho' | 'espalda' | 'piernas' | 'hombros' | 'biceps' | 'triceps';

export interface Exercise {
  id: string;
  nombre: string;
  musculo: MuscleGroup;
  imagen: string;
}
