'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, LockKeyhole, Menu, TriangleAlert, X, type LucideIcon } from 'lucide-react';
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
 * Sigue `DESIGN.md`: encabezado blanco sin borde, secciones con mucho aire, y el Azul
 * Electrico solo en la accion primaria ("Acceso del personal"). `.tema-publico` es el
 * punto de enganche del tema (ver `app/tema-publico.css`).
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

      {/* Vidrio esmerilado: blanco al 75 % sobre el contenido que pasa por debajo. */}
      <header className="sticky top-0 z-30 bg-fondo/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Activity className="size-5 shrink-0 text-texto" aria-hidden />
            <span className="leading-tight">
              <span className="block text-base font-medium text-texto">{INSTITUCION.marca}</span>
              <span className="block text-xs text-texto-suave">Propuesta tecnica · {INSTITUCION.documentoFuente}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-publico"
            className="ml-auto rounded p-2 text-texto transition-colors hover:bg-superficie lg:hidden"
          >
            {abierto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{abierto ? 'Cerrar menu' : 'Abrir menu'}</span>
          </button>

          <nav
            id="menu-publico"
            aria-label="Secciones de la propuesta"
            className={cx(
              'w-full flex-wrap items-center gap-0.5 lg:ml-auto lg:flex lg:w-auto',
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
                  'control flex items-center rounded px-3 text-sm font-medium text-texto transition-colors',
                  activa === a.id ? 'bg-superficie' : 'hover:bg-superficie',
                )}
              >
                {a.etiqueta}
              </a>
            ))}
            <Link
              href="/acceso"
              className="control ml-1 flex items-center gap-2 rounded bg-primario px-5 text-sm font-medium text-primario-texto transition-colors hover:bg-primario-oscuro"
            >
              <LockKeyhole className="size-4" aria-hidden />
              Acceso del personal
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
        'flex items-start gap-3 rounded bg-aviso-suave p-4',
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
      <p className="text-sm leading-llano text-aviso">
        <strong>Prototipo de propuesta, no producto.</strong> Datos sinteticos, sin expediente
        clinico real, sin motor biometrico y con un acceso simulado en el navegador. La sede, las cifras y el alcance son
        propuestas por validar.
      </p>
    </div>
  );
}

/**
 * Banda de seccion del sitio publico.
 *
 * Una seccion por mensaje, con aire generoso arriba y abajo: el espacio en blanco hace de
 * separador, sin lineas. El rotulo va en minusculas tranquilas, sin versalitas.
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
      className={fondo === 'sutil' ? 'banda-sutil bg-lienzo-sutil' : 'bg-lienzo'}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-seccion-lg">
        <div className="max-w-3xl">
          {Icono && <Icono className="mb-5 size-6 text-texto" aria-hidden />}
          {rotulo && <p className="rotulo mb-2">{rotulo}</p>}
          <h2 id={`${id}-titulo`} className="titulo text-3xl text-texto">
            {titulo}
          </h2>
          {descripcion && <p className="mt-4 text-base leading-relajado text-texto-suave">{descripcion}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/**
 * Tarjeta de contenido del sitio publico. Sin borde ni sombra: Ceniza Clara sobre una banda
 * blanca y blanca sobre una banda Ceniza (`in-[.banda-sutil]`), para que siempre haya un
 * cambio de superficie que la delimite.
 */
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
    <div className={cx('rounded-xl bg-lienzo-sutil p-6 in-[.banda-sutil]:bg-fondo', className)}>
      {titulo && <h3 className="mb-2 text-lg font-medium text-texto">{titulo}</h3>}
      {children}
    </div>
  );
}

export function PieDelSitio() {
  return (
    <footer className="bg-lienzo-sutil">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-texto-suave">
        <p className="font-medium text-texto">
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
