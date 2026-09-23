'use client';

import { useEffect, useState } from 'react';
import { clockStatus, elapsedLabel, type ClockStatus } from '@/lib/tiempo';
import { cx } from '@/components/ui/primitivos';

/**
 * Relojes clinicos, RF-21.
 *
 * Dos cosas que el documento pide y que aqui se cumplen en el comportamiento, no en el
 * texto:
 *
 * 1. **El origen del tiempo es visible.** Un temporizador sin procedencia no sirve para
 *    auditar: la pantalla dice de donde sale la hora.
 * 2. **Un aviso nunca cambia el plan clinico.** El semaforo informa; no bloquea, no
 *    reordena la lista y no dispara ninguna accion. Que el reloj se ponga rojo no es una
 *    instruccion.
 *
 * El tick es de un segundo y vive en el cliente. En SSR el valor inicial es un guion para
 * que el HTML del servidor y el primer render del navegador sean identicos: una hora
 * calculada durante el render es un desajuste de hidratacion garantizado.
 */
function useTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  return tick;
}

/** Hora local de la sede, en el encabezado del panel. */
export function RelojLocal() {
  const tick = useTick();
  const [texto, setTexto] = useState<string>('--:--:--');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la hora debe aparecer al montar, no un segundo despues: derivarla del tick la retrasaria
    setTexto(new Date().toLocaleTimeString('es-MX'));
  }, [tick]);
  return (
    <span
      className="hidden px-2 font-mono text-sm tabular-nums text-texto-suave sm:inline"
      title="Hora local de la sede. Las marcas de tiempo se guardan en UTC."
    >
      {texto}
    </span>
  );
}

/** Color de texto y de punto por estado. El texto del estado siempre acompaña al color. */
const TONO_RELOJ: Record<ClockStatus, { texto: string; punto: string }> = {
  en_meta: { texto: 'text-info', punto: 'bg-info' },
  por_vencer: { texto: 'text-aviso', punto: 'bg-aviso' },
  vencido: { texto: 'text-peligro', punto: 'bg-peligro' },
  cumplido: { texto: 'text-exito', punto: 'bg-exito' },
};

const TEXTO_RELOJ: Record<ClockStatus, string> = {
  en_meta: 'dentro de meta',
  por_vencer: 'por vencer',
  vencido: 'meta rebasada',
  cumplido: 'meta cumplida',
};

export function Cronometro({
  from,
  goalMinutes,
  completedAt,
  etiqueta,
}: {
  from: string;
  goalMinutes?: number;
  completedAt?: string;
  etiqueta: string;
}) {
  const tick = useTick();
  const [texto, setTexto] = useState('--:--');
  const [estado, setEstado] = useState<ClockStatus>('en_meta');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el cronometro debe arrancar al montar, no un segundo despues (RF-21)
    setTexto(elapsedLabel(from, completedAt));
    setEstado(goalMinutes ? clockStatus(from, goalMinutes, completedAt) : completedAt ? 'cumplido' : 'en_meta');
  }, [tick, from, goalMinutes, completedAt]);

  // Etiqueta arriba, cifra grande en medio, estado en una sola linea abajo: se lee de lejos
  // y nada se parte en dos renglones dentro de una pastilla.
  return (
    <div className="min-w-0">
      <div className="text-xs text-texto-suave">{etiqueta}</div>
      <div className="display mt-1 text-3xl text-texto tabular-nums">{texto}</div>
      {goalMinutes !== undefined && (
        <div className={cx('mt-1.5 flex items-center gap-1.5 text-xs font-medium', TONO_RELOJ[estado].texto)}>
          <span aria-hidden className={cx('size-1.5 shrink-0 rounded-full', TONO_RELOJ[estado].punto)} />
          {TEXTO_RELOJ[estado]}
          <span className="font-normal text-texto-suave">· meta {goalMinutes} min</span>
        </div>
      )}
    </div>
  );
}
