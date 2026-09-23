'use client';

import { useState } from 'react';
import { CircleAlert, Fingerprint, Scan, TriangleAlert } from 'lucide-react';
import {
  ESCENARIOS,
  NOMBRE_ESTADO_DISPOSITIVO,
  NOMBRE_FALLO,
  NOMBRE_MODALIDAD,
  type EscenarioBiometrico,
  type Modalidad,
} from '@/lib/datos/biometria';
import { actions, useAppState } from '@/lib/estado/tienda';
import { Boton, Campo, Insignia, Requisito, Tarjeta, claseCampo, cx } from '@/components/ui/primitivos';

/**
 * Captura biométrica 1:N — RF-09, RF-31, RF-10, RNF-02, RNF-10.
 *
 * Reemplaza el botón "intentar" que antes devolvía dos candidatos escritos a mano. La
 * diferencia no es de realismo por gusto: un botón sin dispositivo, sin modalidad y sin
 * umbrales esconde exactamente las cuatro cosas que hay que evaluar antes de comprar algo.
 *
 * El recorrido se muestra por etapas porque la meta de la presentación ("menos de 2
 * segundos") no significa nada como número único: captura, comparación 1:N, confirmación
 * humana y consulta al expediente se arreglan en sitios distintos y sólo una de las cuatro
 * depende del proveedor biométrico.
 *
 * La espera visible es la latencia medida, no una animación decorativa. Si el punto de
 * control está degradado, la captura tarda de verdad, y eso es información: así se siente
 * estar de pie frente a un lector que no responde.
 */

type Fase = 'inactivo' | 'capturando' | 'comparando' | 'resuelto';

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.min(ms, 4000)));

export function CapturaBiometrica({ encounterId, conscious }: { encounterId: string; conscious: boolean }) {
  const state = useAppState();
  const [puntoId, setPuntoId] = useState<string>('pc-03');
  const [modalidad, setModalidad] = useState<Modalidad>('iris');
  const [fase, setFase] = useState<Fase>('inactivo');

  if (!state) return null;

  const { puntos, umbrales, perfiles, escenario, ultimoIntento } = state.biometria;
  const punto = puntos.find((p) => p.punto_id === puntoId);
  const perfil = perfiles.find((p) => p.modalidad === modalidad);
  const intento = ultimoIntento?.encounter_id === encounterId ? ultimoIntento : undefined;

  const modalidadesDelPunto = punto?.modalidades ?? [];
  const modalidadValida = modalidadesDelPunto.includes(modalidad);

  async function capturar() {
    setFase('capturando');
    // La acción calcula y mide todo de una vez; la interfaz reproduce después esa medición
    // por etapas. Al revés —animar primero y calcular después— los números mostrados serían
    // inventados por la animación.
    actions.capturarBiometria(encounterId, puntoId, modalidad);

    // Se lee del store recién escrito, no del `state` de este render: ese es el anterior.
    const nuevo = actions.leerUltimoIntento();
    if (!nuevo) {
      setFase('resuelto');
      return;
    }

    await espera(nuevo.captura_ms);
    if (nuevo.comparacion_ms !== undefined) {
      setFase('comparando');
      await espera(nuevo.comparacion_ms);
    }
    setFase('resuelto');
  }

  const ocupado = fase === 'capturando' || fase === 'comparando';

  return (
    <Tarjeta
      titulo="Captura biométrica 1:N (simulada)"
      ayuda="Elegir punto de control y modalidad es parte de la evaluación: un botón genérico esconde de qué depende el resultado."
      acciones={<Requisito ids={['RF-09', 'RF-31', 'RNF-10']} />}
    >
      {/* El aviso va primero y no al final: es lo que impide leer esta pantalla como una
          capacidad disponible. */}
      <div className="mb-4 flex items-start gap-3 rounded bg-aviso-suave p-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
        <p className="text-sm leading-llano text-aviso">
          <strong>Simulador.</strong> No hay motor 1:N contratado, validado ni autorizado: RF-09 sigue
          siendo un bloqueador de factibilidad del piloto. Sirve para ensayar umbrales, fallos de captura
          y latencia por etapa antes de firmar nada, no para identificar a nadie.
        </p>
      </div>

      {!conscious && (
        <p className="mb-4 rounded bg-superficie p-3 text-sm leading-llano text-texto">
          Este episodio está marcado como <strong>no puede participar</strong>. Es precisamente el caso
          que World ID no cubre y el que justifica evaluar un motor 1:N. Aun así, el mejor resultado
          posible aquí es <strong>provisional</strong>: la regla 4 de la ERS exige corroboración antes de
          abrir un expediente.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Punto de control" htmlFor="sel-punto" ayuda={punto?.ubicacion}>
          <select
            id="sel-punto"
            value={puntoId}
            onChange={(e) => setPuntoId(e.target.value)}
            className={claseCampo}
            disabled={ocupado}
          >
            {puntos.map((p) => (
              <option key={p.punto_id} value={p.punto_id}>
                {p.nombre} — {NOMBRE_ESTADO_DISPOSITIVO[p.estado]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Modalidad"
          htmlFor="sel-modalidad"
          ayuda={
            modalidadValida
              ? perfil?.habilitada
                ? undefined
                : 'Modalidad deshabilitada en la consola biométrica'
              : 'Este punto de control no tiene esta modalidad'
          }
        >
          <select
            id="sel-modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as Modalidad)}
            className={claseCampo}
            disabled={ocupado}
          >
            {(['iris', 'rostro'] as Modalidad[]).map((m) => (
              <option key={m} value={m}>
                {NOMBRE_MODALIDAD[m]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Escenario de ensayo"
          htmlFor="sel-escenario"
          ayuda="Condición que se quiere provocar. No es un ajuste de producción."
        >
          <select
            id="sel-escenario"
            value={escenario}
            onChange={(e) => actions.setEscenario(e.target.value as EscenarioBiometrico)}
            className={claseCampo}
            disabled={ocupado}
          >
            {ESCENARIOS.map((e) => (
              <option key={e.clave} value={e.clave}>
                {e.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <EscenarioActivo escenario={escenario} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton tono="primario" onClick={() => void capturar()} disabled={ocupado}>
          <Scan className="size-4" aria-hidden />
          {ocupado ? 'Capturando…' : 'Iniciar captura'}
        </Boton>
        <p className="text-xs text-texto-suave">
          Umbrales vigentes: coincidencia {umbrales.coincidencia.toFixed(2)} · ambigüedad{' '}
          {umbrales.ambiguedad.toFixed(2)} · margen {umbrales.margenDesempate.toFixed(2)} · prueba de vida{' '}
          {umbrales.pruebaDeVida ? 'activa' : 'APAGADA'}
        </p>
      </div>

      {/* WCAG 4.1.3: el avance de la captura se anuncia, no sólo se ve. */}
      <div aria-live="polite" className="mt-4">
        {ocupado && (
          <p role="status" className="text-sm font-medium text-texto">
            {fase === 'capturando'
              ? `Capturando ${NOMBRE_MODALIDAD[modalidad].toLowerCase()} en ${punto?.nombre}…`
              : 'Comparando contra la galería (1:N)…'}
          </p>
        )}
        {fase === 'resuelto' && intento && <ResultadoIntento />}
      </div>
    </Tarjeta>
  );
}

function EscenarioActivo({ escenario }: { escenario: EscenarioBiometrico }) {
  const d = ESCENARIOS.find((e) => e.clave === escenario);
  if (!d) return null;
  return (
    <div className="mt-4 rounded bg-superficie p-3">
      <p className="text-sm text-texto">
        <span className="font-medium">{d.nombre}. </span>
        {d.detalle}
      </p>
      <p className="mt-1.5 text-sm leading-llano text-texto-suave">
        <span className="font-medium text-texto">Lo que debe hacer el sistema: </span>
        {d.esperado}
      </p>
    </div>
  );
}

/** Desglose del intento: etapas medidas, calidad y el motivo en términos de los umbrales. */
function ResultadoIntento() {
  const state = useAppState();
  const intento = state?.biometria.ultimoIntento;
  if (!state || !intento) return null;

  const total = intento.captura_ms + (intento.comparacion_ms ?? 0);
  const tono =
    intento.resultado === 'provisional'
      ? 'aviso'
      : intento.resultado === 'coincidencias_multiples'
        ? 'peligro'
        : intento.resultado === 'proveedor_no_disponible'
          ? 'peligro'
          : 'neutro';

  return (
    <div className="space-y-3 rounded bg-fondo p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Insignia tono={tono}>{intento.resultado.replace(/_/g, ' ')}</Insignia>
        {intento.fallo && <Insignia tono="peligro">{NOMBRE_FALLO[intento.fallo]}</Insignia>}
        <span className="font-mono text-sm tabular-nums text-texto">
          {total} ms
          <span className="text-texto-suave"> extremo a extremo, sin confirmación humana</span>
        </span>
      </div>

      {/* Las etapas separadas son el punto de RNF-02 y RNF-10. */}
      <dl className="grid gap-2 sm:grid-cols-4">
        <Etapa nombre="Captura" ms={intento.captura_ms} responsable="Hardware y condiciones" />
        <Etapa
          nombre="Comparación 1:N"
          ms={intento.comparacion_ms}
          responsable="Motor del proveedor"
          ausente="no se comparó"
        />
        <Etapa nombre="Confirmación humana" responsable="Proceso clínico" ausente="pendiente" />
        <Etapa nombre="Consulta al expediente" responsable="Integración ECE" ausente="no aplicable aún" />
      </dl>

      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <Dato etiqueta="Calidad de captura" valor={intento.calidad === 0 ? '—' : intento.calidad.toFixed(2)} />
        <Dato
          etiqueta="Puntaje máximo"
          valor={intento.puntajeMaximo === 0 ? '—' : intento.puntajeMaximo.toFixed(2)}
        />
        <Dato etiqueta="Margen sobre el segundo" valor={intento.margen === 0 ? '—' : intento.margen.toFixed(2)} />
      </div>

      <p className="text-sm leading-llano text-texto-suave">
        <CircleAlert className="mr-1 inline size-4 text-texto" aria-hidden />
        {intento.motivo}
      </p>

      {/* Lo que un motor real NO dice, dicho aquí a propósito y sólo después del resultado. */}
      {intento.escenario === 'falso_positivo' && intento.resultado === 'provisional' && (
        <p className="rounded bg-peligro-suave p-3 text-sm leading-llano text-peligro">
          <strong>Este resultado es un falso positivo.</strong> El candidato propuesto no es la persona que
          se capturó, y nada en la respuesta del motor lo delata: puntaje alto, margen amplio y una sola
          coincidencia. Un motor real tampoco lo sabría. Es el escenario que justifica que la
          corroboración humana sea obligatoria y que una identidad 1:N nunca se dé por confirmada.
        </p>
      )}

      {intento.fallo === 'prueba_de_vida' && (
        <p className="rounded bg-aviso-suave p-3 text-sm leading-llano text-aviso">
          La prueba de vida rechazó la captura. Apagarla en la consola biométrica haría que este mismo
          intento pasara — junto con una fotografía impresa. Si en un piloto alguien la apaga &quot;para que
          funcione&quot;, eso es un hallazgo, no una configuración.
        </p>
      )}

      {intento.fallo && intento.fallo !== 'prueba_de_vida' && (
        <p className="rounded bg-superficie p-3 text-sm leading-llano text-texto-suave">
          No se comparó nada, así que esto <strong>no</strong> significa que la persona no esté enrolada.
          La ruta manual supervisada sigue disponible y el reloj clínico no se detuvo (RF-08, RNF-03).
        </p>
      )}
    </div>
  );
}

function Etapa({
  nombre,
  ms,
  responsable,
  ausente = '—',
}: {
  nombre: string;
  ms?: number;
  responsable: string;
  ausente?: string;
}) {
  return (
    <div className="rounded bg-superficie px-2.5 py-2">
      <dt className="text-xs font-medium text-texto-suave">{nombre}</dt>
      <dd className="mt-0.5 font-mono text-base tabular-nums text-texto">
        {ms === undefined ? <span className="text-sm text-texto-suave">{ausente}</span> : `${ms} ms`}
      </dd>
      <dd className="mt-0.5 text-xs text-texto-suave">{responsable}</dd>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <p className={cx('rounded bg-superficie px-2.5 py-1.5')}>
      <span className="text-texto-suave">{etiqueta}: </span>
      <span className="font-mono font-medium tabular-nums text-texto">{valor}</span>
    </p>
  );
}

export { Fingerprint as IconoBiometria };
