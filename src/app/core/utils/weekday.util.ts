import { Weekday } from '../../models/routine.model';

export function weekdayFromDate(date: Date): Weekday {
  const day = date.getDay();

  switch (day) {
    case 0:
      return 'domingo';
    case 1:
      return 'lunes';
    case 2:
      return 'martes';
    case 3:
      return 'miercoles';
    case 4:
      return 'jueves';
    case 5:
      return 'viernes';
    case 6:
      return 'sabado';
    default:
      return 'lunes';
  }
}
