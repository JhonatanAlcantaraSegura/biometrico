"use client";

/**
 * Store en memoria del prototipo (sin backend, sin red).
 * Sustituir por el gateway real cuando existan los contratos de la seccion 7 de la ERS:
 * cada accion de aqui corresponde a una operacion publicada en docs/03-ARQUITECTURA.md.
 */
import { useSyncExternalStore } from "react";
import type { OutboxItem } from "@/lib/datos/eventos";
import { EVENT_SCHEMA_VERSION } from "@/lib/datos/eventos";
import type { EventType } from "@/lib/datos/eventos";
import type {
  AlertDelivery,
  AuditEvent,
  ClinicalSnapshot,
  Encounter,
  IdentityCandidate,
  IdentityEvidence,
  IdentityMethod,
  IdentityResult,
  InfarctCase,
  LegalBasisRecord,
  Patient,
  PatientBinding,
  ReperfusionRoute,
  ResourceResponse,
  Rol,
  TriagePriority,
  User,
} from "@/lib/datos/tipos";
import {
  idempotencyKey,
  newAlertId,
  newAuditId,
  newCaseId,
  newCorrelationId,
  newEncounterId,
  newEventId,
  newEvidenceId,
  newTemporaryId,
} from "@/lib/ids";
import { nowIso } from "@/lib/tiempo";
import { CLAVE_SESION, borrar, escribir, leer } from "@/lib/estado/persistencia";
import {
  ALGORITMO_SIMULADO,
  PERFILES,
  PUNTOS_DE_CONTROL,
  UMBRALES_INICIALES,
  type EscenarioBiometrico,
  type EstadoDispositivo,
  type FalloCaptura,
  type MedicionBiometrica,
  type Modalidad,
  type PerfilModalidad,
  type PuntoDeControl,
  type UmbralesMotor,
} from "@/lib/datos/biometria";
import { capturar, puntajesDe, resolverCandidatos } from "@/lib/dominio/motor-biometrico";
import {
  ALERTS,
  AUDIT,
  BINDINGS,
  CASES,
  ENCOUNTERS,
  EVIDENCE,
  LEGAL,
  OUTBOX,
  PATIENTS,
  RESOURCES,
  SITE_CODE,
  SITE_ID,
  SNAPSHOTS,
  USERS,
} from "@/lib/datos/semilla";

/** RNF-01 / RNF-03 / CA-06 / CA-07: el estado de cada integracion se puede degradar a mano. */
export type IntegrationStatus = "ok" | "lento" | "caido";

export interface IntegrationHealth {
  ehr: IntegrationStatus;
  biometric: IntegrationStatus;
  worldId: IntegrationStatus;
  notifications: IntegrationStatus;
}

/**
 * Aviso efimero de la esquina inferior. El Shell los anuncia con `aria-live="polite"`
 * (WCAG 4.1.3): un mensaje que solo cambia de color no existe para quien no ve la pantalla.
 */
export interface Aviso {
  id: string;
  texto: string;
  tono: "exito" | "aviso" | "peligro" | "info";
}

export interface AppState {
  /**
   * `null` = sin sesion. La guarda de `app/(app)/layout.tsx` manda a `/acceso`.
   *
   * ESTO NO ES AUTENTICACION. Es un selector de perfil que hace visible la matriz de
   * permisos de `lib/datos/rutas.ts`; la garantia real vive en el servidor (RF-22), que
   * aqui no existe. Un login falso invita a confiar en controles que no hay.
   */
  currentUserId: string | null;
  avisos: Aviso[];
  users: User[];
  patients: Patient[];
  bindings: PatientBinding[];
  encounters: Encounter[];
  cases: InfarctCase[];
  evidence: IdentityEvidence[];
  snapshots: ClinicalSnapshot[];
  alerts: AlertDelivery[];
  resources: ResourceResponse[];
  legal: LegalBasisRecord[];
  audit: AuditEvent[];
  outbox: OutboxItem[];
  integrations: IntegrationHealth;
  /** Simulador biometrico: inventario, umbrales, perfiles y mediciones (RF-09, RF-31). */
  biometria: EstadoBiometrico;
  sequence: number;
}

/**
 * Porcion biometrica del estado.
 *
 * `escenario` es la condicion que se quiere ensayar; no es un ajuste de produccion. Existe
 * porque un piloto tiene que provocar a proposito los casos que en operacion aparecen solos
 * y a la peor hora: ambiguedad, falso positivo, captura mala, dispositivo caido.
 */
export interface EstadoBiometrico {
  puntos: PuntoDeControl[];
  umbrales: UmbralesMotor;
  perfiles: PerfilModalidad[];
  escenario: EscenarioBiometrico;
  mediciones: MedicionBiometrica[];
  /** Ultimo intento, para que la pantalla de identidad explique el resultado. */
  ultimoIntento?: IntentoBiometrico;
}

/** Lo que la pantalla necesita saber del ultimo intento, incluida la explicacion. */
export interface IntentoBiometrico {
  readonly medicion_id: string;
  readonly encounter_id: string;
  readonly punto_id: string;
  readonly modalidad: Modalidad;
  readonly escenario: EscenarioBiometrico;
  readonly resultado: IdentityResult;
  readonly motivo: string;
  readonly fallo?: FalloCaptura;
  readonly calidad: number;
  readonly captura_ms: number;
  readonly comparacion_ms?: number;
  readonly puntajeMaximo: number;
  readonly margen: number;
  /**
   * Cual era la persona correcta, si la habia. Un motor real NO entrega esto: se guarda
   * solo para que, despues de que el operador decida, la pantalla pueda enseñar si el
   * escenario era un acierto o un falso positivo. Nunca se usa para decidir.
   */
  readonly patient_id_correcto?: string;
}

function initialState(): AppState {
  return {
    currentUserId: null,
    avisos: [],
    users: USERS,
    patients: PATIENTS,
    bindings: BINDINGS,
    encounters: ENCOUNTERS,
    cases: CASES,
    evidence: EVIDENCE,
    snapshots: SNAPSHOTS,
    alerts: ALERTS,
    resources: RESOURCES,
    legal: LEGAL,
    audit: AUDIT,
    outbox: OUTBOX,
    integrations: { ehr: "ok", biometric: "ok", worldId: "ok", notifications: "ok" },
    biometria: {
      // Copias: el inventario y los perfiles se editan en pantalla, y mutar los arreglos
      // importados haria que "reiniciar demostracion" no reiniciara nada.
      puntos: PUNTOS_DE_CONTROL.map((p) => ({ ...p })),
      umbrales: { ...UMBRALES_INICIALES },
      perfiles: PERFILES.map((p) => ({ ...p })),
      escenario: "ambiguedad_homonimos",
      mediciones: [],
    },
    sequence: ENCOUNTERS.length,
  };
}

// --- observable minimo --------------------------------------------------------

let state: AppState | null = null;
const listeners = new Set<() => void>();

function getState(): AppState {
  if (!state) state = initialState();
  return state;
}

function setState(updater: (prev: AppState) => AppState): void {
  state = updater(getState());
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Durante SSR devolvemos null; la UI muestra un esqueleto hasta hidratar. */
const serverSnapshot = (): AppState | null => null;

export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getState, serverSnapshot);
}

/**
 * Reinicia el estado clinico pero CONSERVA la sesion: quien pulsa "reiniciar demostracion"
 * a media presentacion quiere los cuatro casos de nuevo, no volver a la pantalla de acceso.
 */
export function resetDemo(): void {
  const sesion = state?.currentUserId ?? null;
  state = { ...initialState(), currentUserId: sesion };
  listeners.forEach((l) => l());
}

// --- bitacora y cola ----------------------------------------------------------

/**
 * El actor de una accion. Sin sesion se cae al primer usuario de la semilla en vez de
 * lanzar: ninguna accion del prototipo debe romper una demostracion por un estado de
 * sesion a medio camino, y la guarda ya impide llegar aqui sin sesion.
 */
function actorOf(s: AppState): User {
  return s.users.find((u) => u.user_id === s.currentUserId) ?? s.users[0];
}

/** RF-23: toda accion relevante deja rastro; el registro es solo anexable. */
function appendAudit(
  s: AppState,
  input: { action: string; resource: string; outcome?: AuditEvent["outcome"]; reason?: string; breakGlass?: boolean },
): AuditEvent[] {
  const actor = actorOf(s);
  const event: AuditEvent = {
    audit_id: newAuditId(),
    actor_id: actor.user_id,
    actor_role: actor.role,
    action: input.action,
    resource: input.resource,
    outcome: input.outcome ?? "exito",
    reason: input.reason,
    at: nowIso(),
    site_id: SITE_ID,
    correlation_id: newCorrelationId(),
    break_glass: input.breakGlass,
  };
  return [event, ...s.audit];
}

/**
 * RF-15 / CA-11: encola el evento hacia el ECE con llave idempotente.
 * Si la llave ya existe no se duplica; si el ECE esta caido queda "pendiente".
 */
function enqueue(
  s: AppState,
  input: { encounterId: string; eventType: EventType; occurredAt: string; payload: Record<string, unknown> },
): OutboxItem[] {
  const key = idempotencyKey([input.encounterId, input.eventType, input.occurredAt]);
  if (s.outbox.some((o) => o.idempotency_key === key)) return s.outbox;

  const actor = actorOf(s);
  const encounter = s.encounters.find((e) => e.encounter_id === input.encounterId);
  const healthy = s.integrations.ehr === "ok";

  const item: OutboxItem = {
    idempotency_key: key,
    queued_at: nowIso(),
    sync_state: healthy ? "sincronizado" : "pendiente",
    attempts: healthy ? 1 : 0,
    last_error: healthy ? undefined : "ECE no disponible (simulado)",
    synced_at: healthy ? nowIso() : undefined,
    event: {
      event_id: newEventId(),
      schema_version: EVENT_SCHEMA_VERSION,
      encounter_id: input.encounterId,
      patient_id: encounter?.patient_id,
      site_id: SITE_ID,
      event_type: input.eventType,
      occurred_at: input.occurredAt,
      recorded_at: nowIso(),
      actor_id: actor.user_id,
      actor_role: actor.role,
      source_system: "prototipo-urgencias",
      correlation_id: newCorrelationId(),
      idempotency_key: key,
      payload: input.payload,
    },
  };
  return [item, ...s.outbox];
}

// --- acciones -----------------------------------------------------------------

export const actions = {
  /**
   * Entrar como un perfil. No hay contraseña, y la pantalla de acceso lo dice en voz alta.
   * La sesion se guarda en `localStorage` para que recargar no expulse a media demostracion
   * — es lo UNICO que se persiste; el estado clinico nunca (ver `persistencia.ts`).
   */
  iniciarSesion(userId: string) {
    setState((s) => ({
      ...s,
      currentUserId: userId,
      audit: appendAudit({ ...s, currentUserId: userId }, { action: "sesion.iniciada", resource: userId }),
    }));
    escribir(CLAVE_SESION, userId);
  },

  cerrarSesion() {
    setState((s) => ({
      ...s,
      currentUserId: null,
      avisos: [],
      audit: appendAudit(s, { action: "sesion.cerrada", resource: s.currentUserId ?? "sin-sesion" }),
    }));
    borrar(CLAVE_SESION);
  },

  /** Rehidrata la sesion despues del primer render. Nunca durante el render. */
  restaurarSesion(): string | null {
    const guardado = leer<string>(CLAVE_SESION);
    if (!guardado) return null;
    const existe = getState().users.some((u) => u.user_id === guardado);
    if (!existe) {
      borrar(CLAVE_SESION);
      return null;
    }
    setState((s) => ({ ...s, currentUserId: guardado }));
    return guardado;
  },

  setCurrentUser(userId: string) {
    setState((s) => ({ ...s, currentUserId: userId }));
    escribir(CLAVE_SESION, userId);
  },

  avisar(texto: string, tono: Aviso["tono"] = "info") {
    const id = newAuditId();
    setState((s) => ({ ...s, avisos: [...s.avisos, { id, texto, tono }] }));
  },

  descartarAviso(id: string) {
    setState((s) => ({ ...s, avisos: s.avisos.filter((a) => a.id !== id) }));
  },

  setIntegration(key: keyof IntegrationHealth, status: IntegrationStatus) {
    setState((s) => ({
      ...s,
      integrations: { ...s.integrations, [key]: status },
      audit: appendAudit(s, { action: "integration.toggled", resource: key, reason: status }),
    }));
  },

  /**
   * RF-01 + RF-02: una sola accion crea el episodio provisional con hora de llegada
   * y etiqueta legible. No exige nombre ni derechohabiencia.
   */
  createEncounter(input: {
    priority: TriagePriority;
    symptoms: string[];
    arrivalSource: Encounter["arrival_source"];
    conscious: boolean;
    notes?: string;
  }): string {
    const encounterId = newEncounterId();
    setState((s) => {
      const sequence = s.sequence + 1;
      const at = nowIso();
      const encounter: Encounter = {
        encounter_id: encounterId,
        temporary_id: newTemporaryId(SITE_CODE, sequence),
        site_id: SITE_ID,
        arrival_at: at,
        arrival_source: input.arrivalSource,
        clinical_state: "triage",
        identity_state: "provisional",
        conscious: input.conscious,
        created_by: actorOf(s).user_id,
        triage: {
          at,
          priority: input.priority,
          alarm_symptoms: input.symptoms,
          notes: input.notes,
          recorded_by: actorOf(s).user_id,
        },
      };
      const infarctCase: InfarctCase = {
        case_id: newCaseId(),
        encounter_id: encounterId,
        suspicion_at: at,
        code_state: "no_activado",
        route: "no_definida",
        milestones: [
          { type: "ecg_solicitado", occurred_at: at, recorded_at: at, actor_id: actorOf(s).user_id, source: "manual", status: "realizado" },
          { type: "ecg_adquirido", source: "manual", status: "no_documentado" },
          { type: "ecg_entregado", source: "manual", status: "no_documentado" },
          { type: "ecg_interpretado", source: "manual", status: "no_documentado" },
        ],
      };
      return {
        ...s,
        sequence,
        encounters: [encounter, ...s.encounters],
        cases: [infarctCase, ...s.cases],
        audit: appendAudit(s, { action: "encounter.created", resource: encounterId }),
        outbox: enqueue(s, {
          encounterId,
          eventType: "encounter.created",
          occurredAt: at,
          payload: { priority: input.priority, temporary_id: encounter.temporary_id },
        }),
      };
    });
    return encounterId;
  },

  /** RF-04: cada hito guarda hora de ocurrencia, hora de captura y responsable. */
  recordMilestone(caseId: string, type: InfarctCase["milestones"][number]["type"], status: "realizado" | "no_realizado") {
    setState((s) => {
      const at = nowIso();
      const target = s.cases.find((c) => c.case_id === caseId);
      if (!target) return s;
      return {
        ...s,
        cases: s.cases.map((c) =>
          c.case_id !== caseId
            ? c
            : {
                ...c,
                milestones: c.milestones.some((m) => m.type === type)
                  ? c.milestones.map((m) =>
                      m.type !== type
                        ? m
                        : { ...m, status, occurred_at: status === "realizado" ? at : undefined, recorded_at: at, actor_id: actorOf(s).user_id },
                    )
                  : [...c.milestones, { type, status, occurred_at: status === "realizado" ? at : undefined, recorded_at: at, actor_id: actorOf(s).user_id, source: "manual" }],
              },
        ),
        audit: appendAudit(s, { action: "ecg.milestone", resource: `${caseId}:${type}`, reason: status }),
        outbox: enqueue(s, { encounterId: target.encounter_id, eventType: "ecg.milestone", occurredAt: at, payload: { type, status } }),
      };
    });
  },

  /**
   * RF-05 / RF-10: intento de identificacion con estados explicitos.
   * Nunca abre un expediente por si solo; solo "confirmado" habilita la lectura del ECE.
   */
  attemptIdentity(encounterId: string, method: IdentityMethod): IdentityResult {
    let outcome: IdentityResult = "sin_coincidencia";
    setState((s) => {
      const encounter = s.encounters.find((e) => e.encounter_id === encounterId);
      if (!encounter) return s;

      const providerDown =
        (method === "world_id" && s.integrations.worldId === "caido") ||
        (method === "biometrico_1n" && s.integrations.biometric === "caido");

      let candidates: IdentityCandidate[] = [];
      let note = "";

      if (providerDown) {
        outcome = "proveedor_no_disponible";
        note = "Timeout del proveedor. La atencion continua con identificador temporal (CA-06).";
      } else if (method === "world_id" && !encounter.conscious) {
        // CA-04: jamas se intenta una prueba World ID sobre un paciente que no puede participar.
        outcome = "sin_coincidencia";
        note = "Paciente sin capacidad de participar: la prueba requiere su aplicacion y su autorizacion. No se intenta.";
      } else if (method === "world_id") {
        const binding = s.bindings.find(
          (b) => !b.revoked_at && s.patients.some((p) => p.patient_id === b.patient_id),
        );
        if (binding && encounter.encounter_id === "enc_ca02") {
          outcome = "confirmado";
          candidates = [{ patient_id: binding.patient_id, masked_name: "ROMERO S., A.", birth_year: "1958" }];
          note = "Prueba verificada en backend contra un vinculo previo vigente.";
        } else {
          // CA-03: prueba valida sin vinculo local.
          outcome = "sin_coincidencia";
          note = "Humano verificado, expediente no vinculado. No se abre ningun ECE (CA-03).";
        }
      } else if (method === "biometrico_1n") {
        // La biometria 1:N no se intenta desde aqui: tiene su propia accion
        // `capturarBiometria`, porque exige elegir punto de control y modalidad, y porque
        // la captura puede fallar antes de llegar al motor. Ver `motor-biometrico.ts`.
        outcome = "proveedor_no_disponible";
        note =
          "Use la captura biometrica: exige elegir punto de control y modalidad. Un boton de 'intentar' sin dispositivo ni modalidad esconde justo lo que hay que evaluar (RF-09, RF-31).";
      } else if (method === "identificador_hospitalario" || method === "documento") {
        outcome = "provisional";
        candidates = [{ patient_id: "pat_001", masked_name: "GARCIA L., JU**", birth_year: "1962", differentiator: "NSS ...010" }];
        note = "Coincidencia administrativa. Requiere corroboracion humana antes de confirmar (regla 4 de identidad).";
      } else {
        outcome = "baja_confianza";
        note = "Busqueda clinica supervisada sin corroboracion suficiente.";
      }

      const evidence: IdentityEvidence = {
        evidence_id: newEvidenceId(),
        encounter_id: encounterId,
        provider: method === "world_id" ? "world_id (simulado)" : method === "biometrico_1n" ? "motor_1n (simulado)" : "indice_maestro",
        method,
        result: outcome,
        confidence: candidates[0]?.score,
        at: nowIso(),
        operator_id: actorOf(s).user_id,
        algorithm_version: "sim-1.0",
        candidates,
        note,
      };

      // Los metodos de esta accion ya no producen `coincidencias_multiples`: la ambiguedad
      // solo puede venir de una busqueda 1:N, y esa vive en `capturarBiometria`.
      const identityState: Encounter["identity_state"] =
        outcome === "confirmado" ? "confirmada" : encounter.identity_state;

      return {
        ...s,
        evidence: [evidence, ...s.evidence],
        encounters: s.encounters.map((e) =>
          e.encounter_id !== encounterId
            ? e
            : {
                ...e,
                identity_state: identityState,
                patient_id: outcome === "confirmado" ? candidates[0]?.patient_id : e.patient_id,
              },
        ),
        audit: appendAudit(s, {
          action: "identity.attempted",
          resource: encounterId,
          outcome: outcome === "confirmado" ? "exito" : "fallo",
          reason: `${method}:${outcome}`,
        }),
      };
    });
    return outcome;
  },

  /* ------------------------------------------------ simulador biometrico */

  setEstadoDispositivo(puntoId: string, estado: EstadoDispositivo) {
    setState((s) => ({
      ...s,
      biometria: {
        ...s.biometria,
        puntos: s.biometria.puntos.map((p) => (p.punto_id !== puntoId ? p : { ...p, estado })),
      },
      audit: appendAudit(s, { action: "biometria.dispositivo", resource: puntoId, reason: estado }),
    }));
  },

  /** RF-31: la calibracion es un hecho con fecha y responsable, no una casilla. */
  calibrarDispositivo(puntoId: string) {
    setState((s) => ({
      ...s,
      biometria: {
        ...s.biometria,
        puntos: s.biometria.puntos.map((p) =>
          p.punto_id !== puntoId
            ? p
            : {
                ...p,
                calibrado_en: nowIso(),
                operador_id: actorOf(s).user_id,
                // Calibrar saca del estado "sin calibrar"; no arregla un equipo caido.
                estado: p.estado === "sin_calibrar" ? "en_linea" : p.estado,
              },
        ),
      },
      audit: appendAudit(s, { action: "biometria.calibracion", resource: puntoId }),
    }));
  },

  /**
   * RF-09: la politica de umbrales controla el riesgo de mostrar el expediente de otra
   * persona. Cada cambio queda auditado con el valor, porque es una decision del hospital.
   */
  setUmbral<K extends keyof UmbralesMotor>(clave: K, valor: UmbralesMotor[K]) {
    setState((s) => ({
      ...s,
      biometria: { ...s.biometria, umbrales: { ...s.biometria.umbrales, [clave]: valor } },
      audit: appendAudit(s, {
        action: "biometria.umbral",
        resource: String(clave),
        reason: String(valor),
      }),
    }));
  },

  /** RF-09: cada modalidad se habilita por separado, y solo si paso validacion. */
  habilitarModalidad(modalidad: Modalidad, habilitada: boolean) {
    setState((s) => ({
      ...s,
      biometria: {
        ...s.biometria,
        perfiles: s.biometria.perfiles.map((p) => (p.modalidad !== modalidad ? p : { ...p, habilitada })),
      },
      audit: appendAudit(s, {
        action: "biometria.modalidad",
        resource: modalidad,
        reason: habilitada ? "habilitada" : "deshabilitada",
      }),
    }));
  },

  setEscenario(escenario: EscenarioBiometrico) {
    setState((s) => ({ ...s, biometria: { ...s.biometria, escenario } }));
  },

  /**
   * RF-09 + RF-31 + RNF-02/RNF-10: un intento de identificacion biometrica completo.
   *
   * La cadena se ejecuta y se MIDE por etapas, y cada etapa puede terminar el intento:
   *
   *   dispositivo -> captura -> calidad -> prueba de vida -> comparacion 1:N -> umbrales
   *
   * Lo que este metodo NO hace, a proposito: abrir un expediente. El mejor resultado
   * posible es `provisional`, y de ahi solo sale una persona con `confirmIdentity` y un
   * motivo escrito (regla 4 de la seccion 5).
   */
  capturarBiometria(encounterId: string, puntoId: string, modalidad: Modalidad): IdentityResult {
    let outcome: IdentityResult = "proveedor_no_disponible";

    setState((s) => {
      const encounter = s.encounters.find((e) => e.encounter_id === encounterId);
      const punto = s.biometria.puntos.find((p) => p.punto_id === puntoId);
      const perfil = s.biometria.perfiles.find((p) => p.modalidad === modalidad);
      if (!encounter || !punto || !perfil) return s;

      const { umbrales, escenario } = s.biometria;
      const medicion_id = newEvidenceId();
      const at = nowIso();
      const operador = actorOf(s);

      // El conector caido es distinto de un dispositivo caido: el lector puede capturar y
      // no haber con quien comparar. Se distingue porque se arreglan en sitios distintos.
      if (s.integrations.biometric === "caido") {
        outcome = "proveedor_no_disponible";
        const medicion: MedicionBiometrica = {
          medicion_id,
          encounter_id: encounterId,
          punto_id: puntoId,
          modalidad,
          escenario,
          at,
          operador_id: operador.user_id,
          algoritmo: ALGORITMO_SIMULADO,
          captura_ms: 0,
          resultado: outcome,
          candidatos: 0,
          calidad: 0,
          fallo: "timeout",
        };
        return {
          ...s,
          biometria: {
            ...s.biometria,
            mediciones: [medicion, ...s.biometria.mediciones],
            ultimoIntento: {
              medicion_id,
              encounter_id: encounterId,
              punto_id: puntoId,
              modalidad,
              escenario,
              resultado: outcome,
              motivo:
                "El motor del proveedor no responde. La captura no se intenta y la atencion continua con identificador temporal (CA-06).",
              fallo: "timeout",
              calidad: 0,
              captura_ms: 0,
              puntajeMaximo: 0,
              margen: 0,
            },
          },
          audit: appendAudit(s, {
            action: "biometria.intento",
            resource: encounterId,
            outcome: "fallo",
            reason: `${modalidad}@${puntoId}:proveedor_no_disponible`,
          }),
        };
      }

      const cap = capturar(punto, modalidad, perfil, umbrales, escenario);

      let comparacion: ReturnType<typeof resolverCandidatos> | undefined;
      let patient_id_correcto: string | undefined;

      if (cap.ok) {
        const crudos = puntajesDe(escenario, modalidad);
        comparacion = resolverCandidatos(crudos, umbrales, perfil, punto.estado);
        patient_id_correcto = crudos.find((c) => c.esLaPersonaCorrecta)?.entrada.patient_id;
        outcome = comparacion.resultado;
      } else {
        // Un fallo de captura NO es "sin coincidencia": no se comparo nada. Confundirlos
        // haria creer que la persona no esta enrolada cuando el problema fue el lector.
        outcome = "proveedor_no_disponible";
      }

      const medicion: MedicionBiometrica = {
        medicion_id,
        encounter_id: encounterId,
        punto_id: puntoId,
        modalidad,
        escenario,
        at,
        operador_id: operador.user_id,
        algoritmo: ALGORITMO_SIMULADO,
        captura_ms: cap.captura_ms,
        comparacion_ms: comparacion?.comparacion_ms,
        resultado: outcome,
        candidatos: comparacion?.candidatos.length ?? 0,
        calidad: cap.calidad,
        fallo: cap.fallo,
      };

      const evidence: IdentityEvidence = {
        evidence_id: newEvidenceId(),
        encounter_id: encounterId,
        provider: `motor_1n simulado · ${punto.nombre} · ${modalidad}`,
        method: "biometrico_1n",
        result: outcome,
        confidence: comparacion?.puntajeMaximo,
        at,
        operator_id: operador.user_id,
        algorithm_version: ALGORITMO_SIMULADO,
        // Sin plantilla ni imagen: solo la referencia del punto de control (regla 5).
        pseudonymous_ref: `${punto.serie}:${modalidad}`,
        candidates: comparacion ? [...comparacion.candidatos] : [],
        note: cap.fallo
          ? `Fallo de captura antes de comparar. RF-09 sigue siendo bloqueador de factibilidad: no hay motor contratado ni validado.`
          : `${comparacion?.motivo ?? ""} Simulado: RF-09 sigue siendo bloqueador de factibilidad.`,
      };

      // La ambiguedad pone la identidad en conflicto. Un candidato unico NO la confirma.
      const identityState: Encounter["identity_state"] =
        outcome === "coincidencias_multiples" ? "en_conflicto" : encounter.identity_state;

      return {
        ...s,
        evidence: [evidence, ...s.evidence],
        encounters: s.encounters.map((e) =>
          e.encounter_id !== encounterId ? e : { ...e, identity_state: identityState },
        ),
        biometria: {
          ...s.biometria,
          mediciones: [medicion, ...s.biometria.mediciones],
          ultimoIntento: {
            medicion_id,
            encounter_id: encounterId,
            punto_id: puntoId,
            modalidad,
            escenario,
            resultado: outcome,
            motivo: cap.fallo
              ? "La captura no llego al motor. No se comparo nada: esto no significa que la persona no este enrolada."
              : (comparacion?.motivo ?? ""),
            fallo: cap.fallo,
            calidad: cap.calidad,
            captura_ms: cap.captura_ms,
            comparacion_ms: comparacion?.comparacion_ms,
            puntajeMaximo: comparacion?.puntajeMaximo ?? 0,
            margen: comparacion?.margen ?? 0,
            patient_id_correcto,
          },
        },
        audit: appendAudit(s, {
          action: "biometria.intento",
          resource: encounterId,
          outcome: outcome === "provisional" ? "exito" : "fallo",
          reason: `${modalidad}@${puntoId}:${cap.fallo ?? outcome}`,
        }),
      };
    });

    return outcome;
  },

  /**
   * Lectura sincrona del ultimo intento, para la interfaz que acaba de dispararlo.
   *
   * Existe porque un componente no puede ver en su propio render el estado que su manejador
   * de evento acaba de escribir: el `state` de ese render es el anterior. Animar las etapas
   * con numeros del render viejo mostraria una medicion que no es la del intento en curso.
   */
  leerUltimoIntento(): IntentoBiometrico | undefined {
    return getState().biometria.ultimoIntento;
  },

  /**
   * RNF-02: la confirmacion humana es una etapa medible del recorrido, no un hueco.
   * Se registra al resolver un intento para que el p95 total no se atribuya al proveedor.
   */
  registrarConfirmacionHumana(medicionId: string, ms: number) {
    setState((s) => ({
      ...s,
      biometria: {
        ...s.biometria,
        mediciones: s.biometria.mediciones.map((m) =>
          m.medicion_id !== medicionId ? m : { ...m, confirmacion_humana_ms: ms },
        ),
      },
    }));
  },

  /** RF-12: confirmacion manual de identidad por personal autorizado, con motivo. */
  confirmIdentity(encounterId: string, patientId: string, reason: string) {
    setState((s) => {
      /*
       * RNF-02: la confirmacion humana es una ETAPA del recorrido, no un hueco entre el
       * motor y el expediente. Se mide desde que el resultado estuvo disponible hasta que
       * una persona decidio, y se guarda aparte para que el p95 total no se le atribuya al
       * proveedor biometrico: normalmente esta etapa es la mas lenta de las cuatro, y no la
       * arregla comprar un lector mas rapido.
       */
      const intento = s.biometria.ultimoIntento;
      const mediciones =
        intento?.encounter_id === encounterId
          ? s.biometria.mediciones.map((m) => {
              if (m.medicion_id !== intento.medicion_id || m.confirmacion_humana_ms !== undefined) return m;
              const desdeElResultado =
                Date.now() - new Date(m.at).getTime() - m.captura_ms - (m.comparacion_ms ?? 0);
              return { ...m, confirmacion_humana_ms: Math.max(0, Math.round(desdeElResultado)) };
            })
          : s.biometria.mediciones;

      /*
       * Si el escenario en curso era un falso positivo y se confirmo al candidato que el
       * motor propuso, la bitacora lo deja asentado. No es un castigo al operador: es el
       * dato que un piloto necesita para calcular la tasa de vinculacion incorrecta (RF-30),
       * y la razon por la que la corroboracion humana tiene que apoyarse en algo mas que el
       * puntaje que la pantalla acaba de mostrar.
       */
      const vinculacionIncorrecta =
        intento?.encounter_id === encounterId &&
        intento.patient_id_correcto !== undefined &&
        intento.patient_id_correcto !== patientId;

      return {
        ...s,
        encounters: s.encounters.map((e) =>
          e.encounter_id !== encounterId ? e : { ...e, patient_id: patientId, identity_state: "confirmada" },
        ),
        biometria: { ...s.biometria, mediciones },
        audit: appendAudit(s, {
          action: "identity.resolved",
          resource: `${encounterId}->${patientId}`,
          reason: vinculacionIncorrecta
            ? `${reason} [ENSAYO: el escenario simulado era un falso positivo; este vinculo no corresponde a la persona capturada]`
            : reason,
        }),
        outbox: enqueue(s, {
          encounterId,
          eventType: "identity.resolved",
          occurredAt: nowIso(),
          payload: { patient_id: patientId, reason },
        }),
      };
    });
  },

  /** RF-12: deshacer un vinculo equivocado sin borrar la historia (CA-08). */
  unlinkIdentity(encounterId: string, reason: string) {
    setState((s) => ({
      ...s,
      encounters: s.encounters.map((e) =>
        e.encounter_id !== encounterId ? e : { ...e, patient_id: undefined, identity_state: "provisional" },
      ),
      snapshots: s.snapshots.filter((sn) => sn.encounter_id !== encounterId),
      audit: appendAudit(s, { action: "identity.binding_corrected", resource: encounterId, reason }),
      outbox: enqueue(s, { encounterId, eventType: "identity.binding_corrected", occurredAt: nowIso(), payload: { reason } }),
    }));
  },

  /** RF-13: lectura del ECE solo con identidad confirmada o acceso de emergencia justificado. */
  readSnapshot(encounterId: string, options?: { breakGlass?: boolean; reason?: string }) {
    setState((s) => {
      const encounter = s.encounters.find((e) => e.encounter_id === encounterId);
      if (!encounter) return s;
      const allowed = encounter.identity_state === "confirmada" || options?.breakGlass === true;
      if (!allowed) {
        return {
          ...s,
          audit: appendAudit(s, {
            action: "ehr.snapshot_read",
            resource: encounterId,
            outcome: "denegado",
            reason: "identidad no confirmada y sin acceso de emergencia",
          }),
        };
      }
      const patientId = encounter.patient_id ?? "pat_001";
      const available = s.integrations.ehr !== "caido";
      const snapshot: ClinicalSnapshot = {
        snapshot_id: `snap_${encounterId}`,
        encounter_id: encounterId,
        patient_id: patientId,
        read_at: nowIso(),
        source_system: "ECE ISSSTE (simulado)",
        source_available: available,
        version: available ? "v2026.03" : undefined,
        allergies: available ? [{ label: "Sin alergias registradas en la fuente", source: "ECE ISSSTE", recorded_at: nowIso() }] : [],
        medications: available ? [{ label: "Acido acetilsalicilico 100 mg", detail: "1 c/24 h", source: "ECE ISSSTE", recorded_at: nowIso() }] : [],
        active_problems: available ? [{ label: "Hipertension arterial", source: "ECE ISSSTE", recorded_at: nowIso() }] : [],
        cardiovascular_history: [],
        procedures: [],
        alerts: [],
        stale_warning: available ? undefined : "ECE no disponible: no se pudo leer ningun dato (CA-07).",
      };
      return {
        ...s,
        snapshots: [snapshot, ...s.snapshots.filter((sn) => sn.encounter_id !== encounterId)],
        audit: appendAudit(s, {
          action: options?.breakGlass ? "break_glass.used" : "ehr.snapshot_read",
          resource: encounterId,
          outcome: available ? "exito" : "fallo",
          reason: options?.reason,
          breakGlass: options?.breakGlass,
        }),
      };
    });
  },

  /** RF-16: el medico documenta interpretacion, diagnostico y hora cero clinica. */
  recordDiagnosis(caseId: string, input: { ecgInterpretation: string; diagnosis: string }) {
    setState((s) => {
      const target = s.cases.find((c) => c.case_id === caseId);
      if (!target) return s;
      const at = nowIso();
      return {
        ...s,
        cases: s.cases.map((c) =>
          c.case_id !== caseId
            ? c
            : { ...c, ecg_interpretation: input.ecgInterpretation, diagnosis: input.diagnosis, diagnosis_at: at, responsible_physician: actorOf(s).user_id },
        ),
        encounters: s.encounters.map((e) =>
          e.encounter_id !== target.encounter_id ? e : { ...e, clinical_state: "diagnostico_confirmado" },
        ),
        audit: appendAudit(s, { action: "diagnosis.recorded", resource: caseId }),
        outbox: enqueue(s, { encounterId: target.encounter_id, eventType: "diagnosis.recorded", occurredAt: at, payload: { diagnosis: input.diagnosis } }),
      };
    });
  },

  /** RF-17 + RF-18: activacion explicita del medico; genera avisos a los roles configurados. */
  activateCode(caseId: string, route: ReperfusionRoute) {
    setState((s) => {
      const target = s.cases.find((c) => c.case_id === caseId);
      if (!target || target.code_state === "activo") return s; // CA-11: sin activaciones duplicadas
      const actor = actorOf(s);
      if (actor.role !== "medico_urgencias") {
        return { ...s, audit: appendAudit(s, { action: "code.activated", resource: caseId, outcome: "denegado", reason: "rol sin facultad de activacion" }) };
      }
      const at = nowIso();
      const recipients: Array<{ role: Rol; label: string; channel: AlertDelivery["channel"] }> = [
        { role: "cardiologia_hemodinamia", label: "Hemodinamia guardia", channel: "push" },
        { role: "enfermeria", label: "Enfermeria urgencias", channel: "tablero" },
        { role: "traslados", label: "Camilleria / ambulancia", channel: "radio" },
      ];
      const newAlerts: AlertDelivery[] = recipients.map((r) => ({
        alert_id: newAlertId(),
        case_id: caseId,
        recipient_role: r.role,
        recipient_label: r.label,
        channel: r.channel,
        sent_at: at,
        retries: 0,
        failure: s.integrations.notifications === "caido" ? "canal no disponible (simulado)" : undefined,
      }));
      return {
        ...s,
        cases: s.cases.map((c) =>
          c.case_id !== caseId ? c : { ...c, code_state: "activo", activated_at: at, activated_by: actorOf(s).user_id, route, route_decided_at: at },
        ),
        encounters: s.encounters.map((e) => (e.encounter_id !== target.encounter_id ? e : { ...e, clinical_state: "codigo_activo" })),
        alerts: [...newAlerts, ...s.alerts],
        audit: appendAudit(s, { action: "code.activated", resource: caseId, reason: route }),
        outbox: enqueue(s, { encounterId: target.encounter_id, eventType: "code.activated", occurredAt: at, payload: { route } }),
      };
    });
  },

  cancelCode(caseId: string, reason: string) {
    setState((s) => {
      const target = s.cases.find((c) => c.case_id === caseId);
      if (!target) return s;
      return {
        ...s,
        cases: s.cases.map((c) => (c.case_id !== caseId ? c : { ...c, code_state: "cancelado", cancel_reason: reason })),
        audit: appendAudit(s, { action: "code.cancelled", resource: caseId, reason }),
        outbox: enqueue(s, { encounterId: target.encounter_id, eventType: "code.cancelled", occurredAt: nowIso(), payload: { reason } }),
      };
    });
  },

  /** RF-18: acuse de recibo por destinatario. */
  acknowledgeAlert(alertId: string) {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.alert_id !== alertId ? a : { ...a, acknowledged_at: nowIso() })),
      audit: appendAudit(s, { action: "alert.acknowledged", resource: alertId }),
    }));
  },

  escalateAlert(alertId: string) {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.alert_id !== alertId ? a : { ...a, retries: a.retries + 1, escalated_at: nowIso() })),
      audit: appendAudit(s, { action: "alert.escalated", resource: alertId }),
    }));
  },

  /** RF-19: aceptacion o rechazo de sala, equipo o ambulancia, sin bloquear la atencion. */
  decideResource(caseId: string, kind: ResourceResponse["kind"], label: string, decision: "aceptado" | "rechazado", reason?: string) {
    setState((s) => {
      const target = s.cases.find((c) => c.case_id === caseId);
      const existing = s.resources.find((r) => r.case_id === caseId && r.kind === kind);
      const record: ResourceResponse = {
        resource_id: existing?.resource_id ?? `res_${caseId}_${kind}`,
        case_id: caseId,
        kind,
        label,
        decision,
        decided_at: nowIso(),
        reason,
      };
      return {
        ...s,
        resources: [record, ...s.resources.filter((r) => r.resource_id !== record.resource_id)],
        audit: appendAudit(s, { action: "resource.decided", resource: `${caseId}:${kind}`, reason: `${decision}${reason ? ` - ${reason}` : ""}` }),
        outbox: target
          ? enqueue(s, { encounterId: target.encounter_id, eventType: "resource.decided", occurredAt: nowIso(), payload: { kind, decision, reason } })
          : s.outbox,
      };
    });
  },

  /** RF-20: la ruta clinica la elige el medico; el sistema solo la registra. */
  selectRoute(caseId: string, route: ReperfusionRoute) {
    setState((s) => {
      const target = s.cases.find((c) => c.case_id === caseId);
      if (!target) return s;
      return {
        ...s,
        cases: s.cases.map((c) => (c.case_id !== caseId ? c : { ...c, route, route_decided_at: nowIso() })),
        audit: appendAudit(s, { action: "route.selected", resource: caseId, reason: route }),
        outbox: enqueue(s, { encounterId: target.encounter_id, eventType: "route.selected", occurredAt: nowIso(), payload: { route } }),
      };
    });
  },

  /** RF-15: reintento manual de la cola hacia el ECE. */
  retryOutbox() {
    setState((s) => {
      const healthy = s.integrations.ehr === "ok";
      return {
        ...s,
        outbox: s.outbox.map((o) =>
          o.sync_state === "sincronizado"
            ? o
            : healthy
              ? { ...o, sync_state: "sincronizado", attempts: o.attempts + 1, synced_at: nowIso(), last_error: undefined }
              : { ...o, attempts: o.attempts + 1, last_error: "ECE no disponible (simulado)" },
        ),
        audit: appendAudit(s, { action: "ehr.write_synced", resource: "outbox", outcome: healthy ? "exito" : "fallo" }),
      };
    });
  },
};

// --- selectores ---------------------------------------------------------------

export function caseOfEncounter(s: AppState, encounterId: string): InfarctCase | undefined {
  return s.cases.find((c) => c.encounter_id === encounterId);
}

export function encounterById(s: AppState, encounterId: string): Encounter | undefined {
  return s.encounters.find((e) => e.encounter_id === encounterId);
}

export function snapshotOfEncounter(s: AppState, encounterId: string): ClinicalSnapshot | undefined {
  return s.snapshots.find((sn) => sn.encounter_id === encounterId);
}

export function evidenceOfEncounter(s: AppState, encounterId: string): IdentityEvidence[] {
  return s.evidence.filter((e) => e.encounter_id === encounterId);
}

export function alertsOfCase(s: AppState, caseId: string): AlertDelivery[] {
  return s.alerts.filter((a) => a.case_id === caseId);
}

export function resourcesOfCase(s: AppState, caseId: string): ResourceResponse[] {
  return s.resources.filter((r) => r.case_id === caseId);
}

export function patientById(s: AppState, patientId?: string | null): Patient | undefined {
  if (!patientId) return undefined;
  return s.patients.find((p) => p.patient_id === patientId);
}

export function userById(s: AppState, userId?: string | null): User | undefined {
  if (!userId) return undefined;
  return s.users.find((u) => u.user_id === userId);
}

/** Los episodios activos son los que no han cerrado. Orden por prioridad y llegada. */
export function activeEncounters(s: AppState): Encounter[] {
  const weight: Record<TriagePriority, number> = { rojo: 0, naranja: 1, amarillo: 2, verde: 3 };
  return s.encounters
    .filter((e) => e.clinical_state !== "cierre")
    .sort((a, b) => {
      const pa = weight[a.triage?.priority ?? "verde"];
      const pb = weight[b.triage?.priority ?? "verde"];
      if (pa !== pb) return pa - pb;
      return new Date(a.arrival_at).getTime() - new Date(b.arrival_at).getTime();
    });
}
