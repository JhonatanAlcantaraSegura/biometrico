'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Entrada al hacer scroll para el sitio publico.
 *
 * `IntersectionObserver` y no un listener de `scroll`: no lee el layout en cada cuadro. El
 * elemento se oculta SOLO si al montar esta fuera de la pantalla y la persona no pidio
 * movimiento reducido; lo que ya se ve no parpadea, y sin JavaScript todo queda visible.
 */
export function Revelar({
  children,
  como: Etiqueta = 'div',
  retraso = 0,
  duracion,
  className,
}: {
  children: ReactNode;
  como?: ElementType;
  /** Milisegundos de espera, para escalonar elementos hermanos. */
  retraso?: number;
  /** Milisegundos que dura la entrada. Sin valor, la de `.revelar` (900 ms). */
  duracion?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const caja = nodo.getBoundingClientRect();
    if (caja.top < window.innerHeight && caja.bottom > 0) return;

    nodo.dataset.estado = 'oculto';
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        delete nodo.dataset.estado;
        observador.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref}
      className={className ? `revelar ${className}` : 'revelar'}
      style={
        retraso || duracion
          ? ({
              ...(retraso ? { '--retraso': `${retraso}ms` } : {}),
              ...(duracion ? { '--duracion': `${duracion}ms` } : {}),
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </Etiqueta>
  );
}
