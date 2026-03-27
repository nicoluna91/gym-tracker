export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Fecha ISO (UTC) YYYY-MM-DD: consistente con `todayISO()` y lo guardado en DB. */
export function dateToUtcYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Meta del DatePicker (month 0–11) → ISO (UTC) YYYY-MM-DD. */
export function dateMetaToUtcYmd(meta: { year: number; month: number; day: number }): string {
  return new Date(meta.year, meta.month, meta.day).toISOString().slice(0, 10);
}

/** Fecha local YYYY-MM-DD (alineada al calendario del usuario). */
export function dateToLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Meta de día del DatePicker de PrimeNG (month 0–11). */
export function dateMetaToLocalYmd(meta: { year: number; month: number; day: number }): string {
  const y = meta.year;
  const m = String(meta.month + 1).padStart(2, '0');
  const day = String(meta.day).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Nota: evitamos mezclar claves local/UTC en UI para no “mover” sesiones de un día a otro.
