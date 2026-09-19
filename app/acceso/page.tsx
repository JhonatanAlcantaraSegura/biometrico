'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Info } from 'lucide-react';
import { INSTITUCION } from '@/lib/datos/institucion';
import { CAPACIDAD_ROL, NOMBRE_ROL, TODOS_LOS_ROLES, inicioDe, rutasDelMenu } from '@/lib/datos/rutas';
import { USERS } from '@/lib/datos/semilla';
import { actions } from '@/lib/estado/tienda';
import { AvisoPrototipo } from '@/components/dominio/marco-publico';
import { cx } from '@/components/ui/primitivos';

/**
 * Pantalla de acceso: seleccion de perfil, SIN contraseña.
 *
 * La decision de no poner un campo de contraseña es deliberada y va escrita en la propia
 * pantalla. Un formulario de usuario y clave que acepta cualquier cosa enseña a confiar en
 * un control que no existe; cuando este prototipo se enseñe en una sala, alguien preguntara
 * "¿y quien puede entrar?" y la respuesta honesta es "cualquiera, porque no hay backend".
 *
 * Lo que si hace la pantalla, y es su razon de ser: convierte la matriz de actores de la
 * seccion 2 de la ERS en algo que se puede tocar. Cada tarjeta dice lo que ese actor puede
 * hacer y cuantas pantallas ve, asi que la conversacion sobre permisos deja de ser
 * hipotetica.
 */
export default function Acceso() {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  // Si ya habia sesion guardada, no se obliga a elegir otra vez: se entra.
  useEffect(() => {
    const restaurada = actions.restaurarSesion();
    if (restaurada) router.replace('/tablero');
  }, [router]);

  function entrar(userId: string) {
    setSeleccionado(userId);
    actions.iniciarSesion(userId);
    const rol = USERS.find((u) => u.user_id === userId)?.role;
    router.push(rol ? inicioDe(rol) : '/tablero');
  }

  return (
    <div className="tema-publico min-h-dvh">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      <header className="border-b border-borde-suave bg-fondo">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primario-suave">
              <Activity className="size-6 text-primario-oscuro" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold text-texto">{INSTITUCION.marca}</span>
              <span className="block text-xs text-texto-suave">
                {INSTITUCION.sedeNombre} · {INSTITUCION.sedeDependencia}
              </span>
            </span>
          </Link>
          <Link href="/" className="control ml-auto flex items-center px-2 text-sm text-primario underline">
            Volver a la propuesta
          </Link>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-5xl px-4 py-10">
        <p className="rotulo">Acceso al prototipo</p>
        <h1 className="mt-3 text-3xl text-texto">Elija con que perfil quiere ver el sistema</h1>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-primario/30 bg-primario-suave p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primario-oscuro" aria-hidden />
          <p className="text-sm leading-llano text-primario-oscuro">
            <strong>No hay contraseña, y es a proposito.</strong> Este prototipo no tiene autenticacion
            ni servidor: el perfil solo cambia que pantallas y que acciones se habilitan, segun la matriz
            de actores de la ERS. En el sistema real la garantia de acceso vive en el servidor (RF-22), y
            un formulario de clave que acepta cualquier cosa enseñaria a confiar en un control que aqui
            no existe.
          </p>
        </div>

        <AvisoPrototipo className="mt-4" />

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {TODOS_LOS_ROLES.map((rol) => {
            const usuario = USERS.find((u) => u.role === rol);
            if (!usuario) return null;
            const pantallas = rutasDelMenu(rol).length;
            const activo = seleccionado === usuario.user_id;

            return (
              <li key={rol}>
                {/*
                  Es un `<button>` y no una tarjeta con `onClick`: asi entra en el orden de
                  tabulacion, se activa con Enter y con Espacio, y se anuncia como control.
                */}
                <button
                  type="button"
                  onClick={() => entrar(usuario.user_id)}
                  className={cx(
                    'sombra-publica flex h-full w-full flex-col items-start gap-1.5 rounded-xl border bg-fondo p-4 text-left transition-colors',
                    'hover:border-primario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco',
                    activo ? 'border-primario' : 'border-borde-suave',
                  )}
                >
                  <span className="flex w-full flex-wrap items-center justify-between gap-2">
                    <span className="text-base font-semibold text-texto">{NOMBRE_ROL[rol]}</span>
                    <span className="rounded-md bg-superficie px-2 py-0.5 text-xs font-semibold tabular-nums text-texto-suave">
                      {pantallas} {pantallas === 1 ? 'pantalla' : 'pantallas'}
                    </span>
                  </span>
                  <span className="text-sm text-texto-suave">{usuario.name}</span>
                  <span className="text-sm leading-llano text-texto-suave">{CAPACIDAD_ROL[rol]}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primario">
                    Entrar como este perfil
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-texto-suave">
          El perfil se puede cambiar en cualquier momento desde el encabezado del sistema, sin volver
          aqui. La sesion elegida es lo unico que el prototipo guarda en el navegador: el estado clinico
          vive en memoria y se pierde al recargar, para que esto no se parezca a un sistema de registro.
        </p>
      </main>
    </div>
  );
}
