/**
 * Contrato de evento comun - ERS seccion 7.
 * Toda escritura debe tolerar reintentos sin duplicar casos, notas ni alertas (RF-15, CA-11).
 */
import type { ISODateTime, Rol } from "./tipos";

export const EVENT_SCHEMA_VERSION = "1.0.0";

export type EventType =
  | "encounter.created"
  | "encounter.state_changed"
  | "triage.recorded"
  | "ecg.milestone"
  | "identity.attempted"
  | "identity.resolved"
  | "identity.binding_corrected"
  | "ehr.snapshot_read"
  | "ehr.write_queued"
  | "ehr.write_synced"
  | "diagnosis.recorded"
  | "code.activated"
  | "code.cancelled"
  | "alert.sent"
  | "alert.acknowledged"
  | "alert.escalated"
  | "resource.decided"
  | "route.selected"
  | "reperfusion.milestone"
  | "break_glass.used";

export interface DomainEvent<P = Record<string, unknown>> {
  event_id: string;
  schema_version: string;
  encounter_id: string;
  patient_id?: string;
  site_id: string;
  event_type: EventType;
  occurred_at: ISODateTime;
  recorded_at: ISODateTime;
  actor_id: string;
  actor_role: Rol;
  source_system: string;
  correlation_id: string;
  idempotency_key: string;
  payload: P;
}

/** Estado de sincronizacion hacia el ECE - RF-15. */
export type SyncState = "pendiente" | "sincronizado" | "fallido";

export interface OutboxItem {
  idempotency_key: string;
  event: DomainEvent;
  sync_state: SyncState;
  attempts: number;
  last_error?: string;
  queued_at: ISODateTime;
  synced_at?: ISODateTime;
}
