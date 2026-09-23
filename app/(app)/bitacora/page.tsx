'use client';

/**
 * Bitacora y accesos — RF-23, RF-22, CA-12.
 *
 * Registro solo anexable: quien vio o cambio que, cuando y por que. Tres reglas del
 * documento que aqui se ven en el contenido de la tabla, no en su titulo:
 *
 * 1. **No aparecen biometricos crudos ni datos clinicos.** La bitacora guarda referencias
 *    (`enc_ca05`, `case_ca04`), no diagnosticos ni plantillas. Un registro de auditoria que
 *    copia el dato sensible duplica la superficie de exposicion en lugar de protegerla.
 * 2. **Las consultas DENEGADAS tambien se registran.** Un intento fallido de abrir un
 *    expediente es exactamente la señal que un area de proteccion de datos necesita ver.
 * 3. **Los accesos de emergencia se separan a la vista.** No basta con que esten en la
 *    tabla: alguien tiene que revisarlos al cerrar el turno, y para eso hay que poder
 *    contarlos.
 *
 * Advertencia de diseño, escrita aqui porque es donde se nota: en este prototipo la
 * bitacora se ESCRIBE EN EL CLIENTE porque no hay servidor. En el sistema real la auditoria
 * se genera en el backend a partir de la peticion recibida — un cliente no puede ser la
 * fuente de su propio registro de auditoria.
 */
import { Encabezado, Indicador, Insignia, Requisito, Tabla, Tarjeta, Vacio } from '@/components/ui/primitivos';
import { NOMBRE_ROL } from '@/lib/datos/rutas';
import { useAppState, userById } from '@/lib/estado/tienda';
import { localDateTime } from '@/lib/tiempo';

export default function Bitacora() {
  const state = useAppState();
  if (!state) return null;

  const accesosDeEmergencia = state.audit.filter((a) => a.break_glass);
  const denegados = state.audit.filter((a) => a.outcome === 'denegado');
  const fallidos = state.audit.filter((a) => a.outcome === 'fallo');

  return (
    <>
      <Encabezado
        titulo="Bitacora y accesos"
        descripcion="Registro solo anexable. Las correcciones se agregan como eventos nuevos; nada se sobrescribe."
        requisitos={['RF-23', 'RF-22', 'CA-12']}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador etiqueta="Eventos registrados" valor={String(state.audit.length)} />
        <Indicador
          etiqueta="Accesos de emergencia"
          valor={String(accesosDeEmergencia.length)}
          nota="Se revisan al cerrar el turno"
        />
        <Indicador etiqueta="Consultas denegadas" valor={String(denegados.length)} nota="Intentos sin permiso" />
        <Indicador etiqueta="Operaciones fallidas" valor={String(fallidos.length)} nota="Integracion o resolucion" />
      </div>

      <Tarjeta
        titulo="Accesos de emergencia (break glass)"
        ayuda="Exigen motivo escrito, quedan marcados y se revisan despues. Ninguno fusiona episodios ni escribe sobre un expediente candidato."
        acciones={<Requisito ids={['RF-22', 'CA-12']} />}
      >
        {accesosDeEmergencia.length === 0 ? (
          <Vacio>Sin accesos de emergencia en el periodo.</Vacio>
        ) : (
          <ul className="space-y-2">
            {accesosDeEmergencia.map((a) => (
              <li key={a.audit_id} className="rounded bg-atencion-suave px-3 py-2">
                <p className="text-sm font-medium text-texto">{a.resource}</p>
                <p className="mt-0.5 text-xs text-texto-suave">
                  {userById(state, a.actor_id)?.name ?? a.actor_id} · {NOMBRE_ROL[a.actor_role]} ·{' '}
                  {localDateTime(a.at)}
                </p>
                <p className="mt-1 text-sm text-texto">
                  <span className="text-texto-suave">Motivo: </span>
                  {a.reason ?? 'sin motivo registrado'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Bitacora completa"
        ayuda="Sin biometricos crudos ni datos clinicos: la bitacora guarda referencias, no contenido sensible."
        acciones={<Requisito ids={['RF-23', 'RF-35']} />}
      >
        <div className="max-h-[32rem] overflow-y-auto">
          <Tabla cabeceras={['Hora', 'Actor', 'Perfil', 'Accion', 'Recurso', 'Resultado', 'Motivo']}>
            {state.audit.map((a) => (
              <tr key={a.audit_id} className="border-t border-borde-suave align-top">
                <td className="py-2 pr-3 whitespace-nowrap text-xs tabular-nums text-texto-suave">
                  {localDateTime(a.at)}
                </td>
                <td className="py-2 pr-3 text-xs text-texto">{userById(state, a.actor_id)?.name ?? a.actor_id}</td>
                <td className="py-2 pr-3 text-xs text-texto-suave">{NOMBRE_ROL[a.actor_role]}</td>
                <td className="py-2 pr-3 font-mono text-xs text-texto">{a.action}</td>
                <td className="py-2 pr-3 break-all font-mono text-xs text-texto-suave">{a.resource}</td>
                <td className="py-2 pr-3">
                  <Insignia
                    tono={a.outcome === 'exito' ? 'exito' : a.outcome === 'denegado' ? 'aviso' : 'peligro'}
                  >
                    {a.outcome}
                  </Insignia>
                  {a.break_glass && <Insignia tono="atencion">emergencia</Insignia>}
                </td>
                <td className="py-2 text-xs text-texto-suave">{a.reason ?? '—'}</td>
              </tr>
            ))}
          </Tabla>
        </div>
      </Tarjeta>
    </>
  );
}
