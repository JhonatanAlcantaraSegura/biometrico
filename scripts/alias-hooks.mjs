/**
 * Hook de resolucion del alias `@/` para ejecutar modulos del proyecto con `node`.
 *
 * Next resuelve `@/` con la configuracion de `tsconfig.json`; Node no sabe nada de eso. Sin
 * esto, un script o una comprobacion que importe codigo del dominio falla con
 * ERR_MODULE_NOT_FOUND, y la alternativa —duplicar la logica con rutas relativas— es peor:
 * seria verificar una copia en vez del codigo que corre de verdad.
 *
 * Ademas resuelve la extension: en TypeScript los imports se escriben sin ella, y Node
 * necesita el archivo exacto.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = pathToFileURL(`${process.cwd()}/`).href;
const EXTENSIONES = ['.ts', '.tsx', '.mts', '.js', '.mjs', '/index.ts'];

function conExtension(url) {
  if (existsSync(fileURLToPath(url))) return url;
  for (const ext of EXTENSIONES) {
    const probado = `${url}${ext}`;
    if (existsSync(fileURLToPath(probado))) return probado;
  }
  return url;
}

export async function resolve(especificador, contexto, siguiente) {
  if (especificador.startsWith('@/')) {
    return siguiente(conExtension(new URL(especificador.slice(2), RAIZ).href), contexto);
  }
  // TypeScript tambien escribe los imports relativos sin extension ('./institucion').
  if (especificador.startsWith('.') && contexto.parentURL) {
    return siguiente(conExtension(new URL(especificador, contexto.parentURL).href), contexto);
  }
  return siguiente(especificador, contexto);
}
