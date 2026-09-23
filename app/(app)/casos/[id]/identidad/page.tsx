"use client";

/**
 * Pantalla 3 - Identidad y conciliacion.
 * RF-05 estados explicitos, RF-06/07 vinculo previo y prueba World ID, RF-08 ruta manual,
 * RF-09 motor 1:N (bloqueador de factibilidad), RF-10 0/1/N candidatos, RF-12 correccion.
 */
import { useParams } from "next/navigation";
import { useState } from "react";
import { Insignia, Boton, Tarjeta, Vacio, Campo, Requisito, claseCampo } from "@/components/ui/primitivos";
import { actions, encounterById, evidenceOfEncounter, patientById, useAppState } from "@/lib/estado/tienda";
import { localDateTime } from "@/lib/tiempo";
import { CapturaBiometrica } from "@/components/dominio/captura-biometrica";
import type { IdentityMethod, IdentityResult } from "@/lib/datos/tipos";

const METHODS: Array<{ value: IdentityMethod; label: string; note: string; requiresConscious?: boolean }> = [
  {
    value: "identificador_hospitalario",
    label: "Identificador hospitalario",
    note: "Busqueda en el indice maestro por NSS o numero de expediente.",
  },
  { value: "documento", label: "Documento de identidad", note: "Captura asistida a partir de un documento fisico." },
  {
    value: "busqueda_supervisada",
    label: "Busqueda clinica supervisada",
    note: "Ruta manual siempre disponible; nunca se fuerza el registro biometrico durante una crisis (RF-08).",
  },
  {
    value: "world_id",
    label: "World ID (prueba desde la app del paciente)",
    note: "Solo si la persona puede participar y existe un vinculo previo vigente. No sirve para pacientes inconscientes.",
    requiresConscious: true,
  },
];

const RESULT_TONE: Record<IdentityResult, "exito" | "aviso" | "peligro" | "neutro"> = {
  confirmado: "exito",
  provisional: "aviso",
  sin_coincidencia: "neutro",
  coincidencias_multiples: "peligro",
  baja_confianza: "aviso",
  proveedor_no_disponible: "peligro",
};

export default function IdentidadPage() {
  const state = useAppState();
  const params = useParams<{ id: string }>();
  const [reason, setReason] = useState("");
  const [lastResult, setLastResult] = useState<IdentityResult | null>(null);

  if (!state) return null;
  const encounter = encounterById(state, params.id);
  if (!encounter) return null;

  const evidence = evidenceOfEncounter(state, encounter.encounter_id);
  const latest = evidence[0];
  const patient = patientById(state, encounter.patient_id);
  const canReconcile = ["admision_identidad", "medico_urgencias"].includes(
    state.users.find((u) => u.user_id === state.currentUserId)?.role ?? "",
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Tarjeta titulo="Metodos disponibles" ayuda="Ningun metodo es obligatorio para recibir atencion." acciones={<Requisito ids={["RF-05", "RF-08"]} />}>
          <ul className="space-y-2">
            {METHODS.map((m) => {
              const blocked = m.requiresConscious && !encounter.conscious;
              return (
                <li key={m.value} className="flex flex-wrap items-center justify-between gap-3 rounded bg-superficie px-3 py-3">
                  <div className="min-w-[240px] flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-texto-suave">{m.note}</p>
                  </div>
                  <Boton
                    tono={blocked ? "neutro" : "info"}
                    disabled={blocked}
                    title={blocked ? "El paciente no puede participar: la prueba requiere su aplicacion y su autorizacion (CA-04)." : undefined}
                    onClick={() => setLastResult(actions.attemptIdentity(encounter.encounter_id, m.value))}
                  >
                    {blocked ? "No aplicable" : "Intentar"}
                  </Boton>
                </li>
              );
            })}
          </ul>
          {lastResult && (
            <p className="mt-3 text-sm">
              Ultimo resultado: <Insignia tono={RESULT_TONE[lastResult]}>{lastResult.replace(/_/g, " ")}</Insignia>
            </p>
          )}
        </Tarjeta>

        {/*
          La biometria 1:N vive en su propio panel y no como un renglon mas de la lista de
          metodos: exige elegir punto de control y modalidad, puede fallar antes de llegar al
          motor, y su resultado depende de umbrales que alguien tiene que decidir. Meterla en
          una fila con un boton "intentar" escondia justo lo que hay que evaluar (RF-09).
        */}
        <CapturaBiometrica encounterId={encounter.encounter_id} conscious={encounter.conscious} />

        <Tarjeta
          titulo="Candidatos y conciliacion"
          ayuda="Con multiples candidatos o baja confianza solo se muestra informacion minima. Nunca se abre un expediente de forma automatica."
          acciones={<Requisito ids={["RF-10", "RF-12"]} />}
        >
          {!latest || latest.candidates.length === 0 ? (
            <Vacio>Sin candidatos para este episodio. La atencion continua con identificador temporal.</Vacio>
          ) : (
            <div className="space-y-3">
              {latest.candidates.map((cand) => (
                <div key={cand.patient_id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-superficie px-3 py-3">
                  <div>
                    <p className="font-mono text-sm">{cand.masked_name}</p>
                    <p className="text-xs text-texto-suave">
                      nacimiento {cand.birth_year ?? "sin dato"}
                      {cand.differentiator ? ` · ${cand.differentiator}` : ""}
                      {cand.score !== undefined ? ` · similitud ${(cand.score * 100).toFixed(0)}%` : ""}
                    </p>
                  </div>
                  <Boton
                    tono="exito"
                    disabled={!canReconcile || !reason.trim()}
                    title={!canReconcile ? "Rol sin permiso de conciliacion (RF-22)" : !reason.trim() ? "Escriba el motivo de la corroboracion" : undefined}
                    onClick={() => actions.confirmIdentity(encounter.encounter_id, cand.patient_id, reason)}
                  >
                    Confirmar este paciente
                  </Boton>
                </div>
              ))}
              <Campo
                etiqueta="Motivo y evidencia de la corroboracion"
                ayuda="Obligatorio. Queda en la bitacora junto con el actor y la hora (RF-23)."
              >
                <input value={reason} onChange={(e) => setReason(e.target.value)} className={claseCampo} placeholder="p. ej. familiar confirma NSS y fecha de nacimiento" />
              </Campo>
            </div>
          )}
        </Tarjeta>

        {encounter.identity_state === "confirmada" && (
          <Tarjeta titulo="Corregir un vinculo equivocado" acciones={<Requisito ids={["RF-12", "CA-08"]} />}>
            <p className="mb-3 text-sm text-texto-suave">
              Separar el episodio del paciente {patient?.display_name ?? "vinculado"} preserva la trazabilidad, descarta el
              resumen leido y notifica a los sistemas que recibieron la identidad equivocada.
            </p>
            <div className="flex flex-wrap gap-2">
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={claseCampo + " sm:w-96"} placeholder="Motivo de la separacion" />
              <Boton tono="peligro" disabled={!canReconcile || !reason.trim()} onClick={() => actions.unlinkIdentity(encounter.encounter_id, reason)}>
                Separar registros
              </Boton>
            </div>
          </Tarjeta>
        )}
      </div>

      <div className="space-y-5">
        <Tarjeta titulo="Evidencia de identidad" ayuda="Sin plantilla biometrica cruda en la aplicacion." acciones={<Requisito ids={["RF-05", "seccion 6"]} />}>
          {evidence.length === 0 ? (
            <Vacio>Sin intentos registrados.</Vacio>
          ) : (
            <ul className="space-y-3">
              {evidence.map((ev) => (
                <li key={ev.evidence_id} className="rounded bg-superficie px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{ev.method.replace(/_/g, " ")}</span>
                    <Insignia tono={RESULT_TONE[ev.result]}>{ev.result.replace(/_/g, " ")}</Insignia>
                  </div>
                  <p className="mt-1 text-xs text-texto-suave">
                    {ev.provider} · {localDateTime(ev.at)} · algoritmo {ev.algorithm_version ?? "sin dato"}
                  </p>
                  {ev.note && <p className="mt-1 text-xs text-texto-suave">{ev.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="Limite de identidad" acciones={<Requisito ids={["seccion 5"]} />}>
          <p className="text-sm leading-relaxed text-texto-suave">
            World ID demuestra humanidad y unicidad de forma anonima. No entrega nombre ni expediente, y no existe una
            funcion publica para identificar a un paciente inconsciente mediante un escaneo hospitalario. Un nullifier de
            un solo uso no sirve como llave persistente de recuperacion del expediente.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-texto-suave">
            Identificar por biometria a un paciente que no puede participar exige un motor 1:N contratado, validado y
            autorizado. Mientras eso no exista, RF-09 permanece abierto y el prototipo solo lo simula.
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}
