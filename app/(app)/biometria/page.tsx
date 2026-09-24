'use client';

/**
 * Consola biométrica — RF-09, RF-31, RNF-02, RNF-10, CA-13.
 *
 * Es la pantalla que el documento pide y que ninguna presentación de proveedor trae: el
 * inventario real de los cinco puntos de control, los umbrales que alguien tiene que
 * decidir, las tasas de error declaradas frente a las medidas (vacías), y la latencia
 * desglosada por etapa.
 *
 * Su función en una reunión es incómoda a propósito. Cuando alguien enseña "identificación
 * en menos de dos segundos", aquí se puede preguntar: ¿medido con qué dispositivo, con qué
 * umbral, con cuántos registros en la galería, y contando qué de las cuatro etapas?
 */
import { Eye, Gauge, ScanFace, TriangleAlert, Wrench } from 'lucide-react';
import {
  ESCENARIOS,
  NOMBRE_ESTADO_DISPOSITIVO,
  NOMBRE_ETAPA,
  NOMBRE_FALLO,
  NOMBRE_MODALIDAD,
  RESPONSABLE_ETAPA,
  type EstadoDispositivo,
  type EtapaMedicion,
  type MedicionBiometrica,
  type Modalidad,
  type UmbralesMotor,
} from '@/lib/datos/biometria';
import { percentil } from '@/lib/dominio/motor-biometrico';
import { actions, useAppState, userById } from '@/lib/estado/tienda';
import {
  Boton,
  Campo,
  Encabezado,
  Indicador,
  Insignia,
  Requisito,
  Tabla,
  Tarjeta,
  Vacio,
  claseCampo,
} from '@/components/ui/primitivos';
import { localDateTime } from '@/lib/tiempo';
import { BarrasHorizontales } from '@/components/dominio/graficas';
import { PlanoUrgencias } from '@/components/dominio/mapas';

const ESTADOS: EstadoDispositivo[] = ['en_linea', 'degradado', 'fuera_de_linea', 'sin_calibrar'];

/** Punto de color del estado del dispositivo (mismos rellenos que el plano). */
const PUNTO_ESTADO: Record<EstadoDispositivo, string> = {
  en_linea: 'bg-grafica-bueno',
  degradado: 'bg-grafica-aviso',
  sin_calibrar: 'bg-grafica-critico',
  fuera_de_linea: 'bg-grafica-critico',
};

const ETAPAS: EtapaMedicion[] = ['captura_ms', 'comparacion_ms', 'confirmacion_humana_ms', 'consulta_ece_ms'];

/** Los tres umbrales que cambian el desenlace clínico, con su consecuencia escrita. */
const UMBRALES_EDITABLES: Array<{
  clave: keyof Pick<UmbralesMotor, 'coincidencia' | 'ambiguedad' | 'margenDesempate' | 'calidadMinima'>;
  etiqueta: string;
  consecuencia: string;
}> = [
  {
    clave: 'coincidencia',
    etiqueta: 'Umbral de coincidencia',
    consecuencia: 'Bajarlo produce más candidatos únicos, y con ellos más vinculaciones incorrectas.',
  },
  {
    clave: 'ambiguedad',
    etiqueta: 'Umbral de ambigüedad',
    consecuencia: 'Subirlo esconde candidatos que sí debían revisarse; bajarlo llena la pantalla de ruido.',
  },
  {
    clave: 'margenDesempate',
    etiqueta: 'Margen de desempate',
    consecuencia: 'En cero, dos puntajes casi iguales se resuelven por el orden de la lista: azar disfrazado.',
  },
  {
    clave: 'calidadMinima',
    etiqueta: 'Calidad mínima de captura',
    consecuencia: 'Bajarla deja pasar capturas malas al motor, que devuelve un puntaje igual y parece un resultado.',
  },
];

function msDe(m: MedicionBiometrica, etapa: EtapaMedicion): number | undefined {
  return m[etapa];
}

export default function ConsolaBiometrica() {
  const state = useAppState();
  if (!state) return null;

  const { puntos, umbrales, perfiles, escenario, mediciones } = state.biometria;
  const conFallo = mediciones.filter((m) => m.fallo !== undefined);
  const ambiguos = mediciones.filter((m) => m.resultado === 'coincidencias_multiples');
  const sinCalibrar = puntos.filter((p) => p.estado === 'sin_calibrar' || !p.calibrado_en);

  return (
    <>
      <Encabezado
        titulo="Consola biométrica"
        descripcion="Inventario de los puntos de control, política de umbrales y latencia medida por etapa. Todo simulado."
        requisitos={['RF-09', 'RF-31', 'RNF-02', 'RNF-10']}
      />

      <div className="flex items-start gap-3 rounded-xl bg-aviso-suave p-4">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
        <div className="text-sm leading-llano text-aviso">
          <p>
            <strong>RF-09 es un bloqueador de factibilidad, no una función disponible.</strong> No hay
            motor 1:N contratado, validado ni autorizado, y las presentaciones nombran “Orbit” sin
            fabricante, modelo, SDK ni contrato. Tampoco hay evidencia de que los lectores presupuestados
            sean compatibles con el Orb de World ID: son dos integraciones distintas hasta que una
            demostración técnica pruebe lo contrario.
          </p>
          <p className="mt-2">
            Esta consola existe para ensayar antes de comprar: qué pasa cuando la captura falla, cómo
            cambia el resultado al mover un umbral, y cuánto de la latencia prometida depende realmente
            del proveedor.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          etiqueta="Puntos de control"
          valor={`${puntos.filter((p) => p.estado === 'en_linea').length}/${puntos.length}`}
          nota="En línea sobre el inventario propuesto"
        />
        <Indicador etiqueta="Intentos del turno" valor={String(mediciones.length)} />
        <Indicador
          etiqueta="Fallos de captura"
          valor={String(conFallo.length)}
          nota="No llegaron al motor"
        />
        <Indicador
          etiqueta="Resultados ambiguos"
          valor={String(ambiguos.length)}
          nota="Apertura automática bloqueada"
        />
      </div>

      {sinCalibrar.length > 0 && (
        <p className="rounded bg-aviso-suave px-3 py-2 text-sm text-aviso">
          {sinCalibrar.length} punto(s) sin calibración vigente. CA-13 exige que se reporte y que ninguna
          caída bloquee urgencias: la ruta manual supervisada sigue disponible.
        </p>
      )}

      {/* ------------------------------------------------------------- RF-31 */}
      <Tarjeta
        titulo="Puntos de control del piloto"
        ayuda="Cuatro estaciones de escritorio y una de alta concurrencia, según el inventario de la presentación. Modelo y serie son marcadores de posición: no hay compra ni prueba de compatibilidad."
        acciones={<Requisito ids={['RF-31', 'CA-13']} />}
      >
        <PlanoUrgencias puntos={puntos} />
        <h3 className="mt-8 mb-3 text-sm font-medium text-texto">Inventario y estado de cada punto</h3>
        <ul className="space-y-3">
          {puntos.map((p) => (
            <li key={p.punto_id} className="rounded bg-superficie p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-texto">
                    {p.nombre}
                    <span className="ml-2 font-normal text-texto-suave">
                      · {p.tipo === 'escritorio' ? 'escritorio' : 'alta concurrencia'}
                    </span>
                  </h3>
                  <p className="text-xs text-texto-suave">{p.ubicacion}</p>
                  <p className="mt-1 font-mono text-xs text-texto-suave">
                    {p.modelo} · serie {p.serie}
                  </p>
                  <p className="mt-1 text-xs text-texto-suave">
                    Modalidades: {p.modalidades.map((m) => NOMBRE_MODALIDAD[m]).join(', ')} · Calibración:{' '}
                    {p.calibrado_en ? localDateTime(p.calibrado_en) : 'nunca'} · Operador:{' '}
                    {userById(state, p.operador_id)?.name ?? 'sin asignar'}
                  </p>
                </div>

                {/* Un solo indicador de estado: el punto de color y el selector, que ya lo nombra. */}
                <div className="flex flex-wrap items-center gap-2">
                  <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${PUNTO_ESTADO[p.estado]}`} />
                  <label className="sr-only" htmlFor={`estado-${p.punto_id}`}>
                    Estado simulado de {p.nombre}
                  </label>
                  <select
                    id={`estado-${p.punto_id}`}
                    value={p.estado}
                    onChange={(e) => actions.setEstadoDispositivo(p.punto_id, e.target.value as EstadoDispositivo)}
                    className="min-h-control rounded border border-borde bg-fondo pl-3 text-sm text-texto"
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>
                        {NOMBRE_ESTADO_DISPOSITIVO[s]}
                      </option>
                    ))}
                  </select>
                  <Boton tono="contorno" onClick={() => actions.calibrarDispositivo(p.punto_id)}>
                    <Wrench className="size-4" aria-hidden />
                    Calibrar
                  </Boton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Tarjeta>

      {/* ------------------------------------------------------------- RF-09 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta
          titulo="Política de umbrales"
          ayuda="Es una decisión del hospital, no del proveedor ni del programador: controla el riesgo de mostrar el expediente de otra persona."
          acciones={<Requisito ids={['RF-09', 'RF-10']} />}
        >
          <div className="space-y-4">
            {UMBRALES_EDITABLES.map((u) => (
              <Campo key={u.clave} etiqueta={u.etiqueta} htmlFor={`u-${u.clave}`} ayuda={u.consecuencia}>
                <div className="flex items-center gap-3">
                  <input
                    id={`u-${u.clave}`}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={umbrales[u.clave]}
                    onChange={(e) => actions.setUmbral(u.clave, Number(e.target.value))}
                    className="h-2 flex-1"
                  />
                  <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-texto">
                    {umbrales[u.clave].toFixed(2)}
                  </span>
                </div>
              </Campo>
            ))}

            <div className="rounded bg-superficie p-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={umbrales.pruebaDeVida}
                  onChange={(e) => actions.setUmbral('pruebaDeVida', e.target.checked)}
                  className="mt-0.5 size-5 shrink-0"
                />
                <span>
                  <span className="font-medium text-texto">Prueba de vida activa</span>
                  <span className="mt-0.5 block leading-llano text-texto-suave">
                    Apagarla sube la tasa de aceptación y deja pasar una fotografía impresa. Si en un
                    piloto alguien la apaga “para que funcione”, eso es un hallazgo, no una configuración.
                  </span>
                </span>
              </label>
              {!umbrales.pruebaDeVida && (
                <p className="mt-2 rounded bg-peligro-suave px-2.5 py-1.5 text-sm font-medium text-peligro">
                  Prueba de vida APAGADA.
                </p>
              )}
            </div>
          </div>
        </Tarjeta>

        <Tarjeta
          titulo="Modalidades"
          ayuda="RF-09 exige evaluar iris y rostro por separado y habilitar sólo las que superen validación clínica, legal y de seguridad."
          acciones={<Requisito ids={['RF-09']} />}
        >
          <ul className="space-y-3">
            {perfiles.map((p) => (
              <li key={p.modalidad} className="rounded bg-superficie p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-texto">
                    {p.modalidad === 'iris' ? (
                      <Eye className="mr-1.5 inline size-4 text-texto" aria-hidden />
                    ) : (
                      <ScanFace className="mr-1.5 inline size-4 text-texto" aria-hidden />
                    )}
                    {NOMBRE_MODALIDAD[p.modalidad]}
                  </h3>
                  <label className="flex items-center gap-2 text-sm text-texto">
                    <input
                      type="checkbox"
                      checked={p.habilitada}
                      onChange={(e) => actions.habilitarModalidad(p.modalidad, e.target.checked)}
                      className="size-5"
                    />
                    Habilitada en el simulador
                  </label>
                </div>

                <dl className="mt-2 grid gap-1.5 text-xs">
                  <div>
                    <dt className="inline font-medium text-texto">FAR declarado: </dt>
                    <dd className="inline text-texto-suave">{p.farDeclarado}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-texto">FRR declarado: </dt>
                    <dd className="inline text-texto-suave">{p.frrDeclarado}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-texto">Medido en sede: </dt>
                    <dd className="inline">
                      {p.farMedido === null && p.frrMedido === null ? (
                        <span className="font-medium text-aviso">sin medir</span>
                      ) : (
                        <span className="text-texto-suave">
                          FAR {p.farMedido} · FRR {p.frrMedido}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 text-xs leading-llano text-texto-suave">{p.notaValidacion}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-llano text-texto-suave">
            “Habilitada en el simulador” no es “validada”. La validación exige ensayo con la población y
            las condiciones reales de urgencias, metodología del proveedor y resultados independientes.
          </p>
        </Tarjeta>
      </div>

      {/* ------------------------------------------------ RNF-02 y RNF-10 */}
      <Tarjeta
        titulo="Latencia por etapa"
        ayuda="La meta de la presentación no significa nada como número único: cada etapa se arregla en un sitio distinto y sólo una depende del proveedor."
        acciones={<Requisito ids={['RNF-02', 'RNF-10']} />}
      >
        {mediciones.length === 0 ? (
          <Vacio>
            Sin intentos en este turno. Haga una captura desde la pestaña Identidad de cualquier episodio.
          </Vacio>
        ) : (
          <>
          {/* Mediana (p50) por etapa. Sin meta: la tabla de abajo es su vista de tabla. */}
          <div className="mb-8">
            <BarrasHorizontales
              tabla={false}
              unidad="ms"
              formato={(v) => `${Math.round(v)} ms`}
              descripcion="Latencia mediana por etapa de la identificacion biometrica, en milisegundos"
              datos={ETAPAS.map((etapa) => ({
                clave: etapa,
                etiqueta: NOMBRE_ETAPA[etapa],
                valor: percentil(
                  mediciones.map((m) => msDe(m, etapa)).filter((v): v is number => v !== undefined),
                  0.5,
                ),
              }))}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-borde-suave text-xs text-texto-suave">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Etapa
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    n
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    p50
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    p95
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    p99
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    De quién depende
                  </th>
                </tr>
              </thead>
              <tbody>
                {ETAPAS.map((etapa) => {
                  const valores = mediciones
                    .map((m) => msDe(m, etapa))
                    .filter((v): v is number => v !== undefined);
                  const p50 = percentil(valores, 0.5);
                  const p95 = percentil(valores, 0.95);
                  const p99 = percentil(valores, 0.99);
                  return (
                    <tr key={etapa} className="border-t border-borde-suave">
                      <td className="py-2 pr-3 font-medium text-texto">{NOMBRE_ETAPA[etapa]}</td>
                      <td className="py-2 pr-3 tabular-nums text-texto-suave">{valores.length}</td>
                      {[p50, p95, p99].map((v, i) => (
                        <td key={i} className="py-2 pr-3 tabular-nums text-texto">
                          {v === null ? <span className="text-texto-suave">sin dato</span> : `${Math.round(v)} ms`}
                        </td>
                      ))}
                      <td className="py-2 text-xs text-texto-suave">{RESPONSABLE_ETAPA[etapa]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        <p className="mt-3 flex items-start gap-2 text-sm leading-llano text-texto-suave">
          <Gauge className="mt-0.5 size-4 shrink-0 text-texto" aria-hidden />
          La consulta al expediente aparece “sin dato” mientras no se lea un ECE en un episodio con
          identidad resuelta. Es correcto que esté vacía: reportar un total sin esa etapa sería reportar
          un recorrido que nadie recorrió.
        </p>
      </Tarjeta>

      {/* ------------------------------------------------------- bitácora */}
      <Tarjeta
        titulo="Intentos registrados"
        ayuda="Sin imágenes ni plantillas: sólo la referencia del punto de control, el resultado y las etapas medidas (regla 5 de privacidad)."
        acciones={<Requisito ids={['RF-09', 'RF-23']} />}
      >
        {mediciones.length === 0 ? (
          <Vacio>Sin intentos en este turno.</Vacio>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Tabla
              cabeceras={['Hora', 'Punto', 'Modalidad', 'Escenario', 'Calidad', 'Captura', 'Comparación', 'Resultado']}
            >
              {mediciones.map((m) => (
                <tr key={m.medicion_id} className="border-t border-borde-suave align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-xs tabular-nums text-texto-suave">
                    {localDateTime(m.at)}
                  </td>
                  <td className="py-2 pr-3 text-xs text-texto">
                    {puntos.find((p) => p.punto_id === m.punto_id)?.nombre ?? m.punto_id}
                  </td>
                  <td className="py-2 pr-3 text-xs text-texto">{NOMBRE_MODALIDAD[m.modalidad as Modalidad]}</td>
                  <td className="py-2 pr-3 text-xs text-texto-suave">
                    {ESCENARIOS.find((e) => e.clave === m.escenario)?.nombre ?? m.escenario}
                  </td>
                  <td className="py-2 pr-3 text-xs tabular-nums text-texto">
                    {m.calidad === 0 ? '—' : m.calidad.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3 text-xs tabular-nums text-texto">{m.captura_ms} ms</td>
                  <td className="py-2 pr-3 text-xs tabular-nums text-texto">
                    {m.comparacion_ms === undefined ? '—' : `${m.comparacion_ms} ms`}
                  </td>
                  <td className="py-2">
                    <Insignia
                      tono={
                        m.resultado === 'provisional'
                          ? 'aviso'
                          : m.resultado === 'coincidencias_multiples'
                            ? 'peligro'
                            : 'neutro'
                      }
                    >
                      {m.resultado.replace(/_/g, ' ')}
                    </Insignia>
                    {m.fallo && <Insignia tono="peligro">{NOMBRE_FALLO[m.fallo]}</Insignia>}
                  </td>
                </tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Escenario de ensayo en curso" acciones={<Requisito ids={['RF-09', 'CA-05']} />}>
        <Campo
          etiqueta="Escenario"
          htmlFor="sel-escenario-consola"
          ayuda="Se aplica al siguiente intento, desde cualquier episodio."
        >
          <select
            id="sel-escenario-consola"
            value={escenario}
            onChange={(e) => actions.setEscenario(e.target.value as typeof escenario)}
            className={claseCampo}
          >
            {ESCENARIOS.map((e) => (
              <option key={e.clave} value={e.clave}>
                {e.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <ul className="mt-4 space-y-2">
          {ESCENARIOS.map((e) => (
            <li
              key={e.clave}
              className={
                e.clave === escenario
                  ? 'rounded bg-fondo p-3 ring-2 ring-inset ring-texto'
                  : 'rounded bg-superficie p-3'
              }
            >
              <p className="text-sm font-medium text-texto">{e.nombre}</p>
              <p className="mt-0.5 text-sm leading-llano text-texto-suave">{e.detalle}</p>
              <p className="mt-1 text-sm leading-llano text-texto-suave">
                <span className="font-medium text-texto">Debe hacer: </span>
                {e.esperado}
              </p>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </>
  );
}
