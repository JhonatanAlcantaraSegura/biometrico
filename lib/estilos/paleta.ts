/**
 * Paleta de la interfaz — fuente unica de verdad.
 *
 * Dos temas, no dos sistemas: `SISTEMA` es el panel administrado (todo lo que cuelga de
 * `app/(app)`) y `PUBLICO` es el sitio institucional de la raiz. Los dos usan los MISMOS
 * nombres de token, asi que una clase `bg-lienzo` significa lo propio de cada mitad y no
 * hace falta un condicional en tiempo de ejecucion: el cambio lo hace la clase
 * `.tema-publico` de `app/tema-publico.css`.
 *
 * Los valores no se eligieron a ojo. `npm run contraste` recorre cada par de
 * `PARES_DE_CONTRASTE` y CALCULA su razon; si uno baja del umbral, el comando falla.
 *
 * Un solo esquema, claro. No hay variante oscura porque no esta medida, e inventarla
 * romperia en silencio la garantia de contraste. Urgencias trabaja con luz alta y las
 * pantallas se leen de pie y a distancia.
 */

export const SISTEMA = {
  /** Superficies elevadas: tarjetas, encabezado, barra lateral, modales. */
  fondo: '#ffffff',
  /** Fondo de filas alternas y de controles deshabilitados. */
  superficie: '#f1f5f9',
  /** El papel sobre el que se apoya todo. */
  lienzo: '#f7f8fa',
  /** Banda que separa una seccion de la siguiente sin linea dura. */
  lienzoSutil: '#eceff4',

  texto: '#0f172a',
  textoSuave: '#475569',

  /** Borde de CONTROL. Debe alcanzar 3:1 para ser un limite perceptible (WCAG 1.4.11). */
  borde: '#64748b',
  /** Solo separadores DECORATIVOS (filas de tabla). Nunca el borde de un control. */
  bordeSuave: '#cbd5e1',

  /** Azul clinico institucional: accion primaria y enlaces. */
  primario: '#0b4f6c',
  primarioTexto: '#ffffff',
  primarioSuave: '#e7f0f4',
  primarioOscuro: '#083b52',

  /** Codigo activo, triage rojo, error y accion destructiva. */
  peligro: '#b42318',
  peligroSuave: '#fef3f2',
  /** Identidad provisional, triage naranja, temporizador por vencer. */
  aviso: '#92400e',
  avisoSuave: '#fffbeb',
  /** Identidad confirmada, meta cumplida, recurso aceptado. */
  exito: '#067647',
  exitoSuave: '#ecfdf5',
  /** Estado clinico informativo y reloj dentro de meta. */
  info: '#1d4ed8',
  infoSuave: '#eff6ff',
  /** Acceso de emergencia (break glass) y triage amarillo. */
  atencion: '#6d28d9',
  atencionSuave: '#f5f3ff',

  foco: '#1d4ed8',
} as const;

/**
 * Tema del sitio publico. Mismos nombres, valores mas calidos: quien entra a la raiz no
 * es personal de urgencias sino un comite que va a leer parrafos largos en una sala.
 *
 * El primario cambia a verde azulado profundo para que las dos mitades del producto se
 * distingan de un vistazo sin que ninguna pierda su medicion.
 */
export const PUBLICO = {
  fondo: '#ffffff',
  superficie: '#f4efe7',
  lienzo: '#faf7f2',
  lienzoSutil: '#f1ebe1',

  texto: '#1c1917',
  textoSuave: '#57534e',

  borde: '#78716c',
  bordeSuave: '#d6d3d1',

  primario: '#0f5257',
  primarioTexto: '#ffffff',
  primarioSuave: '#e4efef',
  primarioOscuro: '#0a3a3d',

  peligro: '#b42318',
  peligroSuave: '#fef3f2',
  aviso: '#92400e',
  avisoSuave: '#fffbeb',
  exito: '#067647',
  exitoSuave: '#ecfdf5',
  info: '#1d4ed8',
  infoSuave: '#eff6ff',
  atencion: '#6d28d9',
  atencionSuave: '#f5f3ff',

  foco: '#1d4ed8',
} as const;

export type TokenDeColor = keyof typeof SISTEMA;

export interface ParDeContraste {
  readonly frente: TokenDeColor;
  readonly fondo: TokenDeColor;
  /** 4.5 para texto normal (WCAG 1.4.3); 3 para componentes y bordes (WCAG 1.4.11). */
  readonly minimo: number;
  readonly motivo: string;
}

/**
 * Cada combinacion que la interfaz produce de verdad, con el umbral que le corresponde.
 * `npm run contraste` exige que TODO token aparezca al menos una vez aqui: un color que no
 * esta en ningun par es un color que nadie midio.
 */
export const PARES_DE_CONTRASTE: readonly ParDeContraste[] = [
  { frente: 'texto', fondo: 'fondo', minimo: 4.5, motivo: 'texto principal sobre tarjeta' },
  { frente: 'texto', fondo: 'lienzo', minimo: 4.5, motivo: 'texto principal sobre pagina' },
  { frente: 'texto', fondo: 'lienzoSutil', minimo: 4.5, motivo: 'texto principal sobre banda' },
  { frente: 'texto', fondo: 'superficie', minimo: 4.5, motivo: 'texto sobre fila alterna' },
  { frente: 'textoSuave', fondo: 'fondo', minimo: 4.5, motivo: 'texto secundario sobre tarjeta' },
  { frente: 'textoSuave', fondo: 'lienzo', minimo: 4.5, motivo: 'texto secundario sobre pagina' },
  { frente: 'textoSuave', fondo: 'lienzoSutil', minimo: 4.5, motivo: 'texto secundario sobre banda' },
  { frente: 'textoSuave', fondo: 'superficie', minimo: 4.5, motivo: 'texto de control deshabilitado' },
  { frente: 'primarioTexto', fondo: 'primario', minimo: 4.5, motivo: 'texto del boton primario' },
  { frente: 'primario', fondo: 'fondo', minimo: 4.5, motivo: 'enlace sobre tarjeta' },
  { frente: 'primario', fondo: 'lienzo', minimo: 4.5, motivo: 'enlace sobre pagina' },
  { frente: 'primarioOscuro', fondo: 'primarioSuave', minimo: 4.5, motivo: 'renglon activo del menu' },
  { frente: 'peligro', fondo: 'fondo', minimo: 4.5, motivo: 'codigo activo sobre tarjeta' },
  { frente: 'peligro', fondo: 'lienzo', minimo: 4.5, motivo: 'codigo activo sobre pagina' },
  { frente: 'peligro', fondo: 'peligroSuave', minimo: 4.5, motivo: 'error dentro de su bloque' },
  { frente: 'primarioTexto', fondo: 'peligro', minimo: 4.5, motivo: 'texto del boton destructivo' },
  { frente: 'aviso', fondo: 'fondo', minimo: 4.5, motivo: 'identidad provisional sobre tarjeta' },
  { frente: 'aviso', fondo: 'lienzo', minimo: 4.5, motivo: 'identidad provisional sobre pagina' },
  { frente: 'aviso', fondo: 'avisoSuave', minimo: 4.5, motivo: 'aviso dentro de su bloque' },
  { frente: 'exito', fondo: 'fondo', minimo: 4.5, motivo: 'identidad confirmada sobre tarjeta' },
  { frente: 'exito', fondo: 'lienzo', minimo: 4.5, motivo: 'identidad confirmada sobre pagina' },
  { frente: 'exito', fondo: 'exitoSuave', minimo: 4.5, motivo: 'confirmacion dentro de su bloque' },
  { frente: 'info', fondo: 'fondo', minimo: 4.5, motivo: 'reloj en meta sobre tarjeta' },
  { frente: 'info', fondo: 'infoSuave', minimo: 4.5, motivo: 'estado clinico dentro de su bloque' },
  { frente: 'atencion', fondo: 'fondo', minimo: 4.5, motivo: 'acceso de emergencia sobre tarjeta' },
  { frente: 'atencion', fondo: 'atencionSuave', minimo: 4.5, motivo: 'break glass dentro de su bloque' },
  { frente: 'borde', fondo: 'fondo', minimo: 3, motivo: 'borde de control sobre tarjeta' },
  { frente: 'borde', fondo: 'lienzo', minimo: 3, motivo: 'borde de control sobre pagina' },
  { frente: 'borde', fondo: 'superficie', minimo: 3, motivo: 'borde de control sobre fila alterna' },
  { frente: 'bordeSuave', fondo: 'fondo', minimo: 1, motivo: 'separador decorativo, sin umbral' },
  { frente: 'foco', fondo: 'fondo', minimo: 3, motivo: 'anillo de foco sobre tarjeta' },
  { frente: 'foco', fondo: 'lienzo', minimo: 3, motivo: 'anillo de foco sobre pagina' },
];
