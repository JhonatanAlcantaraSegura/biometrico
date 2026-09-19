import type { Rol } from './tipos';

/**
 * Matriz de rutas por rol (ERS seccion 2, "Actores y permisos"), en UN solo lugar.
 *
 * La consumen la guarda de `app/(app)/layout.tsx` y el menu del Shell. Tenerla dos veces
 * es como se llega a un menu que promete pantallas que la guarda niega.
 *
 * Aviso que vale la pena dejar escrito: esto es COSMETICA Y CONVENIENCIA. En el sistema
 * real la garantia vive en el servidor (RF-22) — ocultar un enlace no es control de
 * acceso, quien sepa la URL la escribe. Aqui no hay servidor, asi que esta matriz es lo
 * unico que hay, y por eso es tambien el contrato que el backend tendra que implementar.
 */

export const TODOS_LOS_ROLES: readonly Rol[] = [
  'recepcion_triage',
  'enfermeria',
  'medico_urgencias',
  'cardiologia_hemodinamia',
  'traslados',
  'admision_identidad',
  'calidad',
  'admin_tecnico',
];

export const NOMBRE_ROL: Record<Rol, string> = {
  recepcion_triage: 'Recepcion y triage',
  enfermeria: 'Enfermeria',
  medico_urgencias: 'Medico de urgencias',
  cardiologia_hemodinamia: 'Cardiologia / hemodinamia',
  traslados: 'Traslados y ambulancia',
  admision_identidad: 'Admision y gestion de identidad',
  calidad: 'Calidad clinica',
  admin_tecnico: 'Administracion tecnica',
};

/** Lo que la ERS dice de cada actor, para que el selector de perfil no sea adivinanza. */
export const CAPACIDAD_ROL: Record<Rol, string> = {
  recepcion_triage:
    'Marca llegada, crea el episodio provisional y deriva de inmediato. Sin acceso al expediente completo.',
  enfermeria: 'Registra ECG e hitos, ve datos clinicos minimos autorizados y acusa tareas.',
  medico_urgencias:
    'Documenta interpretacion, diagnostico y hora cero; activa o cancela el Codigo Infarto y elige la ruta.',
  cardiologia_hemodinamia:
    'Recibe la alerta, acepta o rechaza disponibilidad de sala y registra hitos del procedimiento.',
  traslados: 'Recibe datos minimos y deja trazabilidad del traslado autorizado.',
  admision_identidad:
    'Vincula, corrige, fusiona o separa registros con doble revision en operaciones de alto impacto.',
  calidad: 'Ve metricas y casos seudonimizados. Acceso identificable solo si el rol y la finalidad lo autorizan.',
  admin_tecnico:
    'Configura conectores, permisos, politicas y auditoria. Sin acceso clinico por omision.',
};

export type GrupoMenu = 'Urgencias' | 'Identidad' | 'Coordinacion' | 'Gobierno';

export interface RutaProtegida {
  /** Patron con `:param` para los segmentos dinamicos: `/casos/:id/identidad`. */
  readonly patron: string;
  readonly etiqueta: string;
  readonly roles: readonly Rol[];
  /** Clave del icono; el Shell la resuelve para no meter lucide-react en la capa de datos. */
  readonly icono?: string;
  readonly grupo?: GrupoMenu;
  /** `false` = ruta alcanzable pero sin renglon propio en el menu. */
  readonly enMenu?: boolean;
  /** Requisitos de la ERS que la pantalla implementa; el Shell los muestra como pista. */
  readonly requisitos?: readonly string[];
}

export const RUTAS: readonly RutaProtegida[] = [
  /* --------------------------------------------------------------- Urgencias */
  // El ingreso lo abre CUALQUIER rol a proposito. La regla invariable de la ERS es que la
  // atencion empieza al llegar la persona: si el unico que puede marcar la llegada es
  // Recepcion y Recepcion esta ocupada, el reloj clinico no arranca.
  {
    patron: '/triage',
    etiqueta: 'Ingreso y triage',
    roles: TODOS_LOS_ROLES,
    icono: 'triage',
    grupo: 'Urgencias',
    enMenu: true,
    requisitos: ['RF-01', 'RF-02', 'RF-03', 'RF-04'],
  },
  {
    patron: '/tablero',
    etiqueta: 'Tablero operativo',
    roles: TODOS_LOS_ROLES,
    icono: 'tablero',
    grupo: 'Urgencias',
    enMenu: true,
    requisitos: ['RF-25', 'RF-21'],
  },
  // Calidad no entra al puesto del medico: su acceso es a metricas y casos seudonimizados.
  {
    patron: '/casos/:id',
    etiqueta: 'Puesto del medico',
    roles: [
      'recepcion_triage',
      'enfermeria',
      'medico_urgencias',
      'cardiologia_hemodinamia',
      'traslados',
      'admision_identidad',
      'admin_tecnico',
    ],
    requisitos: ['RF-16', 'RF-17', 'RF-20', 'RF-21'],
  },

  /* --------------------------------------------------------------- Identidad */
  {
    patron: '/casos/:id/identidad',
    etiqueta: 'Identidad y conciliacion',
    roles: ['recepcion_triage', 'medico_urgencias', 'admision_identidad', 'admin_tecnico'],
    requisitos: ['RF-05', 'RF-08', 'RF-10', 'RF-12'],
  },
  // Recepcion NO entra al resumen clinico: la ERS le niega el expediente completo.
  // Traslados tampoco: recibe conjunto minimo, no historia clinica.
  {
    patron: '/casos/:id/resumen',
    etiqueta: 'Resumen clinico',
    roles: ['enfermeria', 'medico_urgencias', 'cardiologia_hemodinamia'],
    requisitos: ['RF-13', 'RF-14', 'RF-24'],
  },

  // Consola del simulador biometrico. La abren quien gestiona identidad y quien administra
  // los equipos; tambien calidad, porque las tasas de error y la latencia por etapa son
  // indicadores suyos. Enfermeria y traslados NO: no configuran umbrales.
  {
    patron: '/biometria',
    etiqueta: 'Consola biometrica',
    roles: ['admision_identidad', 'admin_tecnico', 'calidad', 'medico_urgencias'],
    icono: 'biometria',
    grupo: 'Identidad',
    enMenu: true,
    requisitos: ['RF-09', 'RF-31', 'RNF-02', 'RNF-10'],
  },

  /* ------------------------------------------------------------- Coordinacion */
  {
    patron: '/coordinacion',
    etiqueta: 'Coordinacion del codigo',
    roles: [
      'enfermeria',
      'medico_urgencias',
      'cardiologia_hemodinamia',
      'traslados',
      'admin_tecnico',
    ],
    icono: 'coordinacion',
    grupo: 'Coordinacion',
    enMenu: true,
    requisitos: ['RF-18', 'RF-19', 'RF-21'],
  },
  {
    patron: '/hemodinamia',
    etiqueta: 'Hemodinamia y traslado',
    roles: ['medico_urgencias', 'cardiologia_hemodinamia', 'traslados', 'admin_tecnico'],
    icono: 'hemodinamia',
    grupo: 'Coordinacion',
    enMenu: true,
    requisitos: ['RF-19', 'RF-20'],
  },

  /* ----------------------------------------------------------------- Gobierno */
  {
    patron: '/calidad',
    etiqueta: 'Calidad e indicadores',
    roles: ['medico_urgencias', 'calidad', 'admin_tecnico'],
    icono: 'calidad',
    grupo: 'Gobierno',
    enMenu: true,
    requisitos: ['RF-26', 'RF-15'],
  },
  {
    patron: '/bitacora',
    etiqueta: 'Bitacora y accesos',
    roles: ['calidad', 'admin_tecnico'],
    icono: 'bitacora',
    grupo: 'Gobierno',
    enMenu: true,
    requisitos: ['RF-23', 'RF-22'],
  },
  {
    patron: '/integraciones',
    etiqueta: 'Integraciones y cola',
    roles: ['admin_tecnico'],
    icono: 'integraciones',
    grupo: 'Gobierno',
    enMenu: true,
    requisitos: ['RF-15', 'RF-32', 'RNF-03'],
  },
];

export const ORDEN_GRUPOS: readonly GrupoMenu[] = [
  'Urgencias',
  'Identidad',
  'Coordinacion',
  'Gobierno',
];

function segmentos(ruta: string): string[] {
  return ruta.split('/').filter(Boolean);
}

function coincide(patron: string, ruta: string): boolean {
  const p = segmentos(patron);
  const r = segmentos(ruta);
  if (p.length !== r.length) return false;
  return p.every((s, i) => s.startsWith(':') || s === r[i]);
}

/**
 * Busca la regla de una ruta. Gana la mas especifica: con la misma cantidad de segmentos,
 * la que tenga menos comodines.
 */
export function rutaDe(ruta: string): RutaProtegida | undefined {
  const limpia = ruta.split('?')[0].replace(/\/+$/, '') || '/';
  const candidatas = RUTAS.filter((r) => coincide(r.patron, limpia));
  if (candidatas.length === 0) return undefined;
  return candidatas.sort((a, b) => {
    const comodines = (x: string) => segmentos(x).filter((s) => s.startsWith(':')).length;
    return comodines(a.patron) - comodines(b.patron);
  })[0];
}

/** Regla del prototipo: lo que no esta en la matriz, no se abre. */
export function puedeVerRuta(ruta: string, rol: Rol): boolean {
  const regla = rutaDe(ruta);
  if (!regla) return false;
  return regla.roles.includes(rol);
}

export function rutasDelMenu(rol: Rol): readonly RutaProtegida[] {
  return RUTAS.filter((r) => r.enMenu && r.roles.includes(rol));
}

export function menuPorGrupo(rol: Rol): readonly { grupo: GrupoMenu; rutas: readonly RutaProtegida[] }[] {
  return ORDEN_GRUPOS.map((grupo) => ({
    grupo,
    rutas: rutasDelMenu(rol).filter((r) => r.grupo === grupo),
  })).filter((g) => g.rutas.length > 0);
}

/**
 * Primera pantalla del rol, para la pantalla de acceso denegado.
 *
 * El respaldo es `/triage` y no `/`: la raiz es el sitio publico de la propuesta, y mandar
 * ahi a quien ya tiene sesion lo saca del sistema en vez de devolverlo a su inicio.
 */
export function inicioDe(rol: Rol): string {
  const primera = rutasDelMenu(rol)[0];
  return primera ? primera.patron : '/triage';
}
