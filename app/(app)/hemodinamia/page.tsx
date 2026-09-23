"use client";

/**
 * Pantalla 7 - Hemodinamia y traslado.
 * RF-19 aceptar/rechazar con motivo y documentar escalamiento sin bloquear la atencion,
 * RF-20 hitos de la ruta elegida por el medico.
 */
import { useState } from "react";
import { Insignia, Boton, Tarjeta, Vacio, Campo, Requisito, claseCampo } from "@/components/ui/primitivos";
import { actions, encounterById, resourcesOfCase, useAppState, userById } from "@/lib/estado/tienda";
import { localTime } from "@/lib/tiempo";

const MILESTONES = ["inicio_procedimiento", "salida_traslado", "llegada_destino", "reperfusion"] as const;

export default function HemodinamiaPage() {
  const state = useAppState();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  if (!state) return null;
  const me = userById(state, state.currentUserId);
  const canDecide = me?.role === "cardiologia_hemodinamia" || me?.role === "traslados";
  const requests = state.cases.filter((c) => c.code_state === "activo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-texto">Hemodinamia y traslado</h1>
          <p className="text-sm text-texto-suave">
            Solicitudes abiertas: {requests.length}. Rechazar no bloquea la atencion; obliga a documentar el escalamiento.
          </p>
        </div>
        <Requisito ids={["RF-19", "RF-20", "CA-10"]} />
      </div>

      {!canDecide && (
        <Tarjeta>
          <p className="text-sm text-aviso">
            La sesion actual ({me?.role.replace(/_/g, " ")}) puede consultar pero no decidir disponibilidad. Cambie a
            cardiologia/hemodinamia o traslados en la barra superior (RF-22).
          </p>
        </Tarjeta>
      )}

      {requests.length === 0 && (
        <Tarjeta>
          <Vacio>No hay solicitudes activas.</Vacio>
        </Tarjeta>
      )}

      {requests.map((c) => {
        const encounter = encounterById(state, c.encounter_id);
        const resources = resourcesOfCase(state, c.case_id);
        if (!encounter) return null;
        const reasonKey = c.case_id;

        return (
          <Tarjeta
            key={c.case_id}
            titulo={`${encounter.temporary_id} · ${c.diagnosis ?? "sin diagnostico"}`}
            ayuda={`Ruta indicada por el medico: ${c.route.replace(/_/g, " ")}`}
            acciones={<Insignia tono="peligro">Codigo activo {localTime(c.activated_at)}</Insignia>}
          >
            <div className="space-y-4">
              {/* Datos minimos: el equipo receptor no necesita el expediente completo. */}
              <div className="rounded bg-superficie px-3 py-2 text-sm">
                <p className="text-texto-suave">Conjunto minimo compartido</p>
                <p className="mt-1">
                  Episodio {encounter.temporary_id} · triage {encounter.triage?.priority ?? "sin dato"} · diagnostico{" "}
                  {c.diagnosis ?? "sin dato"} · hora cero {localTime(c.diagnosis_at)} ·{" "}
                  {encounter.identity_state === "confirmada" ? "identidad confirmada" : "identidad no confirmada"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Boton tono="exito" disabled={!canDecide} onClick={() => actions.decideResource(c.case_id, "sala_hemodinamia", "Sala 1", "aceptado")}>
                  Aceptar sala de hemodinamia
                </Boton>
                <Boton
                  tono="peligro"
                  disabled={!canDecide || !(reasons[reasonKey] ?? "").trim()}
                  title={!(reasons[reasonKey] ?? "").trim() ? "El rechazo exige motivo" : undefined}
                  onClick={() => actions.decideResource(c.case_id, "sala_hemodinamia", "Sala 1", "rechazado", reasons[reasonKey])}
                >
                  Rechazar sala
                </Boton>
                <Boton tono="info" disabled={!canDecide} onClick={() => actions.decideResource(c.case_id, "ambulancia", "Ambulancia 04", "aceptado")}>
                  Confirmar ambulancia
                </Boton>
              </div>

              <Campo etiqueta="Motivo del rechazo o cambio de plan" ayuda="Se registra y queda disponible para calidad y auditoria.">
                <input
                  value={reasons[reasonKey] ?? ""}
                  onChange={(e) => setReasons((prev) => ({ ...prev, [reasonKey]: e.target.value }))}
                  className={claseCampo}
                  placeholder="p. ej. sala ocupada, sin ventana en 60 min"
                />
              </Campo>

              <div>
                <h3 className="mb-2 text-xs font-medium text-texto-suave">Hitos del procedimiento o traslado</h3>
                <div className="flex flex-wrap gap-2">
                  {MILESTONES.map((t) => {
                    const m = c.milestones.find((x) => x.type === t);
                    const done = m?.status === "realizado";
                    return (
                      <Boton key={t} tono={done ? "exito" : "neutro"} disabled={!canDecide} onClick={() => actions.recordMilestone(c.case_id, t, "realizado")}>
                        {t.replace(/_/g, " ")}
                        {done ? ` · ${localTime(m?.occurred_at)}` : ""}
                      </Boton>
                    );
                  })}
                </div>
              </div>

              {resources.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {resources.map((r) => (
                    <li key={r.resource_id}>
                      <Insignia tono={r.decision === "aceptado" ? "exito" : r.decision === "rechazado" ? "peligro" : "aviso"}>
                        {r.label} · {r.decision} · {localTime(r.decided_at)}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </Insignia>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Tarjeta>
        );
      })}
    </div>
  );
}
