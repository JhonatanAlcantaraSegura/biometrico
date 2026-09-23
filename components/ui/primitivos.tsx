'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CircleCheck, Info, LoaderCircle, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
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
    // Sin borde ni sombra: la tarjeta blanca se separa del lienzo Ceniza por el cambio de
    // superficie y por el espacio, nada mas (`DESIGN.md`, seccion 6).
    <section className={cx('rounded-xl bg-fondo', className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-6 pt-6">
          <div className="min-w-0">
            {titulo && <h2 className="text-lg font-medium tracking-tight text-texto">{titulo}</h2>}
            {ayuda && <p className="mt-1 max-w-prose text-sm text-texto-suave">{ayuda}</p>}
          </div>
          {acciones}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

/** Encabezado de pantalla: titular `.display`, como los de la portada. */
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
    <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div className="min-w-0">
        <h1 className="display text-3xl text-texto sm:text-4xl">{titulo}</h1>
        {descripcion && <p className="mt-3 max-w-2xl text-base leading-llano text-texto-suave">{descripcion}</p>}
        {requisitos && <Requisito ids={requisitos} />}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/* ----------------------------------------------------------------- Insignia */

/**
 * Insignias sin borde: fondo tenue y texto del tono. El azul no aparece aqui — esta
 * reservado a la accion primaria —, asi que `primario` es el gris de Carbon.
 */
const TONO_INSIGNIA: Record<Tono, string> = {
  peligro: 'bg-peligro-suave text-peligro',
  aviso: 'bg-aviso-suave text-aviso',
  exito: 'bg-exito-suave text-exito',
  info: 'bg-info-suave text-info',
  atencion: 'bg-atencion-suave text-atencion',
  neutro: 'bg-superficie text-texto-suave',
  primario: 'bg-superficie text-texto',
};

export function Insignia({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
        TONO_INSIGNIA[tono],
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- Boton */

/**
 * Botones de `DESIGN.md`: rectangulo de 4 px, peso 500, sin sombra, y el hover solo cambia
 * de color. El Azul Electrico es exclusivo de la accion primaria; la secundaria es Ceniza
 * Clara con texto Carbon.
 */
const TONO_BOTON: Record<Tono, string> = {
  peligro: 'bg-peligro text-primario-texto hover:bg-texto',
  aviso: 'bg-aviso-suave text-aviso hover:bg-aviso hover:text-primario-texto',
  exito: 'bg-exito-suave text-exito hover:bg-exito hover:text-primario-texto',
  info: 'bg-primario text-primario-texto hover:bg-primario-oscuro',
  atencion: 'bg-atencion-suave text-atencion hover:bg-atencion hover:text-primario-texto',
  neutro: 'bg-superficie text-texto hover:bg-borde-suave',
  primario: 'bg-primario text-primario-texto hover:bg-primario-oscuro',
};

export function Boton({
  children,
  onClick,
  tono = 'neutro',
  disabled,
  title,
  type = 'button',
  className,
  cargando = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  tono?: Tono;
  disabled?: boolean;
  /**
   * Accion en curso. El boton se deshabilita (un doble clic no envia dos veces) y el
   * texto se conserva junto al indicador: un boton que solo gira no dice que esta haciendo.
   */
  cargando?: boolean;
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
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      title={title}
      className={cx(
        'inline-flex min-h-control items-center justify-center gap-2 rounded border-0 px-5 py-2',
        'text-sm font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco',
        'disabled:cursor-not-allowed disabled:bg-superficie disabled:text-texto-suave',
        TONO_BOTON[tono],
        className,
      )}
    >
      {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function EnlaceBoton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="control inline-flex items-center gap-2 rounded bg-superficie px-5 py-2 text-sm font-medium text-texto transition-colors hover:bg-borde-suave"
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
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-texto">
          {etiqueta}
        </label>
      ) : (
        <span className="mb-1 block text-sm font-medium text-texto">{etiqueta}</span>
      )}
      {children}
      {ayuda && <span className="mt-1 block text-sm text-texto-suave">{ayuda}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-sm font-medium text-peligro">
          {error}
        </span>
      )}
    </Envoltura>
  );
}

export const claseCampo =
  'min-h-control w-full rounded border border-borde bg-fondo px-3 py-2 text-sm text-texto ' +
  'placeholder:text-texto-suave focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-foco ' +
  'disabled:cursor-not-allowed disabled:bg-superficie disabled:text-texto-suave';

/* --------------------------------------------------------------- Sin datos */

/**
 * RF-14: un campo vacio significa que la fuente no tiene el dato, NUNCA que el paciente no
 * tenga alergias. La diferencia entre las dos frases es un evento adverso.
 */
export function Vacio({ children = 'sin datos disponibles' }: { children?: ReactNode }) {
  return <span className="text-sm text-texto-suave">{children}</span>;
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
    <div className="rounded-xl bg-fondo p-6">
      <p className="text-sm text-texto-suave">{etiqueta}</p>
      <p className="display mt-3 text-4xl text-texto tabular-nums">
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
    <span className="mt-3 inline-flex flex-wrap gap-1 align-middle">
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
        <thead className="border-b border-borde-suave text-xs text-texto-suave">
          <tr>
            {cabeceras.map((c) => (
              <th key={c} scope="col" className="py-2 pr-3 font-medium">
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

/* -------------------------------------------------------------------- Banda */

type TonoBanda = 'info' | 'exito' | 'aviso' | 'peligro';

const ESTILO_BANDA: Record<TonoBanda, { clase: string; Icono: LucideIcon }> = {
  info: { clase: 'bg-info-suave text-info', Icono: Info },
  exito: { clase: 'bg-exito-suave text-exito', Icono: CircleCheck },
  aviso: { clase: 'bg-aviso-suave text-aviso', Icono: TriangleAlert },
  peligro: { clase: 'bg-peligro-suave text-peligro', Icono: OctagonAlert },
};

/**
 * Mensaje en linea sobre fondo tenue, con icono y texto (sin borde: `DESIGN.md`). `alerta` lo anuncia de inmediato
 * (`role="alert"`): se reserva para errores que la persona tiene que leer AHORA, como un
 * acceso rechazado. El resto se anuncia con cortesia (`role="status"`).
 */
export function Banda({
  tono = 'info',
  titulo,
  Icono,
  alerta = false,
  children,
  className,
}: {
  tono?: TonoBanda;
  titulo?: string;
  Icono?: LucideIcon;
  alerta?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const estilo = ESTILO_BANDA[tono];
  const Simbolo = Icono ?? estilo.Icono;
  return (
    <div
      role={alerta ? 'alert' : 'status'}
      className={cx('flex items-start gap-3 rounded px-4 py-3 text-sm', estilo.clase, className)}
    >
      <Simbolo className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 leading-llano">
        {titulo && <p className="font-medium">{titulo}</p>}
        <div className={titulo ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Avatar */

export function iniciales(nombre: string): string {
  const partes = nombre
    .replace(/^(dra?|dr)\.\s*/i, '')
    .split(/[\s.]+/)
    .filter(Boolean);
  const texto = (partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '');
  return texto.toUpperCase() || '?';
}

/** Iniciales en circulo. Decorativo: el nombre siempre va escrito al lado. */
export function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'grid size-9 shrink-0 place-items-center rounded-full bg-texto text-xs font-medium text-primario-texto',
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}

/* --------------------------------------------------------- Estados de carga */

/**
 * Bloque de esqueleto. Reserva el espacio de lo que viene para que la pagina no salte al
 * hidratar. El pulso se apaga con movimiento reducido (regla global de `globals.css`).
 */
export function Esqueleto({ className }: { className?: string }) {
  return <span aria-hidden className={cx('block animate-pulse rounded bg-borde-suave', className)} />;
}

/**
 * Espera de pagina completa: el mensaje se anuncia y el esqueleto dibuja la forma del
 * panel, en vez de una linea de texto suelta sobre un fondo vacio que parece un fallo.
 */
export function PantallaCarga({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-10">
      <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-texto-suave">
        <LoaderCircle className="size-4 animate-spin text-texto-suave" aria-hidden />
        {mensaje}
      </p>
      <Esqueleto className="h-9 w-2/3 max-w-md" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Esqueleto className="h-24" />
        <Esqueleto className="h-24" />
        <Esqueleto className="h-24" />
      </div>
      <Esqueleto className="h-56" />
    </main>
  );
}

/* ------------------------------------------------------------- Estado vacio */

/**
 * Estado vacio con proxima accion. Una lista vacia sin explicacion parece un fallo de
 * carga; con una frase y un boton parece lo que es: todavia no hay nada.
 */
export function EstadoVacio({
  Icono = Info,
  titulo,
  children,
  accion,
}: {
  Icono?: LucideIcon;
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-lienzo-sutil px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-fondo">
        <Icono className="size-6 text-texto-suave" aria-hidden />
      </span>
      <p className="text-base font-medium text-texto">{titulo}</p>
      {children && <div className="max-w-prose text-sm text-texto-suave">{children}</div>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
