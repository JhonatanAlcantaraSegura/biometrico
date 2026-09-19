'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { EncounterState, IdentityState, TriagePriority } from '@/lib/datos/tipos';

/**
 * Primitivos de la interfaz.
 *
 * Tres reglas heredadas del proyecto de referencia, y las tres son de accesibilidad, no de
 * estilo:
 *
 * 1. **44 px de area tactil** (`min-h-control`) en todo control, no los 36 px que traen por
 *    omision casi todas las librerias. Enfermeria y medicos trabajan de pie, con guantes y a
 *    veces sobre tablet (WCAG 2.5.5/2.5.8).
 * 2. **El estado deshabilitado NO se comunica bajando la opacidad** — eso hunde el contraste
 *    por debajo de 4.5:1. Se usa `superficie` + `texto-suave`, medido en 6.92:1.
 * 3. **El color nunca es el unico portador.** Una insignia de identidad lleva SIEMPRE su
 *    texto; un error lleva texto ademas del rojo. Quien no distingue el rojo sigue leyendo.
 */

export function cx(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(' ');
}

export type Tono = 'peligro' | 'aviso' | 'exito' | 'info' | 'atencion' | 'neutro' | 'primario';

/* ------------------------------------------------------------------ Tarjeta */

export function Tarjeta({
  titulo,
  ayuda,
  acciones,
  children,
  className,
}: {
  titulo?: string;
  ayuda?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-xl border border-borde-suave bg-fondo shadow-suave', className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-borde-suave px-4 py-3">
          <div>
            {titulo && <h2 className="text-base font-semibold text-texto">{titulo}</h2>}
            {ayuda && <p className="mt-0.5 max-w-prose text-sm text-texto-suave">{ayuda}</p>}
          </div>
          {acciones}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Encabezado de pantalla. El `h1` va en serif por la regla de `globals.css`. */
export function Encabezado({
  titulo,
  descripcion,
  acciones,
  requisitos,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  requisitos?: readonly string[];
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl text-texto">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-prose text-sm text-texto-suave">{descripcion}</p>}
        {requisitos && <Requisito ids={requisitos} />}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/* ----------------------------------------------------------------- Insignia */

const TONO_INSIGNIA: Record<Tono, string> = {
  peligro: 'border-peligro/40 bg-peligro-suave text-peligro',
  aviso: 'border-aviso/40 bg-aviso-suave text-aviso',
  exito: 'border-exito/40 bg-exito-suave text-exito',
  info: 'border-info/40 bg-info-suave text-info',
  atencion: 'border-atencion/40 bg-atencion-suave text-atencion',
  neutro: 'border-borde-suave bg-superficie text-texto-suave',
  primario: 'border-primario/30 bg-primario-suave text-primario-oscuro',
};

export function Insignia({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
        TONO_INSIGNIA[tono],
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- Boton */

const TONO_BOTON: Record<Tono, string> = {
  peligro: 'border-peligro bg-peligro text-primario-texto hover:bg-texto hover:border-texto',
  aviso: 'border-aviso bg-aviso-suave text-aviso hover:bg-aviso hover:text-primario-texto',
  exito: 'border-exito bg-exito-suave text-exito hover:bg-exito hover:text-primario-texto',
  info: 'border-primario bg-primario text-primario-texto hover:bg-texto hover:border-texto',
  atencion: 'border-atencion bg-atencion-suave text-atencion hover:bg-atencion hover:text-primario-texto',
  neutro: 'border-borde bg-fondo text-texto hover:bg-superficie',
  primario: 'border-primario bg-primario text-primario-texto hover:bg-texto hover:border-texto',
};

export function Boton({
  children,
  onClick,
  tono = 'neutro',
  disabled,
  title,
  type = 'button',
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tono?: Tono;
  disabled?: boolean;
  title?: string;
  // `type` explicito: el valor por omision de HTML es `submit`, y un boton secundario
  // dentro de un formulario lo enviaria sin que nadie lo pidiera.
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        'inline-flex min-h-control items-center justify-center gap-2 rounded-md border px-4 py-2',
        'text-sm font-semibold transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco',
        'disabled:cursor-not-allowed disabled:border-borde disabled:bg-superficie disabled:text-texto-suave',
        TONO_BOTON[tono],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EnlaceBoton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="control inline-flex items-center gap-2 rounded-md border border-borde bg-fondo px-4 py-2 text-sm font-semibold text-texto transition-colors hover:bg-superficie"
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- Campo */

/**
 * Etiqueta + control + ayuda + error.
 *
 * Un `<label>` de verdad con `htmlFor` y no un parrafo encima del control: es lo que hace
 * que un lector de pantalla anuncie el nombre del campo al entrar (WCAG 1.3.1, 3.3.2) y lo
 * que permite que un clic sobre el texto lleve el foco al control — area tactil extra
 * gratis para quien tiene poca precision motriz.
 *
 * Sin `order-*` ni ninguna otra utilidad de reordenamiento visual: el orden del DOM es el
 * orden de lectura y el de foco (WCAG 2.4.3).
 */
export function Campo({
  etiqueta,
  ayuda,
  error,
  htmlFor,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const Envoltura = htmlFor ? 'div' : 'label';
  return (
    <Envoltura className="block">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-texto">
          {etiqueta}
        </label>
      ) : (
        <span className="mb-1 block text-sm font-semibold text-texto">{etiqueta}</span>
      )}
      {children}
      {ayuda && <span className="mt-1 block text-sm text-texto-suave">{ayuda}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-sm font-semibold text-peligro">
          {error}
        </span>
      )}
    </Envoltura>
  );
}

export const claseCampo =
  'min-h-control w-full rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto ' +
  'placeholder:text-texto-suave focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-foco ' +
  'disabled:cursor-not-allowed disabled:bg-superficie disabled:text-texto-suave';

/* --------------------------------------------------------------- Sin datos */

/**
 * RF-14: un campo vacio significa que la fuente no tiene el dato, NUNCA que el paciente no
 * tenga alergias. La diferencia entre las dos frases es un evento adverso.
 */
export function Vacio({ children = 'sin datos disponibles' }: { children?: ReactNode }) {
  return <span className="text-sm italic text-texto-suave">{children}</span>;
}

/** Indicador numerico para los tableros de calidad. */
export function Indicador({
  etiqueta,
  valor,
  unidad,
  nota,
}: {
  etiqueta: string;
  valor: string;
  unidad?: string;
  nota?: string;
}) {
  return (
    <div className="rounded-lg border border-borde-suave bg-fondo px-3 py-3 shadow-suave">
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-texto">
        {valor}
        {unidad && <span className="ml-1 text-sm font-normal text-texto-suave">{unidad}</span>}
      </p>
      {nota && <p className="mt-1 text-xs text-texto-suave">{nota}</p>}
    </div>
  );
}

/**
 * Los identificadores de requisito de la ERS, visibles en la propia pantalla.
 *
 * No es decoracion: es lo que permite que en una reunion alguien señale un boton y se
 * pueda ir al parrafo exacto del documento que lo pidio. `docs/02-TRAZABILIDAD.md`
 * mantiene la tabla completa.
 */
export function Requisito({ ids }: { ids: readonly string[] }) {
  return (
    <span className="mt-1.5 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => (
        <span
          key={id}
          className="rounded bg-superficie px-1.5 py-0.5 font-mono text-xs text-texto-suave"
          title="Requisito trazado en la ERS"
        >
          {id}
        </span>
      ))}
    </span>
  );
}

/* ----------------------------------------------------- Insignias de dominio */

const TONO_IDENTIDAD: Record<IdentityState, Tono> = {
  provisional: 'aviso',
  confirmada: 'exito',
  en_conflicto: 'peligro',
};

const TEXTO_IDENTIDAD: Record<IdentityState, string> = {
  provisional: 'Identidad provisional',
  confirmada: 'Identidad confirmada',
  en_conflicto: 'Identidad en conflicto',
};

/** El estado de identidad va SIEMPRE visible y SIEMPRE con texto (ERS seccion 5, regla 4). */
export function InsigniaIdentidad({ estado }: { estado: IdentityState }) {
  return <Insignia tono={TONO_IDENTIDAD[estado]}>{TEXTO_IDENTIDAD[estado]}</Insignia>;
}

const TONO_TRIAGE: Record<TriagePriority, Tono> = {
  rojo: 'peligro',
  naranja: 'aviso',
  amarillo: 'atencion',
  verde: 'exito',
};

/**
 * Rojo, naranja y amarillo no siempre se distinguen entre si para quien tiene deficiencia
 * de vision del color — por eso la insignia escribe la palabra. El color acompaña, no
 * informa por su cuenta.
 */
export function InsigniaTriage({ prioridad }: { prioridad?: TriagePriority }) {
  if (!prioridad) return <Insignia>Sin triage</Insignia>;
  return <Insignia tono={TONO_TRIAGE[prioridad]}>Triage {prioridad}</Insignia>;
}

const TEXTO_ESTADO: Record<EncounterState, string> = {
  llegada: 'Llegada',
  triage: 'Triage',
  evaluacion_ecg: 'Evaluacion / ECG',
  diagnostico_confirmado: 'Diagnostico confirmado',
  diagnostico_descartado: 'Diagnostico descartado',
  codigo_activo: 'Codigo activo',
  tratamiento_traslado: 'Tratamiento / traslado',
  cierre: 'Cierre',
};

export function InsigniaEstadoClinico({ estado }: { estado: EncounterState }) {
  return (
    <Insignia tono={estado === 'codigo_activo' ? 'peligro' : 'primario'}>
      {TEXTO_ESTADO[estado]}
    </Insignia>
  );
}

/* -------------------------------------------------------------------- Tabla */

export function Tabla({ cabeceras, children }: { cabeceras: readonly string[]; children: ReactNode }) {
  // El contenedor con `overflow-x-auto` es lo que evita que la pagina entera se desplace
  // en horizontal en una tablet: se mueve la tabla, no el mundo.
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-borde-suave text-xs uppercase tracking-wide text-texto-suave">
          <tr>
            {cabeceras.map((c) => (
              <th key={c} scope="col" className="py-2 pr-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
