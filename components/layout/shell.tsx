'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlarmClock,
  ChevronDown,
  ClipboardList,
  Fingerprint,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  ScanFace,
  ScrollText,
  Siren,
  X,
  type LucideIcon,
} from 'lucide-react';
import { INSTITUCION } from '@/lib/datos/institucion';
import { menuPorGrupo } from '@/lib/datos/rutas';
import type { GrupoMenu, RutaProtegida } from '@/lib/datos/rutas';
import type { Rol } from '@/lib/datos/tipos';
import { CLAVE_MENU, escribir, leer } from '@/lib/estado/persistencia';
import { actions, useAppState, userById, type IntegrationHealth, type IntegrationStatus } from '@/lib/estado/tienda';
import { Boton, Insignia, PantallaCarga, cx } from '@/components/ui/primitivos';
import { AvisoVerComo, MenuUsuario } from '@/components/layout/menu-usuario';
import { RelojLocal } from '@/components/dominio/relojes';

/**
 * Iconos del menu, resueltos AQUI y no en `lib/datos/rutas.ts`: la matriz de permisos es un
 * contrato que el backend tendra que implementar, y no debe arrastrar dependencias de UI.
 */
const ICONOS: Record<string, LucideIcon> = {
  triage: Siren,
  tablero: LayoutDashboard,
  identidad: Fingerprint,
  biometria: ScanFace,
  coordinacion: AlarmClock,
  hemodinamia: HeartPulse,
  calidad: Gauge,
  bitacora: ScrollText,
  integraciones: Plug,
};

/**
 * Grupos de BAJA FRECUENCIA por rol.
 *
 * El menu no esconde nada: lo que se abre en cada turno queda a la vista y lo que se abre
 * cuando cambia una politica queda a un clic, plegado y al final. Ninguna ruta ni ningun
 * permiso se quita — `lib/datos/rutas.ts` sigue siendo la unica fuente de verdad y esto es
 * exclusivamente presentacion.
 *
 * Para `admin_tecnico` y `calidad`, "Gobierno" NO es de baja frecuencia: es su trabajo.
 */
const GRUPOS_DE_BAJA_FRECUENCIA: Record<Rol, readonly GrupoMenu[]> = {
  recepcion_triage: ['Gobierno'],
  enfermeria: ['Gobierno'],
  medico_urgencias: ['Gobierno'],
  cardiologia_hemodinamia: ['Gobierno'],
  traslados: ['Gobierno'],
  admision_identidad: ['Gobierno'],
  calidad: [],
  admin_tecnico: [],
};

/** Plegar un grupo de uno o dos renglones no ahorra nada y si agrega un clic. */
const MINIMO_PARA_PLEGAR = 3;

function esPlegable(rol: Rol, grupo: GrupoMenu, cuantos: number): boolean {
  return cuantos >= MINIMO_PARA_PLEGAR && GRUPOS_DE_BAJA_FRECUENCIA[rol].includes(grupo);
}

function claveDe(rol: Rol, grupo: GrupoMenu): string {
  return `${rol}:${grupo}`;
}

function contiene(rutas: readonly RutaProtegida[], ruta: string): boolean {
  return rutas.some((m) => {
    const base = m.patron.split('/:')[0];
    return ruta === base || ruta.startsWith(`${base}/`);
  });
}

export function Shell({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});

  const rol = state ? (userById(state, state.currentUserId ?? undefined)?.role ?? 'medico_urgencias') : 'medico_urgencias';
  const grupos = useMemo(() => menuPorGrupo(rol), [rol]);

  const gruposOrdenados = useMemo(
    () =>
      [...grupos].sort(
        (a, b) =>
          Number(esPlegable(rol, a.grupo, a.rutas.length)) - Number(esPlegable(rol, b.grupo, b.rutas.length)),
      ),
    [grupos, rol],
  );

  // Nada de `localStorage` durante el render: el HTML del servidor y el primer render del
  // navegador deben ser identicos. La preferencia entra despues, en un efecto.
  useEffect(() => {
    const guardado = leer<Record<string, boolean>>(CLAVE_MENU);
    if (guardado) setGruposAbiertos(guardado);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ruta]);

  /*
   * Si la pantalla actual vive dentro de un grupo plegado, el grupo se abre solo. Sin esto,
   * quien entra a "Bitacora y accesos" desde un enlace ve el menu sin ningun renglon
   * resaltado y cree que se salio del sistema.
   */
  useEffect(() => {
    const dentro = gruposOrdenados.find(
      (g) => esPlegable(rol, g.grupo, g.rutas.length) && contiene(g.rutas, ruta),
    );
    if (!dentro) return;
    const clave = claveDe(rol, dentro.grupo);
    setGruposAbiertos((previo) => (previo[clave] ? previo : { ...previo, [clave]: true }));
  }, [ruta, rol, gruposOrdenados]);

  if (!state) return <PantallaCarga mensaje="Cargando el estado local del prototipo..." />;

  function alternarGrupo(grupo: GrupoMenu) {
    const clave = claveDe(rol, grupo);
    const siguiente = { ...gruposAbiertos, [clave]: !gruposAbiertos[clave] };
    setGruposAbiertos(siguiente);
    // Si el almacenamiento esta bloqueado, `escribir` devuelve `false` y no pasa nada: el
    // menu funciona igual, solo que no recuerda el plegado entre sesiones.
    escribir(CLAVE_MENU, siguiente);
  }

  function salir() {
    // La guarda redirige a `/acceso?motivo=salida` al ver la sesion cerrada; navegar
    // tambien desde aqui dejaria dos `replace` compitiendo por la URL final.
    actions.cerrarSesion();
  }

  return (
    <div className="min-h-dvh bg-lienzo">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      {/* Banner permanente: este entorno no es apto para datos reales. */}
      <p className="no-imprimir bg-aviso-suave px-4 py-1.5 text-center text-xs font-semibold text-aviso">
        {INSTITUCION.avisoPrototipo}
      </p>
      <div className="no-imprimir">
        <AvisoVerComo state={state} />
      </div>

      <header className="no-imprimir sticky top-0 z-30 border-b border-borde-suave bg-fondo shadow-suave">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={menuAbierto}
            className="rounded-md p-2 text-texto hover:bg-superficie lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          {/* El logotipo lleva al TABLERO, no a `/`: la raiz es el sitio publico de la
              propuesta y quien esta con un paciente enfrente no debe salirse del sistema
              por tocar el encabezado. */}
          <Link href="/tablero" className="flex items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primario-suave">
              <Activity className="size-5 text-primario-oscuro" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-texto">{INSTITUCION.marca}</span>
              <span className="block text-xs text-texto-suave">
                {INSTITUCION.sedeCodigo} · {INSTITUCION.sedeDependencia}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <RelojLocal />

            <MenuUsuario state={state} onSalir={salir} />

            {/* Cerrar sesion SIEMPRE visible: es la salida de emergencia de un equipo
                compartido, donde quien se levanta no debe dejar su sesion abierta. */}
            <Boton tono="neutro" onClick={salir}>
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Salir</span>
              <span className="sr-only sm:hidden">Cerrar sesion</span>
            </Boton>
          </div>
        </div>

        <BarraIntegraciones salud={state.integrations} />
      </header>

      <div className="flex">
        <nav
          aria-label="Navegacion principal"
          className={cx(
            'no-imprimir w-72 shrink-0 border-r border-borde-suave bg-fondo p-3',
            'fixed inset-y-0 left-0 z-40 mt-[7.5rem] overflow-y-auto lg:sticky lg:top-[7.5rem] lg:mt-0 lg:block lg:h-[calc(100dvh-7.5rem)]',
            menuAbierto ? 'block' : 'hidden',
          )}
        >
          {gruposOrdenados.map((g, i) => {
            const plegable = esPlegable(rol, g.grupo, g.rutas.length);
            const abierto = !plegable || Boolean(gruposAbiertos[claveDe(rol, g.grupo)]);
            const idLista = `menu-grupo-${i}`;

            return (
              <div key={g.grupo} className={plegable ? 'mb-2' : 'mb-4'}>
                {plegable ? (
                  <button
                    type="button"
                    onClick={() => alternarGrupo(g.grupo)}
                    aria-expanded={abierto}
                    aria-controls={idLista}
                    className="flex min-h-control w-full items-center gap-2 rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-texto-suave hover:bg-superficie"
                  >
                    <ChevronDown
                      className={cx('size-4 shrink-0 transition-transform duration-200', abierto ? '' : '-rotate-90')}
                      aria-hidden
                    />
                    {g.grupo}
                    {/* Cuantos renglones hay dentro: plegado, el grupo no se vuelve opaco. */}
                    <span className="ml-auto text-xs font-semibold tabular-nums">{g.rutas.length}</span>
                  </button>
                ) : (
                  <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-texto-suave">{g.grupo}</p>
                )}

                <ul id={idLista} className={abierto ? 'block' : 'hidden'}>
                  {g.rutas.map((m) => {
                    const base = m.patron.split('/:')[0];
                    const activo = ruta === base || ruta.startsWith(`${base}/`);
                    const Icono = ICONOS[m.icono ?? ''] ?? LayoutDashboard;
                    return (
                      <li key={m.patron}>
                        {/* `aria-current="page"` le dice a un lector de pantalla donde esta
                            la persona, y no depende del color de fondo para comunicarlo. */}
                        <Link
                          href={m.patron}
                          aria-current={activo ? 'page' : undefined}
                          className={cx(
                            'flex min-h-control items-center gap-2.5 rounded-lg px-3 text-sm',
                            plegable ? 'ml-3 border-l border-borde-suave' : '',
                            activo
                              ? 'bg-primario-suave font-semibold text-primario-oscuro'
                              : 'text-texto hover:bg-superficie',
                          )}
                        >
                          <Icono className="size-4 shrink-0" aria-hidden />
                          {m.etiqueta}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/*
            Lo que el menu NO muestra, dicho en el menu. El perfil activo determina que
            pantallas se ven; que un rol no vea el resumen clinico no es un error de la
            demostracion, es la seccion 2 de la ERS aplicada.
          */}
          <p className="mt-4 rounded-lg bg-superficie px-3 py-2 text-xs leading-comodo text-texto-suave">
            El menu se filtra por perfil segun la matriz de la ERS. Esto es presentacion: en el
            sistema real la garantia de acceso vive en el servidor (RF-22).
          </p>
        </nav>

        <main id="contenido" className="min-w-0 flex-1 p-4 lg:p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-5">{children}</div>

          <footer className="no-imprimir mx-auto mt-10 max-w-7xl border-t border-borde-suave pt-4 text-xs text-texto-suave">
            <p>
              {INSTITUCION.sedeNombre} — {INSTITUCION.sedeDependencia}. {INSTITUCION.sedeNota}
            </p>
            <p className="mt-1">
              Derivado de la {INSTITUCION.documentoFuente} ·{' '}
              <Link className="text-primario underline" href="/">
                Volver al sitio de la propuesta
              </Link>
            </p>
          </footer>
        </main>
      </div>

      {/* WCAG 4.1.3: los avisos de estado se anuncian, no solo se colorean. */}
      <div
        aria-live="polite"
        className="no-imprimir fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {state.avisos.map((a) => (
          <div
            key={a.id}
            className={cx(
              'flex items-start gap-2 rounded-lg border-l-4 bg-fondo p-3 text-sm shadow-elevada',
              a.tono === 'exito' && 'border-exito',
              a.tono === 'aviso' && 'border-aviso',
              a.tono === 'peligro' && 'border-peligro',
              a.tono === 'info' && 'border-primario',
            )}
          >
            <span className="flex-1 text-texto">{a.texto}</span>
            <button
              onClick={() => actions.descartarAviso(a.id)}
              aria-label="Descartar aviso"
              className="rounded p-1 text-texto-suave hover:bg-superficie"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const INTEGRACIONES: Array<{ clave: keyof IntegrationHealth; etiqueta: string }> = [
  { clave: 'ehr', etiqueta: 'ECE' },
  { clave: 'biometric', etiqueta: 'Motor 1:N' },
  { clave: 'worldId', etiqueta: 'World ID' },
  { clave: 'notifications', etiqueta: 'Avisos' },
];

const ESTADOS: IntegrationStatus[] = ['ok', 'lento', 'caido'];

/**
 * Simulador de fallos — RNF-01, RNF-03, CA-06, CA-07.
 *
 * Esta barra no es una herramienta de desarrollo escondida: va en el encabezado, a la
 * vista, porque la afirmacion mas importante de la ERS es que urgencias no se bloquea
 * cuando falla una integracion, y una afirmacion asi se demuestra tumbandola enfrente de
 * quien tiene que aprobarla.
 */
function BarraIntegraciones({ salud }: { salud: IntegrationHealth }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-borde-suave bg-superficie px-4 py-2">
      <span className="text-xs font-bold uppercase tracking-wider text-texto-suave">
        <ClipboardList className="mr-1 inline size-3.5" aria-hidden />
        Simulador de fallos
      </span>
      {INTEGRACIONES.map(({ clave, etiqueta }) => {
        const valor = salud[clave];
        return (
          <div key={clave} className="flex items-center gap-1.5">
            <Insignia tono={valor === 'ok' ? 'exito' : valor === 'lento' ? 'aviso' : 'peligro'}>{etiqueta}</Insignia>
            <label className="sr-only" htmlFor={`int-${clave}`}>
              Estado simulado de {etiqueta}
            </label>
            <select
              id={`int-${clave}`}
              value={valor}
              onChange={(e) => actions.setIntegration(clave, e.target.value as IntegrationStatus)}
              className="min-h-control rounded border border-borde bg-fondo px-1.5 text-xs text-texto"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
