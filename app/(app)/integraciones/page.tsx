'use client';

/**
 * Integraciones y cola — RF-15, RF-32, RNF-03, CA-07, CA-11.
 *
 * Es la pantalla de administracion tecnica, y su contenido es la mitad menos vistosa de la
 * ERS: lo que pasa cuando una integracion no contesta.
 *
 * La afirmacion que esta pantalla sirve para defender es RNF-01: urgencias funciona con los
 * proveedores caidos. Se comprueba degradando cada conector desde el simulador del
 * encabezado y volviendo al ingreso — el episodio se crea igual, el reloj sigue, y las
 * escrituras se acumulan aqui con su llave idempotente en lugar de perderse.
 */
import Link from 'next/link';
import { Boton, Encabezado, Indicador, Insignia, Requisito, Tarjeta, Vacio } from '@/components/ui/primitivos';
import { actions, resetDemo, useAppState, type IntegrationStatus } from '@/lib/estado/tienda';
import { hayAlmacenamiento } from '@/lib/estado/persistencia';
import { localDateTime } from '@/lib/tiempo';
import { useEffect, useState } from 'react';

const DESCRIPCION_CONECTOR: Array<{
  clave: 'ehr' | 'biometric' | 'worldId' | 'notifications';
  nombre: string;
  contrato: string;
  estadoReal: string;
}> = [
  {
    clave: 'ehr',
    nombre: 'Expediente clinico electronico',
    contrato: 'Buscar y leer Patient/Encounter, resumen clinico, publicar eventos y notas por API autorizada.',
    estadoReal: 'SIMULADO. Sin API del ISSSTE, sin catalogos y sin ambiente de pruebas (RF-32).',
  },
  {
    clave: 'biometric',
    nombre: 'Motor biometrico 1:N',
    contrato: 'Devolver 0, 1 o N candidatos con nivel de confianza y version de algoritmo.',
    estadoReal: 'SIMULADO con candidatos escritos a mano. Sin proveedor contratado ni validado (RF-09).',
  },
  {
    clave: 'worldId',
    nombre: 'World ID',
    contrato: 'Verificar en backend una prueba iniciada por la persona y resolverla contra un vinculo previo.',
    estadoReal:
      'SIMULADO. Falta demostrar que exista una referencia de cuenta reutilizable de forma segura (RF-06, RF-07).',
  },
  {
    clave: 'notifications',
    nombre: 'Canal de avisos',
    contrato: 'Entregar con datos minimos, recibir acuse, reintentar y escalar por falta de respuesta.',
    estadoReal: 'SIMULADO en memoria. El acuse se pulsa a mano en la pantalla de coordinacion (RF-18).',
  },
];

const TONO_ESTADO: Record<IntegrationStatus, 'exito' | 'aviso' | 'peligro'> = {
  ok: 'exito',
  lento: 'aviso',
  caido: 'peligro',
};

export default function Integraciones() {
  const state = useAppState();
  // `hayAlmacenamiento` toca `localStorage`, asi que se consulta despues del primer render.
  const [almacenamiento, setAlmacenamiento] = useState<boolean | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratacion: leer localStorage durante el render rompe el HTML del servidor
  useEffect(() => setAlmacenamiento(hayAlmacenamiento()), []);

  if (!state) return null;

  const pendientes = state.outbox.filter((o) => o.sync_state !== 'sincronizado');
  const sincronizados = state.outbox.filter((o) => o.sync_state === 'sincronizado');

  return (
    <>
      <Encabezado
        titulo="Integraciones y cola"
        descripcion="Ningun fallo externo bloquea urgencias. Lo que se rompe, se encola; lo que se encola, se reintenta sin duplicar."
        requisitos={['RF-15', 'RF-32', 'RNF-03']}
        acciones={
          <>
            <Boton onClick={() => actions.retryOutbox()}>Reintentar cola del ECE</Boton>
            <Boton
              tono="aviso"
              onClick={() => {
                resetDemo();
                actions.avisar('Demostracion reiniciada. Los cuatro episodios de la semilla volvieron.', 'info');
              }}
            >
              Reiniciar demostracion
            </Boton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador
          etiqueta="Escrituras pendientes"
          valor={String(pendientes.length)}
          nota="Se reintentan sin duplicar"
        />
        <Indicador etiqueta="Escrituras sincronizadas" valor={String(sincronizados.length)} />
        <Indicador
          etiqueta="Almacenamiento del navegador"
          valor={almacenamiento === null ? '—' : almacenamiento ? 'disponible' : 'bloqueado'}
          nota={almacenamiento === false ? 'La sesion no se recordara; el resto funciona igual' : 'Solo guarda la sesion'}
        />
      </div>

      <Tarjeta
        titulo="Conectores"
        ayuda="Cada fila es un contrato de la seccion 7 de la ERS y su estado real. Degrade cualquiera desde el simulador del encabezado."
        acciones={<Requisito ids={['RNF-01', 'RNF-03', 'CA-06']} />}
      >
        <ul className="space-y-3">
          {DESCRIPCION_CONECTOR.map((c) => {
            const estado = state.integrations[c.clave];
            return (
              <li key={c.clave} className="rounded-lg border border-borde-suave bg-superficie px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-texto">{c.nombre}</h3>
                  <Insignia tono={TONO_ESTADO[estado]}>{estado}</Insignia>
                </div>
                <p className="mt-1.5 text-sm leading-llano text-texto-suave">
                  <span className="font-semibold text-texto">Contrato: </span>
                  {c.contrato}
                </p>
                <p className="mt-1 text-sm leading-llano text-aviso">{c.estadoReal}</p>
              </li>
            );
          })}
        </ul>
      </Tarjeta>

      <Tarjeta
        titulo="Cola de escrituras al expediente"
        ayuda="Llave idempotente por evento: reintentar dos veces no crea dos notas, dos casos ni dos alertas."
        acciones={<Requisito ids={['RF-15', 'CA-07', 'CA-11']} />}
      >
        {state.outbox.length === 0 ? (
          <Vacio>Sin escrituras registradas en este turno.</Vacio>
        ) : (
          <ul className="space-y-2">
            {state.outbox.map((o) => (
              <li
                key={o.idempotency_key}
                className="rounded-lg border border-borde-suave bg-superficie px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-texto">{o.event.event_type}</span>
                  <Insignia tono={o.sync_state === 'sincronizado' ? 'exito' : 'aviso'}>{o.sync_state}</Insignia>
                </div>
                <p className="mt-1 break-all font-mono text-xs text-texto-suave">{o.idempotency_key}</p>
                <p className="mt-0.5 text-xs text-texto-suave">
                  encolada {localDateTime(o.queued_at)} · intentos {o.attempts}
                  {o.synced_at ? ` · sincronizada ${localDateTime(o.synced_at)}` : ''}
                  {o.last_error ? ` · ${o.last_error}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Lo que este prototipo no persiste, y por que"
        acciones={<Requisito ids={['seccion 7']} />}
      >
        <p className="text-sm leading-llano text-texto-suave">
          El estado clinico vive en memoria y se pierde al recargar. Es deliberado: guardarlo en el
          navegador convertiria esta demostracion en algo que se parece a un sistema de registro clinico
          sin serlo, y la fuente de verdad es el expediente designado por la institucion. Lo unico que se
          guarda es el perfil de la sesion.
        </p>
        <p className="mt-3 text-sm leading-llano text-texto-suave">
          La bitacora tambien es efimera aqui, y hay una advertencia de diseño que conviene no perder:
          en el sistema real la auditoria se genera en el servidor a partir de la peticion recibida, no a
          partir de lo que el cliente declare haber hecho. Ver{' '}
          <Link className="text-primario underline" href="/bitacora">
            la bitacora
          </Link>{' '}
          y <code className="text-texto">docs/03-ARQUITECTURA.md</code>.
        </p>
      </Tarjeta>
    </>
  );
}
