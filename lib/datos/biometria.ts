import type { ISODateTime, IdentityResult } from './tipos';
import { INSTITUCION } from './institucion';

/**
 * Capa de datos del SIMULADOR biométrico — RF-09, RF-31, RNF-02, RNF-10, CA-13.
 *
 * ------------------------------------------------------------------------------------
 * ADVERTENCIA QUE NO DEBE BORRARSE
 *
 * Esto es un simulador. No hay motor de búsqueda 1:N contratado, validado ni autorizado, y
 * **RF-09 sigue siendo un bloqueador de factibilidad del piloto**. El propósito de este
 * módulo es exactamente el contrario de dar la impresión de que la capacidad existe: sirve
 * para hacer visibles, antes de firmar nada, las cuatro cosas que la ERS exige documentar y
 * que una demostración de proveedor normalmente esconde:
 *
 *   1. Que la captura falla sola (calidad, prueba de vida, dispositivo fuera de línea).
 *   2. Que el resultado depende de UMBRALES que alguien tiene que elegir, y que moverlos
 *      cambia el resultado clínico.
 *   3. Que un falso positivo llega con la misma cara que un acierto: nada en la respuesta
 *      del motor dice que está equivocado.
 *   4. Que la latencia prometida ("menos de 2 s") sólo significa algo si se mide por etapa.
 *
 * ------------------------------------------------------------------------------------
 * LO QUE NO SE GUARDA, Y POR QUÉ
 *
 * Regla 5 de privacidad de la ERS: la aplicación hospitalaria no guarda imágenes crudas ni
 * plantillas biométricas. Por eso la "galería" de más abajo NO contiene plantillas: cada
 * entrada es una referencia seudónima más un número sintético que este simulador usa para
 * calcular puntajes de forma determinista.
 *
 * En un sistema real la galería vive en el motor del proveedor, no aquí, y lo que el
 * hospital conserva es la referencia y la traza. Si algún día alguien propone guardar
 * plantillas en esta aplicación, eso es un cambio de diseño que exige evaluación de impacto,
 * no una optimización.
 */

/** RF-09 pide evaluar iris y rostro POR SEPARADO y habilitar sólo lo que pase validación. */
export type Modalidad = 'iris' | 'rostro';

export const NOMBRE_MODALIDAD: Record<Modalidad, string> = {
  iris: 'Iris',
  rostro: 'Rostro',
};

export type EstadoDispositivo = 'en_linea' | 'degradado' | 'fuera_de_linea' | 'sin_calibrar';

export const NOMBRE_ESTADO_DISPOSITIVO: Record<EstadoDispositivo, string> = {
  en_linea: 'En línea',
  degradado: 'Degradado',
  fuera_de_linea: 'Fuera de línea',
  sin_calibrar: 'Sin calibrar',
};

export type TipoPunto = 'escritorio' | 'alta_concurrencia';

/**
 * Punto de control del piloto propuesto — RF-31, CA-13.
 *
 * Cuatro estaciones de escritorio con lector ocular y una de alta concurrencia con cámara
 * dual iris/rostro, según el inventario de la segunda presentación. Modelo y número de serie
 * son marcadores de posición: la presentación nombra "Orbit" sin fabricante, modelo, SDK ni
 * contrato, y no hay evidencia de que los lectores presupuestados sean compatibles con el
 * Orb de World ID. Son dos integraciones distintas hasta que una demostración técnica lo
 * pruebe.
 */
export interface PuntoDeControl {
  readonly punto_id: string;
  readonly nombre: string;
  readonly ubicacion: string;
  readonly tipo: TipoPunto;
  readonly modalidades: readonly Modalidad[];
  /** Marcador de posición: sin fabricante ni modelo definidos en las presentaciones. */
  readonly modelo: string;
  readonly serie: string;
  estado: EstadoDispositivo;
  /** `undefined` = nunca calibrado. No se asume calibración por omisión. */
  calibrado_en?: ISODateTime;
  operador_id?: string;
}

const diasAtras = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const PUNTOS_DE_CONTROL: PuntoDeControl[] = [
  {
    punto_id: 'pc-01',
    nombre: 'Admisión Central 1',
    ubicacion: 'Admisión Central, ventanilla 1',
    tipo: 'escritorio',
    modalidades: ['iris'],
    modelo: 'lector ocular USB (modelo por definir)',
    serie: 'SINT-OC-001',
    estado: 'en_linea',
    calibrado_en: diasAtras(3),
    operador_id: 'u_adm',
  },
  {
    punto_id: 'pc-02',
    nombre: 'Admisión Central 2',
    ubicacion: 'Admisión Central, ventanilla 2',
    tipo: 'escritorio',
    modalidades: ['iris'],
    modelo: 'lector ocular USB (modelo por definir)',
    serie: 'SINT-OC-002',
    estado: 'en_linea',
    calibrado_en: diasAtras(3),
    operador_id: 'u_adm',
  },
  {
    punto_id: 'pc-03',
    nombre: 'Urgencias — triage',
    ubicacion: 'Urgencias, área de triage',
    tipo: 'escritorio',
    modalidades: ['iris'],
    modelo: 'lector ocular USB (modelo por definir)',
    serie: 'SINT-OC-003',
    estado: 'degradado',
    calibrado_en: diasAtras(21),
    operador_id: 'u_enf',
  },
  {
    punto_id: 'pc-04',
    nombre: 'Urgencias — choque',
    ubicacion: 'Urgencias, sala de choque',
    tipo: 'escritorio',
    modalidades: ['iris'],
    modelo: 'lector ocular USB (modelo por definir)',
    serie: 'SINT-OC-004',
    // Sin calibrar a propósito en la semilla: CA-13 exige que una caída o un equipo sin
    // calibrar se reporte y no bloquee urgencias.
    estado: 'sin_calibrar',
  },
  {
    punto_id: 'pc-05',
    nombre: 'Acceso de alta concurrencia',
    ubicacion: 'Acceso entre Admisión y Urgencias',
    tipo: 'alta_concurrencia',
    modalidades: ['iris', 'rostro'],
    modelo: 'cámara dual iris/rostro (modelo por definir)',
    serie: 'SINT-DU-001',
    estado: 'en_linea',
    calibrado_en: diasAtras(1),
    operador_id: 'u_tec',
  },
];

/**
 * Umbrales del motor — RF-09, RF-10.
 *
 * Que estos tres números sean editables en pantalla es el punto de toda la simulación. La
 * política de umbrales "controla el riesgo de mostrar el expediente de otra persona" (ERS
 * sección 12) y es una decisión del hospital, no del proveedor ni del programador.
 */
export interface UmbralesMotor {
  /** Puntaje mínimo para considerar que hay una coincidencia utilizable. */
  coincidencia: number;
  /** Puntaje mínimo para que un registro aparezca como candidato a conciliar. */
  ambiguedad: number;
  /**
   * Distancia mínima entre el primer y el segundo candidato. Sin margen de desempate, dos
   * puntajes casi iguales se resuelven por orden de la lista, que es azar disfrazado de
   * decisión.
   */
  margenDesempate: number;
  /** Calidad mínima de captura. Por debajo, el intento no llega al motor. */
  calidadMinima: number;
  /** Prueba de vida. Desactivarla sube la tasa de aceptación y el riesgo de suplantación. */
  pruebaDeVida: boolean;
}

export const UMBRALES_INICIALES: UmbralesMotor = {
  coincidencia: 0.88,
  ambiguedad: 0.55,
  margenDesempate: 0.08,
  calidadMinima: 0.6,
  pruebaDeVida: true,
};

/**
 * Perfil de rendimiento declarado por el proveedor vs. medido en sede.
 *
 * `farDeclarado` y `frrDeclarado` son las cifras de la diapositiva. `farMedido` y
 * `frrMedido` son `null` a propósito: nadie los ha medido con pacientes y condiciones
 * reales, y mientras sean `null` la pantalla lo dice en lugar de rellenar el hueco.
 */
export interface PerfilModalidad {
  readonly modalidad: Modalidad;
  /** Habilitada sólo si superó validación clínica, legal y de seguridad (RF-09). */
  habilitada: boolean;
  readonly msCapturaBase: number;
  readonly msComparacionBase: number;
  readonly farDeclarado: string;
  readonly frrDeclarado: string;
  readonly farMedido: number | null;
  readonly frrMedido: number | null;
  readonly notaValidacion: string;
}

export const PERFILES: PerfilModalidad[] = [
  {
    modalidad: 'iris',
    // Arranca habilitada porque es la modalidad que la presentación pone al centro; la
    // pantalla deja claro que "habilitada en el simulador" no es "validada".
    habilitada: true,
    msCapturaBase: 900,
    msComparacionBase: 450,
    farDeclarado: '< 0.0001 % (cifra de la presentación, sin metodología)',
    frrDeclarado: 'no indicado en la presentación',
    farMedido: null,
    frrMedido: null,
    notaValidacion:
      'Sin ensayo en sede. Falta medir fallos de captura en pacientes con ojos cerrados, edema periorbitario o midriasis farmacológica, que son frecuentes en urgencias.',
  },
  {
    modalidad: 'rostro',
    habilitada: false,
    msCapturaBase: 600,
    msComparacionBase: 800,
    farDeclarado: 'no indicado por separado del iris',
    frrDeclarado: 'no indicado por separado del iris',
    farMedido: null,
    frrMedido: null,
    notaValidacion:
      'Deshabilitada. RF-09 exige evaluar cada modalidad por separado, y la comparación facial 1:1 de un proveedor de identidad no sustituye una búsqueda 1:N de pacientes.',
  },
];

/**
 * Galería sintética. NO contiene plantillas ni imágenes: `firma` es un número inventado que
 * este simulador usa para calcular puntajes de forma determinista. Ver la advertencia de la
 * cabecera del archivo.
 */
export interface EntradaGaleria {
  readonly patient_id: string;
  readonly nombre_enmascarado: string;
  readonly anio_nacimiento: string;
  readonly diferenciador: string;
  /** Referencia seudónima: es lo único que un sistema real conservaría del lado hospital. */
  readonly referencia_seudonima: string;
  readonly firma: number;
  readonly modalidades_enroladas: readonly Modalidad[];
}

export const GALERIA: readonly EntradaGaleria[] = [
  {
    patient_id: 'pat_001',
    nombre_enmascarado: 'GARCIA L., JU**',
    anio_nacimiento: '1962',
    diferenciador: 'sexo M · NSS ...010',
    referencia_seudonima: 'ref_sint_001',
    firma: 0.62,
    modalidades_enroladas: ['iris'],
  },
  {
    patient_id: 'pat_002',
    nombre_enmascarado: 'GARCIA L., JU**',
    anio_nacimiento: '1965',
    diferenciador: 'sexo F · NSS ...011',
    referencia_seudonima: 'ref_sint_002',
    firma: 0.59,
    modalidades_enroladas: ['iris'],
  },
  {
    patient_id: 'pat_003',
    nombre_enmascarado: 'ROMERO S., A.',
    anio_nacimiento: '1958',
    diferenciador: 'sexo F · NSS ...012',
    referencia_seudonima: 'ref_sint_003',
    firma: 0.94,
    modalidades_enroladas: ['iris', 'rostro'],
  },
];

/**
 * Escenarios de ensayo. Son las condiciones que un piloto tiene que provocar a propósito
 * porque en producción aparecen solas y a la peor hora.
 */
export type EscenarioBiometrico =
  | 'coincidencia_unica'
  | 'ambiguedad_homonimos'
  | 'sin_enrolamiento'
  | 'falso_positivo'
  | 'calidad_insuficiente'
  | 'prueba_de_vida_fallida';

export interface DescripcionEscenario {
  readonly clave: EscenarioBiometrico;
  readonly nombre: string;
  readonly detalle: string;
  /** Qué tiene que hacer el sistema, no qué devuelve el motor. */
  readonly esperado: string;
}

export const ESCENARIOS: readonly DescripcionEscenario[] = [
  {
    clave: 'coincidencia_unica',
    nombre: 'Coincidencia única y clara',
    detalle: 'Un solo registro por encima del umbral, con margen amplio sobre el segundo.',
    esperado:
      'El motor propone UN candidato. La identidad queda provisional: un resultado 1:N nunca confirma por sí solo (regla 4).',
  },
  {
    clave: 'ambiguedad_homonimos',
    nombre: 'Homónimos con puntajes vecinos',
    detalle: 'Dos registros del mismo apellido por encima del umbral de ambigüedad, sin margen de desempate.',
    esperado:
      'Apertura automática bloqueada, información mínima de cada candidato y conciliación por personal autorizado (RF-10).',
  },
  {
    clave: 'sin_enrolamiento',
    nombre: 'Persona no enrolada',
    detalle: 'Nadie en la galería se parece lo suficiente: el puntaje más alto queda por debajo del umbral.',
    esperado: 'Sin coincidencia. Se atiende con identificador temporal y se concilia después (RF-08).',
  },
  {
    clave: 'falso_positivo',
    nombre: 'Falso positivo',
    detalle:
      'Puntaje alto y margen amplio contra el registro EQUIVOCADO. Nada en la respuesta del motor lo delata.',
    esperado:
      'Es el escenario que justifica la corroboración humana: el sistema no puede distinguirlo de un acierto, sólo el personal con el paciente enfrente.',
  },
  {
    clave: 'calidad_insuficiente',
    nombre: 'Captura de calidad insuficiente',
    detalle: 'Ojo cerrado, edema o movimiento. El intento no llega al motor.',
    esperado: 'Fallo de captura visible, ruta alternativa disponible y el reloj clínico sin detenerse (RNF-03).',
  },
  {
    clave: 'prueba_de_vida_fallida',
    nombre: 'Prueba de vida no superada',
    detalle: 'La captura se rechaza antes de comparar. Si la prueba de vida está apagada, pasa.',
    esperado:
      'Con prueba de vida activa se rechaza. Apagarla para "que funcione" es exactamente el atajo que un piloto debe detectar.',
  },
];

/** Fallos que ocurren ANTES de llegar al motor de comparación. */
export type FalloCaptura =
  | 'dispositivo_fuera_de_linea'
  | 'dispositivo_sin_calibrar'
  | 'modalidad_no_habilitada'
  | 'calidad_insuficiente'
  | 'prueba_de_vida'
  | 'timeout';

export const NOMBRE_FALLO: Record<FalloCaptura, string> = {
  dispositivo_fuera_de_linea: 'Dispositivo fuera de línea',
  dispositivo_sin_calibrar: 'Dispositivo sin calibrar',
  modalidad_no_habilitada: 'Modalidad no habilitada',
  calidad_insuficiente: 'Calidad de captura insuficiente',
  prueba_de_vida: 'Prueba de vida no superada',
  timeout: 'Tiempo de espera agotado',
};

/**
 * Medición de un intento — RNF-02 y RNF-10.
 *
 * Las etapas se guardan SEPARADAS a propósito. La meta de la presentación ("menos de 2
 * segundos", "menos de 5 segundos") no significa nada como número único: hay que saber
 * cuánto tarda la captura, cuánto la comparación 1:N, cuánto la confirmación humana y
 * cuánto la consulta al expediente, porque cada una se arregla de forma distinta y sólo una
 * de las cuatro depende del proveedor biométrico.
 */
export interface MedicionBiometrica {
  readonly medicion_id: string;
  readonly encounter_id: string;
  readonly punto_id: string;
  readonly modalidad: Modalidad;
  readonly escenario: EscenarioBiometrico;
  readonly at: ISODateTime;
  readonly operador_id: string;
  readonly algoritmo: string;
  readonly captura_ms: number;
  /** `undefined` cuando la captura falló y nunca llegó al motor. */
  readonly comparacion_ms?: number;
  /** Se llena cuando una persona confirma o descarta. Antes queda pendiente, no en cero. */
  confirmacion_humana_ms?: number;
  /** Se llena al leer el expediente, si llega a leerse. */
  consulta_ece_ms?: number;
  readonly resultado: IdentityResult;
  readonly candidatos: number;
  readonly calidad: number;
  readonly fallo?: FalloCaptura;
}

export type EtapaMedicion = 'captura_ms' | 'comparacion_ms' | 'confirmacion_humana_ms' | 'consulta_ece_ms';

export const NOMBRE_ETAPA: Record<EtapaMedicion, string> = {
  captura_ms: 'Captura',
  comparacion_ms: 'Comparación 1:N',
  confirmacion_humana_ms: 'Confirmación humana',
  consulta_ece_ms: 'Consulta al expediente',
};

/** De quién depende arreglar cada etapa. Sirve para no culpar al proveedor de todo. */
export const RESPONSABLE_ETAPA: Record<EtapaMedicion, string> = {
  captura_ms: 'Hardware y condiciones del punto de control',
  comparacion_ms: 'Motor del proveedor y tamaño de la galería',
  confirmacion_humana_ms: 'Proceso clínico y dotación de personal',
  consulta_ece_ms: 'Integración con el expediente institucional',
};

export const ALGORITMO_SIMULADO = `motor-1n-simulado/${INSTITUCION.sedeCodigo}/0.9`;
