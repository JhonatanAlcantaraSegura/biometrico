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
import { Boton, PantallaCarga, cx } from '@/components/ui/primitivos';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratacion: la preferencia del menu vive en localStorage, no se lee en el render
    if (guardado) setGruposAbiertos(guardado);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cerrar el menu movil al navegar por la aplicacion
    setMenuAbierto(false);
  }, [ruta]);

  // Escape cierra el cajon del menu movil, como cualquier panel superpuesto.
  useEffect(() => {
    if (!menuAbierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [menuAbierto]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abrir el grupo que contiene la ruta activa; derivarlo dejaria el grupo abierto para siempre
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
    <div className="min-h-dvh bg-lienzo-sutil lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      {/*
        Menu movil: cajon sobre el contenido con un velo gris al 65 % (nivel 2 de `DESIGN.md`).
        El velo es un boton: tocar fuera del cajon lo cierra, igual que Escape.
      */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setMenuAbierto(false)}
          className="no-imprimir fixed inset-0 z-40 bg-[rgba(128,128,128,0.65)] lg:hidden"
        />
      )}

      {/*
        Barra lateral a toda la altura, con la marca arriba. En escritorio es una columna fija
        de la rejilla (`sticky` + `h-dvh`), asi que el blanco llega siempre hasta abajo.
      */}
      <aside
        className={cx(
          'no-imprimir fixed inset-y-0 left-0 z-50 w-[17rem] flex-col bg-fondo lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-dvh',
          menuAbierto ? 'flex' : 'hidden',
        )}
      >
        {/* El logotipo lleva al TABLERO, no a `/`: la raiz es el sitio publico de la
            propuesta y quien esta con un paciente enfrente no debe salirse del sistema
            por tocar el encabezado. */}
        <Link href="/tablero" className="flex h-16 shrink-0 items-center gap-3 px-6">
          <Activity className="size-5 shrink-0 text-texto" aria-hidden />
          <span className="leading-tight">
            <span translate="no" className="block text-base font-medium text-texto">
              {INSTITUCION.marca}
            </span>
            <span className="block text-xs text-texto-suave">
              {INSTITUCION.sedeCodigo} · {INSTITUCION.sedeDependencia}
            </span>
          </span>
        </Link>

        <nav aria-label="Navegacion principal" className="flex-1 overflow-y-auto overscroll-contain px-3 pt-4 pb-6">
          {gruposOrdenados.map((g, i) => {
            const plegable = esPlegable(rol, g.grupo, g.rutas.length);
            const abierto = !plegable || Boolean(gruposAbiertos[claveDe(rol, g.grupo)]);
            const idLista = `menu-grupo-${i}`;

            return (
              <div key={g.grupo} className={plegable ? 'mb-2' : 'mb-6'}>
                {plegable ? (
                  <button
                    type="button"
                    onClick={() => alternarGrupo(g.grupo)}
                    aria-expanded={abierto}
                    aria-controls={idLista}
                    className="flex min-h-control w-full items-center gap-2 rounded px-3 text-xs font-medium text-texto-suave transition-colors hover:bg-superficie hover:text-texto"
                  >
                    <ChevronDown
                      className={cx('size-4 shrink-0 transition-transform', abierto ? '' : '-rotate-90')}
                      aria-hidden
                    />
                    {g.grupo}
                    {/* Cuantos renglones hay dentro: plegado, el grupo no se vuelve opaco. */}
                    <span className="ml-auto text-xs font-medium tabular-nums">{g.rutas.length}</span>
                  </button>
                ) : (
                  <p className="px-3 pb-2 text-xs font-medium text-texto-suave">{g.grupo}</p>
                )}

                <ul id={idLista} className={cx('space-y-0.5', abierto ? 'block' : 'hidden')}>
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
                            'flex min-h-control items-center gap-3 rounded px-3 text-sm transition-colors',
                            plegable ? 'ml-3' : '',
                            activo
                              ? 'bg-superficie font-medium text-texto'
                              : 'text-texto-suave hover:bg-superficie hover:text-texto',
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
        </nav>

        {/*
          Lo que el menu NO muestra, dicho en el menu. El perfil activo determina que
          pantallas se ven; que un rol no vea el resumen clinico no es un error de la
          demostracion, es la seccion 2 de la ERS aplicada.
        */}
        <p className="shrink-0 px-6 pb-6 text-xs leading-comodo text-texto-suave">
          El menu se filtra por perfil segun la matriz de la ERS. Esto es presentacion: en el sistema
          real la garantia de acceso vive en el servidor (RF-22).
        </p>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Banner permanente: este entorno no es apto para datos reales. */}
        <p className="no-imprimir bg-aviso-suave px-4 py-2 text-center text-xs font-medium text-aviso">
          {INSTITUCION.avisoPrototipo}
        </p>
        <div className="no-imprimir">
          <AvisoVerComo state={state} />
        </div>

        {/*
          Vidrio esmerilado, como el encabezado de la portada. Sin borde ni sombra. Fijo solo en
          escritorio: en un telefono ocuparia un tercio de la pantalla en cada desplazamiento.
        */}
        <header className="no-imprimir z-30 bg-fondo/80 backdrop-blur-md lg:sticky lg:top-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menu"
              aria-expanded={menuAbierto}
              className="-ml-1 rounded p-2 text-texto transition-colors hover:bg-superficie lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Link href="/tablero" className="flex items-center gap-2 lg:hidden">
              <Activity className="size-5 text-texto" aria-hidden />
              <span translate="no" className="text-base font-medium text-texto">
                {INSTITUCION.marca}
              </span>
            </Link>

            <BarraIntegraciones salud={state.integrations} />

            <div className="ml-auto flex items-center gap-2">
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
        </header>

        <main id="contenido" className="min-w-0 flex-1 px-4 pt-8 pb-12 lg:px-10 lg:pt-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">{children}</div>
        </main>

        <footer className="no-imprimir px-4 pb-8 text-xs text-texto-suave lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p>
              {INSTITUCION.sedeNombre}, {INSTITUCION.sedeDependencia}. {INSTITUCION.sedeNota}
            </p>
            <p className="mt-1">
              Derivado de la {INSTITUCION.documentoFuente} ·{' '}
              <Link className="underline underline-offset-2 transition-colors hover:text-texto" href="/">
                Volver al sitio de la propuesta
              </Link>
            </p>
          </div>
        </footer>
      </div>

      {/* WCAG 4.1.3: los avisos de estado se anuncian, no solo se colorean. */}
      <div
        aria-live="polite"
        className="no-imprimir fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {state.avisos.map((a) => (
          // Carbon sobre el contenido: la capa se distingue por el cambio de superficie, no
          // por una sombra. El punto de color acompaña; el texto del aviso es el que informa.
          <div key={a.id} className="aparecer flex items-start gap-3 rounded-xl bg-texto p-4 text-sm text-primario-texto">
            <span
              aria-hidden
              className={cx(
                'mt-1.5 size-2 shrink-0 rounded-full',
                a.tono === 'exito' && 'bg-exito-suave',
                a.tono === 'aviso' && 'bg-aviso-suave',
                a.tono === 'peligro' && 'bg-peligro-suave',
                a.tono === 'info' && 'bg-primario',
              )}
            />
            <span className="flex-1">{a.texto}</span>
            <button
              onClick={() => actions.descartarAviso(a.id)}
              aria-label="Descartar aviso"
              className="rounded p-1 text-primario-texto transition-colors hover:bg-primario-texto/10"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Nombres visibles de cada integracion. Los usa tambien el tablero. */
export const INTEGRACIONES: Array<{ clave: keyof IntegrationHealth; etiqueta: string }> = [
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
    <fieldset className="order-last grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center lg:order-none">
      <legend className="sr-only">Simulador de fallos de integracion</legend>
      <span aria-hidden className="hidden items-center gap-1.5 pr-1 text-xs font-medium text-texto-suave 2xl:flex">
        <ClipboardList className="size-3.5" />
        Simulador
      </span>
      {INTEGRACIONES.map(({ clave, etiqueta }) => {
        const valor = salud[clave];
        return (
          // Una sola pieza por integracion: punto de estado, nombre y selector. El estado se
          // lee en el selector; el punto de color solo lo acompaña.
          <label
            key={clave}
            htmlFor={`int-${clave}`}
            className="relative flex min-h-control items-center gap-1.5 rounded border border-borde bg-fondo pl-2.5 text-xs text-texto transition-colors hover:bg-superficie"
          >
            <span
              aria-hidden
              className={cx(
                'size-2 shrink-0 rounded-full',
                valor === 'ok' ? 'bg-exito' : valor === 'lento' ? 'bg-aviso' : 'bg-peligro',
              )}
            />
            <span className="font-medium">{etiqueta}</span>
            <span className="sr-only">, estado simulado</span>
            <select
              id={`int-${clave}`}
              value={valor}
              onChange={(e) => actions.setIntegration(clave, e.target.value as IntegrationStatus)}
              className="min-h-0 cursor-pointer appearance-none self-stretch rounded-r border-0 bg-transparent pr-6 pl-1 text-xs text-texto-suave"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {/* Flecha propia y chica: la del navegador trae su propio relleno y ensancha cada pieza. */}
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-1.5 size-3.5 text-texto-suave"
            />
          </label>
        );
      })}
    </fieldset>
  );
}
