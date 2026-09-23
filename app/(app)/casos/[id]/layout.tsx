"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Banda, Insignia, InsigniaIdentidad, InsigniaTriage, InsigniaEstadoClinico } from "@/components/ui/primitivos";
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
      <div className="rounded-xl bg-fondo p-6">
        <p className="text-sm text-texto-suave">Episodio no encontrado en el estado local del prototipo.</p>
        <Link href="/tablero" className="mt-3 inline-block text-sm text-texto underline underline-offset-2">
          Volver al tablero
        </Link>
      </div>
    );
  }

  const patient = patientById(state, encounter.patient_id);
  const base = `/casos/${id}`;

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/tablero"
          className="control -ml-2 inline-flex items-center gap-1.5 rounded px-2 text-sm text-texto-suave transition-colors hover:text-texto"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Casos activos
        </Link>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="display text-3xl text-texto sm:text-4xl">
              {patient ? patient.display_name : "Paciente sin identificar"}
            </h1>
            <p className="mt-2 text-sm text-texto-suave">
              <span className="font-mono text-texto">{encounter.temporary_id}</span> · llegada{" "}
              {localDateTime(encounter.arrival_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            <InsigniaTriage prioridad={encounter.triage?.priority} />
            <InsigniaIdentidad estado={encounter.identity_state} />
            <InsigniaEstadoClinico estado={encounter.clinical_state} />
            {!encounter.conscious && <Insignia tono="aviso">No puede participar</Insignia>}
          </div>
        </div>

        {/* Regla 4: aviso permanente mientras la identidad no este confirmada. */}
        {encounter.identity_state !== "confirmada" && (
          <Banda tono="aviso" className="mt-6">
            Identidad no confirmada. No se abre ningun expediente de forma automatica y no se escriben datos sobre un
            expediente candidato. La atencion continua con identificador temporal.
          </Banda>
        )}
      </header>

      <nav aria-label="Vistas del episodio" className="flex flex-wrap gap-1 border-b border-borde-suave">
        {TABS.map((t) => {
          const href = t.seg ? `${base}/${t.seg}` : base;
          const active = pathname === href;
          return (
            <Link
              key={t.label}
              href={href}
              title={t.rf}
              aria-current={active ? "page" : undefined}
              className={`control -mb-px inline-flex items-center border-b-2 px-4 text-sm font-medium transition-colors ${
                active ? "border-texto text-texto" : "border-transparent text-texto-suave hover:text-texto"
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
