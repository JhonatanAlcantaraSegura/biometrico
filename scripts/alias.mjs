/**
 * Registra el hook de resolucion del alias `@/`.
 *
 * Va separado de `alias-hooks.mjs` porque los hooks corren en su propio hilo: el modulo que
 * se registra no es el que hace la llamada a `register`.
 *
 * Uso: node --experimental-strip-types --import ./scripts/alias.mjs <archivo>
 */
import { register } from 'node:module';

register('./alias-hooks.mjs', import.meta.url);
