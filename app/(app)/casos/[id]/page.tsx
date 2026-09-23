"use client";

/**
 * Pantalla 4 - Puesto del medico.
 * RF-04 hitos de ECG, RF-16 interpretacion/diagnostico/hora cero, RF-17 activacion,
 * RF-20 ruta clinica, RF-21 temporizadores. La biometria no genera diagnostico.
 */
import { useParams } from "next/navigation";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Insignia, Boton, Tarjeta, Vacio, Campo, Requisito, claseCampo } from "@/components/ui/primitivos";
import { Cronometro } from "@/components/dominio/relojes";
import { actions, caseOfEncounter, encounterById, useAppState, userById } from "@/lib/estado/tienda";
import { localTime } from "@/lib/tiempo";
import type { CaseMilestone, ReperfusionRoute } from "@/lib/datos/tipos";

const ECG_STEPS: Array<{ type: CaseMilestone["type"]; label: string }> = [
  { type: "ecg_solicitado", label: "ECG solicitado" },
  { type: "ecg_adquirido", label: "ECG adquirido" },
  { type: "ecg_entregado", label: "ECG entregado al medico" },
  { type: "ecg_interpretado", label: "ECG interpretado" },
];

const ROUTES: Array<{ value: ReperfusionRoute; label: string }> = [
  { value: "pci_primaria", label: "Angioplastia primaria (PCI)" },
  { value: "fibrinolisis", label: "Fibrinolisis" },
  { value: "traslado", label: "Traslado a centro con hemodinamia" },
  { value: "otra", label: "Otra ruta indicada" },
];

export default function PuestoMedicoPage() {
  const state = useAppState();
  const params = useParams<{ id: string }>();
  const [ecg, setEcg] = useState("");
  const [dx, setDx] = useState("");
  const [route, setRoute] = useState<ReperfusionRoute>("pci_primaria");
  const [cancelReason, setCancelReason] = useState("");

  if (!state) return null;
  const encounter = encounterById(state, params.id);
  const c = encounter ? caseOfEncounter(state, encounter.encounter_id) : undefined;
  if (!encounter || !c) return null;

  const me = userById(state, state.currentUserId);
  const isPhysician = me?.role === "medico_urgencias";
  const ecgAcquired = c.milestones.find((m) => m.type === "ecg_adquirido" && m.status === "realizado")?.occurred_at;
  const reperfusion = c.milestones.find((m) => m.type === "reperfusion" && m.status === "realizado")?.occurred_at;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Tarjeta titulo="Cronologia del ECG" ayuda="Cada hora se guarda con responsable y fuente." acciones={<Requisito ids={["RF-04"]} />}>
          <ul className="space-y-2">
            {ECG_STEPS.map((step) => {
              const m = c.milestones.find((x) => x.type === step.type);
              const done = m?.status === "realizado";
              return (
                <li key={step.type} className="flex flex-wrap items-center justify-between gap-2 rounded bg-superficie px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-texto-suave">
                      {done
                        ? `Ocurrio ${localTime(m?.occurred_at)} · capturado ${localTime(m?.recorded_at)} · ${userById(state, m?.actor_id)?.name ?? "actor desconocido"} · fuente ${m?.source}`
                        : m?.status === "no_realizado"
                          ? "Marcado como NO REALIZADO"
                          : "No documentado"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Boton onClick={() => actions.recordMilestone(c.case_id, step.type, "realizado")}>
                      {done && <CircleCheck className="size-4 text-exito" aria-hidden />}
                      {done ? "Registrado" : "Registrar"}
                    </Boton>
                    {!done && (
                      <Boton onClick={() => actions.recordMilestone(c.case_id, step.type, "no_realizado")} title="Distinto de 'no documentado'">
                        No realizado
                      </Boton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        <Tarjeta
          titulo="Interpretacion, diagnostico y hora cero"
          ayuda="Lo documenta el medico. Ningun resultado biometrico produce un diagnostico."
          acciones={<Requisito ids={["RF-16"]} />}
        >
          {c.diagnosis ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-texto-suave">Interpretacion: </span>
                {c.ecg_interpretation ?? <Vacio />}
              </p>
              <p className="text-sm">
                <span className="text-texto-suave">Diagnostico: </span>
                <span className="font-medium">{c.diagnosis}</span>
              </p>
              <p className="text-sm text-texto-suave">
                Hora cero clinica: {localTime(c.diagnosis_at)} · responsable {userById(state, c.responsible_physician)?.name ?? "sin dato"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Campo etiqueta="Interpretacion del ECG">
                <textarea value={ecg} onChange={(e) => setEcg(e.target.value)} rows={3} className={claseCampo} />
              </Campo>
              <Campo etiqueta="Diagnostico">
                <input value={dx} onChange={(e) => setDx(e.target.value)} className={claseCampo} placeholder="p. ej. IAM CEST inferior" />
              </Campo>
              <Boton
                tono="info"
                disabled={!isPhysician || !dx.trim()}
                title={isPhysician ? undefined : "Solo el medico de urgencias puede documentar el diagnostico (RF-22)"}
                onClick={() => actions.recordDiagnosis(c.case_id, { ecgInterpretation: ecg, diagnosis: dx })}
              >
                Registrar diagnostico y hora cero
              </Boton>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Codigo Infarto" ayuda="Activacion por accion explicita del medico." acciones={<Requisito ids={["RF-17", "RF-20"]} />}>
          {c.code_state === "activo" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Insignia tono="peligro">Codigo activo desde {localTime(c.activated_at)}</Insignia>
                <Insignia tono="info">Ruta: {c.route.replace(/_/g, " ")}</Insignia>
              </div>
              <Campo etiqueta="Cambiar ruta clinica" ayuda="La decision terapeutica es del medico; el sistema solo la registra.">
                <div className="flex flex-wrap gap-2">
                  {ROUTES.map((r) => (
                    <Boton key={r.value} tono={c.route === r.value ? "info" : "neutro"} onClick={() => actions.selectRoute(c.case_id, r.value)}>
                      {r.label}
                    </Boton>
                  ))}
                </div>
              </Campo>
              <Campo etiqueta="Cancelar codigo" ayuda="Requiere motivo; queda auditado y se notifica a los destinatarios.">
                <div className="flex flex-wrap gap-2">
                  <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className={claseCampo + " sm:w-80"} placeholder="Motivo de la cancelacion" />
                  <Boton tono="aviso" disabled={!isPhysician || !cancelReason.trim()} onClick={() => actions.cancelCode(c.case_id, cancelReason)}>
                    Cancelar codigo
                  </Boton>
                </div>
              </Campo>
            </div>
          ) : c.code_state === "cancelado" ? (
            <p className="text-sm text-texto-suave">Codigo cancelado. Motivo: {c.cancel_reason ?? <Vacio />}</p>
          ) : (
            <div className="space-y-4">
              <Campo etiqueta="Estrategia inicial">
                <select value={route} onChange={(e) => setRoute(e.target.value as ReperfusionRoute)} className={claseCampo}>
                  {ROUTES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Campo>
              <Boton
                tono="peligro"
                disabled={!isPhysician || !c.diagnosis}
                title={!c.diagnosis ? "Primero registre diagnostico y hora cero" : isPhysician ? undefined : "Rol sin facultad de activacion"}
                onClick={() => actions.activateCode(c.case_id, route)}
              >
                Activar Codigo Infarto
              </Boton>
              <p className="text-xs text-texto-suave">
                Una segunda pulsacion no crea una activacion duplicada: la accion es idempotente por caso (CA-11).
              </p>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Hitos de tratamiento y traslado" acciones={<Requisito ids={["RF-20", "RF-35"]} />}>
          <div className="flex flex-wrap gap-2">
            {(["orden_reperfusion", "inicio_procedimiento", "salida_traslado", "llegada_destino", "reperfusion"] as const).map((t) => {
              const m = c.milestones.find((x) => x.type === t);
              const done = m?.status === "realizado";
              return (
                <Boton key={t} tono={done ? "exito" : "neutro"} onClick={() => actions.recordMilestone(c.case_id, t, "realizado")}>
                  {t.replace(/_/g, " ")}
                  {done ? ` · ${localTime(m?.occurred_at)}` : ""}
                </Boton>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-texto-suave">
            Las correcciones se registran como eventos nuevos; el historial no se sobrescribe.
          </p>
        </Tarjeta>
      </div>

      <div className="space-y-6">
        <Tarjeta titulo="Relojes clinicos" acciones={<Requisito ids={["RF-21"]} />}>
          <div className="space-y-4">
            <Cronometro from={encounter.arrival_at} goalMinutes={10} completedAt={ecgAcquired} etiqueta="Llegada → ECG adquirido" />
            {c.diagnosis_at && <Cronometro from={c.diagnosis_at} goalMinutes={90} completedAt={reperfusion} etiqueta="Hora cero → reperfusion" />}
            <p className="text-xs text-texto-suave">
              Origen de tiempo: reloj del servidor del prototipo. Metas configurables por sede; un aviso nunca cambia el
              plan clinico ni retrasa la intervencion.
            </p>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Sesion activa" acciones={<Requisito ids={["RF-22"]} />}>
          <p className="text-sm">
            {me?.name} <span className="text-texto-suave">· {me?.role.replace(/_/g, " ")}</span>
          </p>
          <p className="mt-2 text-xs text-texto-suave">
            Cambia de rol en la barra superior para comprobar que las acciones criticas se deshabilitan segun el permiso.
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}
