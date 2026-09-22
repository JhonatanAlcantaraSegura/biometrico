import { USERS } from './semilla';

/**
 * Padron de cuentas de DEMOSTRACION.
 *
 * Una cuenta por actor de la ERS (seccion 2), ligada al `user_id` de la semilla. La
 * contraseña es la misma para todas y esta impresa en la propia pantalla de acceso: no es
 * un secreto, es una llave de demostracion. En el sistema real la identidad del personal
 * vive en el directorio institucional con MFA y se verifica en el servidor (RNF-04, RF-22);
 * aqui no hay servidor, asi que nada de este archivo protege nada.
 *
 * Hay UNA cuenta desactivada a proposito, para que la pantalla de acceso pueda enseñar el
 * mensaje que recibe quien ya no tiene permiso de entrar.
 */

export const CONTRASENA_DEMO = 'infarto2026';

export interface Cuenta {
  readonly correo: string;
  readonly userId: string;
  readonly activa: boolean;
}

const DOMINIO = 'hrlam.demo';

const ALIAS: Record<string, string> = {
  u_recep: 'recepcion',
  u_enf: 'enfermeria',
  u_med: 'medico',
  u_hemo: 'hemodinamia',
  u_tras: 'traslados',
  u_adm: 'admision',
  u_cal: 'calidad',
  u_tec: 'soporte',
};

export const CUENTAS: readonly Cuenta[] = [
  ...USERS.map((u) => ({
    correo: `${ALIAS[u.user_id] ?? u.user_id}@${DOMINIO}`,
    userId: u.user_id,
    activa: true,
  })),
  // Sin `userId` valido a proposito: nunca debe poder abrir una sesion.
  { correo: `baja@${DOMINIO}`, userId: 'u_baja', activa: false },
];

export function cuentaDeUsuario(userId: string): Cuenta | undefined {
  return CUENTAS.find((c) => c.userId === userId);
}
