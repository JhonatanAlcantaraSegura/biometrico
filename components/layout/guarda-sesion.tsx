'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { NOMBRE_ROL, inicioDe, puedeVerRuta, rutaDe } from '@/lib/datos/rutas';
import { actions, useAppState, userById } from '@/lib/estado/tienda';
import { Boton, PantallaCarga } from '@/components/ui/primitivos';

/**
 * Guarda del panel administrado.
 *
 * **ESTO NO ES CONTROL DE ACCESO.** Amenaza clasica: creer que ocultar un enlace y rebotar
 * una ruta en el cliente es seguridad es una escalada de privilegios esperando a ocurrir —
 * quien sepa la URL la escribe, y el codigo que decide vive en el navegador de quien
 * entra. La garantia real es RF-22 y vive en el servidor, que en este prototipo no existe.
 *
 * Lo que si hace, y por eso vale la pena: hace VISIBLE la matriz de `lib/datos/rutas.ts`.
 * En una reunion se puede cambiar de perfil y comprobar que Recepcion no abre el resumen
 * clinico, que es exactamente lo que la seccion 2 de la ERS pide y lo que el backend
 * tendra que implementar.
 *
 * La sesion se restaura en un efecto y no durante el render: leer `localStorage` en el
 * render produce un HTML de servidor distinto al primer render del navegador.
 */
export function GuardaSesion({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const ruta = usePathname();
  const router = useRouter();
  const [restaurada, setRestaurada] = useState(false);

  useEffect(() => {
    actions.restaurarSesion();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca de "restauracion completada": sin ella la guarda redirige antes de rehidratar
    setRestaurada(true);
  }, []);

  const usuario = state ? userById(state, state.currentUserId ?? undefined) : undefined;

  useEffect(() => {
    if (!restaurada || !state) return;
    if (state.currentUserId) return;
    const motivo = state.motivoSalida === 'manual' ? 'salida' : state.motivoSalida;
    router.replace(motivo ? `/acceso?motivo=${motivo}` : '/acceso');
  }, [restaurada, state, router]);

  /*
   * Vencimiento del turno. Se revisa cada 30 s y al volver a la pestaña: un equipo de
   * urgencias se queda abierto horas, y una sesion vencida que sigue operando es
   * justamente lo que la expiracion quiere evitar.
   */
  const expiraEn = state?.sesion?.expiraEn;
  useEffect(() => {
    if (!expiraEn) return;
    const revisar = () => {
      if (new Date(expiraEn).getTime() > Date.now()) return;
      // La redireccion la hace el efecto de arriba, con el motivo que deja esta accion.
      actions.cerrarSesion('expirada');
    };
    revisar();
    const id = setInterval(revisar, 30_000);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, [expiraEn, router]);

  // Hasta que la sesion se restaura no se decide nada: mostrar la pantalla de acceso
  // durante un instante a quien ya tenia sesion es un parpadeo que parece un fallo.
  if (!state || !restaurada) return <PantallaCarga mensaje="Verificando la sesion..." />;

  if (!state.currentUserId || !usuario) {
    return <PantallaCarga mensaje="Sin sesion. Redirigiendo a la pantalla de acceso..." />;
  }

  const regla = rutaDe(ruta);
  const permitida = puedeVerRuta(ruta, usuario.role);

  if (!permitida) {
    // Fuera del shell (la guarda lo envuelve), asi que la pantalla trae su propio lienzo y su
    // propio `h1`: sin eso, la tarjeta blanca desaparecia sobre la pagina blanca.
    return (
      <main className="grid min-h-dvh place-items-center bg-lienzo-sutil px-4 py-10">
        <div className="w-full max-w-xl rounded-xl bg-fondo p-8 sm:p-10">
          <ShieldAlert className="size-7 text-aviso" aria-hidden />
          <h1 className="display mt-6 text-3xl text-texto">Esta pantalla no corresponde a su perfil</h1>
          <p className="mt-3 text-base leading-llano text-texto-suave">
            La matriz de la ERS decide que ve cada actor. No es un fallo del prototipo.
          </p>
          <div className="mt-6 space-y-3 text-sm leading-llano text-texto">
            <p>
              Su perfil activo es <strong>{NOMBRE_ROL[usuario.role]}</strong>
              {regla ? (
                <>
                  {' '}
                  y la pantalla <strong>{regla.etiqueta}</strong> esta reservada a{' '}
                  {regla.roles.map((r) => NOMBRE_ROL[r]).join(', ')}.
                </>
              ) : (
                <> y esta direccion no figura en la matriz de rutas del prototipo.</>
              )}
            </p>
            <p className="text-texto-suave">
              Cambie de perfil en el encabezado para ver la misma pantalla con otros permisos, o vuelva a su
              inicio.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Boton tono="primario" onClick={() => router.replace(inicioDe(usuario.role))}>
              Ir a mi inicio
            </Boton>
            <Link
              href="/"
              className="control inline-flex items-center px-2 text-sm text-texto-suave underline underline-offset-2 transition-colors hover:text-texto"
            >
              Salir al sitio de la propuesta
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
