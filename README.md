# Código Infarto — sitio de la propuesta y panel administrado

Prototipo navegable derivado de la ERS v1.1 *Identificación del paciente y orquestación del Código
Infarto* (`docs/ERS_Biometria_Codigo_Infarto.md`).

> **No es un producto clínico.** Datos sintéticos, sin ECE real, sin biometría real, sin
> autenticación. El banner superior del panel lo declara de forma permanente. No usar con pacientes
> ni con datos personales.

La maquetación sigue las convenciones del proyecto de referencia `workspaceia/dif` (URIS-CITAS,
SMDIF Lerma): estructura y decisiones en `docs/00-ESTRUCTURA.md`.

## Dos mitades, dos públicos

| Ruta | Qué es | Para quién |
|---|---|---|
| `/` | Sitio de la propuesta: qué se plantea, el límite de la identidad biométrica, qué demuestra el prototipo y las cinco decisiones que siguen abiertas | Comité clínico, informática del hospital, protección de datos |
| `/acceso` | Selección de perfil, sin contraseña y diciéndolo en la pantalla | Quien va a hacer el recorrido |
| `/(app)/…` | Panel administrado: 9 pantallas con guarda de rol, relojes clínicos y simulador de fallos | Personal de urgencias |

Cada mitad tiene su propia paleta sobre **los mismos nombres de token**, así que ninguna pantalla
lleva condicional de tema: lo cambia la clase `.tema-publico`. El `themeColor` del segmento
`(app)` gana sobre el de la raíz, de modo que el marco del navegador también cambia.

## Pantallas del panel

| Ruta | Pantalla de la ERS | Requisitos |
|---|---|---|
| `/triage` | Ingreso rápido y triage | RF-01 a RF-04 |
| `/tablero` | Tablero operativo | RF-25, RF-21 |
| `/casos/[id]` | Puesto del médico | RF-16, RF-17, RF-20 |
| `/casos/[id]/identidad` | Identidad y conciliación | RF-05, RF-08, RF-10, RF-12 |
| `/casos/[id]/resumen` | Resumen clínico | RF-13, RF-14, RF-24 |
| `/coordinacion` | Coordinación del código | RF-18, RF-19 |
| `/hemodinamia` | Hemodinamia y traslado | RF-19, RF-20 |
| `/calidad` | Indicadores clínicos y de identificación | RF-26 |
| `/bitacora` | Bitácora y accesos de emergencia | RF-23, RF-22 |
| `/integraciones` | Conectores y cola hacia el ECE | RF-15, RF-32, RNF-03 |

## Lo que el prototipo demuestra en vivo

| Regla de la ERS | Cómo se comprueba |
|---|---|
| El triage y el ECG nunca se bloquean por identidad | Tumbar ECE, motor 1:N y World ID desde el *simulador de fallos* del encabezado; `/triage` sigue funcionando |
| Sólo `confirmado` abre un expediente | Un resultado ambiguo deja el resumen clínico cerrado; abrirlo exige acceso de emergencia con motivo |
| World ID no identifica a un inconsciente | El método aparece deshabilitado cuando el episodio está marcado como "no puede participar" |
| Homónimos y candidatos múltiples | `HRLAM-TMP-004` llega con dos candidatos: apertura automática bloqueada, conciliación con motivo obligatorio |
| Campos vacíos ≠ "sin alergias" | El resumen clínico rotula "sin datos disponibles" |
| Permisos por actor | Cambiar de perfil: enfermería no activa el código, recepción no abre el resumen clínico |
| Idempotencia | Reactivar un código o reintentar la cola no duplica alertas ni notas |
| Auditoría | Toda acción aparece en `/bitacora`, incluidos los accesos de emergencia y las consultas denegadas |

## Correr en local

```bash
npm install
npm run dev          # http://localhost:3000
npm run contraste    # verifica la paleta: falla si un par baja de su umbral WCAG
npm run typecheck
npm run build
```

Requiere Node 20.9 o superior (probado con Node 24).

## Accesibilidad, medida y no estimada

`npm run contraste` recorre los dos temas y calcula la razón de contraste WCAG 2.1 de cada par que
la interfaz produce de verdad. Los números que aparecen en los comentarios de `app/globals.css` y
`app/tema-publico.css` son la salida de ese comando. El par más justo del tema del panel es
`exito` sobre `lienzo`, en 5.36:1 — por encima del 4.5:1 exigido.

Además, y por las mismas razones que el proyecto de referencia: 44 px de área táctil en todo
control, foco visible por regla global, movimiento reducido respetado, enlace de salto al
contenido, `aria-current` en la ruta activa y región de avisos con `aria-live`.

## Publicar en Vercel

Ver `docs/04-DESPLIEGUE-VERCEL.md`. Es un proyecto Next.js estándar en la raíz; Vercel lo detecta
sin configuración.

**Antes de publicar:** protege el despliegue con Vercel Authentication o con contraseña. El
prototipo no tiene control de acceso propio y el selector de perfil es una simulación de permisos.

## Qué NO está resuelto

Sigue abierto todo lo de la sección 12 de la ERS, y la landing lo pone por escrito:

- **RF-09** (identificar por biometría 1:N a un paciente inconsciente) es un bloqueador de
  factibilidad. Aquí está simulado con candidatos escritos a mano.
- **RF-32** (adaptador al ECE del ISSSTE) no tiene contrato, catálogo ni sandbox.
- No hay autorización institucional de la sede propuesta ni evaluación de impacto en privacidad.
- Las metas de latencia (&lt;2 s, &lt;5 s) y los ahorros de las presentaciones no se miden aquí.
- La bitácora se escribe en el cliente porque no hay servidor. En el sistema real la auditoría se
  genera en el backend a partir de la petición recibida.
