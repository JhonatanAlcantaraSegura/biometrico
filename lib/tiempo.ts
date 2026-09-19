/**
 * Utilidades de tiempo. RF-01/RF-04/RF-21: se guarda hora de ocurrencia y hora de
 * captura por separado, siempre en UTC; la UI muestra hora local de la sede.
 */
import type { ISODateTime } from "@/lib/datos/tipos";

export function nowIso(): ISODateTime {
  return new Date().toISOString();
}

export function minutesBetween(from: ISODateTime, to: ISODateTime = nowIso()): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / 60000;
}

/** mm:ss transcurridos desde `from`. Para relojes clinicos visibles. */
export function elapsedLabel(from: ISODateTime, to: ISODateTime = nowIso()): string {
  const totalSeconds = Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function localTime(iso?: ISODateTime): string {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export function localDateTime(iso?: ISODateTime): string {
  if (!iso) return "sin dato";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** RF-21: semaforo de meta sin cambiar el plan clinico, solo avisa. */
export type ClockStatus = "en_meta" | "por_vencer" | "vencido" | "cumplido";

export function clockStatus(startedAt: ISODateTime, goalMinutes: number, completedAt?: ISODateTime): ClockStatus {
  if (completedAt) return "cumplido";
  const elapsed = minutesBetween(startedAt);
  if (elapsed >= goalMinutes) return "vencido";
  if (elapsed >= goalMinutes * 0.7) return "por_vencer";
  return "en_meta";
}
