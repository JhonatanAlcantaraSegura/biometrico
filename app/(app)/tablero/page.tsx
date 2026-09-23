"use client";

/**
 * Pantalla 2 - Tablero operativo de casos activos.
 * RF-25: prioridad, llegada, ECG, diagnostico, estado del codigo, sala/traslado,
 * identidad provisional/confirmada y fallos de integracion, sin recarga manual.
 */
import Link from "next/link";
import { Encabezado, Insignia, Tarjeta, InsigniaIdentidad, InsigniaTriage, Requisito, InsigniaEstadoClinico, cx } from "@/components/ui/primitivos";
import { Cronometro } from "@/components/dominio/relojes";
import { INTEGRACIONES } from "@/components/layout/shell";
import { activeEncounters, caseOfEncounter, patientById, resourcesOfCase, useAppState } from "@/lib/estado/tienda";
import { localTime } from "@/lib/tiempo";

/** Metas de referencia del protocolo IMSS; se configuran por sede (RF-28). */
const GOAL_ECG_MIN = 10;
const GOAL_PCI_MIN = 90;

const TEXTO_INTEGRACION = { ok: "operando", lento: "lenta", caido: "caida" } as const;

export default function CasosPage() {
  const state = useAppState();
  if (!state) return null;

  const encounters = activeEncounters(state);
  const pendingWrites = state.outbox.filter((o) => o.sync_state !== "sincronizado").length;

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Casos activos"
        descripcion={`${encounters.length} episodios en piso. El estado de identidad no detiene ninguna transicion clinica.`}
        requisitos={["RF-25", "RF-21"]}
        acciones={pendingWrites > 0 ? <Insignia tono="aviso">{pendingWrites} escrituras pendientes de sincronizar</Insignia> : undefined}
      />

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
              className="group flex flex-col rounded-xl bg-fondo p-6 transition-colors hover:bg-borde-suave"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-texto-suave">{e.temporary_id}</p>
                  <p className="mt-1 text-lg font-medium tracking-tight text-texto">
                    {patient ? patient.display_name : "Paciente sin identificar"}
                  </p>
                  {!e.conscious && <p className="text-sm text-aviso">No puede participar en su identificacion</p>}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <InsigniaTriage prioridad={e.triage?.priority} />
                  <InsigniaIdentidad estado={e.identity_state} />
                  <InsigniaEstadoClinico estado={e.clinical_state} />
                </div>
              </div>

              <div className="mt-6 grid gap-6 border-t border-borde-suave pt-5 sm:grid-cols-2">
                <Cronometro from={e.arrival_at} goalMinutes={GOAL_ECG_MIN} completedAt={ecgAcquired} etiqueta="Llegada → ECG adquirido" />
                {c?.diagnosis_at ? (
                  <Cronometro
                    from={c.diagnosis_at}
                    goalMinutes={GOAL_PCI_MIN}
                    completedAt={c.milestones.find((m) => m.type === "reperfusion" && m.status === "realizado")?.occurred_at}
                    etiqueta="Hora cero → reperfusion"
                  />
                ) : (
                  <div>
                    <div className="text-xs text-texto-suave">Hora cero → reperfusion</div>
                    <div className="mt-2 text-sm text-texto-suave">Hora cero clinica sin registrar</div>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs text-texto-suave">
                <span>Llegada {localTime(e.arrival_at)}</span>
                <span aria-hidden>·</span>
                <span className="mr-auto">{c?.diagnosis ? c.diagnosis : "sin diagnostico documentado"}</span>
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

      <Tarjeta titulo="Integraciones" ayuda="Ningun fallo externo bloquea esta pantalla." acciones={<Requisito ids={["RNF-03", "CA-06", "CA-07"]} />}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRACIONES.map(({ clave, etiqueta }) => {
            const v = state.integrations[clave];
            return (
              <li key={clave} className="rounded bg-superficie px-4 py-3">
                <p className="text-sm font-medium text-texto">{etiqueta}</p>
                <p
                  className={cx(
                    "mt-1 flex items-center gap-1.5 text-xs font-medium",
                    v === "ok" ? "text-exito" : v === "lento" ? "text-aviso" : "text-peligro",
                  )}
                >
                  <span aria-hidden className={cx("size-1.5 rounded-full", v === "ok" ? "bg-exito" : v === "lento" ? "bg-aviso" : "bg-peligro")} />
                  {TEXTO_INTEGRACION[v]}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-texto-suave">
          Las escrituras al ECE se encolan con llave idempotente y se reintentan desde Calidad y administracion.
        </p>
      </Tarjeta>
    </div>
  );
}
