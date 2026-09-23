'use client';

import { useEffect, useState } from 'react';
import { clockStatus, elapsedLabel, type ClockStatus } from '@/lib/tiempo';
import { Insignia, type Tono } from '@/components/ui/primitivos';

/**
 * Relojes clinicos — RF-21.
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
      className="rounded-md border border-borde-suave bg-superficie px-2 py-1.5 font-mono text-xs tabular-nums text-texto-suave"
      title="Hora local de la sede. Las marcas de tiempo se guardan en UTC."
    >
      {texto}
    </span>
  );
}

const TONO_RELOJ: Record<ClockStatus, Tono> = {
  en_meta: 'info',
  por_vencer: 'aviso',
  vencido: 'peligro',
  cumplido: 'exito',
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

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xl font-bold tabular-nums text-texto">{texto}</span>
      <div className="leading-tight">
        <div className="text-xs text-texto-suave">{etiqueta}</div>
        {goalMinutes !== undefined && (
          <Insignia tono={TONO_RELOJ[estado]}>
            meta {goalMinutes} min · {TEXTO_RELOJ[estado]}
          </Insignia>
        )}
      </div>
    </div>
  );
}
