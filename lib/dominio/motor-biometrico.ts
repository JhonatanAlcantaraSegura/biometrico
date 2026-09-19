import {
  GALERIA,
  type EntradaGaleria,
  type EscenarioBiometrico,
  type EstadoDispositivo,
  type FalloCaptura,
  type Modalidad,
  type PerfilModalidad,
  type PuntoDeControl,
  type UmbralesMotor,
} from '@/lib/datos/biometria';
import type { IdentityCandidate, IdentityResult } from '@/lib/datos/tipos';

/**
 * Motor biométrico SIMULADO — funciones puras, sin estado ni React.
 *
 * La lógica está separada del store a propósito: es la única parte de esta simulación que un
 * proveedor real tendría que reproducir, y así se puede leer y discutir sin abrir la
 * interfaz. Cuando exista un motor de verdad, este archivo se borra completo y el store
 * llama a un adaptador HTTP; nada más cambia.
 *
 * Las dos decisiones de diseño que importan:
 *
 * 1. **El motor nunca devuelve `confirmado`.** Lo máximo que puede producir una búsqueda 1:N
 *    es `provisional`. Confirmar es un acto humano con motivo escrito (ERS sección 5, regla
 *    4: en un paciente incapaz de confirmar su identidad, incluso un único candidato
 *    permanece provisional). Un motor que "confirma" es un motor que abre expedientes solo.
 *
 * 2. **El resultado se deriva de los umbrales, no del escenario.** El escenario sólo produce
 *    puntajes crudos; quien decide si eso es coincidencia, ambigüedad o nada es
 *    `resolverCandidatos` con los umbrales vigentes. Por eso mover un umbral en pantalla
 *    cambia el desenlace clínico, que es precisamente lo que hay que poder mostrarle al
 *    comité antes de que alguien elija esos números en una junta.
 */

/* ------------------------------------------------------------------ captura */

export interface ResultadoCaptura {
  readonly ok: boolean;
  readonly captura_ms: number;
  readonly calidad: number;
  readonly fallo?: FalloCaptura;
}

/** Los estados degradados no fallan: tardan. Los fuera de línea y sin calibrar no capturan. */
const FACTOR_LATENCIA: Record<EstadoDispositivo, number> = {
  en_linea: 1,
  degradado: 3.2,
  fuera_de_linea: 1,
  sin_calibrar: 1,
};

/** Jitter acotado para que dos intentos seguidos no den el mismo número al milisegundo. */
function jitter(base: number): number {
  return Math.round(base * (0.85 + Math.random() * 0.4));
}

/**
 * Calidad de captura por escenario. Es lo primero que se evalúa: un motor excelente sobre
 * una captura mala sigue siendo inútil, y en urgencias la captura mala es la norma, no la
 * excepción — ojos cerrados, edema, camilla en movimiento, luz de quirófano.
 */
function calidadDe(escenario: EscenarioBiometrico): number {
  switch (escenario) {
    case 'calidad_insuficiente':
      return 0.31;
    case 'prueba_de_vida_fallida':
      return 0.74;
    case 'ambiguedad_homonimos':
      return 0.81;
    case 'sin_enrolamiento':
      return 0.86;
    default:
      return 0.93;
  }
}

export function capturar(
  punto: PuntoDeControl,
  modalidad: Modalidad,
  perfil: PerfilModalidad,
  umbrales: UmbralesMotor,
  escenario: EscenarioBiometrico,
): ResultadoCaptura {
  const calidad = calidadDe(escenario);

  // Orden de los rechazos: primero lo que impide capturar, luego lo que invalida la captura.
  // No se intenta comparar nada de lo que se rechazó — un motor que recibe basura devuelve
  // un puntaje, y ese puntaje parece un resultado.
  if (punto.estado === 'fuera_de_linea') {
    return { ok: false, captura_ms: 0, calidad: 0, fallo: 'dispositivo_fuera_de_linea' };
  }
  if (punto.estado === 'sin_calibrar') {
    return { ok: false, captura_ms: 0, calidad: 0, fallo: 'dispositivo_sin_calibrar' };
  }
  if (!punto.modalidades.includes(modalidad)) {
    return { ok: false, captura_ms: 0, calidad: 0, fallo: 'modalidad_no_habilitada' };
  }
  if (!perfil.habilitada) {
    return { ok: false, captura_ms: 0, calidad: 0, fallo: 'modalidad_no_habilitada' };
  }

  const captura_ms = jitter(perfil.msCapturaBase * FACTOR_LATENCIA[punto.estado]);

  if (calidad < umbrales.calidadMinima) {
    return { ok: false, captura_ms, calidad, fallo: 'calidad_insuficiente' };
  }
  // Apagar la prueba de vida hace que este escenario PASE. Está así para que se vea el
  // precio del atajo: una fotografía impresa entraría igual que una persona.
  if (escenario === 'prueba_de_vida_fallida' && umbrales.pruebaDeVida) {
    return { ok: false, captura_ms, calidad, fallo: 'prueba_de_vida' };
  }

  return { ok: true, captura_ms, calidad };
}

/* -------------------------------------------------------------- comparación */

export interface PuntajeCrudo {
  readonly entrada: EntradaGaleria;
  readonly puntaje: number;
  /** Sólo el simulador sabe esto. El motor real no lo entrega, y ahí está el problema. */
  readonly esLaPersonaCorrecta: boolean;
}

/**
 * Puntajes crudos del escenario contra la galería.
 *
 * `esLaPersonaCorrecta` existe únicamente para que la pantalla pueda explicar, DESPUÉS de
 * que el operador decida, si acertó o no. Un motor real no expone ese campo: si lo
 * expusiera, no habría falsos positivos. Nunca se usa para tomar la decisión.
 */
export function puntajesDe(escenario: EscenarioBiometrico, modalidad: Modalidad): readonly PuntajeCrudo[] {
  const enroladas = GALERIA.filter((g) => g.modalidades_enroladas.includes(modalidad));

  switch (escenario) {
    case 'coincidencia_unica':
      return enroladas.map((e) => ({
        entrada: e,
        puntaje: e.patient_id === 'pat_003' ? 0.95 : e.firma * 0.45,
        esLaPersonaCorrecta: e.patient_id === 'pat_003',
      }));

    case 'ambiguedad_homonimos':
      // Dos homónimos casi empatados. Con el margen de desempate por omisión (0.08) la
      // diferencia de 0.04 no alcanza, así que no hay ganador.
      return enroladas.map((e) => ({
        entrada: e,
        puntaje: e.patient_id === 'pat_001' ? 0.63 : e.patient_id === 'pat_002' ? 0.59 : 0.18,
        esLaPersonaCorrecta: e.patient_id === 'pat_001',
      }));

    case 'sin_enrolamiento':
      return enroladas.map((e) => ({ entrada: e, puntaje: e.firma * 0.38, esLaPersonaCorrecta: false }));

    case 'falso_positivo':
      // Puntaje alto y margen amplio... contra la persona equivocada. Idéntico a un acierto
      // desde el punto de vista del sistema.
      return enroladas.map((e) => ({
        entrada: e,
        puntaje: e.patient_id === 'pat_002' ? 0.92 : e.firma * 0.4,
        esLaPersonaCorrecta: false,
      }));

    default:
      return enroladas.map((e) => ({ entrada: e, puntaje: e.firma * 0.4, esLaPersonaCorrecta: false }));
  }
}

export interface ResultadoComparacion {
  readonly resultado: IdentityResult;
  readonly candidatos: readonly IdentityCandidate[];
  readonly comparacion_ms: number;
  /** Explicación de POR QUÉ salió ese resultado, en términos de los umbrales vigentes. */
  readonly motivo: string;
  readonly puntajeMaximo: number;
  readonly margen: number;
}

/**
 * Aplica los umbrales a los puntajes crudos.
 *
 * Reglas, en orden:
 *
 *   - Nada llega al umbral de ambigüedad  → `sin_coincidencia`.
 *   - Varios pasan el umbral de ambigüedad, o el margen entre el primero y el segundo es
 *     insuficiente                        → `coincidencias_multiples`.
 *   - Uno solo pasa ambigüedad pero no llega al de coincidencia → `baja_confianza`.
 *   - Uno solo, por encima del umbral de coincidencia y con margen → `provisional`.
 *
 * Nunca `confirmado`: eso lo hace una persona. Ver la cabecera del archivo.
 */
export function resolverCandidatos(
  crudos: readonly PuntajeCrudo[],
  umbrales: UmbralesMotor,
  perfil: PerfilModalidad,
  estado: EstadoDispositivo,
): ResultadoComparacion {
  const comparacion_ms = jitter(perfil.msComparacionBase * FACTOR_LATENCIA[estado]);

  const ordenados = [...crudos].sort((a, b) => b.puntaje - a.puntaje);
  const sobreAmbiguedad = ordenados.filter((p) => p.puntaje >= umbrales.ambiguedad);

  const maximo = ordenados[0]?.puntaje ?? 0;
  const segundo = ordenados[1]?.puntaje ?? 0;
  const margen = maximo - segundo;

  const aCandidato = (p: PuntajeCrudo): IdentityCandidate => ({
    patient_id: p.entrada.patient_id,
    masked_name: p.entrada.nombre_enmascarado,
    birth_year: p.entrada.anio_nacimiento,
    score: Number(p.puntaje.toFixed(2)),
    differentiator: p.entrada.diferenciador,
  });

  if (sobreAmbiguedad.length === 0) {
    return {
      resultado: 'sin_coincidencia',
      candidatos: [],
      comparacion_ms,
      motivo: `El puntaje más alto (${maximo.toFixed(2)}) queda por debajo del umbral de ambigüedad (${umbrales.ambiguedad.toFixed(2)}). No se muestra ningún candidato.`,
      puntajeMaximo: maximo,
      margen,
    };
  }

  if (sobreAmbiguedad.length > 1 || margen < umbrales.margenDesempate) {
    return {
      resultado: 'coincidencias_multiples',
      // Información MÍNIMA de cada candidato: lo justo para conciliar, nada más (RF-10).
      candidatos: sobreAmbiguedad.map(aCandidato),
      comparacion_ms,
      motivo:
        sobreAmbiguedad.length > 1
          ? `${sobreAmbiguedad.length} registros superan el umbral de ambigüedad (${umbrales.ambiguedad.toFixed(2)}) y el margen entre los dos primeros es ${margen.toFixed(2)}, menor que el margen de desempate exigido (${umbrales.margenDesempate.toFixed(2)}).`
          : `Un solo registro supera el umbral, pero el margen sobre el siguiente (${margen.toFixed(2)}) no alcanza el mínimo exigido (${umbrales.margenDesempate.toFixed(2)}).`,
      puntajeMaximo: maximo,
      margen,
    };
  }

  const unico = sobreAmbiguedad[0];

  if (unico.puntaje < umbrales.coincidencia) {
    return {
      resultado: 'baja_confianza',
      candidatos: [aCandidato(unico)],
      comparacion_ms,
      motivo: `El único candidato alcanza ${unico.puntaje.toFixed(2)}, por encima del umbral de ambigüedad pero por debajo del de coincidencia (${umbrales.coincidencia.toFixed(2)}).`,
      puntajeMaximo: maximo,
      margen,
    };
  }

  return {
    resultado: 'provisional',
    candidatos: [aCandidato(unico)],
    comparacion_ms,
    motivo: `Un candidato con ${unico.puntaje.toFixed(2)} sobre el umbral de coincidencia (${umbrales.coincidencia.toFixed(2)}) y margen de ${margen.toFixed(2)}. La identidad queda PROVISIONAL: una búsqueda 1:N no confirma por sí sola.`,
    puntajeMaximo: maximo,
    margen,
  };
}

/* ------------------------------------------------------------- percentiles */

/**
 * Percentil por interpolación lineal. RNF-02 pide p50, p95 y p99, no un promedio: la media
 * esconde justo la cola que hace que alguien espere de pie frente a un lector.
 */
export function percentil(valores: readonly number[], p: number): number | null {
  if (valores.length === 0) return null;
  const s = [...valores].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const pos = (s.length - 1) * p;
  const bajo = Math.floor(pos);
  const alto = Math.ceil(pos);
  if (bajo === alto) return s[bajo];
  return s[bajo] + (s[alto] - s[bajo]) * (pos - bajo);
}
