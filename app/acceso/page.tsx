'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Timer,
  TimerReset,
  UserRound,
} from 'lucide-react';
import { INSTITUCION, METAS } from '@/lib/datos/institucion';
import { CONTRASENA_DEMO, CUENTAS } from '@/lib/datos/credenciales';
import { NOMBRE_ROL, inicioDe } from '@/lib/datos/rutas';
import { USERS } from '@/lib/datos/semilla';
import {
  BLOQUEO_MIN,
  DURACION_SESION_MIN,
  MAX_INTENTOS,
  bloqueoVigente,
  cuentaRegresiva,
  restanteDeBloqueo,
} from '@/lib/estado/sesion';
import { actions } from '@/lib/estado/tienda';
import { Avatar, Banda, Campo, claseCampo, cx } from '@/components/ui/primitivos';
import retinaBiometrica from '@/public/imagenes/hero-biometria-retina.jpg';

/**
 * Pantalla de acceso con credenciales, adaptada del login de URIS-CITAS (DIF).
 *
 * Antes era un selector de perfil sin contraseña. Ahora es un formulario de verdad en su
 * CONDUCTA —validacion, intentos restantes, bloqueo con cuenta regresiva, cuenta
 * desactivada, expiracion por turno— porque eso es lo que un comite quiere ver antes de
 * aprobar. Lo que sigue sin existir es el servidor, y la pantalla lo dice junto al boton:
 * la validacion corre en el navegador y la contraseña de demostracion esta impresa aqui
 * mismo. Esconder eso enseñaria a confiar en un control que no hay.
 */

/** Pausa breve al validar. Sin ella, el cambio de pantalla parece un parpadeo sin causa. */
const PAUSA_VALIDACION_MS = 350;

export default function Acceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [errorCampo, setErrorCampo] = useState<{ campo: 'correo' | 'contrasena'; mensaje: string } | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [validando, setValidando] = useState(false);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<string | null>(null);
  const [restante, setRestante] = useState(0);
  const refEnviar = useRef<HTMLButtonElement>(null);
  const refContrasena = useRef<HTMLInputElement>(null);

  // Sesion vigente: no se pide otra vez. El motivo de salida llega por la URL y se lee
  // en un efecto, no en el render, para no desincronizar el HTML del servidor.
  useEffect(() => {
    const restaurada = actions.restaurarSesion();
    if (restaurada) {
      const rol = USERS.find((u) => u.user_id === restaurada)?.role;
      router.replace(rol ? inicioDe(rol) : '/tablero');
      return;
    }
    const motivo = new URLSearchParams(window.location.search).get('motivo');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el motivo llega por la URL y solo existe despues de hidratar
    if (motivo === 'expirada') setAviso('Su sesion vencio al terminar el turno. Vuelva a entrar para continuar.');
    if (motivo === 'salida') setAviso('Sesion cerrada. El equipo queda listo para la siguiente persona.');
  }, [router]);

  // El bloqueo vive en `localStorage` y se consulta por correo, despues de hidratar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratacion: la consulta toca localStorage, no puede ir en el render
    setBloqueadoHasta(correo ? bloqueoVigente(correo) : null);
  }, [correo]);

  // Cuenta regresiva real, de un segundo: "espere 5 minutos" sin reloj obliga a adivinar.
  useEffect(() => {
    if (!bloqueadoHasta) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio sincrono del conteo; sin el, el numero anterior persistiria un segundo mas
      setRestante(0);
      return;
    }
    const tick = () => {
      const s = restanteDeBloqueo(bloqueadoHasta);
      setRestante(s);
      if (s === 0) {
        setBloqueadoHasta(null);
        setError('');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [bloqueadoHasta]);

  const bloqueado = Boolean(bloqueadoHasta) && restante > 0;

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || validando) return;
    setError('');
    setErrorCampo(null);
    setAviso('');
    setValidando(true);

    window.setTimeout(() => {
      const r = actions.autenticar(correo, contrasena);
      setValidando(false);
      if (r.ok) {
        const usuario = USERS.find((u) => u.user_id === r.sesion.userId);
        actions.avisar(`Bienvenida(o), ${usuario?.name ?? 'sesion iniciada'}.`, 'exito');
        router.replace(usuario ? inicioDe(usuario.role) : '/tablero');
        return;
      }
      const f = r.fallo;
      if (f.clave === 'VACIO') {
        setErrorCampo({ campo: f.campo, mensaje: f.mensaje });
        document.getElementById(f.campo)?.focus();
        return;
      }
      if (f.clave === 'BLOQUEADO') setBloqueadoHasta(f.bloqueadoHasta);
      setError(f.mensaje);
      // La contraseña fallida no se queda en el campo: el siguiente intento se escribe
      // completo, no se corrige a ciegas sobre puntos.
      setContrasena('');
      if (f.clave === 'CREDENCIALES') refContrasena.current?.focus();
    }, PAUSA_VALIDACION_MS);
  }

  function usarCuenta(c: (typeof CUENTAS)[number]) {
    setCorreo(c.correo);
    setContrasena(CONTRASENA_DEMO);
    setError('');
    setErrorCampo(null);
    // El foco va al boton de entrar: el siguiente Enter ya envia el formulario.
    requestAnimationFrame(() => refEnviar.current?.focus());
  }

  function detectarMayusculas(e: React.KeyboardEvent<HTMLInputElement>) {
    setMayusculas(e.getModifierState?.('CapsLock') ?? false);
  }

  return (
    <div className="min-h-dvh bg-lienzo lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      <PanelMarca />

      <main id="contenido" className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <Activity className="size-5 text-texto" aria-hidden />
            <span className="text-sm font-medium text-texto">{INSTITUCION.marca}</span>
          </Link>
          <Link
            href="/"
            className="control ml-auto inline-flex items-center gap-1.5 rounded px-2 text-sm text-texto-suave underline-offset-4 transition-colors hover:text-texto hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver a la propuesta
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="aparecer">
            <p className="rotulo">Acceso del personal · {INSTITUCION.sedeCodigo}</p>
            <h1 className="display mt-2 text-3xl text-texto sm:text-4xl">Iniciar sesion</h1>
            <p className="mt-2 text-sm leading-llano text-texto-suave">
              Entre con su correo institucional. La sesion dura un turno ({DURACION_SESION_MIN / 60} h) y se
              cierra sola al vencer.
            </p>
          </div>

          <form
            onSubmit={entrar}
            noValidate
            className="aparecer-2 mt-8 flex flex-col gap-5"
          >
            {aviso && <Banda tono="info">{aviso}</Banda>}

            <Campo
              etiqueta="Correo institucional"
              htmlFor="correo"
              error={errorCampo?.campo === 'correo' ? errorCampo.mensaje : undefined}
            >
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave"
                  aria-hidden
                />
                <input
                  id="correo"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="nombre@hrlam.demo"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    setError('');
                    setErrorCampo(null);
                  }}
                  disabled={validando}
                  aria-invalid={errorCampo?.campo === 'correo' || undefined}
                  className={cx(claseCampo, 'pl-9')}
                />
              </div>
            </Campo>

            <Campo
              etiqueta="Contraseña"
              htmlFor="contrasena"
              error={errorCampo?.campo === 'contrasena' ? errorCampo.mensaje : undefined}
            >
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave"
                  aria-hidden
                />
                <input
                  id="contrasena"
                  ref={refContrasena}
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    setErrorCampo(null);
                  }}
                  onKeyUp={detectarMayusculas}
                  onKeyDown={detectarMayusculas}
                  disabled={bloqueado || validando}
                  aria-invalid={errorCampo?.campo === 'contrasena' || undefined}
                  aria-describedby={mayusculas ? 'aviso-mayusculas' : undefined}
                  className={cx(claseCampo, 'pr-12 pl-9')}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-pressed={verContrasena}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute top-0 right-0 grid h-full w-11 place-items-center rounded-r-md text-texto-suave hover:text-texto"
                >
                  {verContrasena ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              {mayusculas && (
                <span id="aviso-mayusculas" className="mt-1 block text-sm font-medium text-aviso">
                  Bloq Mayus esta activado.
                </span>
              )}
            </Campo>

            {bloqueado ? (
              <Banda tono="peligro" Icono={TimerReset} titulo="Cuenta bloqueada" alerta>
                Se bloqueo {BLOQUEO_MIN} minutos tras {MAX_INTENTOS} intentos fallidos. Podra volver a
                intentar en{' '}
                <strong className="tabular-nums" aria-live="polite">
                  {cuentaRegresiva(restante)}
                </strong>
                .
              </Banda>
            ) : error ? (
              <Banda tono="peligro" alerta>
                {error}
              </Banda>
            ) : null}

            <button
              ref={refEnviar}
              type="submit"
              disabled={bloqueado || validando}
              aria-busy={validando || undefined}
              className="inline-flex min-h-control items-center justify-center gap-2 rounded bg-primario px-4 text-sm font-medium text-primario-texto transition-colors hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:bg-superficie disabled:text-texto-suave"
            >
              {validando ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Validando...
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" aria-hidden />
                  Iniciar sesion
                </>
              )}
            </button>

            <p className="flex items-start gap-2 text-xs leading-llano text-texto-suave">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Autenticacion simulada: se valida en este navegador, sin servidor. En el sistema real la
              identidad del personal vive en el directorio institucional con MFA (RNF-04, RF-22).
            </p>
          </form>

          <CuentasDemo alElegir={usarCuenta} activa={correo} />
        </div>

        <p className="text-center text-xs text-texto-suave">{INSTITUCION.avisoPrototipo}</p>
      </main>
    </div>
  );
}

/**
 * Panel de marca, solo en pantallas anchas. En un telefono el formulario va primero: nadie
 * que llega a urgencias con prisa tiene que desplazarse para encontrar donde escribir.
 */
function PanelMarca() {
  return (
    // La misma fotografia del hero de la portada: quien entra al sistema viene de ahi, y la
    // pantalla de acceso debe sentirse parte del mismo producto. El velo Carbon garantiza el
    // contraste del texto blanco.
    <aside className="relative isolate hidden overflow-hidden bg-texto text-primario-texto lg:flex lg:flex-col lg:justify-between lg:p-12">
      <Image
        src={retinaBiometrica}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="42vw"
        className="-z-20 object-cover object-[70%_center]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-texto/70" />
      <Link href="/" className="relative z-10 flex items-center gap-3">
        <Activity className="size-6" aria-hidden />
        <span className="leading-tight">
          <span className="block text-base font-medium">{INSTITUCION.marca}</span>
          <span className="block text-sm text-primario-texto/80">
            {INSTITUCION.sedeNombre} · {INSTITUCION.sedeDependencia}
          </span>
        </span>
      </Link>

      <div className="relative z-10">
        <p className="display max-w-md text-4xl">
          Identificar a la persona no puede retrasar la atencion del infarto.
        </p>
        <ul className="mt-8 space-y-4 text-sm text-primario-texto/90">
          <li className="flex items-start gap-3">
            <Timer className="mt-0.5 size-5 shrink-0" aria-hidden />
            ECG en menos de {METAS.ecgMinutos} minutos, con o sin identidad confirmada.
          </li>
          <li className="flex items-start gap-3">
            <Fingerprint className="mt-0.5 size-5 shrink-0" aria-hidden />
            Identidad en paralelo: provisional hasta que se confirma, sin fusiones a ciegas.
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            Cada acceso queda en la bitacora con actor, hora y motivo.
          </li>
        </ul>
      </div>

      <p className="relative z-10 text-xs text-primario-texto/75">{INSTITUCION.sedeNota}</p>
    </aside>
  );
}

/** Cuentas de demostracion: una por actor de la ERS, mas una desactivada. */
function CuentasDemo({
  alElegir,
  activa,
}: {
  alElegir: (c: (typeof CUENTAS)[number]) => void;
  activa: string;
}) {
  return (
    <details className="aparecer-3 group mt-8 rounded-xl bg-lienzo-sutil" open>
      <summary className="flex min-h-control cursor-pointer items-center justify-between gap-2 px-5 py-3 text-sm font-medium text-texto">
        Cuentas de demostracion
        <span className="text-xs font-normal text-texto-suave">
          contraseña <code className="rounded bg-fondo px-1.5 py-0.5 font-mono text-texto">{CONTRASENA_DEMO}</code>
        </span>
      </summary>
      <div className="px-3 pb-3">
        <p className="px-2 pb-2 text-xs leading-llano text-texto-suave">
          Elija un perfil para llenar el formulario. Cada uno ve pantallas y acciones distintas segun la
          matriz de actores de la ERS.
        </p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {CUENTAS.map((c) => {
            const usuario = USERS.find((u) => u.user_id === c.userId);
            const elegida = activa.trim().toLowerCase() === c.correo;
            return (
              <li key={c.correo}>
                <button
                  type="button"
                  onClick={() => alElegir(c)}
                  aria-pressed={elegida}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left transition-colors',
                    elegida ? 'bg-fondo ring-2 ring-inset ring-texto' : 'hover:bg-fondo',
                  )}
                >
                  <Avatar nombre={usuario?.name ?? 'Cuenta baja'} className={c.activa ? '' : 'bg-texto-suave'} />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-medium text-texto">
                      {usuario ? NOMBRE_ROL[usuario.role] : 'Cuenta desactivada'}
                    </span>
                    <span className="block truncate text-xs text-texto-suave">{c.correo}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
