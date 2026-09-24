"use client";

/**
 * Pantalla 2 - Tablero operativo de casos activos.
 * RF-25: prioridad, llegada, ECG, diagnostico, estado del codigo, sala/traslado,
 * identidad provisional/confirmada y fallos de integracion, sin recarga manual.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Encabezado, Insignia, Tarjeta, InsigniaIdentidad, InsigniaTriage, Requisito, InsigniaEstadoClinico, cx } from "@/components/ui/primitivos";
import { Cronometro } from "@/components/dominio/relojes";
import { BarraDePartes, BarrasHorizontales, TarjetaIndicador, Tendencia } from "@/components/dominio/graficas";
import { INTEGRACIONES } from "@/components/layout/shell";
import { activeEncounters, caseOfEncounter, patientById, resourcesOfCase, useAppState } from "@/lib/estado/tienda";
import { localTime, minutesBetween } from "@/lib/tiempo";
import type { AppState } from "@/lib/estado/tienda";

/** Metas de referencia del protocolo IMSS; se configuran por sede (RF-28). */
const GOAL_ECG_MIN = 10;
const GOAL_PCI_MIN = 90;

const TEXTO_INTEGRACION = { ok: "operando", lento: "lenta", caido: "caida" } as const;

/** Tendencia de llegadas: intervalos de 10 minutos durante las ultimas 2 horas. */
const MINUTOS_INTERVALO = 10;
const INTERVALOS = 12;

/**
 * Vuelve a pintar cada 30 s: las barras "en curso" avanzan solas, igual que los relojes, sin
 * tocar el estado de la aplicacion.
 */
function useCadaMedioMinuto() {
  const [, setPulso] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPulso((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Llegadas por intervalo de 10 minutos en las ultimas 2 horas, a partir de `arrival_at`. */
function llegadasRecientes(state: AppState) {
  const ahora = Date.now();
  const paso = MINUTOS_INTERVALO * 60_000;
  const valores: number[] = [];
  const etiquetas: string[] = [];
  for (let k = INTERVALOS - 1; k >= 0; k--) {
    const fin = ahora - k * paso;
    const inicio = fin - paso;
    valores.push(
      state.encounters.filter((e) => {
        const t = Date.parse(e.arrival_at);
        return t > inicio && t <= fin;
      }).length,
    );
    etiquetas.push(k === 0 ? `ultimos ${MINUTOS_INTERVALO} min` : `hace ${k * MINUTOS_INTERVALO}-${(k + 1) * MINUTOS_INTERVALO} min`);
  }
  return { valores, etiquetas };
}

export default function CasosPage() {
  const state = useAppState();
  useCadaMedioMinuto();
  if (!state) return null;

  const encounters = activeEncounters(state);
  const pendingWrites = state.outbox.filter((o) => o.sync_state !== "sincronizado").length;

  // Tiempo de llegada a ECG por episodio: el adquirido si ya existe, si no el que va corriendo.
  const tiemposEcg = encounters.map((e) => {
    const c = caseOfEncounter(state, e.encounter_id);
    const ecg = c?.milestones.find((m) => m.type === "ecg_adquirido" && m.status === "realizado")?.occurred_at;
    const paciente = patientById(state, e.patient_id);
    return {
      clave: e.encounter_id,
      etiqueta: paciente ? paciente.display_name : "Sin identificar",
      detalle: e.temporary_id,
      valor: minutesBetween(e.arrival_at, ecg),
      estado: ecg ? ("completo" as const) : ("en_curso" as const),
    };
  });
  const medianaEcg = mediana(tiemposEcg.filter((t) => t.estado === "completo").map((t) => t.valor));
  const codigosActivos = state.cases.filter((c) => c.code_state === "activo").length;
  const llegadas = llegadasRecientes(state);
  const porIdentidad = (estado: string) => encounters.filter((e) => e.identity_state === estado).length;

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Casos activos"
        descripcion={`${encounters.length} episodios en piso. El estado de identidad no detiene ninguna transicion clinica.`}
        requisitos={["RF-25", "RF-21"]}
        acciones={pendingWrites > 0 ? <Insignia tono="aviso">{pendingWrites} escrituras pendientes de sincronizar</Insignia> : undefined}
      />

      {/* Fila de indicadores: UNA cifra oscura encabeza la vista, el resto acompaña. */}
      <section aria-label="Indicadores del turno" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador
          oscuro
          etiqueta="Codigos activos"
          valor={String(codigosActivos)}
          nota={`${encounters.length} episodios en piso`}
        />
        <TarjetaIndicador
          etiqueta="Llegada a ECG, mediana"
          valor={medianaEcg === null ? "sin dato" : medianaEcg.toFixed(1)}
          unidad={medianaEcg === null ? undefined : "min"}
          nota={`Meta ${GOAL_ECG_MIN} min · solo ECG ya adquiridos`}
        />
        <TarjetaIndicador
          etiqueta="Llegadas recientes"
          valor={String(llegadas.valores.reduce((a, b) => a + b, 0))}
          nota={`Ultimas 2 horas, cada ${MINUTOS_INTERVALO} min`}
        >
          <Tendencia valores={llegadas.valores} etiquetas={llegadas.etiquetas} descripcion={`Llegadas por intervalo de ${MINUTOS_INTERVALO} minutos`} />
        </TarjetaIndicador>
        <TarjetaIndicador
          etiqueta="Identidad sin confirmar"
          valor={String(porIdentidad("provisional") + porIdentidad("en_conflicto"))}
          nota="No detiene la atencion"
        />
      </section>

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
                {c?.code_state === "activo" && <Insignia tono="peligro"><span aria-hidden className="pulso-vivo size-1.5 rounded-full bg-peligro" />Codigo activo</Insignia>}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Tarjeta titulo="Llegada a ECG por episodio" ayuda="Minutos desde la llegada. Los episodios sin ECG siguen corriendo." acciones={<Requisito ids={["RF-04", "RF-21"]} />}>
          <BarrasHorizontales
            datos={tiemposEcg}
            meta={GOAL_ECG_MIN}
            unidad="min"
            descripcion={`Minutos de llegada a ECG por episodio frente a la meta de ${GOAL_ECG_MIN} minutos`}
          />
        </Tarjeta>
        <Tarjeta titulo="Estado de identidad" ayuda="Episodios en piso. Ninguno espera a la identidad para ser atendido." acciones={<Requisito ids={["RF-05", "RF-10"]} />}>
          <BarraDePartes
            descripcion="Episodios en piso por estado de identidad"
            segmentos={[
              { clave: "confirmada", etiqueta: "Confirmada", valor: porIdentidad("confirmada"), relleno: "bueno" },
              { clave: "provisional", etiqueta: "Provisional", valor: porIdentidad("provisional"), relleno: "aviso" },
              { clave: "en_conflicto", etiqueta: "En conflicto", valor: porIdentidad("en_conflicto"), relleno: "critico" },
            ]}
          />
        </Tarjeta>
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
