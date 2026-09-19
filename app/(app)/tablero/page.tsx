"use client";

/**
 * Pantalla 2 - Tablero operativo de casos activos.
 * RF-25: prioridad, llegada, ECG, diagnostico, estado del codigo, sala/traslado,
 * identidad provisional/confirmada y fallos de integracion, sin recarga manual.
 */
import Link from "next/link";
import { Insignia, Tarjeta, InsigniaIdentidad, InsigniaTriage, Requisito, InsigniaEstadoClinico } from "@/components/ui/primitivos";
import { Cronometro } from "@/components/dominio/relojes";
import { activeEncounters, caseOfEncounter, patientById, resourcesOfCase, useAppState } from "@/lib/estado/tienda";
import { localTime } from "@/lib/tiempo";

/** Metas de referencia del protocolo IMSS; se configuran por sede (RF-28). */
const GOAL_ECG_MIN = 10;
const GOAL_PCI_MIN = 90;

export default function CasosPage() {
  const state = useAppState();
  if (!state) return null;

  const encounters = activeEncounters(state);
  const pendingWrites = state.outbox.filter((o) => o.sync_state !== "sincronizado").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Casos activos</h1>
          <p className="text-sm text-texto-suave">
            {encounters.length} episodios en piso · el estado de identidad no detiene ninguna transicion clinica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingWrites > 0 && <Insignia tono="aviso">{pendingWrites} escrituras pendientes de sincronizar</Insignia>}
          <Requisito ids={["RF-25", "RF-21"]} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {encounters.map((e) => {
          const c = caseOfEncounter(state, e.encounter_id);
          const patient = patientById(state, e.patient_id);
          const ecgAcquired = c?.milestones.find((m) => m.type === "ecg_adquirido" && m.status === "realizado")?.occurred_at;
          const resources = c ? resourcesOfCase(state, c.case_id) : [];

          return (
            <Link
              key={e.encounter_id}
              href={`/casos/${e.encounter_id}`}
              className="block rounded-lg border border-borde-suave bg-fondo p-4 transition hover:border-info"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold">{e.temporary_id}</p>
                  <p className="text-sm text-texto-suave">
                    {patient ? patient.display_name : "Paciente sin identificar"}
                    {!e.conscious && <span className="ml-2 text-aviso">· no puede participar</span>}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <InsigniaTriage prioridad={e.triage?.priority} />
                  <InsigniaIdentidad estado={e.identity_state} />
                  <InsigniaEstadoClinico estado={e.clinical_state} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Cronometro from={e.arrival_at} goalMinutes={GOAL_ECG_MIN} completedAt={ecgAcquired} etiqueta="llegada -> ECG adquirido" />
                {c?.diagnosis_at ? (
                  <Cronometro
                    from={c.diagnosis_at}
                    goalMinutes={GOAL_PCI_MIN}
                    completedAt={c.milestones.find((m) => m.type === "reperfusion" && m.status === "realizado")?.occurred_at}
                    etiqueta="hora cero -> reperfusion"
                  />
                ) : (
                  <div className="text-sm text-texto-suave">Hora cero clinica sin registrar</div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-texto-suave">
                <span>Llegada {localTime(e.arrival_at)}</span>
                <span>·</span>
                <span>{c?.diagnosis ? c.diagnosis : "sin diagnostico documentado"}</span>
                {c?.code_state === "activo" && <Insignia tono="peligro">Codigo activo</Insignia>}
                {c?.code_state === "cancelado" && <Insignia tono="neutro">Codigo cancelado</Insignia>}
                {resources.map((r) => (
                  <Insignia key={r.resource_id} tono={r.decision === "aceptado" ? "exito" : r.decision === "rechazado" ? "peligro" : "aviso"}>
                    {r.label}: {r.decision}
                  </Insignia>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      <Tarjeta titulo="Fallos de integracion visibles en el tablero" acciones={<Requisito ids={["RNF-03", "CA-06", "CA-07"]} />}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(state.integrations).map(([k, v]) => (
            <Insignia key={k} tono={v === "exito" ? "exito" : v === "lento" ? "aviso" : "peligro"}>
              {k}: {v}
            </Insignia>
          ))}
        </div>
        <p className="mt-3 text-sm text-texto-suave">
          Ningun fallo externo bloquea esta pantalla. Las escrituras al ECE se encolan con llave idempotente y se
          reintentan desde Calidad y administracion.
        </p>
      </Tarjeta>
    </div>
  );
}
