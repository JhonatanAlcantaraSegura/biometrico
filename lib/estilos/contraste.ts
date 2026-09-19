/**
 * Razon de contraste de WCAG 2.1, calculada — no estimada.
 *
 * Adaptado del proyecto de referencia (`dif/packages/web/src/estilos/contraste.ts`).
 * La formula es la de la tecnica G18 del W3C: luminancia relativa de cada color y
 * `(L1 + 0.05) / (L2 + 0.05)` con el mas claro arriba.
 *
 * Existe porque "se ve bien" no es una verificacion. Los numeros que aparecen en los
 * comentarios de `app/globals.css` y `app/tema-publico.css` salen de ejecutar
 * `npm run contraste`, no de mirar la pantalla.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Canal sRGB de 0-255 a su valor linealizado, segun WCAG 2.1. */
function linealizar(canal: number): number {
  const normalizado = canal / 255;
  return normalizado <= 0.03928 ? normalizado / 12.92 : Math.pow((normalizado + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa de un color `#rrggbb`. */
export function luminanciaRelativa(hex: string): number {
  if (!HEX.test(hex)) {
    throw new Error(`Color no reconocido: "${hex}". Se espera el formato #rrggbb.`);
  }
  const crudo = hex.slice(1);
  const r = linealizar(Number.parseInt(crudo.slice(0, 2), 16));
  const g = linealizar(Number.parseInt(crudo.slice(2, 4), 16));
  const b = linealizar(Number.parseInt(crudo.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razon de contraste entre dos colores. Simetrica: el orden no importa.
 * Devuelve un numero entre 1 (identicos) y 21 (negro contra blanco).
 */
export function contraste(unColor: string, otroColor: string): number {
  const a = luminanciaRelativa(unColor);
  const b = luminanciaRelativa(otroColor);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}
