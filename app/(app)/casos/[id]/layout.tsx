"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Insignia, InsigniaIdentidad, InsigniaTriage, InsigniaEstadoClinico } from "@/components/ui/primitivos";
import { encounterById, patientById, useAppState } from "@/lib/estado/tienda";
import { localDateTime } from "@/lib/tiempo";

const TABS = [
  { seg: "", label: "Puesto del medico", rf: "RF-16,17,20,21" },
  { seg: "identidad", label: "Identidad y conciliacion", rf: "RF-05..12" },
  { seg: "resumen", label: "Resumen clinico", rf: "RF-13,14" },
];

export default function CaseLayout({ children }: { children: ReactNode }) {
  const state = useAppState();
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const id = params.id;

  if (!state) return null;
  const encounter = encounterById(state, id);
  if (!encounter) {
    return (
      <div className="rounded-lg border border-borde-suave bg-fondo p-6">
        <p className="text-sm text-texto-suave">Episodio no encontrado en el estado local del prototipo.</p>
        <Link href="/tablero" className="mt-3 inline-block text-sm text-info">
          Volver al tablero
        </Link>
      </div>
    );
  }

  const patient = patientById(state, encounter.patient_id);
  const base = `/casos/${id}`;

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-borde-suave bg-fondo p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-bold">{encounter.temporary_id}</p>
            <p className="text-sm text-texto-suave">
              {patient ? patient.display_name : "Paciente sin identificar"} · llegada {localDateTime(encounter.arrival_at)}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <InsigniaTriage prioridad={encounter.triage?.priority} />
            <InsigniaIdentidad estado={encounter.identity_state} />
            <InsigniaEstadoClinico estado={encounter.clinical_state} />
            {!encounter.conscious && <Insignia tono="aviso">No puede participar</Insignia>}
          </div>
        </div>

        {/* Regla 4: aviso permanente mientras la identidad no este confirmada. */}
        {encounter.identity_state !== "confirmada" && (
          <p className="mt-3 rounded border border-aviso/50 bg-aviso/10 px-3 py-2 text-sm text-aviso">
            Identidad no confirmada. No se abre ningun expediente de forma automatica y no se escriben datos sobre un
            expediente candidato. La atencion continua con identificador temporal.
          </p>
        )}
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-borde-suave">
        {TABS.map((t) => {
          const href = t.seg ? `${base}/${t.seg}` : base;
          const active = pathname === href;
          return (
            <Link
              key={t.label}
              href={href}
              title={t.rf}
              className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition ${
                active ? "border-info text-info" : "border-transparent text-texto-suave hover:text-texto"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
