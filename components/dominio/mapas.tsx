'use client';

import { useEffect, useState } from 'react';
import { NOMBRE_ESTADO_DISPOSITIVO, type EstadoDispositivo, type PuntoDeControl } from '@/lib/datos/biometria';
import type { ResourceResponse } from '@/lib/datos/tipos';
import { cx } from '@/components/ui/primitivos';
import { VistaTabla } from '@/components/dominio/graficas';

/**
 * Mapas esquematicos del panel, en SVG propio (sin teselas ni red: funcionan sin internet).
 * NO son planos a escala: ubican cada cosa en su zona para que se lea de un vistazo donde
 * esta el problema. Lo dicen en pantalla.
 *
 * Mismas reglas que las graficas (`graficas.tsx`): color de estado solo donde es estado y
 * siempre con texto, capa de hover y foco en cada marcador, y vista de tabla gemela. En un
 * telefono cada mapa se desplaza en horizontal dentro de su propio contenedor, para que el
 * texto no se encoja hasta ser ilegible.
 */

type Relleno = 'bueno' | 'aviso' | 'critico' | 'neutro';

const FILL: Record<Relleno, string> = {
  bueno: 'fill-grafica-bueno',
  aviso: 'fill-grafica-aviso',
  critico: 'fill-grafica-critico',
  neutro: 'fill-borde',
};

const FONDO: Record<Relleno, string> = {
  bueno: 'bg-grafica-bueno',
  aviso: 'bg-grafica-aviso',
  critico: 'bg-grafica-critico',
  neutro: 'bg-borde',
};

/** `true` si la persona pidio movimiento reducido. Se lee en el cliente, despues de montar. */
function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(true);
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const actualizar = () => setReducido(consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);
  return reducido;
}

function Leyenda({ items }: { items: readonly { relleno: Relleno; texto: string }[] }) {
  return (
    <ul aria-hidden className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-texto-suave">
      {items.map((i) => (
        <li key={i.texto} className="flex items-center gap-1.5">
          <span className={cx('size-2.5 rounded-full', FONDO[i.relleno])} />
          {i.texto}
        </li>
      ))}
    </ul>
  );
}

/** Globo de un marcador, posicionado en % del lienzo del mapa. */
function GloboMapa({ x, y, titulo, lineas }: { x: number; y: number; titulo: string; lineas: readonly string[] }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+1.25rem)] rounded bg-texto px-3 py-2 text-xs whitespace-nowrap text-primario-texto"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span className="block font-medium">{titulo}</span>
      {lineas.map((l) => (
        <span key={l} className="block text-primario-texto/80">
          {l}
        </span>
      ))}
    </span>
  );
}

/* ---------------------------------------------------------- Plano de urgencias */

const ANCHO_PLANO = 800;
const ALTO_PLANO = 440;

/** Posicion ilustrativa de cada punto de control dentro de su zona. */
const POSICION_PUNTO: Record<string, { x: number; y: number }> = {
  'pc-01': { x: 95, y: 120 },
  'pc-02': { x: 245, y: 120 },
  'pc-03': { x: 450, y: 120 },
  'pc-04': { x: 670, y: 120 },
  'pc-05': { x: 400, y: 262 },
};

const ZONAS = [
  { nombre: 'Admision Central', x: 20, y: 20, w: 300, h: 190 },
  { nombre: 'Urgencias · triage', x: 340, y: 20, w: 220, h: 190 },
  { nombre: 'Sala de choque', x: 580, y: 20, w: 200, h: 190 },
  { nombre: 'Acceso Admision · Urgencias', x: 20, y: 230, w: 760, h: 64 },
  { nombre: 'Sala de espera', x: 20, y: 314, w: 360, h: 106 },
  { nombre: 'Observacion', x: 400, y: 314, w: 380, h: 106 },
] as const;

/** "Urgencias — triage" ya esta dentro de la zona Urgencias: en el plano basta "Triage". */
function nombreCorto(nombre: string): string {
  const corto = nombre.replace(/^Urgencias — /, '');
  return corto.charAt(0).toUpperCase() + corto.slice(1);
}

function rellenoDispositivo(estado: EstadoDispositivo): Relleno {
  if (estado === 'en_linea') return 'bueno';
  if (estado === 'degradado') return 'aviso';
  return 'critico';
}

/**
 * Plano esquematico de urgencias con los puntos de control biometricos y su estado. Lo que
 * NO esta en linea lleva un halo que late: es lo unico del plano que pide atencion.
 */
export function PlanoUrgencias({ puntos }: { puntos: readonly PuntoDeControl[] }) {
  const [activo, setActivo] = useState<string | null>(null);
  const marcado = puntos.find((p) => p.punto_id === activo);
  const posMarcado = marcado ? POSICION_PUNTO[marcado.punto_id] : undefined;

  return (
    <figure>
      <figcaption className="sr-only">
        Plano esquematico de urgencias con {puntos.length} puntos de control biometricos y su estado.
      </figcaption>
      <div className="overflow-x-auto">
        {/* Ancho de diseño como tope: estirado, el texto del SVG crece con el. */}
        <div className="relative mx-auto max-w-[50rem] min-w-[40rem]">
          <svg viewBox={`0 0 ${ANCHO_PLANO} ${ALTO_PLANO}`} className="block w-full" aria-hidden>
            {ZONAS.map((z) => (
              <g key={z.nombre}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} className="fill-superficie" />
                <text x={z.x + 16} y={z.y + 26} className="fill-texto-suave text-[14px]">
                  {z.nombre}
                </text>
              </g>
            ))}
            {puntos.map((p) => {
              const pos = POSICION_PUNTO[p.punto_id];
              if (!pos) return null;
              const relleno = rellenoDispositivo(p.estado);
              const alta = p.tipo === 'alta_concurrencia';
              return (
                <g key={p.punto_id}>
                  {relleno !== 'bueno' && (
                    <circle cx={pos.x} cy={pos.y} r={18} fillOpacity={0.25} className={cx('pulso-vivo', FILL[relleno])} />
                  )}
                  {alta ? (
                    <rect
                      x={pos.x - 10}
                      y={pos.y - 10}
                      width={20}
                      height={20}
                      rx={4}
                      strokeWidth={3}
                      className={cx('stroke-superficie', FILL[relleno])}
                    />
                  ) : (
                    <circle cx={pos.x} cy={pos.y} r={10} strokeWidth={3} className={cx('stroke-superficie', FILL[relleno])} />
                  )}
                  {/* En el pasillo la etiqueta va a la derecha: abajo se saldria de la franja. */}
                  <text
                    x={alta ? pos.x + 24 : pos.x}
                    y={alta ? pos.y - 3 : pos.y + 34}
                    textAnchor={alta ? 'start' : 'middle'}
                    className="fill-texto text-[15px] font-medium"
                  >
                    {nombreCorto(p.nombre)}
                  </text>
                  <text
                    x={alta ? pos.x + 24 : pos.x}
                    y={alta ? pos.y + 14 : pos.y + 51}
                    textAnchor={alta ? 'start' : 'middle'}
                    className="fill-texto-suave text-[13px]"
                  >
                    {NOMBRE_ESTADO_DISPOSITIVO[p.estado]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Objetivos de hover y foco: 44 px, mas grandes que el marcador. */}
          {puntos.map((p) => {
            const pos = POSICION_PUNTO[p.punto_id];
            if (!pos) return null;
            return (
              <button
                key={p.punto_id}
                type="button"
                aria-label={`${p.nombre}, ${p.ubicacion}: ${NOMBRE_ESTADO_DISPOSITIVO[p.estado]}`}
                onPointerEnter={() => setActivo(p.punto_id)}
                onPointerLeave={() => setActivo((a) => (a === p.punto_id ? null : a))}
                onFocus={() => setActivo(p.punto_id)}
                onBlur={() => setActivo((a) => (a === p.punto_id ? null : a))}
                className="absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full"
                style={{ left: `${(pos.x / ANCHO_PLANO) * 100}%`, top: `${(pos.y / ALTO_PLANO) * 100}%` }}
              />
            );
          })}

          {marcado && posMarcado && (
            <GloboMapa
              x={(posMarcado.x / ANCHO_PLANO) * 100}
              y={(posMarcado.y / ALTO_PLANO) * 100}
              titulo={marcado.nombre}
              lineas={[marcado.ubicacion, NOMBRE_ESTADO_DISPOSITIVO[marcado.estado]]}
            />
          )}
        </div>
      </div>

      <Leyenda
        items={[
          { relleno: 'bueno', texto: 'En linea' },
          { relleno: 'aviso', texto: 'Degradado' },
          { relleno: 'critico', texto: 'Sin calibrar o fuera de linea' },
        ]}
      />
      <p className="mt-2 text-xs text-texto-suave">
        Esquema ilustrativo, no a escala. El cuadro es el punto de alta concurrencia; los circulos, lectores de escritorio.
      </p>

      <VistaTabla
        cabeceras={['Punto', 'Ubicacion', 'Estado']}
        filas={puntos.map((p) => [p.nombre, p.ubicacion, NOMBRE_ESTADO_DISPOSITIVO[p.estado]])}
      />
    </figure>
  );
}

/* ---------------------------------------------------------- Red de atencion */

const ANCHO_RED = 800;
const ALTO_RED = 280;

const NODO = {
  urgencias: { x: 200, y: 170 },
  sala: { x: 420, y: 90 },
  referencia: { x: 690, y: 200 },
} as const;

const RUTA_SALA = `M${NODO.urgencias.x} ${NODO.urgencias.y} C 300 170 330 90 ${NODO.sala.x} ${NODO.sala.y}`;
const RUTA_TRASLADO = `M${NODO.urgencias.x} ${NODO.urgencias.y} C 360 270 520 270 ${NODO.referencia.x} ${NODO.referencia.y}`;

const TEXTO_DECISION: Record<ResourceResponse['decision'], string> = {
  aceptado: 'aceptado',
  pendiente: 'pendiente',
  rechazado: 'rechazado',
};

function rellenoDecision(r?: ResourceResponse): Relleno {
  if (!r) return 'neutro';
  return r.decision === 'aceptado' ? 'bueno' : r.decision === 'rechazado' ? 'critico' : 'aviso';
}

/** Trazo de la ruta segun la decision: firme si se acepto, tenue si espera, rojo si se rechazo. */
function trazoDecision(r?: ResourceResponse): { clase: string; opacidad: number } {
  if (!r) return { clase: 'stroke-borde-suave', opacidad: 1 };
  if (r.decision === 'aceptado') return { clase: 'stroke-texto', opacidad: 1 };
  if (r.decision === 'rechazado') return { clase: 'stroke-grafica-critico', opacidad: 1 };
  return { clase: 'stroke-texto', opacidad: 0.3 };
}

/** La ultima respuesta de cada tipo de recurso: es la que vale. */
function ultima(recursos: readonly ResourceResponse[], tipo: ResourceResponse['kind']) {
  return [...recursos]
    .filter((r) => r.kind === tipo)
    .sort((a, b) => (a.decided_at ?? '').localeCompare(b.decided_at ?? ''))
    .at(-1);
}

/**
 * Red de atencion de un caso: urgencias, la sala de hemodinamia propia y el centro de
 * referencia por ambulancia. Con la ambulancia aceptada, un punto recorre la ruta (salvo con
 * movimiento reducido): dice "hay un traslado en marcha" sin otra palabra.
 */
export function RedDeAtencion({ recursos }: { recursos: readonly ResourceResponse[] }) {
  const reducido = useMovimientoReducido();
  const [activo, setActivo] = useState<'sala' | 'referencia' | null>(null);
  const sala = ultima(recursos, 'sala_hemodinamia');
  const ambulancia = ultima(recursos, 'ambulancia');
  const trasladoEnMarcha = ambulancia?.decision === 'aceptado';

  const nodos = [
    {
      clave: 'sala' as const,
      ...NODO.sala,
      titulo: 'Sala de hemodinamia',
      recurso: sala,
      detalle: sala ? `${sala.label} · ${TEXTO_DECISION[sala.decision]}` : 'sin solicitud',
    },
    {
      clave: 'referencia' as const,
      ...NODO.referencia,
      titulo: 'Centro de referencia',
      recurso: ambulancia,
      detalle: ambulancia ? `${ambulancia.label} · ${TEXTO_DECISION[ambulancia.decision]}` : 'sin traslado',
    },
  ];
  const marcado = nodos.find((n) => n.clave === activo);

  return (
    <figure>
      <figcaption className="sr-only">
        Red de atencion del caso: sala de hemodinamia {nodos[0].detalle}; traslado a centro de referencia {nodos[1].detalle}.
      </figcaption>
      <div className="overflow-x-auto">
        <div className="relative mx-auto max-w-[50rem] min-w-[36rem]">
          <svg viewBox={`0 0 ${ANCHO_RED} ${ALTO_RED}`} className="block w-full" aria-hidden>
            {[
              { d: RUTA_SALA, r: sala },
              { d: RUTA_TRASLADO, r: ambulancia },
            ].map(({ d, r }) => {
              const t = trazoDecision(r);
              return (
                <path
                  key={d}
                  d={d}
                  fill="none"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeOpacity={t.opacidad}
                  className={t.clase}
                />
              );
            })}

            {/*
              Con movimiento reducido la ambulancia queda quieta a media ruta: el punto medio de
              la curva de Bezier, (P0 + 3 P1 + 3 P2 + P3) / 8 = (441, 249).
            */}
            {trasladoEnMarcha &&
              (reducido ? (
                <circle cx={441} cy={249} r={8} strokeWidth={3} className="fill-fondo stroke-texto" />
              ) : (
                // Ficha blanca con aro Carbon: sobre la ruta Carbon, un punto del mismo color no se ve.
                <circle r={8} strokeWidth={3} className="fill-fondo stroke-texto">
                  <animateMotion dur="9s" repeatCount="indefinite" path={RUTA_TRASLADO} />
                </circle>
              ))}

            {/* Origen: urgencias, siempre Carbon. */}
            <circle cx={NODO.urgencias.x} cy={NODO.urgencias.y} r={12} strokeWidth={3} className="fill-texto stroke-fondo" />
            {/* Etiquetas del origen a la izquierda: las dos rutas salen hacia la derecha. */}
            <text x={NODO.urgencias.x - 24} y={NODO.urgencias.y - 2} textAnchor="end" className="fill-texto text-[17px] font-medium">
              Urgencias HRLAM
            </text>
            <text x={NODO.urgencias.x - 24} y={NODO.urgencias.y + 18} textAnchor="end" className="fill-texto-suave text-[15px]">
              origen del caso
            </text>

            {nodos.map((n) => (
              <g key={n.clave}>
                <circle cx={n.x} cy={n.y} r={11} strokeWidth={3} className={cx('stroke-fondo', FILL[rellenoDecision(n.recurso)])} />
                {/* Titulo y detalle por encima del nodo: las rutas llegan por la izquierda y por abajo. */}
                <text x={n.x} y={n.y - 44} textAnchor="middle" className="fill-texto text-[17px] font-medium">
                  {n.titulo}
                </text>
                <text x={n.x} y={n.y - 22} textAnchor="middle" className="fill-texto-suave text-[15px]">
                  {n.detalle}
                </text>
              </g>
            ))}
          </svg>

          {nodos.map((n) => (
            <button
              key={n.clave}
              type="button"
              aria-label={`${n.titulo}: ${n.detalle}`}
              onPointerEnter={() => setActivo(n.clave)}
              onPointerLeave={() => setActivo((a) => (a === n.clave ? null : a))}
              onFocus={() => setActivo(n.clave)}
              onBlur={() => setActivo((a) => (a === n.clave ? null : a))}
              className="absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full"
              style={{ left: `${(n.x / ANCHO_RED) * 100}%`, top: `${(n.y / ALTO_RED) * 100}%` }}
            />
          ))}

          {marcado && (
            <GloboMapa
              x={(marcado.x / ANCHO_RED) * 100}
              y={(marcado.y / ALTO_RED) * 100}
              titulo={marcado.titulo}
              lineas={[marcado.detalle, ...(marcado.recurso?.reason ? [`motivo: ${marcado.recurso.reason}`] : [])]}
            />
          )}
        </div>
      </div>

      <Leyenda
        items={[
          { relleno: 'bueno', texto: 'Aceptado' },
          { relleno: 'aviso', texto: 'Pendiente' },
          { relleno: 'critico', texto: 'Rechazado' },
          { relleno: 'neutro', texto: 'Sin solicitud' },
        ]}
      />
      <p className="mt-2 text-xs text-texto-suave">Esquema de la red, no a escala ni geografico.</p>

      <VistaTabla
        cabeceras={['Destino', 'Recurso', 'Decision']}
        filas={[
          ['Sala de hemodinamia', sala?.label ?? 'sin solicitud', sala ? TEXTO_DECISION[sala.decision] : '-'],
          ['Centro de referencia', ambulancia?.label ?? 'sin traslado', ambulancia ? TEXTO_DECISION[ambulancia.decision] : '-'],
        ]}
      />
    </figure>
  );
}
