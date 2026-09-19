/**
 * Verificador de contraste de la paleta. `npm run contraste`.
 *
 * Recorre los dos temas, calcula cada par declarado y sale con codigo 1 si alguno baja del
 * umbral o si algun token quedo sin medir. La tabla que imprime es la que se copia a los
 * comentarios de `app/globals.css` y `app/tema-publico.css`: los numeros de esos archivos
 * son salida de este comando, no estimaciones.
 */
import { contraste } from '../lib/estilos/contraste.ts';
import { PARES_DE_CONTRASTE, PUBLICO, SISTEMA, type TokenDeColor } from '../lib/estilos/paleta.ts';

const TEMAS = [
  { nombre: 'SISTEMA (panel administrado)', paleta: SISTEMA },
  { nombre: 'PUBLICO (sitio institucional)', paleta: PUBLICO },
] as const;

let fallos = 0;

for (const { nombre, paleta } of TEMAS) {
  console.log(`\n=== ${nombre} ===`);
  console.log('razon   min   par');

  for (const par of PARES_DE_CONTRASTE) {
    const frente = paleta[par.frente];
    const fondo = paleta[par.fondo];
    const razon = contraste(frente, fondo);
    const pasa = razon >= par.minimo;
    if (!pasa) fallos += 1;
    const marca = pasa ? ' ' : 'X';
    console.log(
      `${marca} ${razon.toFixed(2).padStart(5)}  ${String(par.minimo).padStart(3)}   ` +
        `${par.frente} sobre ${par.fondo} — ${par.motivo}`,
    );
  }

  // Un color que no aparece en ningun par es un color que nadie midio.
  const medidos = new Set<string>();
  for (const par of PARES_DE_CONTRASTE) {
    medidos.add(par.frente);
    medidos.add(par.fondo);
  }
  const sinMedir = (Object.keys(paleta) as TokenDeColor[]).filter((t) => !medidos.has(t));
  if (sinMedir.length > 0) {
    fallos += sinMedir.length;
    console.log(`X tokens sin ningun par declarado: ${sinMedir.join(', ')}`);
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} comprobacion(es) fallaron.`);
  process.exit(1);
}
console.log('\nTodos los pares cumplen su umbral.');
