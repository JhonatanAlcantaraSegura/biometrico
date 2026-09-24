/**
 * Paleta de la interfaz — fuente unica de verdad. Sigue `DESIGN.md`.
 *
 * Monocromo mas un azul: blanco, Ceniza Clara, tres grises de texto y el Azul Electrico
 * reservado a la accion primaria. Los colores de ESTADO se conservan como excepcion
 * deliberada: urgencias necesita decir "codigo activo" o "identidad provisional" de un
 * vistazo, y siempre lo dice tambien con texto.
 *
 * Los valores no se eligieron a ojo. `npm run contraste` recorre cada par de
 * `PARES_DE_CONTRASTE` y CALCULA su razon; si uno baja del umbral, el comando falla.
 *
 * Un solo esquema, claro. No hay variante oscura porque no esta medida.
 */

export const SISTEMA = {
  /** Superficies elevadas: tarjetas, encabezado, barra lateral, modales. Blanco Puro. */
  fondo: '#ffffff',
  /** Fondo de controles secundarios, hover y controles deshabilitados. Ceniza Clara. */
  superficie: '#f4f4f4',
  /** El lienzo de la pagina: blanco, como todo lo que no es contenido. */
  lienzo: '#ffffff',
  /** Banda que separa una seccion de la siguiente sin linea dura. Ceniza Clara. */
  lienzoSutil: '#f4f4f4',

  /** Carbon: titulos y texto principal. */
  texto: '#171a20',
  /** Peltre: texto secundario y enlaces terciarios. */
  textoSuave: '#5c5e62',

  /** Borde de CONTROL. Debe alcanzar 3:1 para ser un limite perceptible (WCAG 1.4.11). */
  borde: '#808285',
  /** Gris Nube: solo separadores DECORATIVOS (filas de tabla). Nunca el borde de un control. */
  bordeSuave: '#eeeeee',

  /** Azul Electrico: exclusivo de la accion primaria. */
  primario: '#3e6ae1',
  primarioTexto: '#ffffff',
  primarioSuave: '#eef2fc',
  /** Hover del boton primario: el mismo azul, un paso mas oscuro. */
  primarioOscuro: '#2f55c0',

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
  info: '#2f55c0',
  infoSuave: '#eef2fc',
  /** Acceso de emergencia (break glass) y triage amarillo. */
  atencion: '#6d28d9',
  atencionSuave: '#f5f3ff',

  foco: '#3e6ae1',
} as const;

/**
 * Tema del sitio publico. La misma paleta monocroma que el panel, con UNA diferencia: los
 * fondos blancos no son blanco puro sino Blanco Carbon (`#f8f9fb`), un casi blanco con el
 * subtono azul del Carbon (#171a20) para que el fondo pertenezca a la paleta. La banda
 * (`lienzoSutil`) baja a `#e8ebef` con el mismo subtono: con `#f4f4f4` las tarjetas
 * `#f8f9fb` quedaban a 1.04:1 de la banda y no se distinguian; asi quedan a 1.14:1.
 * Se declara aqui para que `npm run contraste` lo mida; el CSS vive en `app/tema-publico.css`.
 */
export const PUBLICO = {
  ...SISTEMA,
  fondo: '#f8f9fb',
  lienzo: '#f8f9fb',
  lienzoSutil: '#e8ebef',
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
  { frente: 'primarioOscuro', fondo: 'primarioSuave', minimo: 4.5, motivo: 'seleccion dentro de una lista' },
  { frente: 'primarioTexto', fondo: 'primarioOscuro', minimo: 4.5, motivo: 'boton primario en hover' },
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
