/** Generadores de identificadores del prototipo. En produccion los emite el backend. */

let counter = 0;

function rand(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const newEncounterId = () => `enc_${rand()}`;
export const newCaseId = () => `case_${rand()}`;
export const newEventId = () => `evt_${rand()}`;
export const newAuditId = () => `aud_${rand()}`;
export const newEvidenceId = () => `ide_${rand()}`;
export const newAlertId = () => `alr_${rand()}`;
export const newCorrelationId = () => `cor_${rand()}`;

/** RF-02: etiqueta legible para brazalete, sin colision aun sin conexion al ECE. */
export function newTemporaryId(siteCode: string, sequence: number): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${siteCode}-${ymd}-${String(sequence).padStart(3, "0")}`;
}

/** CA-11: misma accion logica => misma llave, no se duplica. */
export function idempotencyKey(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("|");
}
