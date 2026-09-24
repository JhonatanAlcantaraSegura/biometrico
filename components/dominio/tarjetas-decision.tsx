'use client';

import Image, { type StaticImageData } from 'next/image';
import { useState } from 'react';
import { DECISIONES_ABIERTAS } from '@/lib/datos/institucion';
import { cx } from '@/components/ui/primitivos';
import autorizacion from '@/public/imagenes/decision-1-autorizacion.webp';
import expediente from '@/public/imagenes/decision-2-expediente-clinico.webp';
import pacienteInconsciente from '@/public/imagenes/decision-3-paciente-inconsciente.webp';
import baseJuridica from '@/public/imagenes/decision-4-base-juridica.webp';
import cotizaciones from '@/public/imagenes/decision-5-cotizaciones-licencias.webp';

type ClaveDecision = (typeof DECISIONES_ABIERTAS)[number]['clave'];

const IMAGENES: Record<ClaveDecision, StaticImageData> = {
  autorizacion,
  ece: expediente,
  biometria: pacienteInconsciente,
  juridico: baseJuridica,
  costos: cotizaciones,
};

/** Sombra ligerisima en Carbon (no negro puro): excepcion pedida a `DESIGN.md`, que no usa sombras. */
const cara =
  'flex h-full flex-col overflow-hidden rounded-xl bg-lienzo-sutil backface-hidden ' +
  'shadow-[0_1px_2px_rgb(23_26_32/0.04),0_8px_20px_-10px_rgb(23_26_32/0.12)]';

/**
 * Las cinco decisiones abiertas como tarjetas que se voltean.
 *
 * Reglas (EARS, pedidas para esta seccion):
 * - Las tarjetas son estaticas: sin entrada al hacer scroll y sin moverse de su lugar.
 * - Al hacer clic, la tarjeta gira sobre su eje vertical, como una pagina, y muestra su imagen
 *   a toda la tarjeta, con el titulo en una franja; sin numero.
 * - Mientras el cursor siga sobre ESA tarjeta, la imagen se queda; al salir, regresa al texto
 *   con el mismo giro y el estado queda limpio.
 * - Solo una tarjeta volteada a la vez: `volteada` es un solo indice. Para hacer clic en otra
 *   hay que salir de la primera, y esa salida ya la regreso.
 *
 * El `button` que recibe el clic y el cursor NO gira: es una capa fija encima. Si fuera la cara
 * que rota, a 90 grados quedaria de canto y el navegador dispararia la salida a medio giro.
 * El teclado sigue la misma regla: Enter o Espacio voltea; salir con Tab (blur) regresa.
 */
export function TarjetasDecision() {
  const [volteada, setVolteada] = useState<number | null>(null);
  const regresar = (i: number) => setVolteada((v) => (v === i ? null : v));

  return (
    <ol
      tabIndex={0}
      aria-label="Decisiones abiertas"
      className="-mx-4 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {DECISIONES_ABIERTAS.map((d, i) => {
        const vuelta = volteada === i;
        return (
          <li
            key={d.clave}
            className="relative w-[17rem] shrink-0 snap-start perspective-[1400px] lg:w-auto"
            onMouseLeave={() => regresar(i)}
          >
            <div
              /*
                La duracion la pone el estado AL QUE se va: volteando (entrada) 600 ms; regresando
                (salida, al quitar el cursor) 850 ms, un cuarto de segundo mas lenta.
              */
              className={cx(
                'relative h-full transition-transform ease-[cubic-bezier(0.4,0,0.2,1)] transform-3d motion-reduce:transition-none',
                vuelta ? 'rotate-y-180 duration-[600ms]' : 'duration-[850ms]',
              )}
            >
              {/* Frente: el texto. Esta en flujo y fija la altura de la tarjeta. */}
              <div className={cx(cara, 'p-7')}>
                <div className="flex items-end justify-between gap-3" aria-hidden>
                  <span className="display tabular-nums">
                    <span className="text-5xl text-aviso">{i + 1}</span>
                    <span className="ml-1 text-lg text-texto-suave">/{DECISIONES_ABIERTAS.length}</span>
                  </span>
                  <span className="mb-2 flex gap-1">
                    {DECISIONES_ABIERTAS.map((_, j) => (
                      <span key={j} className={cx('h-1 w-3 rounded-full', j === i ? 'bg-aviso' : 'bg-texto/15')} />
                    ))}
                  </span>
                </div>

                <h3 className="mt-8 text-lg leading-snug font-medium text-texto">{d.titulo}</h3>
                <p className="mt-3 text-sm leading-relajado text-texto-suave">{d.detalle}</p>

                {/* `mt-auto` empuja el pie al fondo; el `pt-8` del envoltorio garantiza aire. */}
                <div className="mt-auto pt-8">
                  <p className="flex items-center gap-2 border-t border-texto/10 pt-5 text-xs font-medium text-aviso">
                    <span aria-hidden className="size-1.5 rounded-full bg-aviso" />
                    Decision abierta
                  </p>
                </div>
              </div>

              {/*
                Reverso: la imagen cubre TODA la tarjeta y el titulo va sobre una franja Carbon al
                80 %, con un filete `aviso` arriba que la amarra al numero del frente. Medido en el
                peor caso (foto blanca detras): blanco sobre Carbon/80 = 9.18:1, sobre el 7:1 de AAA.
                No bajar de 70 % (6.40:1) sin volver a medir.
                `sizes`: la tarjeta es vertical, asi que la foto 4:3 se escala por su ALTO (~480 px
                -> ~640 px de ancho visible), no por el ancho de la tarjeta. Decorativo.
              */}
              <div aria-hidden className={cx(cara, 'absolute inset-0 rotate-y-180')}>
                <Image
                  src={IMAGENES[d.clave]}
                  alt=""
                  fill
                  placeholder="blur"
                  sizes="640px"
                  className="object-cover"
                />
                <p className="absolute inset-x-0 bottom-0 border-t-2 border-aviso bg-texto/80 px-7 py-5 text-lg leading-snug font-medium text-primario-texto">
                  {d.titulo}
                </p>
              </div>
            </div>

            {/* Capa fija que recibe clic, cursor y foco; no gira con la tarjeta. */}
            <button
              type="button"
              aria-pressed={vuelta}
              aria-label={`Mostrar imagen: ${d.titulo}`}
              className="absolute inset-0 z-10 cursor-pointer rounded-xl"
              onClick={() => setVolteada(i)}
              onBlur={() => regresar(i)}
            />
          </li>
        );
      })}
    </ol>
  );
}
