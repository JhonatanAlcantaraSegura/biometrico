'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock, LogOut, UserRound } from 'lucide-react';
import { cuentaDeUsuario } from '@/lib/datos/credenciales';
import { NOMBRE_ROL, TODOS_LOS_ROLES } from '@/lib/datos/rutas';
import { restanteDeSesion } from '@/lib/estado/sesion';
import { actions, type AppState } from '@/lib/estado/tienda';
import { Avatar, cx } from '@/components/ui/primitivos';

/**
 * Menu de usuario del encabezado.
 *
 * Junta lo que antes eran tres controles sueltos (nombre, selector de perfil, salir) en
 * un solo boton con avatar. El selector "ver como" vive DENTRO del menu porque se usa en
 * una demostracion, no en cada turno; dejarlo a la vista lo hacia parecer una funcion
 * operativa.
 *
 * Se cierra con Escape (devolviendo el foco al boton), con clic fuera y al elegir.
 */
export function MenuUsuario({ state, onSalir }: { state: AppState; onSalir: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [restante, setRestante] = useState('');
  const refRaiz = useRef<HTMLDivElement>(null);
  const refBoton = useRef<HTMLButtonElement>(null);

  const real = state.users.find((u) => u.user_id === state.sesion?.userId);
  const perfil = state.users.find((u) => u.user_id === state.currentUserId);
  const viendoComo = Boolean(real && perfil && real.user_id !== perfil.user_id);

  // El tiempo restante se calcula en un efecto: `Date.now()` en el render desincroniza
  // el HTML del servidor y el del navegador.
  const sesion = state.sesion;
  useEffect(() => {
    if (!sesion) return;
    const tick = () => setRestante(restanteDeSesion(sesion));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [sesion]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!refRaiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        refBoton.current?.focus();
      }
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  if (!perfil) return null;

  return (
    <div ref={refRaiz} className="relative">
      <button
        ref={refBoton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-usuario"
        className="flex items-center gap-2 rounded py-1 pr-2 pl-1 transition-colors hover:bg-superficie"
      >
        <Avatar nombre={perfil.name} className={viendoComo ? 'bg-atencion' : ''} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-medium text-texto">{perfil.name}</span>
          <span className="block text-xs text-texto-suave">{NOMBRE_ROL[perfil.role]}</span>
        </span>
        <ChevronDown
          className={cx('size-4 text-texto-suave transition-transform', abierto && 'rotate-180')}
          aria-hidden
        />
        <span className="sr-only">Menu de usuario</span>
      </button>

      {abierto && (
        <div
          id="menu-usuario"
          className="aparecer absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-fondo p-2 shadow-[0_8px_24px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar nombre={(real ?? perfil).name} className="size-11" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-texto">{(real ?? perfil).name}</p>
              <p className="truncate text-xs text-texto-suave">
                {cuentaDeUsuario((real ?? perfil).user_id)?.correo ?? NOMBRE_ROL[(real ?? perfil).role]}
              </p>
            </div>
          </div>

          {restante && (
            <p className="mx-2 mb-1 flex items-center gap-2 rounded-md bg-superficie px-2.5 py-1.5 text-xs text-texto-suave">
              <Clock className="size-3.5" aria-hidden />
              La sesion vence en <strong className="tabular-nums text-texto">{restante}</strong>
            </p>
          )}

          <div className="mt-1 border-t border-borde-suave px-2 pt-3 pb-2">
            <label htmlFor="sel-rol" className="flex items-center gap-1.5 text-xs font-medium text-texto">
              <UserRound className="size-3.5" aria-hidden />
              Ver el sistema como
            </label>
            <select
              id="sel-rol"
              value={state.currentUserId ?? ''}
              onChange={(e) => {
                actions.setCurrentUser(e.target.value);
                setAbierto(false);
              }}
              className="mt-1.5 min-h-control w-full rounded-md border border-borde bg-fondo px-2 text-sm text-texto"
            >
              {TODOS_LOS_ROLES.map((r) => {
                const u = state.users.find((x) => x.role === r);
                if (!u) return null;
                return (
                  <option key={r} value={u.user_id}>
                    {NOMBRE_ROL[r]}
                    {u.user_id === real?.user_id ? ' (su perfil)' : ''}
                  </option>
                );
              })}
            </select>
            <p className="mt-1.5 text-xs leading-comodo text-texto-suave">
              Demostracion de la matriz de permisos. La bitacora registra el cambio con su usuario como
              origen.
            </p>
          </div>

          <div className="border-t border-borde-suave pt-1">
            <button
              type="button"
              onClick={onSalir}
              className="flex min-h-control w-full items-center gap-2 rounded px-2 text-sm font-medium text-peligro hover:bg-peligro-suave"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Aviso de "ver como". Si la persona olvida que cambio de perfil, cree que el sistema le
 * quito permisos; el aviso lo dice y ofrece volver en un clic.
 */
export function AvisoVerComo({ state }: { state: AppState }) {
  const real = state.users.find((u) => u.user_id === state.sesion?.userId);
  const perfil = state.users.find((u) => u.user_id === state.currentUserId);
  if (!real || !perfil || real.user_id === perfil.user_id) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-atencion-suave px-4 py-1.5 text-xs text-atencion">
      <span>
        Viendo el sistema como <strong>{NOMBRE_ROL[perfil.role]}</strong>. Su sesion es de {real.name} (
        {NOMBRE_ROL[real.role]}).
      </span>
      <button
        type="button"
        onClick={() => actions.setCurrentUser(real.user_id)}
        className="font-medium underline underline-offset-2"
      >
        Volver a mi perfil
      </button>
    </div>
  );
}
