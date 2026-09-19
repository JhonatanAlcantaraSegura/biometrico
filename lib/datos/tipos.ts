/**
 * Modelo minimo de datos - ERS seccion 6.
 * El prototipo NO persiste biometricos crudos ni plantillas (regla de privacidad 5).
 * Toda marca de tiempo se guarda en ISO-8601 UTC; la UI la presenta en hora local.
 */

export type ISODateTime = string;

/** Estado clinico del episodio - ERS seccion 3 ("Estados independientes"). */
export type EncounterState =
  | "llegada"
  | "triage"
  | "evaluacion_ecg"
  | "diagnostico_confirmado"
  | "diagnostico_descartado"
  | "codigo_activo"
  | "tratamiento_traslado"
  | "cierre";

/** Estado de identidad. Cambia por separado y NO detiene ninguna transicion clinica. */
export type IdentityState = "provisional" | "confirmada" | "en_conflicto";

/** Resultado de un intento de resolucion de identidad - RF-05, RF-10. */
export type IdentityResult =
  | "confirmado"
  | "provisional"
  | "sin_coincidencia"
  | "coincidencias_multiples"
  | "baja_confianza"
  | "proveedor_no_disponible";

export type IdentityMethod =
  | "identificador_hospitalario"
  | "documento"
  | "busqueda_supervisada"
  | "biometrico_1n"
  | "world_id";

export type TriagePriority = "rojo" | "naranja" | "amarillo" | "verde";

export type ReperfusionRoute = "pci_primaria" | "fibrinolisis" | "traslado" | "otra" | "no_definida";

export type CodeState = "no_activado" | "activo" | "cancelado" | "cerrado";

export type Rol =
  | "recepcion_triage"
  | "enfermeria"
  | "medico_urgencias"
  | "cardiologia_hemodinamia"
  | "traslados"
  | "admision_identidad"
  | "calidad"
  | "admin_tecnico";

/** Indice maestro de pacientes - RF-11. */
export interface Patient {
  patient_id: string;
  display_name: string;
  birth_date?: string;
  external_ids: ExternalId[];
  status: "activo" | "fusionado" | "inactivo";
  merge_history: MergeRecord[];
}

export interface ExternalId {
  namespace: string; // p.ej. "ISSSTE.NSS", "CURP", "HRLAM.NE"
  value: string;
  source: string;
  recorded_at: ISODateTime;
}

export interface MergeRecord {
  at: ISODateTime;
  action: "fusion" | "separacion";
  from_patient_id: string;
  into_patient_id: string;
  reason: string;
  approved_by: string[];
}

/** Episodio de urgencias - RF-02. */
export interface Encounter {
  encounter_id: string;
  temporary_id: string; // brazalete/etiqueta legible
  patient_id?: string; // solo cuando la identidad esta confirmada
  site_id: string;
  arrival_at: ISODateTime; // RF-01, no editable sin motivo auditado
  arrival_source: "ambulancia" | "demanda_espontanea" | "referencia" | "intrahospitalario";
  discharge_at?: ISODateTime;
  clinical_state: EncounterState;
  identity_state: IdentityState;
  triage?: TriageRecord;
  conscious: boolean;
  created_by: string;
}

export interface TriageRecord {
  at: ISODateTime;
  priority: TriagePriority;
  alarm_symptoms: string[];
  notes?: string;
  recorded_by: string;
}

/** Evidencia de identidad - RF-05. Sin plantilla cruda en la aplicacion. */
export interface IdentityEvidence {
  evidence_id: string;
  encounter_id: string;
  provider: string;
  method: IdentityMethod;
  result: IdentityResult;
  confidence?: number; // 0..1, informativo; no sustituye supervision humana
  at: ISODateTime;
  operator_id: string;
  algorithm_version?: string;
  pseudonymous_ref?: string; // referencia seudonima, nunca biometrico crudo
  expires_at?: ISODateTime;
  candidates: IdentityCandidate[];
  note?: string;
}

/** Candidato mostrado con informacion MINIMA para conciliacion - RF-10. */
export interface IdentityCandidate {
  patient_id: string;
  masked_name: string;
  birth_year?: string;
  score?: number;
  differentiator?: string; // dato minimo que permite distinguir homonimos
}

/** Vinculo previo validado - RF-06, RF-07. Nunca un nullifier efimero. */
export interface PatientBinding {
  binding_id: string;
  patient_id: string;
  provider: string;
  account_ref: string; // referencia reutilizable soportada por el proveedor
  validation_method: string;
  valid_from: ISODateTime;
  valid_until?: ISODateTime;
  revoked_at?: ISODateTime;
  approvers: string[];
}

/** Resumen leido del ECE - RF-13, RF-14. Campos vacios = "sin datos disponibles". */
export interface ClinicalSnapshot {
  snapshot_id: string;
  encounter_id: string;
  patient_id: string;
  read_at: ISODateTime;
  source_system: string;
  source_available: boolean;
  version?: string;
  allergies: ClinicalItem[];
  medications: ClinicalItem[];
  active_problems: ClinicalItem[];
  cardiovascular_history: ClinicalItem[];
  procedures: ClinicalItem[];
  alerts: ClinicalItem[];
  stale_warning?: string;
}

export interface ClinicalItem {
  label: string;
  detail?: string;
  source: string;
  recorded_at: ISODateTime;
}

/** Caso de Codigo Infarto - RF-16, RF-17, RF-20. */
export interface InfarctCase {
  case_id: string;
  encounter_id: string;
  suspicion_at: ISODateTime;
  ecg_interpretation?: string;
  diagnosis?: string;
  diagnosis_at?: ISODateTime; // hora cero clinica
  activated_at?: ISODateTime;
  activated_by?: string;
  code_state: CodeState;
  route: ReperfusionRoute;
  route_decided_at?: ISODateTime;
  cancel_reason?: string;
  responsible_physician?: string;
  milestones: CaseMilestone[];
}

export interface CaseMilestone {
  type:
    | "ecg_solicitado"
    | "ecg_adquirido"
    | "ecg_entregado"
    | "ecg_interpretado"
    | "orden_reperfusion"
    | "inicio_procedimiento"
    | "salida_traslado"
    | "llegada_destino"
    | "reperfusion";
  occurred_at?: ISODateTime;
  recorded_at?: ISODateTime;
  actor_id?: string;
  source: "manual" | "interfaz";
  /** RF-04: distingue "no realizado" de "no documentado". */
  status: "realizado" | "no_realizado" | "no_documentado";
}

/** Entrega de alerta - RF-18. Datos minimos en canales externos. */
export interface AlertDelivery {
  alert_id: string;
  case_id: string;
  recipient_role: Rol;
  recipient_label: string;
  channel: "push" | "sms" | "radio" | "tablero" | "correo";
  sent_at: ISODateTime;
  acknowledged_at?: ISODateTime;
  retries: number;
  escalated_at?: ISODateTime;
  failure?: string;
}

/** Disponibilidad de recurso - RF-19. */
export interface ResourceResponse {
  resource_id: string;
  case_id: string;
  kind: "sala_hemodinamia" | "equipo" | "ambulancia";
  label: string;
  decision: "pendiente" | "aceptado" | "rechazado";
  decided_at?: ISODateTime;
  reason?: string;
}

/** Base juridica - RF-24. */
export interface LegalBasisRecord {
  record_id: string;
  encounter_id: string;
  kind: "aviso" | "consentimiento" | "excepcion_legal";
  version: string;
  purpose: string;
  at: ISODateTime;
  responsible: string;
}

/** Bitacora solo anexable - RF-23, RF-35. */
export interface AuditEvent {
  audit_id: string;
  actor_id: string;
  actor_role: Rol;
  action: string;
  resource: string;
  outcome: "exito" | "fallo" | "denegado";
  reason?: string;
  at: ISODateTime;
  site_id: string;
  correlation_id: string;
  break_glass?: boolean;
}

export interface User {
  user_id: string;
  name: string;
  role: Rol;
  site_id: string;
}
