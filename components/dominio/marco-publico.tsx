'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, Menu, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { INSTITUCION } from '@/lib/datos/institucion';
import { cx } from '@/components/ui/primitivos';

/**
 * Marco del SITIO PUBLICO de la propuesta.
 *
 * La raiz no es el panel de urgencias. Quien escribe la direccion sin haber visto nunca el
 * proyecto es, casi siempre, alguien del comite clinico, de informatica del hospital o de
 * proteccion de datos que necesita entender la propuesta antes de dejar entrar a nadie a un
 * expediente. Abrirle el tablero operativo de urgencias no le sirve y ademas le da una
 * impresion equivocada: que el sistema ya existe y ya opera.
 *
 * La clase `.tema-publico` cambia la paleta completa (ver `app/tema-publico.css`) sin que
 * ninguna pantalla lleve un condicional de tema: `bg-lienzo` sigue diciendo `bg-lienzo` y
 * es la variable la que cambia de valor.
 */

export interface AnclaPublica {
  readonly id: string;
  readonly etiqueta: string;
}

const SIN_ANCLAS: readonly AnclaPublica[] = [];

/**
 * Que seccion se esta leyendo, para marcar el ancla activa.
 *
 * `IntersectionObserver` y no un calculo de `scroll`: el segundo obliga a leer el layout en
 * cada evento y en un equipo modesto eso se nota. Si la API no existe, el menu simplemente
 * no resalta nada — se degrada sin romperse.
 */
function useSeccionActiva(anclas: readonly AnclaPublica[]): string | null {
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    if (anclas.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.id);
      },
      // La banda de observacion empieza debajo del encabezado fijo: sin el margen negativo
      // superior, la seccion que queda tapada por la barra contaria como visible.
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );

    for (const a of anclas) {
      const nodo = document.getElementById(a.id);
      if (nodo) observador.observe(nodo);
    }
    return () => observador.disconnect();
  }, [anclas]);

  return activa;
}

export function MarcoPublico({
  anclas = SIN_ANCLAS,
  children,
}: {
  anclas?: readonly AnclaPublica[];
  children: React.ReactNode;
}) {
  const activa = useSeccionActiva(anclas);
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="tema-publico min-h-dvh">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-borde-suave bg-fondo">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primario-suave">
              <Activity className="size-6 text-primario-oscuro" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold text-texto">{INSTITUCION.marca}</span>
              <span className="block text-xs text-texto-suave">Propuesta tecnica · {INSTITUCION.documentoFuente}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-publico"
            className="ml-auto rounded-md p-2 text-texto hover:bg-superficie md:hidden"
          >
            {abierto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{abierto ? 'Cerrar menu' : 'Abrir menu'}</span>
          </button>

          <nav
            id="menu-publico"
            aria-label="Secciones de la propuesta"
            className={cx(
              'w-full flex-wrap items-center gap-1 md:ml-auto md:flex md:w-auto',
              abierto ? 'flex' : 'hidden',
            )}
          >
            {anclas.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                onClick={() => setAbierto(false)}
                aria-current={activa === a.id ? 'true' : undefined}
                className={cx(
                  'control flex items-center rounded-md px-3 text-sm',
                  activa === a.id
                    ? 'bg-primario-suave font-semibold text-primario-oscuro'
                    : 'text-texto-suave hover:bg-superficie hover:text-texto',
                )}
              >
                {a.etiqueta}
              </a>
            ))}
            <Link
              href="/acceso"
              className="control ml-1 flex items-center rounded-md border border-primario bg-primario px-4 text-sm font-semibold text-primario-texto hover:bg-primario-oscuro"
            >
              Abrir el prototipo
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido">{children}</main>

      <PieDelSitio />
    </div>
  );
}

/**
 * Aviso de prototipo. Va en la portada Y en el panel, con el mismo texto.
 *
 * Un prototipo convincente puede hacer parecer resueltas decisiones que siguen abiertas.
 * Decirlo una vez en una reunion no basta: la captura de pantalla circula sola.
 */
export function AvisoPrototipo({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'flex items-start gap-3 rounded-xl border border-aviso/40 bg-aviso-suave p-4',
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
      <p className="text-sm leading-llano text-aviso">
        <strong>Prototipo de propuesta, no producto.</strong> Datos sinteticos, sin expediente
        clinico real, sin motor biometrico y sin autenticacion. La sede, las cifras y el alcance son
        propuestas por validar.
      </p>
    </div>
  );
}

/**
 * Banda de seccion del sitio publico.
 *
 * El rotulo se escribe en minusculas y con acentos, y son las VERSALITAS de `.rotulo` las
 * que lo ponen en mayusculas. Asi el lector de pantalla lee "lo que resuelve" como palabra
 * y no deletrea las letras, que es lo que hacen algunos con texto capturado en mayusculas.
 */
export function BandaPublica({
  id,
  rotulo,
  titulo,
  descripcion,
  Icono,
  fondo = 'base',
  children,
}: {
  id: string;
  rotulo?: string;
  titulo: string;
  descripcion?: string;
  Icono?: LucideIcon;
  fondo?: 'base' | 'sutil';
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      // El desfase del encabezado fijo lo pone `scroll-padding-top` en `html`, UNA vez. Un
      // `scroll-mt-*` aqui se sumaria a aquel y dejaria el titulo medio salto mas abajo.
      className={fondo === 'sutil' ? 'bg-lienzo-sutil' : 'bg-lienzo'}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-seccion">
        <div className="max-w-3xl">
          {Icono && (
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-primario-suave">
              <Icono className="size-6 text-primario-oscuro" aria-hidden />
            </span>
          )}
          {rotulo && <p className="rotulo mb-3">{rotulo}</p>}
          <h2 id={`${id}-titulo`} className="titulo text-2xl text-texto">
            {titulo}
          </h2>
          {descripcion && <p className="mt-4 text-lg leading-relajado text-texto-suave">{descripcion}</p>}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** Tarjeta de contenido del sitio publico, con la sombra del tema calido. */
export function TarjetaPublica({
  titulo,
  children,
  className,
}: {
  titulo?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('sombra-publica rounded-xl border border-borde-suave bg-fondo p-5', className)}>
      {titulo && <h3 className="mb-2 text-base font-semibold text-texto">{titulo}</h3>}
      {children}
    </div>
  );
}

export function PieDelSitio() {
  return (
    <footer className="border-t border-borde-suave bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-texto-suave">
        <p className="font-semibold text-texto">
          {INSTITUCION.sedeNombre} — {INSTITUCION.sedeDependencia}
        </p>
        <p className="mt-1">{INSTITUCION.sedeNota}</p>
        <p className="mt-4">
          Derivado de la {INSTITUCION.documentoFuente}. El documento fuente vive en{' '}
          <code className="text-texto">docs/ERS_Biometria_Codigo_Infarto.md</code> y la trazabilidad
          requisito por requisito en <code className="text-texto">docs/02-TRAZABILIDAD.md</code>.
        </p>
      </div>
    </footer>
  );
}
