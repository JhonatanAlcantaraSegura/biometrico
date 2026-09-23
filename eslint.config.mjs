import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * ESLint plano (flat config), migrado desde `next lint` — eliminado en Next.js 16.
 * Sigue la referencia de Next.js: core-web-vitals + reglas de TypeScript.
 * Los scripts tipo .mts/.mjs (contraste, probar:motor) quedan fuera porque corren
 * con `node --experimental-strip-types` y no pasan por el parser de ESLint.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Ignora lo que genera el propio proyecto (referencia de eslint-config-next).
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;