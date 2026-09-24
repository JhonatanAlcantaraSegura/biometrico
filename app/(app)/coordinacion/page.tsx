"use client";

/**
 * Pantalla 6 - Coordinacion del codigo.
 * RF-18 avisos, acuse, reintento y escalamiento; RF-19 disponibilidad de recursos;
 * RF-21 temporizadores. Las notificaciones externas llevan datos minimos.
 */
import Link from "next/link";
import { Insignia, Boton, Encabezado, Tarjeta, Vacio } from "@/components/ui/primitivos";
import { Cronometro } from "@/components/dominio/relojes";
import { RedDeAtencion } from "@/components/dominio/mapas";
import { actions, alertsOfCase, encounterById, resourcesOfCase, useAppState } from "@/lib/estado/tienda";
import { localTime, minutesBetween } from "@/lib/tiempo";

/** RF-18: ventana configurable antes de escalar por falta de acuse. */
const ACK_WINDOW_MIN = 3;

export default function CoordinacionPage() {
  const state = useAppState();
  if (!state) return null;

  const activeCases = state.cases.filter((c) => c.code_state === "activo");

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Coordinacion del Codigo Infarto"
        descripcion={`${activeCases.length} codigos activos. Avisos con datos minimos, acuse y escalamiento.`}
        requisitos={["RF-18", "RF-19", "RF-21"]}
      />

      {activeCases.length === 0 && (
        <Tarjeta>
          <Vacio>No hay codigos activos. Active uno desde el puesto del medico.</Vacio>
        </Tarjeta>
      )}

      {activeCases.map((c) => {
        const encounter = encounterById(state, c.encounter_id);
        const alerts = alertsOfCase(state, c.case_id);
        const resources = resourcesOfCase(state, c.case_id);
        if (!encounter) return null;

        return (
          <Tarjeta
            key={c.case_id}
            titulo={`${encounter.temporary_id} · ${c.diagnosis ?? "sin diagnostico"}`}
            ayuda={`Ruta ${c.route.replace(/_/g, " ")} · activado ${localTime(c.activated_at)}`}
            acciones={
              <Link href={`/casos/${encounter.encounter_id}`} className="text-sm text-info">
                Abrir caso
              </Link>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-texto-suave">Avisos enviados</h3>
                {alerts.length === 0 ? (
                  <Vacio>Sin avisos registrados.</Vacio>
                ) : (
                  <ul className="space-y-2">
                    {alerts.map((a) => {
                      const overdue = !a.acknowledged_at && minutesBetween(a.sent_at) > ACK_WINDOW_MIN;
                      return (
                        <li key={a.alert_id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-superficie px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{a.recipient_label}</p>
                            <p className="text-xs text-texto-suave">
                              canal {a.channel} · enviado {localTime(a.sent_at)} · reintentos {a.retries}
                              {a.failure ? ` · ${a.failure}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {a.acknowledged_at ? (
                              <Insignia tono="exito">acuse {localTime(a.acknowledged_at)}</Insignia>
                            ) : overdue ? (
                              <Insignia tono="peligro">sin acuse</Insignia>
                            ) : (
                              <Insignia tono="aviso">esperando acuse</Insignia>
                            )}
                            {!a.acknowledged_at && (
                              <>
                                <Boton tono="exito" onClick={() => actions.acknowledgeAlert(a.alert_id)}>
                                  Acusar
                                </Boton>
                                <Boton tono="aviso" onClick={() => actions.escalateAlert(a.alert_id)}>
                                  Escalar
                                </Boton>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <h3 className="pt-2 text-xs font-medium text-texto-suave">Red de atencion</h3>
                <RedDeAtencion recursos={resources} />

                <h3 className="pt-2 text-xs font-medium text-texto-suave">Recursos</h3>
                {resources.length === 0 ? (
                  <Vacio>Sin respuesta de sala, equipo ni ambulancia.</Vacio>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {resources.map((r) => (
                      <li key={r.resource_id}>
                        <Insignia tono={r.decision === "aceptado" ? "exito" : r.decision === "rechazado" ? "peligro" : "aviso"}>
                          {r.kind.replace(/_/g, " ")} · {r.label} · {r.decision}
                          {r.reason ? ` (${r.reason})` : ""}
                        </Insignia>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-4 rounded bg-superficie p-3">
                <Cronometro from={encounter.arrival_at} etiqueta="Desde la llegada" />
                {c.diagnosis_at && <Cronometro from={c.diagnosis_at} goalMinutes={90} etiqueta="Desde la hora cero" />}
                <p className="text-xs text-texto-suave">
                  Un aviso sin acuse escala al siguiente destinatario configurado. Ningun escalamiento retrasa la
                  atencion ni cambia la ruta elegida por el medico.
                </p>
              </div>
            </div>
          </Tarjeta>
        );
      })}
    </div>
  );
}
