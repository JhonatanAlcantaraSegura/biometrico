"use client";

/**
 * Pantalla 1 - Ingreso rapido y triage.
 * RF-01 hora de llegada, RF-02 episodio provisional + etiqueta, RF-03 sin tramite previo,
 * RF-04 tareas de ECG. Usable sin nombre y sin conexion a ninguna integracion.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton, Tarjeta, Campo, InsigniaTriage, Requisito, claseCampo } from "@/components/ui/primitivos";
import { actions, useAppState } from "@/lib/estado/tienda";
import { localDateTime } from "@/lib/tiempo";
import type { Encounter, TriagePriority } from "@/lib/datos/tipos";

const SYMPTOMS = [
  "dolor toracico opresivo",
  "dolor irradiado a brazo o mandibula",
  "diaforesis",
  "disnea",
  "sincope",
  "nausea o vomito",
  "inconsciente",
  "hipotension",
];

const SOURCES: Array<{ value: Encounter["arrival_source"]; label: string }> = [
  { value: "demanda_espontanea", label: "Demanda espontanea" },
  { value: "ambulancia", label: "Ambulancia" },
  { value: "referencia", label: "Referencia de otra unidad" },
  { value: "intrahospitalario", label: "Intrahospitalario" },
];

const PRIORITIES: TriagePriority[] = ["rojo", "naranja", "amarillo", "verde"];

export default function TriagePage() {
  const state = useAppState();
  const router = useRouter();

  const [priority, setPriority] = useState<TriagePriority>("rojo");
  const [symptoms, setSymptoms] = useState<string[]>(["dolor toracico opresivo"]);
  const [source, setSource] = useState<Encounter["arrival_source"]>("demanda_espontanea");
  const [conscious, setConscious] = useState(true);
  const [notes, setNotes] = useState("");
  const [lastCreated, setLastCreated] = useState<string | null>(null);

  if (!state) return null;

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = () => {
    const id = actions.createEncounter({ priority, symptoms, arrivalSource: source, conscious, notes: notes || undefined });
    setLastCreated(id);
    setNotes("");
  };

  const created = lastCreated ? state.encounters.find((e) => e.encounter_id === lastCreated) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Tarjeta
          titulo="Ingreso rapido por sospecha"
          ayuda="El reloj clinico arranca aqui. No se pide nombre, derechohabiencia ni documento."
          acciones={<Requisito ids={["RF-01", "RF-02", "RF-03"]} />}
        >
          <div className="space-y-5">
            <Campo etiqueta="Prioridad de triage">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-md border px-4 py-2 text-sm font-semibold capitalize transition ${
                      priority === p ? "border-info bg-info/20 text-info" : "border-borde-suave bg-superficie text-texto-suave hover:text-texto"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Campo>

            <Campo etiqueta="Signos y sintomas de alarma" ayuda="Seleccion multiple. Ninguno es obligatorio para continuar.">
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`rounded-md border px-3 py-2 text-sm transition ${
                      symptoms.includes(s) ? "border-peligro bg-peligro/15 text-peligro" : "border-borde-suave bg-superficie text-texto-suave hover:text-texto"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Origen">
                <select value={source} onChange={(e) => setSource(e.target.value as Encounter["arrival_source"])} className={claseCampo}>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo etiqueta="Estado de conciencia" ayuda="Si no puede participar, no se ofrecera World ID (CA-04).">
                <select value={conscious ? "si" : "no"} onChange={(e) => setConscious(e.target.value === "si")} className={claseCampo}>
                  <option value="si">Consciente, puede participar</option>
                  <option value="no">Inconsciente o incapaz de participar</option>
                </select>
              </Campo>
            </div>

            <Campo etiqueta="Nota breve (opcional)">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={claseCampo} />
            </Campo>

            <div className="flex flex-wrap items-center gap-3">
              <Boton tono="peligro" onClick={submit}>
                Crear episodio y arrancar reloj
              </Boton>
              <span className="text-xs text-texto-suave">
                Una sola accion: genera identificador temporal, etiqueta de brazalete y tarea de ECG.
              </span>
            </div>
          </div>
        </Tarjeta>

        {created && (
          <Tarjeta titulo="Episodio creado" acciones={<Requisito ids={["RF-02", "RF-04"]} />}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-2xl font-bold">{created.temporary_id}</p>
                <p className="mt-1 text-sm text-texto-suave">
                  Llegada registrada: {localDateTime(created.arrival_at)} · <InsigniaTriage prioridad={created.triage?.priority} />
                </p>
                <p className="mt-2 text-sm text-aviso">
                  Siguiente tarea: ECG de 12 derivaciones. Registrar solicitud, adquisicion, entrega e interpretacion por separado.
                </p>
              </div>
              <div className="flex gap-2">
                <Boton onClick={() => window.print()}>Imprimir etiqueta</Boton>
                <Boton tono="info" onClick={() => router.push(`/casos/${created.encounter_id}`)}>
                  Abrir puesto del medico
                </Boton>
              </div>
            </div>
          </Tarjeta>
        )}
      </div>

      <div className="space-y-6">
        <Tarjeta titulo="Regla clinica invariable" acciones={<Requisito ids={["seccion 1"]} />}>
          <p className="text-sm leading-relaxed text-texto-suave">
            El triage, el ECG y la atencion comienzan al llegar la persona. Nunca se bloquean por registro,
            derechohabiencia, biometria, consentimiento, conectividad ni disponibilidad del expediente.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-texto-suave">
            Esta pantalla funciona con todas las integraciones caidas. Puedes comprobarlo con el simulador de fallos
            de la barra superior.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Ultimos episodios del turno" acciones={<Requisito ids={["RF-25"]} />}>
          <ul className="space-y-2">
            {state.encounters.slice(0, 6).map((e) => (
              <li key={e.encounter_id} className="flex items-center justify-between gap-2 rounded border border-borde-suave bg-superficie px-3 py-2">
                <span className="font-mono text-xs">{e.temporary_id}</span>
                <InsigniaTriage prioridad={e.triage?.priority} />
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </div>
  );
}
