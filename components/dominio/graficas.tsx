'use client';

import { useState, type ReactNode } from 'react';
import { cx } from '@/components/ui/primitivos';

/**
 * Graficas del panel, en HTML y SVG propios: sin libreria ni CDN, asi que funcionan en una
 * sala sin internet. Siguen la skill `dataviz`:
 *
 * - Marcas delgadas (barras de 14 px, linea de 2 px), extremo de dato redondeado a 4 px y
 *   cuadrado en la linea base; rejilla en filete solido de 1 px, recesiva.
 * - Una serie = un color y sin caja de leyenda (el titulo la nombra). El color de ESTADO
 *   (bueno / aviso / critico) solo aparece donde significa estado, y siempre con texto.
 * - Etiquetas selectivas: el valor en la punta de cada barra, nunca un numero en cada punto.
 * - Capa de hover y FOCO en cada marca (el objetivo es la fila entera, no los pixeles de la
 *   barra) y una vista de tabla gemela: ningun valor queda escondido detras del puntero.
 * - Las barras crecen una vez desde su base (`.crecer-x`); con movimiento reducido no.
 */

/** Tope "redondo" de la escala: 10, 15, 20, 30, 45, 60, 90, 120... */
function topeRedondo(valor: number): number {
  const pasos = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 600, 900, 1200, 1800, 2400, 3600];
  return pasos.find((p) => p >= valor) ?? Math.ceil(valor / 600) * 600;
}

/** Cuatro o cinco marcas limpias entre 0 y el tope. */
function marcas(tope: number): number[] {
  const paso = tope <= 20 ? 5 : tope <= 60 ? 15 : tope <= 120 ? 30 : tope / 4;
  const salida: number[] = [];
  for (let v = 0; v <= tope + 1e-9; v += paso) salida.push(Math.round(v));
  return salida;
}

/* ------------------------------------------------------------------ Tabla gemela */

/**
 * Vista de tabla de una grafica. Es el equivalente accesible y el "desborde" de cualquier
 * valor que no cupo como etiqueta: plegada por omision, a un clic de distancia.
 */
export function VistaTabla({
  cabeceras,
  filas,
}: {
  cabeceras: readonly string[];
  filas: readonly (readonly ReactNode[])[];
}) {
  return (
    <details className="group mt-5">
      <summary className="control inline-flex cursor-pointer items-center rounded text-xs font-medium text-texto-suave underline-offset-2 hover:text-texto hover:underline">
        Ver como tabla
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-texto-suave">
            <tr>
              {cabeceras.map((c) => (
                <th key={c} scope="col" className="border-b border-borde-suave py-2 pr-4 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="border-b border-borde-suave last:border-0">
                {f.map((celda, j) => (
                  <td key={j} className={cx('py-2 pr-4', j > 0 && 'tabular-nums')}>
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ---------------------------------------------------------------------- Globo */

/** Globo del hover/foco: el VALOR manda, la etiqueta acompaña. Texto normal, nunca HTML. */
function Globo({
  valor,
  etiqueta,
  className,
  claro = false,
  envolver = false,
}: {
  valor: string;
  etiqueta: string;
  className?: string;
  /** Sobre una superficie Carbon el globo va en blanco para no perderse. */
  claro?: boolean;
  /**
   * Con ancla a la izquierda (fila entera, no un punto centrado) el globo puede acercarse al
   * borde: aqui se parte en vez de desbordar la pantalla, acotado al ancho de su contenedor.
   */
  envolver?: boolean;
}) {
  return (
    <span
      role="tooltip"
      className={cx(
        'pointer-events-none absolute z-10 rounded px-2.5 py-1.5 text-xs',
        envolver ? 'max-w-full break-words' : 'whitespace-nowrap',
        claro ? 'bg-fondo text-texto' : 'bg-texto text-primario-texto',
        className,
      )}
    >
      <span className="block font-medium">{valor}</span>
      <span className={cx('block', claro ? 'text-texto-suave' : 'text-primario-texto/80')}>{etiqueta}</span>
    </span>
  );
}

/* --------------------------------------------------------- Barras horizontales */

export type EstadoDato = 'completo' | 'en_curso';

export interface DatoBarra {
  readonly clave: string;
  readonly etiqueta: string;
  /** Segunda linea de la etiqueta (p. ej. el identificador temporal). */
  readonly detalle?: string;
  /** `null` = sin dato: se escribe "sin dato", nunca se dibuja como cero (RF-26). */
  readonly valor: number | null;
  readonly estado?: EstadoDato;
}

/**
 * Barras horizontales con meta opcional. Una sola serie en Carbon; lo que REBASA la meta se
 * pinta con el relleno critico (eso si es estado) y lo que sigue corriendo va tenue.
 */
export function BarrasHorizontales({
  datos,
  meta,
  unidad,
  formato = (v) => `${v.toFixed(1)} ${unidad}`,
  descripcion,
  tabla = true,
}: {
  datos: readonly DatoBarra[];
  meta?: number;
  unidad: string;
  formato?: (v: number) => string;
  /** Resumen para lectores de pantalla. */
  descripcion: string;
  /** `false` cuando la pantalla ya muestra una tabla con estos mismos valores. */
  tabla?: boolean;
}) {
  const [activo, setActivo] = useState<string | null>(null);
  const valores = datos.map((d) => d.valor ?? 0);
  const tope = topeRedondo(Math.max(...valores, (meta ?? 0) * 1.3, 1));
  const ticks = marcas(tope);
  const pct = (v: number) => `${(v / tope) * 100}%`;

  const hayCritico = meta !== undefined && datos.some((d) => (d.valor ?? 0) > meta);
  const hayEnCurso = datos.some((d) => d.estado === 'en_curso');
  const hayCompleto = datos.some((d) => d.estado !== 'en_curso' && d.valor !== null && !(meta !== undefined && d.valor > meta));
  // Con un solo tipo de barra el titulo basta; la leyenda aparece cuando hay mas de uno.
  const leyenda = hayEnCurso || hayCritico;

  function notaDe(d: DatoBarra) {
    if (d.valor === null) return 'sin registro';
    if (meta !== undefined && d.valor > meta) return 'rebasa la meta';
    return d.estado === 'en_curso' ? 'en curso' : 'cumplido';
  }

  function relleno(d: DatoBarra) {
    if (meta !== undefined && (d.valor ?? 0) > meta) return 'bg-grafica-critico';
    return d.estado === 'en_curso' ? 'bg-texto/25' : 'bg-texto';
  }

  return (
    <figure>
      <figcaption className="sr-only">{descripcion}</figcaption>

      {leyenda && (
        <ul aria-hidden className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-texto-suave">
          {hayCompleto && (
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-texto" /> Cumplido
            </li>
          )}
          {hayEnCurso && (
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-texto/25" /> En curso
            </li>
          )}
          {hayCritico && (
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm bg-grafica-critico" /> Rebasa la meta
            </li>
          )}
        </ul>
      )}

      {/*
        Una fila de rejilla por barra (etiqueta | trazado). La rejilla de fondo, la meta y el eje
        van en una capa superpuesta sobre la columna de trazado, alineada con el mismo ancho de
        etiqueta (9 rem + 1 rem de hueco; 11 rem en `sm`).
      */}
      <div className={cx('relative', meta !== undefined && 'pt-6')}>
        <div
          aria-hidden
          className={cx(
            'pointer-events-none absolute right-0 bottom-6 left-[10rem] sm:left-[12rem]',
            meta !== undefined ? 'top-6' : 'top-0',
          )}
        >
          {ticks.map((t) => (
            <span key={t} className="absolute inset-y-0 w-px bg-borde-suave" style={{ left: pct(t) }} />
          ))}
          {meta !== undefined && (
            <span className="absolute inset-y-0 z-[1] w-px bg-texto" style={{ left: pct(meta) }}>
              <span className="absolute -top-5 -translate-x-1/2 text-[0.6875rem] font-medium whitespace-nowrap text-texto">
                Meta {meta} {unidad}
              </span>
            </span>
          )}
        </div>

        <ul className="relative">
          {datos.map((d, i) => {
            const texto = d.valor === null ? 'sin dato' : formato(d.valor);
            const nota = notaDe(d);
            return (
              <li
                key={d.clave}
                tabIndex={0}
                aria-label={`${d.etiqueta}${d.detalle ? ` ${d.detalle}` : ''}: ${texto}, ${nota}`}
                onPointerEnter={() => setActivo(d.clave)}
                onPointerLeave={() => setActivo((a) => (a === d.clave ? null : a))}
                onFocus={() => setActivo(d.clave)}
                onBlur={() => setActivo((a) => (a === d.clave ? null : a))}
                className="grid min-h-11 grid-cols-[9rem_minmax(0,1fr)] items-center gap-x-4 rounded transition-colors hover:bg-superficie/60 focus-visible:bg-superficie/60 sm:grid-cols-[11rem_minmax(0,1fr)]"
              >
                <span aria-hidden className="flex min-w-0 flex-col py-1 pl-1">
                  <span className="truncate text-sm text-texto">{d.etiqueta}</span>
                  {d.detalle && <span className="truncate font-mono text-xs text-texto-suave">{d.detalle}</span>}
                </span>
                <span aria-hidden className="relative flex items-center">
                  {d.valor !== null && (
                    <span
                      className={cx('crecer-x h-3.5 shrink-0 rounded-r', relleno(d))}
                      style={{ width: pct(d.valor), ['--retraso' as string]: `${i * 70}ms` }}
                    />
                  )}
                  <span className="ml-2 min-w-0 text-xs text-texto tabular-nums">
                    {texto}
                    {d.estado === 'en_curso' && d.valor !== null && <span className="text-texto-suave"> · en curso</span>}
                  </span>
                  {activo === d.clave && (
                    <Globo
                      valor={texto}
                      etiqueta={`${d.etiqueta} · ${nota}`}
                      className="bottom-full left-0 mb-1"
                      envolver
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Eje: marcas redondas bajo el trazado */}
        <div aria-hidden className="relative mt-2 ml-[10rem] h-4 text-[0.6875rem] text-texto-suave tabular-nums sm:ml-[12rem]">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {tabla && (
      <VistaTabla
        cabeceras={['Elemento', 'Valor', 'Estado']}
        filas={datos.map((d) => [
          `${d.etiqueta}${d.detalle ? ` (${d.detalle})` : ''}`,
          d.valor === null ? 'sin dato' : formato(d.valor),
          notaDe(d),
        ])}
      />
      )}
    </figure>
  );
}

/* ------------------------------------------------------- Barra de partes (apilada) */

export type RellenoEstado = 'bueno' | 'aviso' | 'critico' | 'neutro';

const CLASE_RELLENO: Record<RellenoEstado, string> = {
  bueno: 'bg-grafica-bueno',
  aviso: 'bg-grafica-aviso',
  critico: 'bg-grafica-critico',
  neutro: 'bg-texto/25',
};

export interface Segmento {
  readonly clave: string;
  readonly etiqueta: string;
  readonly valor: number;
  readonly relleno: RellenoEstado;
}

/**
 * Parte de un todo en una sola barra horizontal: huecos de 2 px entre segmentos, leyenda
 * SIEMPRE (son varias series) con conteo y porcentaje escritos, y tabla gemela. El color de
 * cada segmento es de estado porque el dato ES un estado.
 */
export function BarraDePartes({ segmentos, descripcion }: { segmentos: readonly Segmento[]; descripcion: string }) {
  const [activo, setActivo] = useState<string | null>(null);
  const total = segmentos.reduce((t, s) => t + s.valor, 0);
  const visibles = segmentos.filter((s) => s.valor > 0);
  const porcentaje = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 100));

  return (
    <figure>
      <figcaption className="sr-only">{descripcion}</figcaption>
      {total === 0 ? (
        <p className="text-sm text-texto-suave">Sin episodios que medir en este turno.</p>
      ) : (
        <ul className="flex h-6 gap-0.5">
          {visibles.map((s, i) => (
            <li
              key={s.clave}
              tabIndex={0}
              aria-label={`${s.etiqueta}: ${s.valor} de ${total} (${porcentaje(s.valor)} %)`}
              onPointerEnter={() => setActivo(s.clave)}
              onPointerLeave={() => setActivo((a) => (a === s.clave ? null : a))}
              onFocus={() => setActivo(s.clave)}
              onBlur={() => setActivo((a) => (a === s.clave ? null : a))}
              className="relative h-full"
              style={{ flexGrow: s.valor, flexBasis: 0 }}
            >
              <span
                aria-hidden
                className={cx(
                  'crecer-x block h-full transition-opacity',
                  CLASE_RELLENO[s.relleno],
                  i === 0 && 'rounded-l',
                  i === visibles.length - 1 && 'rounded-r',
                  activo && activo !== s.clave && 'opacity-40',
                )}
                style={{ ['--retraso' as string]: `${i * 90}ms` }}
              />
              {activo === s.clave && (
                <Globo
                  valor={`${s.valor} de ${total} · ${porcentaje(s.valor)} %`}
                  etiqueta={s.etiqueta}
                  className="bottom-full left-1/2 mb-2 -translate-x-1/2"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        {segmentos.map((s) => (
          <li key={s.clave} className="flex items-start gap-2.5">
            <span aria-hidden className={cx('mt-1 h-3 w-3 shrink-0 rounded-sm', CLASE_RELLENO[s.relleno])} />
            <span>
              <span className="block text-sm text-texto">{s.etiqueta}</span>
              <span className="block text-xs text-texto-suave">
                <span className="font-medium text-texto">{s.valor}</span> · {porcentaje(s.valor)} %
              </span>
            </span>
          </li>
        ))}
      </ul>

      <VistaTabla
        cabeceras={['Estado', 'Episodios', 'Porcentaje']}
        filas={segmentos.map((s) => [s.etiqueta, String(s.valor), `${porcentaje(s.valor)} %`])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------ Linea de tendencia */

/**
 * Linea de tendencia de una tarjeta de indicador: 2 px, lavado al 10 %, punto final con aro
 * del color de la superficie. El puntero encuentra la X mas cercana (no hay que atinarle a la
 * linea) y el foco de teclado recorre los puntos con las flechas.
 */
export function Tendencia({
  valores,
  etiquetas,
  descripcion,
  oscuro = false,
}: {
  valores: readonly number[];
  etiquetas: readonly string[];
  descripcion: string;
  /** Sobre la tarjeta Carbon: trazo blanco. */
  oscuro?: boolean;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const ancho = 200;
  const alto = 48;
  const max = Math.max(...valores, 1);
  const x = (i: number) => (valores.length === 1 ? ancho : (i / (valores.length - 1)) * ancho);
  const y = (v: number) => alto - 4 - (v / max) * (alto - 10);
  const puntos = valores.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const ultimo = valores.length - 1;
  const trazo = oscuro ? 'text-primario-texto' : 'text-texto';

  function alMover(e: React.PointerEvent<HTMLDivElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - caja.left) / caja.width) * ultimo);
    setActivo(Math.min(ultimo, Math.max(0, i)));
  }

  function alTeclear(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setActivo((a) => {
      const base = a ?? ultimo;
      return Math.min(ultimo, Math.max(0, base + (e.key === 'ArrowRight' ? 1 : -1)));
    });
  }

  const marcado = activo ?? ultimo;

  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`${descripcion}. ${etiquetas.map((e, i) => `${e}: ${valores[i]}`).join(', ')}`}
      onPointerMove={alMover}
      onPointerLeave={() => setActivo(null)}
      onKeyDown={alTeclear}
      onBlur={() => setActivo(null)}
      className="relative mt-4 rounded"
    >
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className={cx('block h-12 w-full', trazo)} aria-hidden>
        <polygon points={`0,${alto} ${puntos} ${ancho},${alto}`} fill="currentColor" fillOpacity={0.1} />
        <polyline
          points={puntos}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {activo !== null && (
          <line
            x1={x(activo)}
            x2={x(activo)}
            y1={0}
            y2={alto}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {/* El punto va en HTML para que sea redondo aunque el SVG se estire a lo ancho. */}
      <span
        aria-hidden
        className={cx(
          'absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2',
          oscuro ? 'bg-primario-texto ring-texto' : 'bg-texto ring-fondo',
        )}
        style={{ left: `${(x(marcado) / ancho) * 100}%`, top: `${(y(valores[marcado]) / alto) * 100}%` }}
      />
      {activo !== null && (
        <Globo
          valor={String(valores[activo])}
          etiqueta={etiquetas[activo]}
          claro={oscuro}
          className="bottom-full mb-1 -translate-x-1/2"
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------- Tarjeta de indicador */

/**
 * Tarjeta de indicador del panel: etiqueta, cifra grande (cifras proporcionales, no
 * tabulares: `121` no debe verse suelto), nota y tendencia opcional. `oscuro` la vuelve la
 * cifra que encabeza la vista: una sola por pantalla.
 */
export function TarjetaIndicador({
  etiqueta,
  valor,
  unidad,
  nota,
  oscuro = false,
  children,
}: {
  etiqueta: string;
  valor: string;
  unidad?: string;
  nota?: ReactNode;
  oscuro?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cx('flex flex-col rounded-xl p-6', oscuro ? 'bg-texto text-primario-texto' : 'bg-fondo text-texto')}>
      <p className={cx('text-sm', oscuro ? 'text-primario-texto/80' : 'text-texto-suave')}>{etiqueta}</p>
      <p className="display mt-3 text-5xl">
        {valor}
        {unidad && (
          <span className={cx('ml-1.5 text-lg tracking-normal', oscuro ? 'text-primario-texto/80' : 'text-texto-suave')}>
            {unidad}
          </span>
        )}
      </p>
      {nota && <p className={cx('mt-2 text-xs', oscuro ? 'text-primario-texto/80' : 'text-texto-suave')}>{nota}</p>}
      {children && <div className="mt-auto">{children}</div>}
    </div>
  );
}
