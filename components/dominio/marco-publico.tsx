'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, LockKeyhole, Menu, TriangleAlert, X } from 'lucide-react';
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
 * Sigue `DESIGN.md` (monocromo, Azul Electrico solo en la accion primaria, sin sombras) con
 * el lenguaje editorial de `app/tema-publico.css` encima.
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
 * no resalta nada: se degrada sin romperse.
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

      {/*
        Vidrio esmerilado: blanco al 75 % sobre lo que pasa por debajo. Una sola linea en
        escritorio: las seis anclas solo caben a partir de `xl`; por debajo, menu plegado.
      */}
      <header className="sticky top-0 z-30 bg-fondo/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="control flex items-center gap-2.5 rounded">
            <Activity className="size-5 shrink-0 text-texto" aria-hidden />
            <span translate="no" className="text-base font-medium text-texto">{INSTITUCION.marca}</span>
          </Link>

          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="menu-publico"
            className="ml-auto rounded p-2 text-texto transition-colors hover:bg-superficie xl:hidden"
          >
            {abierto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{abierto ? 'Cerrar menu' : 'Abrir menu'}</span>
          </button>

          <nav
            id="menu-publico"
            aria-label="Secciones de la propuesta"
            className={cx(
              'w-full flex-col gap-0.5 pb-2 xl:ml-auto xl:flex xl:w-auto xl:flex-row xl:items-center xl:pb-0',
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
              className="control mt-2 flex items-center justify-center gap-2 rounded bg-primario px-5 text-sm font-medium text-primario-texto transition-colors hover:bg-primario-oscuro active:bg-primario-oscuro xl:mt-0 xl:ml-2"
            >
              <LockKeyhole className="size-4" aria-hidden />
              Entrar al prototipo
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido" className="w-full max-w-full overflow-x-clip">
        {children}
      </main>

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
export function AvisoPrototipo({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cx('flex items-start gap-3 rounded bg-aviso-suave p-4 sm:p-5', className)}>
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
      <div className="text-sm leading-llano text-aviso">
        <p>
          <strong>Prototipo de propuesta, no producto.</strong> Datos sinteticos, sin expediente
          clinico real, sin motor biometrico y con un acceso simulado en el navegador. La sede, las
          cifras y el alcance son propuestas por validar.
        </p>
        {children}
      </div>
    </div>
  );
}

/** Rotulo de columna del pie: etiqueta en tono suave y un filete, como el del hero. */
function RotuloPie({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-medium tracking-wide text-texto-suave uppercase">
      {children}
      <span aria-hidden className="h-px w-8 bg-texto/25" />
    </p>
  );
}

const claseEnlacePie =
  'underline decoration-texto/40 underline-offset-2 transition-colors hover:text-texto hover:decoration-texto';

/**
 * Pie sobre la banda clara (`bg-lienzo-sutil`) con la jerarquia por tono de
 * `IA_BRAIN/jerarquia-de-color.md`: en cada columna un solo dato en pleno (marca, sede, version)
 * y el resto en tono suave. Los pares Peltre sobre banda y sobre `bg-fondo` (recuadros de las
 * rutas) ya los mide `npm run contraste`. El unico bloque oscuro es el cuadro de la marca.
 */
export function PieDelSitio() {
  return (
    <footer className="bg-lienzo-sutil text-sm text-texto-suave">
      <div className="mx-auto grid max-w-[86rem] gap-12 px-4 pt-16 pb-12 sm:px-6 sm:pt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="flex items-center gap-3">
            <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-texto text-primario-texto">
              <Activity className="size-5" strokeWidth={2} />
            </span>
            <span translate="no" className="text-lg font-medium text-texto">
              {INSTITUCION.marca}
            </span>
          </p>
          <p className="mt-5 max-w-sm leading-relajado">{INSTITUCION.lema}.</p>
        </div>

        <div className="md:col-span-4">
          <RotuloPie>Sede</RotuloPie>
          <p className="mt-4 text-base font-medium text-texto">
            {INSTITUCION.sedeNombre}, {INSTITUCION.sedeDependencia}
          </p>
          <p className="mt-2 max-w-sm leading-relajado">{INSTITUCION.sedeNota}</p>
        </div>

        <div className="md:col-span-3">
          <RotuloPie>Documento fuente</RotuloPie>
          <p className="mt-4 text-base font-medium text-texto">{INSTITUCION.documentoFuente}</p>
          <ul className="mt-4 flex flex-col items-start gap-2">
            {['docs/ERS_Biometria_Codigo_Infarto.md', 'docs/02-TRAZABILIDAD.md'].map((ruta) => (
              <li key={ruta}>
                <code className="rounded bg-fondo px-2 py-1 text-xs break-all">{ruta}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/*
        Creditos de las fotografias de la portada (`public/imagenes`), tomados del origen de
        cada descarga. Mantener al dia si se cambia una foto.
      */}
      <div className="mx-auto max-w-[86rem] px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-4 border-t border-texto/10 pt-8 text-xs leading-llano md:flex-row md:items-start md:justify-between md:gap-12">
          <p className="max-w-3xl">
            Fotografias: biometria de retina, rawpixel.com / Wit (Rawpixel Ltd.). Ambulancia,{' '}
            <a
              href="https://unsplash.com/photos/vGu08RYjO-s"
              className={claseEnlacePie}
              rel="noopener noreferrer"
              target="_blank"
            >
              Camilo Jimenez en Unsplash
            </a>
            . Pantallas clinicas y personal clinico,{' '}
            <a href="https://www.magnific.com/" className={claseEnlacePie} rel="noopener noreferrer" target="_blank">
              magnific.com
            </a>
            .
          </p>
          <p className="shrink-0 font-medium text-texto">Prototipo de propuesta, no producto.</p>
        </div>
      </div>
    </footer>
  );
}
