/**
 * Datos SINTETICOS del prototipo. Ninguna persona real, ningun dato clinico real.
 * Los escenarios reproducen los casos de aceptacion CA-01 a CA-17 de la ERS.
 */
import type {
  AlertDelivery,
  AuditEvent,
  ClinicalSnapshot,
  Encounter,
  IdentityEvidence,
  InfarctCase,
  LegalBasisRecord,
  Patient,
  PatientBinding,
  ResourceResponse,
  User,
} from "@/lib/datos/tipos";
import type { OutboxItem } from "@/lib/datos/eventos";
import { INSTITUCION } from "@/lib/datos/institucion";

/**
 * La sede sale de `lib/datos/institucion.ts`: un nombre de hospital duplicado en dos
 * archivos es un nombre que un dia aparece distinto en dos capturas de pantalla.
 */
export const SITE_ID = INSTITUCION.sedeId;
export const SITE_CODE = INSTITUCION.sedeCodigo;

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const USERS: User[] = [
  { user_id: "u_recep", name: "M. Salgado", role: "recepcion_triage", site_id: SITE_ID },
  { user_id: "u_enf", name: "R. Duarte", role: "enfermeria", site_id: SITE_ID },
  { user_id: "u_med", name: "Dra. C. Ibarra", role: "medico_urgencias", site_id: SITE_ID },
  { user_id: "u_hemo", name: "Dr. J. Peralta", role: "cardiologia_hemodinamia", site_id: SITE_ID },
  { user_id: "u_tras", name: "L. Mendez", role: "traslados", site_id: SITE_ID },
  { user_id: "u_adm", name: "P. Vargas", role: "admision_identidad", site_id: SITE_ID },
  { user_id: "u_cal", name: "S. Rojas", role: "calidad", site_id: SITE_ID },
  { user_id: "u_tec", name: "A. Lugo", role: "admin_tecnico", site_id: SITE_ID },
];

export const PATIENTS: Patient[] = [
  {
    patient_id: "pat_001",
    display_name: "GARCIA LOPEZ, JUAN",
    birth_date: "1962-04-18",
    status: "activo",
    external_ids: [
      { namespace: "ISSSTE.NSS", value: "SINT-00010", source: "indice_maestro", recorded_at: minutesAgo(200000) },
    ],
    merge_history: [],
  },
  {
    patient_id: "pat_002",
    display_name: "GARCIA LOPEZ, JUANA",
    birth_date: "1965-09-02",
    status: "activo",
    external_ids: [
      { namespace: "ISSSTE.NSS", value: "SINT-00011", source: "indice_maestro", recorded_at: minutesAgo(190000) },
    ],
    merge_history: [],
  },
  {
    patient_id: "pat_003",
    display_name: "ROMERO SILVA, ALICIA",
    birth_date: "1958-01-30",
    status: "activo",
    external_ids: [
      { namespace: "ISSSTE.NSS", value: "SINT-00012", source: "indice_maestro", recorded_at: minutesAgo(150000) },
    ],
    merge_history: [],
  },
];

/** RF-06: vinculo previo validado y reutilizable. Nunca un nullifier efimero. */
export const BINDINGS: PatientBinding[] = [
  {
    binding_id: "bind_001",
    patient_id: "pat_003",
    provider: "world_id (simulado)",
    account_ref: "acct_ref_sintetica_003",
    validation_method: "prerregistro presencial con doble revision",
    valid_from: minutesAgo(80000),
    approvers: ["u_adm", "u_tec"],
  },
];

export const ENCOUNTERS: Encounter[] = [
  // CA-01: sospecha sin identificacion. Triage y ECG avanzan igual.
  {
    encounter_id: "enc_ca01",
    temporary_id: SITE_CODE + "-TMP-001",
    site_id: SITE_ID,
    arrival_at: minutesAgo(6),
    arrival_source: "demanda_espontanea",
    clinical_state: "evaluacion_ecg",
    identity_state: "provisional",
    conscious: true,
    created_by: "u_recep",
    triage: {
      at: minutesAgo(5),
      priority: "rojo",
      alarm_symptoms: ["dolor toracico opresivo", "diaforesis"],
      recorded_by: "u_recep",
    },
  },
  // CA-04: paciente inconsciente. Nunca se intenta World ID.
  {
    encounter_id: "enc_ca04",
    temporary_id: SITE_CODE + "-TMP-002",
    site_id: SITE_ID,
    arrival_at: minutesAgo(23),
    arrival_source: "ambulancia",
    clinical_state: "codigo_activo",
    identity_state: "provisional",
    conscious: false,
    created_by: "u_recep",
    triage: {
      at: minutesAgo(22),
      priority: "rojo",
      alarm_symptoms: ["inconsciente", "hipotension"],
      recorded_by: "u_enf",
    },
  },
  // CA-02: paciente consciente ya vinculado. Identidad confirmada.
  {
    encounter_id: "enc_ca02",
    temporary_id: SITE_CODE + "-TMP-003",
    patient_id: "pat_003",
    site_id: SITE_ID,
    arrival_at: minutesAgo(41),
    arrival_source: "demanda_espontanea",
    clinical_state: "tratamiento_traslado",
    identity_state: "confirmada",
    conscious: true,
    created_by: "u_recep",
    triage: {
      at: minutesAgo(40),
      priority: "rojo",
      alarm_symptoms: ["dolor toracico", "disnea"],
      recorded_by: "u_recep",
    },
  },
  // CA-05: dos candidatos homonimos. Identidad en conflicto, sin apertura automatica.
  {
    encounter_id: "enc_ca05",
    temporary_id: SITE_CODE + "-TMP-004",
    site_id: SITE_ID,
    arrival_at: minutesAgo(14),
    arrival_source: "referencia",
    clinical_state: "diagnostico_confirmado",
    identity_state: "en_conflicto",
    conscious: false,
    created_by: "u_recep",
    triage: {
      at: minutesAgo(13),
      priority: "naranja",
      alarm_symptoms: ["dolor toracico atipico"],
      recorded_by: "u_enf",
    },
  },
];

export const CASES: InfarctCase[] = [
  {
    case_id: "case_ca01",
    encounter_id: "enc_ca01",
    suspicion_at: minutesAgo(6),
    code_state: "no_activado",
    route: "no_definida",
    milestones: [
      { type: "ecg_solicitado", occurred_at: minutesAgo(5), recorded_at: minutesAgo(5), actor_id: "u_enf", source: "manual", status: "realizado" },
      { type: "ecg_adquirido", source: "manual", status: "no_documentado" },
      { type: "ecg_entregado", source: "manual", status: "no_documentado" },
      { type: "ecg_interpretado", source: "manual", status: "no_documentado" },
    ],
  },
  {
    case_id: "case_ca04",
    encounter_id: "enc_ca04",
    suspicion_at: minutesAgo(23),
    ecg_interpretation: "Elevacion del ST en cara inferior (DII, DIII, aVF).",
    diagnosis: "IAM CEST inferior",
    diagnosis_at: minutesAgo(16),
    activated_at: minutesAgo(15),
    activated_by: "u_med",
    code_state: "activo",
    route: "pci_primaria",
    route_decided_at: minutesAgo(14),
    responsible_physician: "u_med",
    milestones: [
      { type: "ecg_solicitado", occurred_at: minutesAgo(22), recorded_at: minutesAgo(22), actor_id: "u_enf", source: "manual", status: "realizado" },
      { type: "ecg_adquirido", occurred_at: minutesAgo(20), recorded_at: minutesAgo(19), actor_id: "u_enf", source: "interfaz", status: "realizado" },
      { type: "ecg_entregado", occurred_at: minutesAgo(19), recorded_at: minutesAgo(18), actor_id: "u_enf", source: "manual", status: "realizado" },
      { type: "ecg_interpretado", occurred_at: minutesAgo(17), recorded_at: minutesAgo(16), actor_id: "u_med", source: "manual", status: "realizado" },
      { type: "orden_reperfusion", occurred_at: minutesAgo(13), recorded_at: minutesAgo(13), actor_id: "u_med", source: "manual", status: "realizado" },
      { type: "inicio_procedimiento", source: "manual", status: "no_documentado" },
      { type: "reperfusion", source: "manual", status: "no_documentado" },
    ],
  },
  {
    case_id: "case_ca02",
    encounter_id: "enc_ca02",
    suspicion_at: minutesAgo(41),
    ecg_interpretation: "Elevacion del ST anterior extenso.",
    diagnosis: "IAM CEST anterior",
    diagnosis_at: minutesAgo(33),
    activated_at: minutesAgo(32),
    activated_by: "u_med",
    code_state: "activo",
    route: "traslado",
    route_decided_at: minutesAgo(25),
    responsible_physician: "u_med",
    milestones: [
      { type: "ecg_solicitado", occurred_at: minutesAgo(39), recorded_at: minutesAgo(39), actor_id: "u_enf", source: "manual", status: "realizado" },
      { type: "ecg_adquirido", occurred_at: minutesAgo(36), recorded_at: minutesAgo(35), actor_id: "u_enf", source: "interfaz", status: "realizado" },
      { type: "ecg_interpretado", occurred_at: minutesAgo(34), recorded_at: minutesAgo(33), actor_id: "u_med", source: "manual", status: "realizado" },
      { type: "orden_reperfusion", occurred_at: minutesAgo(24), recorded_at: minutesAgo(24), actor_id: "u_med", source: "manual", status: "realizado" },
      { type: "salida_traslado", occurred_at: minutesAgo(12), recorded_at: minutesAgo(11), actor_id: "u_tras", source: "manual", status: "realizado" },
      { type: "llegada_destino", source: "manual", status: "no_documentado" },
      { type: "reperfusion", source: "manual", status: "no_documentado" },
    ],
  },
  {
    case_id: "case_ca05",
    encounter_id: "enc_ca05",
    suspicion_at: minutesAgo(14),
    ecg_interpretation: "Sin elevacion del ST; T negativas en V4-V6.",
    diagnosis: "Sindrome coronario agudo sin elevacion del ST",
    diagnosis_at: minutesAgo(7),
    code_state: "no_activado",
    route: "no_definida",
    responsible_physician: "u_med",
    milestones: [
      { type: "ecg_solicitado", occurred_at: minutesAgo(13), recorded_at: minutesAgo(13), actor_id: "u_enf", source: "manual", status: "realizado" },
      { type: "ecg_adquirido", occurred_at: minutesAgo(11), recorded_at: minutesAgo(10), actor_id: "u_enf", source: "interfaz", status: "realizado" },
      { type: "ecg_interpretado", occurred_at: minutesAgo(8), recorded_at: minutesAgo(7), actor_id: "u_med", source: "manual", status: "realizado" },
    ],
  },
];

export const EVIDENCE: IdentityEvidence[] = [
  {
    evidence_id: "ide_ca02",
    encounter_id: "enc_ca02",
    provider: "world_id (simulado)",
    method: "world_id",
    result: "confirmado",
    confidence: 1,
    at: minutesAgo(38),
    operator_id: "u_adm",
    algorithm_version: "sim-1.0",
    pseudonymous_ref: "acct_ref_sintetica_003",
    candidates: [{ patient_id: "pat_003", masked_name: "ROMERO S., A.", birth_year: "1958" }],
    note: "Prueba iniciada por la paciente desde su aplicacion y verificada contra un vinculo previo vigente.",
  },
  {
    evidence_id: "ide_ca05",
    encounter_id: "enc_ca05",
    provider: "motor_1n (simulado, proveedor no contratado)",
    method: "biometrico_1n",
    result: "coincidencias_multiples",
    confidence: 0.61,
    at: minutesAgo(12),
    operator_id: "u_adm",
    algorithm_version: "sim-0.9",
    candidates: [
      { patient_id: "pat_001", masked_name: "GARCIA L., JU**", birth_year: "1962", score: 0.63, differentiator: "sexo M / NSS ...010" },
      { patient_id: "pat_002", masked_name: "GARCIA L., JU**", birth_year: "1965", score: 0.59, differentiator: "sexo F / NSS ...011" },
    ],
    note: "Homonimos. Apertura automatica bloqueada; requiere conciliacion por personal autorizado (RF-10).",
  },
];

export const SNAPSHOTS: ClinicalSnapshot[] = [
  {
    snapshot_id: "snap_ca02",
    encounter_id: "enc_ca02",
    patient_id: "pat_003",
    read_at: minutesAgo(37),
    source_system: "ECE ISSSTE (simulado)",
    source_available: true,
    version: "v2026.03",
    allergies: [
      { label: "Penicilina", detail: "Exantema documentado", source: "ECE ISSSTE", recorded_at: minutesAgo(120000) },
    ],
    medications: [
      { label: "Metformina 850 mg", detail: "1 c/12 h", source: "ECE ISSSTE", recorded_at: minutesAgo(40000) },
      { label: "Losartan 50 mg", detail: "1 c/24 h", source: "ECE ISSSTE", recorded_at: minutesAgo(40000) },
    ],
    active_problems: [
      { label: "Diabetes mellitus tipo 2", source: "ECE ISSSTE", recorded_at: minutesAgo(130000) },
      { label: "Hipertension arterial", source: "ECE ISSSTE", recorded_at: minutesAgo(130000) },
    ],
    cardiovascular_history: [
      { label: "Angina estable", detail: "Valorada en consulta externa", source: "ECE ISSSTE", recorded_at: minutesAgo(60000) },
    ],
    procedures: [],
    alerts: [{ label: "Anticoagulacion previa: no", source: "ECE ISSSTE", recorded_at: minutesAgo(40000) }],
  },
];

export const ALERTS: AlertDelivery[] = [
  { alert_id: "alr_1", case_id: "case_ca04", recipient_role: "cardiologia_hemodinamia", recipient_label: "Hemodinamia guardia", channel: "push", sent_at: minutesAgo(15), acknowledged_at: minutesAgo(14), retries: 0 },
  { alert_id: "alr_2", case_id: "case_ca04", recipient_role: "enfermeria", recipient_label: "Enfermeria urgencias", channel: "tablero", sent_at: minutesAgo(15), acknowledged_at: minutesAgo(15), retries: 0 },
  { alert_id: "alr_3", case_id: "case_ca04", recipient_role: "traslados", recipient_label: "Camilleria", channel: "radio", sent_at: minutesAgo(15), retries: 2, escalated_at: minutesAgo(11), failure: "sin acuse tras 2 reintentos" },
  { alert_id: "alr_4", case_id: "case_ca02", recipient_role: "cardiologia_hemodinamia", recipient_label: "Hemodinamia guardia", channel: "push", sent_at: minutesAgo(32), acknowledged_at: minutesAgo(31), retries: 0 },
  { alert_id: "alr_5", case_id: "case_ca02", recipient_role: "traslados", recipient_label: "Ambulancia 04", channel: "sms", sent_at: minutesAgo(26), acknowledged_at: minutesAgo(25), retries: 1 },
];

export const RESOURCES: ResourceResponse[] = [
  { resource_id: "res_1", case_id: "case_ca04", kind: "sala_hemodinamia", label: "Sala 1", decision: "aceptado", decided_at: minutesAgo(13) },
  { resource_id: "res_2", case_id: "case_ca02", kind: "sala_hemodinamia", label: "Sala 1", decision: "rechazado", decided_at: minutesAgo(28), reason: "Sala ocupada, sin ventana en 60 min" },
  { resource_id: "res_3", case_id: "case_ca02", kind: "ambulancia", label: "Ambulancia 04", decision: "aceptado", decided_at: minutesAgo(26) },
];

export const LEGAL: LegalBasisRecord[] = [
  { record_id: "leg_1", encounter_id: "enc_ca02", kind: "consentimiento", version: "aviso-2026.1", purpose: "Vinculacion voluntaria y consulta del expediente", at: minutesAgo(38), responsible: "u_adm" },
  { record_id: "leg_2", encounter_id: "enc_ca04", kind: "excepcion_legal", version: "urgencia-2026.1", purpose: "Atencion de urgencia sin capacidad de consentir", at: minutesAgo(22), responsible: "u_med" },
];

export const AUDIT: AuditEvent[] = [
  { audit_id: "aud_1", actor_id: "u_recep", actor_role: "recepcion_triage", action: "encounter.created", resource: "enc_ca04", outcome: "exito", at: minutesAgo(23), site_id: SITE_ID, correlation_id: "cor_seed_4" },
  { audit_id: "aud_2", actor_id: "u_adm", actor_role: "admision_identidad", action: "identity.attempted", resource: "enc_ca05", outcome: "fallo", reason: "coincidencias_multiples", at: minutesAgo(12), site_id: SITE_ID, correlation_id: "cor_seed_5" },
  { audit_id: "aud_3", actor_id: "u_med", actor_role: "medico_urgencias", action: "break_glass.used", resource: "enc_ca05", outcome: "exito", reason: "Urgencia con identidad no confirmada", at: minutesAgo(9), site_id: SITE_ID, correlation_id: "cor_seed_5", break_glass: true },
];

/** RF-15: escrituras al ECE encoladas con llave idempotente cuando la integracion falla. */
export const OUTBOX: OutboxItem[] = [
  {
    idempotency_key: "enc_ca05|diagnosis.recorded|1",
    queued_at: minutesAgo(7),
    sync_state: "pendiente",
    attempts: 3,
    last_error: "ECE no disponible (timeout 2s)",
    event: {
      event_id: "evt_seed_1",
      schema_version: "1.0.0",
      encounter_id: "enc_ca05",
      site_id: SITE_ID,
      event_type: "diagnosis.recorded",
      occurred_at: minutesAgo(7),
      recorded_at: minutesAgo(7),
      actor_id: "u_med",
      actor_role: "medico_urgencias",
      source_system: "prototipo-urgencias",
      correlation_id: "cor_seed_5",
      idempotency_key: "enc_ca05|diagnosis.recorded|1",
      payload: { diagnosis: "SICA SEST" },
    },
  },
];
