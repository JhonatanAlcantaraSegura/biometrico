# Estructura del proyecto

## De dónde sale esta forma

La maquetación sigue las convenciones del proyecto de referencia `workspaceia/dif` (URIS-CITAS,
SMDIF Lerma), adaptadas a este dominio. Lo que se tomó prestado, y por qué cada cosa:

| Convención del proyecto de referencia | Por qué se adopta aquí |
|---|---|
| `app/` en la raíz, sin `src/`, con nombres de carpeta en español | Una sola lengua en todo el repositorio. `componentes`, `dominio`, `datos`, `estado` se leen igual que los documentos de la ERS |
| Partición `app/page.tsx` (público) vs `app/(app)/` (panel) | Son dos productos con dos públicos: el comité que evalúa la propuesta y el personal que opera urgencias |
| Dos temas sobre los **mismos** nombres de token | Ninguna pantalla lleva condicional de tema. `bg-lienzo` significa lo propio de cada mitad; lo cambia la clase `.tema-publico` |
| Paleta con contraste **calculado**, no estimado | `npm run contraste` recorre cada par y falla si baja del umbral. "Se ve bien" no es una verificación |
| Matriz de rutas por rol en un solo archivo | Tenerla dos veces es cómo se llega a un menú que promete pantallas que la guarda niega |
| Menú como tablero, con grupos plegables por frecuencia | Un menú largo no se lee: se rastrea. Nada se esconde; lo poco frecuente se pliega |
| Comentarios que explican la **decisión**, no el código | El siguiente que lo lea necesita saber por qué, no qué |
| 44 px de área táctil, foco siempre visible, movimiento reducido | Reglas WCAG escritas antes que las pantallas, no después |

Lo que **no** se copió: la paleta ámbar del sitio público de referencia (aquí el verde azulado
encaja mejor con el tono clínico), Tailwind 3.4 (este proyecto no tiene la restricción de parque
de equipos que justificaba quedarse) y `localStorage` para el estado de dominio — ver más abajo.

## Árbol

```
ERSBiometria/
├── docs/
│   ├── ERS_Biometria_Codigo_Infarto.md   Documento fuente v1.1 (no editar desde el código)
│   ├── 00-ESTRUCTURA.md                  Este archivo
│   ├── 01-ALCANCE-PROTOTIPO.md           Qué entra, qué se simula y qué queda fuera
│   ├── 02-TRAZABILIDAD.md                RF/RNF/CA ↔ archivo del repositorio
│   ├── 03-ARQUITECTURA.md                Módulos, contratos y ruta hacia el backend real
│   └── 04-DESPLIEGUE-VERCEL.md           Publicación y configuración del despliegue
│
├── app/
│   ├── layout.tsx              Raíz: idioma, metadatos, themeColor del sitio público
│   ├── globals.css             Tokens del panel + reglas WCAG globales + hoja de impresión
│   ├── tema-publico.css        Paleta del sitio público, sobre los mismos nombres de token
│   ├── page.tsx                LANDING — la propuesta, sus límites y lo que falta decidir
│   ├── acceso/page.tsx         Inicio de sesión simulado con cuentas de demostración
│   └── (app)/                  PANEL ADMINISTRADO
│       ├── layout.tsx          Guarda de sesión + Shell; themeColor azul institucional
│       ├── triage/             Ingreso rápido y triage
│       ├── tablero/            Tablero operativo de casos activos
│       ├── casos/[id]/         Puesto del médico
│       │   ├── identidad/      Identidad y conciliación
│       │   └── resumen/        Resumen clínico desde el ECE
│       ├── coordinacion/       Avisos, acuse y escalamiento
│       ├── hemodinamia/        Aceptación de sala, ambulancia e hitos
│       ├── calidad/            Indicadores clínicos y de identificación
│       ├── bitacora/           Auditoría y accesos de emergencia
│       └── integraciones/      Conectores, cola hacia el ECE y reinicio de la demostración
│
├── components/
│   ├── layout/
│   │   ├── shell.tsx           Encabezado, menú por grupos, simulador de fallos, avisos
│   │   └── guarda-sesion.tsx   Guarda de rutas del panel (cosmética; ver advertencia)
│   ├── dominio/
│   │   ├── marco-publico.tsx   Marco, bandas y avisos del sitio público
│   │   └── relojes.tsx         Reloj local y cronómetros clínicos con semáforo
│   └── ui/primitivos.tsx       Tarjeta, Boton, Campo, Insignia, Indicador, Tabla, Vacio…
│
├── lib/
│   ├── datos/
│   │   ├── tipos.ts            Modelo mínimo de datos (§6 de la ERS)
│   │   ├── eventos.ts          Contrato de evento común (§7) y cola de salida
│   │   ├── rutas.ts            Matriz de rutas por rol (§2) — el contrato del futuro backend
│   │   ├── institucion.ts      Sede propuesta, metas del protocolo, decisiones abiertas
│   │   └── semilla.ts          Datos sintéticos: CA-01, CA-02, CA-04 y CA-05
│   ├── estado/
│   │   ├── tienda.ts           Store en memoria + acciones. La costura con el backend
│   │   └── persistencia.ts     `localStorage` sólo para la sesión, nunca para lo clínico
│   ├── estilos/
│   │   ├── paleta.ts           Fuente única de los dos temas + pares de contraste
│   │   └── contraste.ts        Razón de contraste WCAG 2.1, calculada
│   ├── tiempo.ts               UTC, ocurrencia vs captura, semáforo de metas
│   └── ids.ts                  Identificadores temporales y llaves de idempotencia
│
├── scripts/contraste.mts       `npm run contraste` — verifica la paleta y falla si no pasa
├── next.config.ts, tsconfig.json, postcss.config.mjs
├── vercel.json                 Cabeceras de seguridad y `noindex`
└── .env.example                Variables de etiqueta; los conectores reales no existen
```

## Las dos mitades del producto

**`/` es el sitio de la propuesta.** Quien escribe la dirección sin contexto es un comité
clínico, informática del hospital o protección de datos. Abrirle el tablero de urgencias no le
sirve y le da una impresión falsa: que el sistema ya opera. La landing dice qué se propone, qué
límite tiene la identidad biométrica, qué demuestra el prototipo y qué sigue sin decidirse —esto
último con el mismo peso visual que lo demás, no en letra chica al final.

**`/(app)` es el panel administrado.** Guarda de sesión, shell con menú por rol, simulador de
fallos en el encabezado y región de avisos anunciada. El `themeColor` del segmento anidado gana
sobre el de la raíz, así que las dos mitades tienen cada una su marco de navegador sin ningún
condicional en tiempo de ejecución.

## Reglas de trabajo en el repositorio

1. **`lib/datos/` no importa nada de React ni de `lib/estado/`.** Es el único código pensado para
   sobrevivir tal cual al backend real. `rutas.ts` es además el contrato que ese backend tendrá
   que implementar.
2. **La UI nunca habla con una integración directamente.** Todo pasa por `actions` de
   `lib/estado/tienda.ts`. Cuando exista el gateway se reemplaza ese archivo por llamadas HTTP y
   las pantallas no cambian. El mapeo acción ↔ operación está en `docs/03-ARQUITECTURA.md`.
3. **Los iconos se resuelven en el Shell, no en la capa de datos.** `rutas.ts` guarda una clave
   (`'tablero'`), no un componente: un contrato de permisos no debe arrastrar dependencias de UI.
4. **Cada pantalla declara sus RF** en el comentario de cabecera y los muestra con
   `<Requisito ids={[...]} />`. Si un requisito cambia en la ERS, `grep -rn "RF-13" app lib` dice
   qué tocar.
5. **Ningún color se escribe a mano en una pantalla.** Sale de `lib/estilos/paleta.ts`, y todo par
   que la interfaz produce de verdad está en `PARES_DE_CONTRASTE`. Un color sin par declarado hace
   fallar `npm run contraste`.
6. **Ningún dato real entra al repositorio.** Los nombres de `semilla.ts` son inventados y los
   identificadores llevan el prefijo `SINT-`.

## Por qué el estado clínico no se persiste

El proyecto de referencia guarda su estado completo en `localStorage`. Aquí sólo se guarda el
perfil de la sesión, y la asimetría es deliberada: guardar episodios, diagnósticos o evidencia de
identidad en el navegador convertiría esta demostración en algo que se parece a un sistema de
registro clínico sin serlo. La fuente de verdad es el ECE designado por la institución (§7 de la
ERS). Un prototipo que recuerda pacientes entre recargas invita a que alguien capture algo real
"nada más para probar".

Consecuencia práctica al enseñarlo: si alguien recarga a media demostración, vuelven los cuatro
casos sembrados. Es la función, no el defecto.
