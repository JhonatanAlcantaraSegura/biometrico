'use client';

/**
 * Calidad e indicadores — RF-26, seccion 9 de la ERS.
 *
 * Dos decisiones que separan este tablero de la diapositiva que lo inspiro:
 *
 * 1. **Las metricas clinicas y las de identificacion van aparte.** Mezclarlas permite que
 *    una mejora en el registro administrativo se lea como una mejora en el tiempo a
 *    reperfusion, que es precisamente la extrapolacion que la ERS prohibe.
 * 2. **Los casos sin dato se cuentan, no se imputan.** Un indicador calculado solo sobre los
 *    episodios completos siempre se ve mejor de lo que es. Aqui el hueco es un numero.
 *
 * Ninguna cifra de las presentaciones (10x, cero errores, 84 % de reduccion) aparece como
 * resultado: son hipotesis de linea base y este prototipo no puede medirlas.
 */
import { Encabezado, Indicador, Requisito, Tarjeta } from '@/components/ui/primitivos';
import { useAppState, type AppState } from '@/lib/estado/tienda';
import { METAS } from '@/lib/datos/institucion';
import { minutesBetween } from '@/lib/tiempo';

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const s = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(s.length / 2);
  return s.length % 2 ? s[mitad] : (s[mitad - 1] + s[mitad]) / 2;
}

/** RF-26: los casos sin dato se reportan, no se ocultan ni se imputan. */
function metricasClinicas(s: AppState) {
  const llegadaAEcg: number[] = [];
  let ecgSinDocumentar = 0;
  const horaCeroAActivacion: number[] = [];

  for (const c of s.cases) {
    const enc = s.encounters.find((e) => e.encounter_id === c.encounter_id);
    if (!enc) continue;
    const ecg = c.milestones.find((m) => m.type === 'ecg_adquirido' && m.status === 'realizado')?.occurred_at;
    if (ecg) llegadaAEcg.push(minutesBetween(enc.arrival_at, ecg));
    else ecgSinDocumentar += 1;
    if (c.diagnosis_at && c.activated_at) horaCeroAActivacion.push(minutesBetween(c.diagnosis_at, c.activated_at));
  }

  return { llegadaAEcg, ecgSinDocumentar, horaCeroAActivacion };
}

/** Las metricas de identificacion se reportan SEPARADAS de las clinicas. */
function metricasIdentidad(s: AppState) {
  const total = s.evidence.length;
  const confirmados = s.evidence.filter((e) => e.result === 'confirmado').length;
  const ambiguos = s.evidence.filter((e) => e.result === 'coincidencias_multiples').length;
  const sinProveedor = s.evidence.filter((e) => e.result === 'proveedor_no_disponible').length;
  const sinBiometria = s.encounters.filter(
    (e) => !s.evidence.some((ev) => ev.encounter_id === e.encounter_id && ev.method === 'biometrico_1n'),
  ).length;
  return { total, confirmados, ambiguos, sinProveedor, sinBiometria };
}

export default function Calidad() {
  const state = useAppState();
  if (!state) return null;

  const clinicas = metricasClinicas(state);
  const identidad = metricasIdentidad(state);
  const medianaEcg = mediana(clinicas.llegadaAEcg);
  const medianaActivacion = mediana(clinicas.horaCeroAActivacion);

  return (
    <>
      <Encabezado
        titulo="Calidad e indicadores"
        descripcion="Datos sinteticos del turno en curso. Las cifras de las presentaciones no se muestran como resultado: son hipotesis por medir."
        requisitos={['RF-26', 'seccion 9']}
      />

      <Tarjeta
        titulo="Indicadores clinicos"
        ayuda="Los tiempos de interpretacion y de tratamiento no se suman: cada intervalo se reporta por separado."
        acciones={<Requisito ids={['RF-26']} />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            etiqueta="Llegada a ECG (mediana)"
            valor={medianaEcg === null ? 'sin dato' : medianaEcg.toFixed(1)}
            unidad={medianaEcg === null ? undefined : 'min'}
            nota={`Meta de referencia IMSS: ${METAS.ecgMinutos} min`}
          />
          <Indicador
            etiqueta="Casos sin ECG documentado"
            valor={String(clinicas.ecgSinDocumentar)}
            nota="Se reportan, no se imputan"
          />
          <Indicador
            etiqueta="Hora cero a activacion (mediana)"
            valor={medianaActivacion === null ? 'sin dato' : medianaActivacion.toFixed(1)}
            unidad={medianaActivacion === null ? undefined : 'min'}
            nota="El origen de la hora cero lo fija el protocolo local"
          />
          <Indicador
            etiqueta="Codigos activos"
            valor={String(state.cases.filter((c) => c.code_state === 'activo').length)}
          />
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Indicadores de identificacion"
        ayuda="Atender sin biometria nunca es un fallo del proceso: es una de las rutas previstas."
        acciones={<Requisito ids={['RF-26', 'seccion 9.4']} />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            etiqueta="Intentos confirmados"
            valor={
              identidad.total === 0 ? 'sin dato' : `${Math.round((identidad.confirmados / identidad.total) * 100)}%`
            }
            nota={`${identidad.confirmados} de ${identidad.total} intentos`}
          />
          <Indicador
            etiqueta="Resultados ambiguos"
            valor={String(identidad.ambiguos)}
            nota="Bloquean la apertura automatica"
          />
          <Indicador etiqueta="Proveedor no disponible" valor={String(identidad.sinProveedor)} />
          <Indicador
            etiqueta="Atendidos sin biometria"
            valor={String(identidad.sinBiometria)}
            nota="Ruta prevista, no incidencia"
          />
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Lo que este prototipo NO demuestra"
        ayuda="Va en la pantalla y no en una nota al pie: un prototipo convincente puede hacer parecer resueltas decisiones que siguen abiertas."
        acciones={<Requisito ids={['seccion 12']} />}
      >
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-llano text-texto-suave">
          <li>
            No hay motor biometrico 1:N contratado ni validado. RF-09 sigue siendo un bloqueador de
            factibilidad y aqui esta simulado con candidatos escritos a mano.
          </li>
          <li>No hay integracion con el expediente clinico del ISSSTE ni contrato FHIR acordado (RF-32).</li>
          <li>
            No hay autorizacion institucional de la sede propuesta ni evaluacion de impacto en privacidad.
          </li>
          <li>
            Las latencias de las presentaciones (menos de 2 s de captura, menos de 5 s de identificacion)
            no se miden aqui: requieren hardware, poblacion y condiciones reales.
          </li>
          <li>
            La autenticacion es simulada en el navegador, con cuentas de demostracion y sin servidor. El
            &quot;ver como&quot; es una simulacion de permisos, no un control de acceso.
          </li>
        </ul>
      </Tarjeta>
    </>
  );
}
