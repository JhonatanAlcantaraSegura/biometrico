"use client";

/**
 * Pantalla 5 - Resumen clinico desde el ECE.
 * RF-13 lectura solo con identidad confirmada o acceso de emergencia justificado,
 * RF-14 alergias y medicamentos al frente con fuente y fecha, campos vacios rotulados.
 */
import { useParams } from "next/navigation";
import { useState } from "react";
import { Insignia, Boton, Tarjeta, Vacio, Campo, Requisito, claseCampo } from "@/components/ui/primitivos";
import { actions, encounterById, patientById, snapshotOfEncounter, useAppState } from "@/lib/estado/tienda";
import { localDateTime } from "@/lib/tiempo";
import type { ClinicalItem } from "@/lib/datos/tipos";

function ItemList({ items, emphasis }: { items: ClinicalItem[]; emphasis?: boolean }) {
  if (items.length === 0) return <Vacio />;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className={`rounded px-3 py-2 ${emphasis ? "bg-peligro-suave" : "bg-superficie"}`}>
          <p className="text-sm font-medium">{it.label}</p>
          <p className="text-xs text-texto-suave">
            {it.detail ? `${it.detail} · ` : ""}
            fuente {it.source} · {localDateTime(it.recorded_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function ResumenPage() {
  const state = useAppState();
  const params = useParams<{ id: string }>();
  const [breakGlassReason, setBreakGlassReason] = useState("");

  if (!state) return null;
  const encounter = encounterById(state, params.id);
  if (!encounter) return null;

  const snapshot = snapshotOfEncounter(state, encounter.encounter_id);
  const patient = patientById(state, encounter.patient_id);
  const confirmed = encounter.identity_state === "confirmada";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {!confirmed && (
          <Tarjeta titulo="Expediente no disponible" acciones={<Requisito ids={["RF-13", "CA-03"]} />}>
            <p className="text-sm text-aviso">
              La identidad no esta confirmada, por lo que no se abre ningun expediente. La atencion se documenta en el
              episodio temporal y se concilia despues.
            </p>
            <div className="mt-4 space-y-3">
              <Campo
                etiqueta="Acceso de emergencia (break glass)"
                ayuda="Exige motivo, queda marcado en la bitacora y se revisa despues. No fusiona episodios ni escribe sobre el expediente candidato."
              >
                <input value={breakGlassReason} onChange={(e) => setBreakGlassReason(e.target.value)} className={claseCampo} placeholder="Motivo clinico del acceso" />
              </Campo>
              <Boton
                tono="aviso"
                disabled={!breakGlassReason.trim()}
                onClick={() => actions.readSnapshot(encounter.encounter_id, { breakGlass: true, reason: breakGlassReason })}
              >
                Usar acceso de emergencia
              </Boton>
            </div>
          </Tarjeta>
        )}

        {confirmed && !snapshot && (
          <Tarjeta titulo="Leer resumen del ECE" acciones={<Requisito ids={["RF-13"]} />}>
            <p className="mb-3 text-sm text-texto-suave">
              Identidad confirmada: {patient?.display_name}. La consulta se limita a datos pertinentes para esta atencion.
            </p>
            <Boton tono="info" onClick={() => actions.readSnapshot(encounter.encounter_id)}>
              Consultar expediente
            </Boton>
          </Tarjeta>
        )}

        {snapshot && (
          <>
            {!snapshot.source_available && (
              <Tarjeta titulo="ECE no disponible" acciones={<Requisito ids={["CA-07", "RNF-03"]} />}>
                <p className="text-sm text-peligro">{snapshot.stale_warning}</p>
                <p className="mt-2 text-sm text-texto-suave">
                  La atencion se documenta localmente. Las escrituras quedan encoladas con llave idempotente y se
                  reconcilian al restablecerse la integracion.
                </p>
              </Tarjeta>
            )}

            <Tarjeta
              titulo="Alergias y reacciones"
              ayuda="Un campo vacio significa que la fuente no tiene el dato, nunca que el paciente no tenga alergias."
              acciones={<Requisito ids={["RF-14"]} />}
            >
              <ItemList items={snapshot.allergies} emphasis />
            </Tarjeta>

            <Tarjeta titulo="Medicamentos relevantes" acciones={<Requisito ids={["RF-14"]} />}>
              <ItemList items={snapshot.medications} />
            </Tarjeta>

            <div className="grid gap-5 md:grid-cols-2">
              <Tarjeta titulo="Problemas activos">
                <ItemList items={snapshot.active_problems} />
              </Tarjeta>
              <Tarjeta titulo="Antecedentes cardiovasculares">
                <ItemList items={snapshot.cardiovascular_history} />
              </Tarjeta>
              <Tarjeta titulo="Intervenciones previas">
                <ItemList items={snapshot.procedures} />
              </Tarjeta>
              <Tarjeta titulo="Alertas clinicas">
                <ItemList items={snapshot.alerts} />
              </Tarjeta>
            </div>
          </>
        )}
      </div>

      <div className="space-y-5">
        <Tarjeta titulo="Procedencia del resumen" acciones={<Requisito ids={["RF-13", "RF-14"]} />}>
          {snapshot ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-texto-suave">Sistema origen: </span>
                {snapshot.source_system}
              </p>
              <p>
                <span className="text-texto-suave">Leido: </span>
                {localDateTime(snapshot.read_at)}
              </p>
              <p>
                <span className="text-texto-suave">Version: </span>
                {snapshot.version ?? "sin dato"}
              </p>
              <Insignia tono={snapshot.source_available ? "exito" : "peligro"}>
                {snapshot.source_available ? "Fuente disponible" : "Fuente no disponible"}
              </Insignia>
            </div>
          ) : (
            <Vacio>Todavia no se ha leido el expediente en este episodio.</Vacio>
          )}
        </Tarjeta>

        <Tarjeta titulo="Base juridica del tratamiento" acciones={<Requisito ids={["RF-24"]} />}>
          {state.legal.filter((l) => l.encounter_id === encounter.encounter_id).length === 0 ? (
            <Vacio>Sin aviso, consentimiento ni excepcion registrada para este episodio.</Vacio>
          ) : (
            <ul className="space-y-2">
              {state.legal
                .filter((l) => l.encounter_id === encounter.encounter_id)
                .map((l) => (
                  <li key={l.record_id} className="rounded bg-superficie px-3 py-2 text-sm">
                    <p className="font-medium">{l.kind.replace(/_/g, " ")}</p>
                    <p className="text-xs text-texto-suave">
                      {l.purpose} · version {l.version} · {localDateTime(l.at)}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
