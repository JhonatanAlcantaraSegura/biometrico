/**
 * Datos de la sede y de la propuesta, en UN solo lugar.
 *
 * Todo lo de aqui es PROPUESTA de las presentaciones, no autorizacion confirmada. El sitio
 * publico y el pie del panel leen de este archivo para que no haya dos versiones del
 * nombre del hospital circulando en capturas de pantalla distintas.
 */

export const INSTITUCION = {
  marca: 'Codigo Infarto',
  lema: 'Identificacion del paciente y orquestacion del Codigo Infarto',

  /** Sede PROPUESTA en la segunda presentacion. No hay autorizacion institucional. */
  sedeId: process.env.NEXT_PUBLIC_SITE_ID ?? 'HRLAM-ISSSTE',
  sedeCodigo: 'HRLAM',
  sedeNombre: 'Hospital Regional Lic. Adolfo Lopez Mateos',
  sedeDependencia: 'ISSSTE',
  sedeNota: 'Sede propuesta en la presentacion. La autorizacion institucional esta pendiente.',

  /** Puntos de control del piloto propuesto (RF-31). Inventario sin compra ni prueba. */
  puntosDeControl: 5,
  lectoresEscritorio: 4,
  camarasAltaConcurrencia: 1,

  documentoFuente: 'ERS v1.1, 17 de septiembre de 2026',
  avisoPrototipo:
    'Prototipo de propuesta. Datos sinteticos, sin expediente clinico real, sin biometria real y con autenticacion simulada. No usar con pacientes.',
} as const;

/** Metas de referencia del protocolo IMSS. Configurables por sede (RF-28). */
export const METAS = {
  /** ECG de 12 derivaciones dentro de los primeros 10 minutos. */
  ecgMinutos: 10,
  /** Angioplastia primaria en menos de 90 minutos bajo las condiciones del protocolo. */
  pciMinutos: 90,
  /** Fibrinolisis en menos de 30 minutos bajo las condiciones del protocolo. */
  fibrinolisisMinutos: 30,
  /** Ventana antes de escalar un aviso sin acuse (RF-18). */
  acuseMinutos: 3,
} as const;

/**
 * Las cinco preguntas que el comite hace en la primera reunion, con su respuesta corta.
 * El sitio publico las usa como recorrido; viven aqui para que no se dupliquen en la
 * portada y en los documentos.
 */
export const DECISIONES_ABIERTAS = [
  {
    clave: 'autorizacion',
    titulo: 'Autorizacion del hospital',
    detalle:
      'Falta la aprobacion formal de la sede propuesta y el nombramiento de responsable clinico y responsable de datos.',
  },
  {
    clave: 'ece',
    titulo: 'Expediente clinico electronico',
    detalle:
      'Sin API autorizada, catalogos ni ambiente de pruebas no existe el beneficio prometido: recuperar informacion clinica al identificar.',
  },
  {
    clave: 'biometria',
    titulo: 'Identificar a un paciente inconsciente',
    detalle:
      'World ID no lo resuelve: demuestra humanidad de forma anonima y necesita la aplicacion de la persona. Hace falta un motor 1:N contratado y validado.',
  },
  {
    clave: 'juridico',
    titulo: 'Base juridica y evaluacion de impacto',
    detalle:
      'La excepcion de consentimiento en urgencias no autoriza por si sola extraer identidad de un proveedor externo ni elimina el deber de proporcionalidad.',
  },
  {
    clave: 'costos',
    titulo: 'Cotizaciones y periodicidad de licencias',
    detalle:
      'El presupuesto de la diapositiva no indica proveedor vinculante ni si la licencia del motor biometrico es anual o mensual.',
  },
] as const;
