import { Fingerprint, HeartPulse, ScanFace, Timer } from 'lucide-react';
import { METAS } from '@/lib/datos/institucion';

/**
 * Vista previa del producto para el hero del sitio publico.
 *
 * Es una ILUSTRACION hecha con los mismos tokens del sistema, no una captura: una captura
 * envejece con cada cambio de pantalla y ademas tendria que llevar datos que parezcan
 * reales. Aqui todo es sintetico y la leyenda lo dice.
 *
 * Enseña en un vistazo las dos cosas que la propuesta repite: el reloj clinico corre
 * aunque la identidad siga provisional, y la identidad cambia de estado por su cuenta.
 */
export function VistaPrevia() {
  return (
    <figure className="aparecer-2 relative">
      <div className="sombra-publica-elevada overflow-hidden rounded-2xl border border-borde-suave bg-fondo">
        <div className="flex items-center gap-2 border-b border-borde-suave bg-lienzo-sutil px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-peligro/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-aviso/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-exito/70" aria-hidden />
          <span className="ml-2 font-mono text-xs text-texto-suave">tablero · urgencias</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-texto-suave">TMP-7F3K · brazalete 0412</p>
              <p className="mt-1 text-lg font-semibold text-texto">Paciente sin identificar</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-peligro/40 bg-peligro-suave px-2 py-0.5 text-xs font-semibold text-peligro">
              <span className="latido size-2 rounded-full bg-peligro" aria-hidden />
              Triage rojo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-borde-suave p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-texto-suave">
                <Timer className="size-3.5" aria-hidden />
                Llegada → ECG
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-texto">
                06:42 <span className="text-sm font-normal text-texto-suave">/ {METAS.ecgMinutos} min</span>
              </p>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-superficie" aria-hidden>
                <span className="block h-full w-2/3 rounded-full bg-primario" />
              </span>
            </div>
            <div className="rounded-xl border border-borde-suave p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-texto-suave">
                <HeartPulse className="size-3.5" aria-hidden />
                Puerta → balon
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-texto">
                — <span className="text-sm font-normal text-texto-suave">/ {METAS.pciMinutos} min</span>
              </p>
              <span className="mt-2 block text-xs text-texto-suave">Pendiente de diagnostico</span>
            </div>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center gap-3 rounded-lg bg-lienzo px-3 py-2">
              <ScanFace className="size-4 shrink-0 text-primario" aria-hidden />
              <span className="flex-1 text-sm text-texto">Captura facial · lector 2</span>
              <span className="rounded-md border border-aviso/40 bg-aviso-suave px-2 py-0.5 text-xs font-semibold text-aviso">
                2 candidatos
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-lg bg-lienzo px-3 py-2">
              <Fingerprint className="size-4 shrink-0 text-primario" aria-hidden />
              <span className="flex-1 text-sm text-texto">Identidad</span>
              <span className="rounded-md border border-aviso/40 bg-aviso-suave px-2 py-0.5 text-xs font-semibold text-aviso">
                Provisional
              </span>
            </li>
          </ul>

          <svg aria-hidden viewBox="0 0 400 60" className="h-10 w-full text-peligro" fill="none">
            <path
              className="trazo-ecg"
              d="M0 30 H110 L122 30 L130 14 L140 46 L150 6 L162 52 L172 30 H250 L262 22 L274 30 H400"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-texto-suave">
        Ilustracion con datos sinteticos: el reloj clinico corre mientras la identidad sigue provisional.
      </figcaption>
    </figure>
  );
}
