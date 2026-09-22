import { CONTRASENA_DEMO, CUENTAS, type Cuenta } from '../datos/credenciales';
import { CLAVE_INTENTOS, CLAVE_SESION, VERSION_SESION, borrar, escribir, leer } from './persistencia';

/**
 * Sesion SIMULADA del prototipo, adaptada del proyecto de referencia (URIS-CITAS).
 *
 * No hay servidor, asi que no hay autenticacion: esto es una maqueta honesta de la
 * CONDUCTA que el sistema real tendra — credenciales, bloqueo tras intentos fallidos con
 * su cuenta regresiva, cuenta desactivada y expiracion por turno. Lo que se evalua en una
 * reunion es esa conducta, no la criptografia, y la pantalla de acceso lo dice.
 *
 * El bloqueo de 3 intentos viene del contrato del servicio de autenticacion de CURA (429
 * con `retryAfterSeconds`); la duracion se acorta a 5 minutos porque en una demostracion
 * nadie espera media hora para seguir.
 */

/** Doce horas: un turno de urgencias. Al vencer, la sesion se descarta. */
export const DURACION_SESION_MIN = 12 * 60;
export const MAX_INTENTOS = 3;
export const BLOQUEO_MIN = 5;

export interface Sesion {
  /** Quien se autentico. No cambia al usar "ver como". */
  readonly userId: string;
  /** Perfil con el que se esta viendo el sistema. Igual a `userId` salvo en "ver como". */
  readonly perfilId: string;
  readonly iniciadaEn: string;
  readonly expiraEn: string;
}

interface IntentosCorreo {
  intentos: number;
  /** ISO del fin del bloqueo; `null` = no esta bloqueado. */
  bloqueadoHasta: string | null;
}

type RegistroIntentos = Record<string, IntentosCorreo>;

export type FalloLogin =
  | { clave: 'VACIO'; mensaje: string; campo: 'correo' | 'contrasena' }
  | { clave: 'CREDENCIALES'; mensaje: string; intentosRestantes: number }
  | { clave: 'INACTIVA'; mensaje: string }
  | { clave: 'BLOQUEADO'; mensaje: string; bloqueadoHasta: string };

export type ResultadoLogin = { ok: true; sesion: Sesion; cuenta: Cuenta } | { ok: false; fallo: FalloLogin };

export function normalizar(correo: string): string {
  return correo.trim().toLowerCase();
}

/**
 * Lee la sesion guardada. `vencida` distingue "nunca hubo sesion" de "la habia y termino
 * el turno": la pantalla de acceso le explica a la segunda persona por que volvio ahi.
 */
export function leerSesion(ahora = Date.now()): { sesion: Sesion | null; vencida: boolean } {
  const s = leer<Sesion>(CLAVE_SESION, VERSION_SESION);
  if (!s || typeof s.userId !== 'string' || typeof s.expiraEn !== 'string') return { sesion: null, vencida: false };
  if (new Date(s.expiraEn).getTime() <= ahora) {
    borrar(CLAVE_SESION);
    return { sesion: null, vencida: true };
  }
  return { sesion: s, vencida: false };
}

export function guardarSesion(sesion: Sesion): void {
  escribir(CLAVE_SESION, sesion, VERSION_SESION);
}

export function borrarSesion(): void {
  borrar(CLAVE_SESION);
}

function leerIntentos(): RegistroIntentos {
  return leer<RegistroIntentos>(CLAVE_INTENTOS) ?? {};
}

function guardarIntentos(registro: RegistroIntentos): void {
  escribir(CLAVE_INTENTOS, registro);
}

/** Segundos que faltan para que termine un bloqueo. */
export function restanteDeBloqueo(bloqueadoHasta: string, ahora = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(bloqueadoHasta).getTime() - ahora) / 1000));
}

export function cuentaRegresiva(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Tiempo restante de sesion en texto corto: "11 h 42 min", "8 min". */
export function restanteDeSesion(sesion: Sesion, ahora = Date.now()): string {
  const min = Math.max(0, Math.floor((new Date(sesion.expiraEn).getTime() - ahora) / 60_000));
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${min % 60} min` : `${min} min`;
}

export function bloqueoVigente(correo: string, ahora = Date.now()): string | null {
  const clave = normalizar(correo);
  const registro = leerIntentos();
  const entrada = registro[clave];
  if (!entrada?.bloqueadoHasta) return null;
  if (new Date(entrada.bloqueadoHasta).getTime() <= ahora) {
    delete registro[clave];
    guardarIntentos(registro);
    return null;
  }
  return entrada.bloqueadoHasta;
}

export function nuevaSesion(userId: string, ahora = new Date()): Sesion {
  return {
    userId,
    perfilId: userId,
    iniciadaEn: ahora.toISOString(),
    expiraEn: new Date(ahora.getTime() + DURACION_SESION_MIN * 60_000).toISOString(),
  };
}

/**
 * Valida credenciales y administra el contador de intentos.
 *
 * El orden importa, igual que en la referencia: primero el bloqueo (acertar la contraseña
 * no levanta un bloqueo), luego las credenciales y al final la cuenta desactivada. El
 * mensaje de error NO dice si fallo el correo o la contraseña: decirlo le confirma a
 * quien prueba correos cuales existen.
 */
export function validarCredenciales(correo: string, contrasena: string, ahora = new Date()): ResultadoLogin {
  if (!correo.trim()) {
    return { ok: false, fallo: { clave: 'VACIO', campo: 'correo', mensaje: 'Escriba su correo institucional.' } };
  }
  if (!contrasena) {
    return { ok: false, fallo: { clave: 'VACIO', campo: 'contrasena', mensaje: 'Escriba su contraseña.' } };
  }

  const clave = normalizar(correo);
  const bloqueado = bloqueoVigente(clave, ahora.getTime());
  if (bloqueado) {
    return {
      ok: false,
      fallo: {
        clave: 'BLOQUEADO',
        bloqueadoHasta: bloqueado,
        mensaje: `La cuenta esta bloqueada tras ${MAX_INTENTOS} intentos fallidos.`,
      },
    };
  }

  const cuenta = CUENTAS.find((c) => c.correo === clave);
  const credencialesOk = Boolean(cuenta) && contrasena === CONTRASENA_DEMO;

  if (!credencialesOk) {
    const registro = leerIntentos();
    const intentos = (registro[clave]?.intentos ?? 0) + 1;
    if (intentos >= MAX_INTENTOS) {
      const hasta = new Date(ahora.getTime() + BLOQUEO_MIN * 60_000).toISOString();
      registro[clave] = { intentos, bloqueadoHasta: hasta };
      guardarIntentos(registro);
      return {
        ok: false,
        fallo: {
          clave: 'BLOQUEADO',
          bloqueadoHasta: hasta,
          mensaje: `Cuenta bloqueada ${BLOQUEO_MIN} minutos tras ${MAX_INTENTOS} intentos fallidos.`,
        },
      };
    }
    registro[clave] = { intentos, bloqueadoHasta: null };
    guardarIntentos(registro);
    const restantes = MAX_INTENTOS - intentos;
    return {
      ok: false,
      fallo: {
        clave: 'CREDENCIALES',
        intentosRestantes: restantes,
        mensaje: `Correo o contraseña incorrectos. ${restantes === 1 ? 'Queda 1 intento' : `Quedan ${restantes} intentos`} antes del bloqueo.`,
      },
    };
  }

  if (!cuenta!.activa) {
    return {
      ok: false,
      fallo: {
        clave: 'INACTIVA',
        mensaje: 'La cuenta esta desactivada. Pida a Administracion tecnica que la reactive; volver a intentar no sirve.',
      },
    };
  }

  const registro = leerIntentos();
  delete registro[clave];
  guardarIntentos(registro);

  const sesion = nuevaSesion(cuenta!.userId, ahora);
  guardarSesion(sesion);
  return { ok: true, sesion, cuenta: cuenta! };
}
