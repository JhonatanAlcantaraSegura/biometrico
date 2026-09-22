/**
 * Persistencia del prototipo. Adaptado del proyecto de referencia, con UNA diferencia
 * deliberada: aqui solo se guarda la SESION simulada, nunca el estado clinico.
 *
 * Por que la asimetria: guardar episodios, diagnosticos o evidencia de identidad en el
 * navegador convertiria esta demostracion en algo que se parece a un sistema de registro
 * clinico sin serlo. El expediente es el ECE (ERS seccion 7); un prototipo que recuerda
 * pacientes entre recargas invita a que alguien capture algo real "nada mas para probar".
 * El estado clinico vive en memoria y se pierde al recargar, y eso es la funcion, no el
 * defecto.
 *
 * Reglas de la casa, iguales a las del proyecto de referencia:
 *
 * 1. TODO acceso va envuelto en `try/catch`. En modo privado de Safari, con la cuota
 *    agotada o con el almacenamiento bloqueado por politica del equipo institucional,
 *    `localStorage` LANZA. Una demostracion no se puede caer porque el navegador del
 *    hospital tenga el almacenamiento apagado: si no se puede guardar, se sigue en memoria.
 * 2. Lo guardado lleva numero de version. Si no coincide con la del codigo, se descarta.
 * 3. Nada se lee durante el render. Lo persistido entra en un `useEffect`, para que el
 *    HTML del servidor y el primer render del navegador sean identicos.
 */

export const CLAVE_ALMACEN = 'codigo-infarto-prototipo/v1';
export const VERSION_ESTADO = 1;

export const CLAVE_SESION = `${CLAVE_ALMACEN}:sesion`;
export const CLAVE_MENU = `${CLAVE_ALMACEN}:menu-abierto`;
export const CLAVE_INTENTOS = `${CLAVE_ALMACEN}:intentos`;

/**
 * La sesion paso de ser un `user_id` suelto (selector de perfil) a un objeto con
 * expiracion. La version propia hace que una sesion guardada con el formato viejo se
 * descarte sola en vez de colarse como sesion sin vencimiento.
 */
export const VERSION_SESION = 2;

interface Sobre<T> {
  version: number;
  guardadoEn: string;
  datos: T;
}

function almacen(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function leer<T>(clave: string, version = VERSION_ESTADO): T | null {
  const store = almacen();
  if (!store) return null;
  try {
    const crudo = store.getItem(clave);
    if (!crudo) return null;
    const sobre = JSON.parse(crudo) as Sobre<T>;
    if (!sobre || typeof sobre !== 'object' || sobre.version !== version) {
      store.removeItem(clave);
      return null;
    }
    return sobre.datos;
  } catch {
    try {
      store.removeItem(clave);
    } catch {
      /* el almacenamiento esta bloqueado: no hay nada mas que hacer */
    }
    return null;
  }
}

export function escribir<T>(clave: string, datos: T, version = VERSION_ESTADO): boolean {
  const store = almacen();
  if (!store) return false;
  try {
    const sobre: Sobre<T> = { version, guardadoEn: new Date().toISOString(), datos };
    store.setItem(clave, JSON.stringify(sobre));
    return true;
  } catch {
    return false;
  }
}

export function borrar(...claves: string[]): void {
  const store = almacen();
  if (!store) return;
  for (const c of claves) {
    try {
      store.removeItem(c);
    } catch {
      /* almacenamiento bloqueado */
    }
  }
}

export function hayAlmacenamiento(): boolean {
  const store = almacen();
  if (!store) return false;
  try {
    const prueba = `${CLAVE_ALMACEN}:prueba`;
    store.setItem(prueba, '1');
    store.removeItem(prueba);
    return true;
  } catch {
    return false;
  }
}
