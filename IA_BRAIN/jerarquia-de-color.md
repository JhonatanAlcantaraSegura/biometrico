# Jerarquía de color por tono

_Creado: 2026-09-23 22:48:01 CST_

Estrategia para ordenar la atención sobre fondos oscuros o fotografía sin agregar colores
nuevos. Se aplicó por primera vez en el hero de la portada (`app/page.tsx`, sección
`hero-titulo`).

## Índice

1. [Principio](#1-principio)
2. [Niveles de tono](#2-niveles-de-tono)
3. [Cómo se reparte en un bloque](#3-cómo-se-reparte-en-un-bloque)
4. [Jerarquía de acciones](#4-jerarquía-de-acciones)
5. [Contraste mínimo](#5-contraste-mínimo)
6. [Qué no hacer](#6-qué-no-hacer)

## 1. Principio

La jerarquía se construye con **niveles de opacidad del mismo color**, no con colores
distintos. Blanco pleno es lo que importa; blanco atenuado es contexto.

Así se respeta `DESIGN.md`: paleta monocroma y el Azul Eléctrico (`bg-primario`) reservado
**solo** para la acción principal. El único color que llama la atención es el que lleva a
actuar.

## 2. Niveles de tono

Sobre fondo oscuro se usa `text-primario-texto` (blanco `#ffffff`) con estas opacidades:

| Nivel | Clase | Uso |
|---|---|---|
| Pleno | `text-primario-texto` | La idea principal: la promesa del titular, la frase clave del subtítulo, el rótulo de sección |
| Alto | `text-primario-texto/80` | Texto de apoyo de tamaño normal o chico: párrafos, fechas, notas, enlaces secundarios |
| Atenuado | `text-primario-texto/60` | Solo en texto **grande** (titulares): la parte del titular que da contexto |
| Línea | `bg-primario-texto/40` y `border-primario-texto/30` | Separadores y filetes finos que ordenan sin pesar |

Sobre fondo claro, el equivalente son los tokens `text-texto` (pleno) y `text-texto-suave`
(apoyo).

## 3. Cómo se reparte en un bloque

Dentro de una misma frase se alternan los niveles para que la vista caiga donde está el
mensaje:

- **Rótulo:** palabra clave en pleno, un filete de `h-px w-8` al 40 %, y el dato secundario
  (fecha, versión) al 80 %.
- **Titular:** la parte de contexto al 60 % y la promesa en pleno.
  Ejemplo: *"Identificar a la persona"* (60 %) *"no puede retrasar la atencion del infarto."*
  (pleno).
- **Subtítulo:** la primera frase, la que resume, en pleno; la explicación al 80 %. Un filete
  vertical (`border-l` al 30 % con `pl-5`) lo ancla al titular.

La regla es que en cada bloque haya **un solo fragmento en pleno** compitiendo por la
atención.

## 4. Jerarquía de acciones

- **Una sola acción principal**, en `bg-primario`, más grande que el resto (`text-base`,
  `px-7 py-3.5`) y con una flecha → que indica avance.
- **La acción secundaria no es otro botón de bloque.** Es un enlace de texto al 80 % con un
  icono que dice hacia dónde lleva (↓ si baja por la página), y se subraya en hover.
  Un botón blanco sobre fondo oscuro pesa más que el azul y le roba la atención.
- **Se conserva el alto táctil** de 44 px con la clase `control`, también en el enlace.
- **Sin animaciones:** el dinamismo viene del contraste de tamaños y tonos. El hover solo
  cambia el color, como pide `DESIGN.md`.

## 5. Contraste mínimo

Los tonos translúcidos no están cubiertos por `npm run contraste`, que solo mide la paleta.
Se miden aparte, con `contraste()` de `lib/estilos/contraste.ts`, mezclando el blanco con el
fondo real que queda detrás.

Para el fondo se toma el **peor caso**: la parte más clara de la foto bajo el velo. Estas
fueron las mediciones del hero:

| Texto | Mínimo WCAG | Escritorio (velo 0.78) | Móvil (velo 0.70) |
|---|---|---|---|
| Titular al 60 % (texto grande) | 3 | 4.29 | 3.48 |
| Texto chico al 70 % | 4.5 | 5.20 | **4.10, no pasa** |
| Texto chico al 80 % | 4.5 | 6.21 | 4.80 |
| Texto chico al 60 % | 4.5 | **4.29, no pasa** | **3.48, no pasa** |

De ahí salen las reglas de la sección 2:

- **Texto de tamaño normal o chico: nunca por debajo del 80 %.**
- **El 60 % solo en texto grande**, como los titulares.
- Si cambia el velo o la foto, hay que volver a medir.

## 6. Qué no hacer

- No introducir un segundo color de acento para jerarquizar. El azul es solo para la acción
  principal.
- No dejar dos fragmentos en pleno compitiendo dentro del mismo bloque.
- No usar el 60 % en párrafos, fechas o notas.
- No poner dos botones de bloque del mismo tamaño, uno junto al otro.
- No usar animaciones para dar dinamismo que el orden y el tono pueden dar.
