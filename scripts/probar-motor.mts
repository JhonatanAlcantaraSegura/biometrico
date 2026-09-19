/**
 * Comprobacion del motor biometrico simulado. `npm run probar:motor`.
 *
 * No es una suite de pruebas del proyecto: es la verificacion de que la logica de umbrales
 * hace lo que los comentarios dicen que hace. Importa porque esa logica es el unico
 * artefacto de esta simulacion que un proveedor real tendria que reproducir, y porque la
 * consola biometrica promete que mover un umbral cambia el desenlace clinico.
 */
import { capturar, percentil, puntajesDe, resolverCandidatos } from '@/lib/dominio/motor-biometrico';
import { PERFILES, PUNTOS_DE_CONTROL, UMBRALES_INICIALES } from '@/lib/datos/biometria';

const perfilIris = PERFILES.find((p) => p.modalidad === 'iris')!;
const perfilRostro = PERFILES.find((p) => p.modalidad === 'rostro')!;
const pcOk = PUNTOS_DE_CONTROL.find((p) => p.punto_id === 'pc-01')!;
const def = UMBRALES_INICIALES;

let fallos = 0;
function check(nombre: string, ok: boolean, detalle = '') {
  console.log(`${ok ? ' ok  ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos += 1;
}

console.log('=== resultado de cada escenario con los umbrales por omision ===');
for (const esc of ['coincidencia_unica', 'ambiguedad_homonimos', 'sin_enrolamiento', 'falso_positivo'] as const) {
  const r = resolverCandidatos(puntajesDe(esc, 'iris'), def, perfilIris, 'en_linea');
  console.log(
    `  ${esc.padEnd(22)} -> ${r.resultado.padEnd(24)} ${r.candidatos.length} cand · max ${r.puntajeMaximo.toFixed(2)} · margen ${r.margen.toFixed(2)}`,
  );
}

console.log('\n=== reglas que no pueden romperse ===');
check(
  'una busqueda 1:N NUNCA devuelve "confirmado"',
  (['coincidencia_unica', 'ambiguedad_homonimos', 'sin_enrolamiento', 'falso_positivo'] as const).every(
    (e) => resolverCandidatos(puntajesDe(e, 'iris'), def, perfilIris, 'en_linea').resultado !== 'confirmado',
  ),
);
check(
  'coincidencia unica => provisional',
  resolverCandidatos(puntajesDe('coincidencia_unica', 'iris'), def, perfilIris, 'en_linea').resultado === 'provisional',
);
check(
  'homonimos => coincidencias_multiples (apertura bloqueada)',
  resolverCandidatos(puntajesDe('ambiguedad_homonimos', 'iris'), def, perfilIris, 'en_linea').resultado ===
    'coincidencias_multiples',
);
check(
  'sin enrolamiento => sin_coincidencia y CERO candidatos',
  (() => {
    const r = resolverCandidatos(puntajesDe('sin_enrolamiento', 'iris'), def, perfilIris, 'en_linea');
    return r.resultado === 'sin_coincidencia' && r.candidatos.length === 0;
  })(),
);
check(
  'un falso positivo es INDISTINGUIBLE de un acierto',
  resolverCandidatos(puntajesDe('falso_positivo', 'iris'), def, perfilIris, 'en_linea').resultado === 'provisional',
);

console.log('\n=== mover umbrales cambia el desenlace clinico ===');
const rBajo = resolverCandidatos(
  puntajesDe('ambiguedad_homonimos', 'iris'),
  { ...def, coincidencia: 0.6, ambiguedad: 0.62, margenDesempate: 0.02 },
  perfilIris,
  'en_linea',
);
check('bajar umbrales convierte una ambiguedad en candidato unico', rBajo.resultado === 'provisional', `-> ${rBajo.resultado}`);
const rAlto = resolverCandidatos(puntajesDe('coincidencia_unica', 'iris'), { ...def, ambiguedad: 0.97 }, perfilIris, 'en_linea');
check('subir el umbral de ambiguedad esconde una coincidencia buena', rAlto.resultado === 'sin_coincidencia', `-> ${rAlto.resultado}`);
const rMargen = resolverCandidatos(puntajesDe('coincidencia_unica', 'iris'), { ...def, margenDesempate: 0.9 }, perfilIris, 'en_linea');
check('exigir un margen imposible bloquea incluso un acierto claro', rMargen.resultado === 'coincidencias_multiples', `-> ${rMargen.resultado}`);

console.log('\n=== la captura falla ANTES de llegar al motor ===');
check(
  'dispositivo fuera de linea no captura',
  capturar({ ...pcOk, estado: 'fuera_de_linea' }, 'iris', perfilIris, def, 'coincidencia_unica').fallo ===
    'dispositivo_fuera_de_linea',
);
check(
  'dispositivo sin calibrar no captura',
  capturar({ ...pcOk, estado: 'sin_calibrar' }, 'iris', perfilIris, def, 'coincidencia_unica').fallo ===
    'dispositivo_sin_calibrar',
);
check(
  'modalidad que el punto no tiene',
  capturar(pcOk, 'rostro', perfilRostro, def, 'coincidencia_unica').fallo === 'modalidad_no_habilitada',
);
check(
  'calidad insuficiente no llega al motor',
  capturar(pcOk, 'iris', perfilIris, def, 'calidad_insuficiente').fallo === 'calidad_insuficiente',
);
check(
  'prueba de vida ACTIVA rechaza la captura',
  capturar(pcOk, 'iris', perfilIris, def, 'prueba_de_vida_fallida').fallo === 'prueba_de_vida',
);
check(
  'prueba de vida APAGADA deja pasar el mismo intento (el atajo peligroso)',
  capturar(pcOk, 'iris', perfilIris, { ...def, pruebaDeVida: false }, 'prueba_de_vida_fallida').ok === true,
);

const normal = capturar(pcOk, 'iris', perfilIris, def, 'coincidencia_unica');
const degradado = capturar({ ...pcOk, estado: 'degradado' }, 'iris', perfilIris, def, 'coincidencia_unica');
check(
  'un punto degradado captura, pero tarda mas',
  degradado.ok && degradado.captura_ms > normal.captura_ms,
  `${normal.captura_ms} ms vs ${degradado.captura_ms} ms`,
);

console.log('\n=== percentiles (RNF-02 pide p50/p95/p99, no promedio) ===');
check('p50 de 1..100 = 50.5', Math.abs(percentil(Array.from({ length: 100 }, (_, i) => i + 1), 0.5)! - 50.5) < 0.01);
check('p95 de 1..100 = 95.05', Math.abs(percentil(Array.from({ length: 100 }, (_, i) => i + 1), 0.95)! - 95.05) < 0.01);
check('lista vacia devuelve null, no cero', percentil([], 0.5) === null);

console.log(fallos === 0 ? '\nTodo correcto.' : `\n${fallos} comprobacion(es) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
