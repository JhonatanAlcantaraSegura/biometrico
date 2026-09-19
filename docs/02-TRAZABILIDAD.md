# Trazabilidad ERS ↔ código

Estado: **P** prototipado (comportamiento real sobre datos sintéticos) · **S** simulado (la interacción existe, la
integración no) · **N** no implementado en esta fase.

## Requerimientos funcionales

| ID | Estado | Dónde |
|---|---|---|
| RF-01 Hora de llegada y reloj clínico | P | `app/(app)/triage/page.tsx`, `lib/estado/tienda.ts` → `createEncounter` |
| RF-02 Episodio provisional y etiqueta | P | `lib/ids.ts` → `newTemporaryId`; `createEncounter` |
| RF-03 Triage sin trámite previo | P | `app/(app)/triage/page.tsx` (ningún campo administrativo es obligatorio) |
| RF-04 Horas de ECG con responsable y fuente | P | `app/(app)/casos/[id]/page.tsx`; `recordMilestone` |
| RF-05 Estados explícitos de identidad | P | `lib/datos/tipos.ts` → `IdentityResult`; `attemptIdentity` |
| RF-06 Vínculo previo validado | S | `lib/datos/tipos.ts` → `PatientBinding`; `lib/datos/semilla.ts` → `BINDINGS` |
| RF-07 Prueba World ID verificada en backend | S | `attemptIdentity`, rama `world_id` |
| RF-08 Ruta manual supervisada | P | `app/(app)/casos/[id]/identidad/page.tsx` → método `busqueda_supervisada` |
| RF-09 Motor 1:N para inconscientes | S | `lib/dominio/motor-biometrico.ts` (umbrales, captura, 1:N), `/biometria`, `components/dominio/captura-biometrica.tsx` — **bloqueador de factibilidad** |
| RF-10 Resolver 0, 1 o N candidatos | P | `app/(app)/casos/[id]/identidad/page.tsx`, bloque de candidatos |
| RF-11 Índice maestro y homónimos | S | `lib/datos/semilla.ts` → `PATIENTS` (`pat_001`/`pat_002` homónimos) |
| RF-12 Corrección, fusión y separación | P | `confirmIdentity`, `unlinkIdentity` (motivo obligatorio) |
| RF-13 Lectura del ECE con identidad o break glass | P | `readSnapshot`; `app/(app)/casos/[id]/resumen/page.tsx` |
| RF-14 Resumen con fuente y "sin datos disponibles" | P | `components/ui/primitivos.tsx` → `Vacio`; página de resumen |
| RF-15 Escritura al ECE con cola idempotente | P | `lib/estado/tienda.ts` → `enqueue`, `retryOutbox`; `/integraciones` |
| RF-16 Diagnóstico y hora cero por el médico | P | `recordDiagnosis`; puesto del médico |
| RF-17 Activación explícita, sin duplicados | P | `activateCode` (rechaza si ya está activo y si el rol no es médico) |
| RF-18 Alertas, acuse, reintento y escalamiento | P | `app/(app)/coordinacion/page.tsx`; `acknowledgeAlert`, `escalateAlert` |
| RF-19 Disponibilidad y aceptación de recursos | P | `app/(app)/hemodinamia/page.tsx`; `decideResource` |
| RF-20 Ruta clínica y sus hitos | P | `selectRoute`, `recordMilestone` |
| RF-21 Temporizadores con origen de tiempo visible | P | `components/dominio/relojes.tsx`; `lib/tiempo.ts` → `clockStatus` |
| RF-22 Acceso por rol y break glass | S | `lib/datos/rutas.ts` (matriz) + `components/layout/guarda-sesion.tsx`; `readSnapshot({breakGlass})`. Cosmética: no hay servidor |
| RF-23 Auditoría de toda acción | P | `lib/estado/tienda.ts` → `appendAudit`; tabla en `/bitacora` |
| RF-24 Aviso, consentimiento o excepción legal | S | `lib/datos/tipos.ts` → `LegalBasisRecord`; página de resumen |
| RF-25 Tablero operativo | P | `app/(app)/tablero/page.tsx` |
| RF-26 Tablero de calidad con casos sin dato | P | `app/(app)/calidad/page.tsx` → `metricasClinicas`, `metricasIdentidad` |
| RF-27 Conectores de calidad y KDS/MEG | N | Fase 2 |
| RF-28 Configuración multi-sede sin tocar código | N | Hoy sólo `NEXT_PUBLIC_SITE_ID` como etiqueta |
| RF-29 Referencia y traslado entre sedes | N | Fase 2 |
| RF-30 Reportes de seguridad del paciente | N | Fase 2 |
| RF-31 Cinco puntos de control del piloto | S | `lib/datos/biometria.ts` → `PUNTOS_DE_CONTROL`; inventario, estado y calibración en `/biometria`. Modelo y serie son marcadores: no hay compra ni prueba |
| RF-32 Adaptador ECE del ISSSTE | S | `readSnapshot` y `enqueue` simulan el contrato; falta la API autorizada |
| RF-33 Detección de laboratorios repetidos | N | Fase 2 |
| RF-34 Verificación en administración de medicamentos | N | Fase 2 |
| RF-35 Evidencia verificable de hitos | S | Bitácora sólo anexable en memoria; falta firma y sello de tiempo |
| RF-36 Medición de ahorro y retorno | N | Exige línea base y costos reales |

## Requerimientos no funcionales

| ID | Estado | Dónde |
|---|---|---|
| RNF-01 Funciona con integraciones caídas | P | Simulador de fallos en `components/layout/shell.tsx` |
| RNF-02 Latencia de identificación &lt;5 s | S | `/biometria` mide p50/p95/p99 **por etapa** sobre latencias simuladas. La meta real no es medible sin proveedor ni hardware |
| RNF-03 Timeout, mensaje visible y ruta alternativa | P | `attemptIdentity` → `proveedor_no_disponible`; avisos en pantalla |
| RNF-04 Cifrado, MFA, privilegio mínimo | N | Exige backend e infraestructura |
| RNF-05 Sin datos clínicos ni biométricos en logs | P | El store no registra contenido clínico en la bitácora, sólo referencias |
| RNF-06 Respaldo, monitoreo y continuidad | N | Exige operación real |
| RNF-07 Interfaz táctil y estado de identidad destacado | P | `app/globals.css` (44 px mínimo), `InsigniaIdentidad` en cabecera de episodio |
| RNF-08 Pruebas de seguridad, privacidad y desempeño | N | Fase 0 y 1 |
| RNF-09 Separación por institución | N | Exige backend |
| RNF-10 Captura ocular &lt;2 s | S | Captura y comparación se cronometran por separado en `/biometria`. Los valores son simulados: la meta exige ensayo con hardware real |

## Casos de aceptación

| Caso | Estado | Cómo reproducirlo en el prototipo |
|---|---|---|
| CA-01 Sospecha sin identificación | P | Episodio `HRLAM-TMP-001` en `/tablero`; nunca se pide World ID |
| CA-02 Consciente ya vinculado | P | Episodio `HRLAM-TMP-003`; identidad confirmada y resumen con fuente y fecha |
| CA-03 Prueba válida sin vínculo | P | En cualquier otro episodio consciente, intentar World ID |
| CA-04 Paciente inconsciente | P | `HRLAM-TMP-002`; el método World ID aparece deshabilitado |
| CA-05 Dos candidatos homónimos | P | Escenario «Homónimos» en `/biometria` + captura desde la pestaña Identidad: apertura bloqueada, conciliación con motivo |
| CA-06 Fallo de proveedor o red | P | Poner `Motor 1:N` o `World ID` en `caido` e intentar |
| CA-07 ECE no disponible | P | Poner `ECE` en `caido`; las escrituras quedan pendientes en `/integraciones` |
| CA-08 Error de vinculación descubierto | P | "Separar registros" en la pantalla de identidad |
| CA-09 Activación clínica | P | Activar como médico; los avisos aparecen en `/coordinacion` |
| CA-10 Sin sala de hemodinamia | P | Rechazar sala en `/hemodinamia` con motivo |
| CA-11 Doble envío | P | Pulsar dos veces activar, o reintentar la cola dos veces |
| CA-12 Auditoría y privacidad | P | Tabla y bloque de accesos de emergencia en `/bitacora` |
| CA-13 Cinco puntos del piloto | P | En `/biometria`: degradar o tumbar un punto y comprobar que se reporta y que `/triage` sigue funcionando |
| CA-14 ECE sin FHIR nativo | N | Requiere el contrato real del adaptador |
| CA-15 Laboratorio repetido | N | Fase 2 |
| CA-16 Administración de medicamento | N | Fase 2 |
| CA-17 Evidencia de hitos | S | Bitácora sólo anexable; falta verificación criptográfica independiente |

## Simulador biométrico

Vive en `lib/datos/biometria.ts` (inventario, umbrales, perfiles, galería sintética),
`lib/dominio/motor-biometrico.ts` (lógica pura de captura y comparación 1:N) y la consola
`/biometria`. El panel de captura es `components/dominio/captura-biometrica.tsx`, dentro de la
pestaña Identidad de cada episodio.

`npm run probar:motor` verifica 17 reglas de esa lógica. Las tres que no pueden romperse:

- **Una búsqueda 1:N nunca devuelve `confirmado`.** Lo máximo que produce es `provisional`;
  confirmar es un acto humano con motivo escrito (sección 5, regla 4).
- **Un falso positivo es indistinguible de un acierto.** Mismo puntaje alto, mismo margen
  amplio, un solo candidato. Es la razón de que la corroboración humana sea obligatoria.
- **Mover un umbral cambia el desenlace clínico.** Bajarlos convierte una ambigüedad en
  candidato único; subirlos esconde una coincidencia buena.

Seis escenarios de ensayo: coincidencia única, homónimos, persona no enrolada, falso positivo,
calidad insuficiente y prueba de vida fallida. La captura falla **antes** de llegar al motor
cuando el dispositivo está fuera de línea, sin calibrar, la modalidad no está habilitada, la
calidad no alcanza o la prueba de vida rechaza — y un fallo de captura no es "sin coincidencia":
no se comparó nada.

La galería **no contiene plantillas ni imágenes** (regla 5 de privacidad): cada entrada es una
referencia seudónima más un número sintético. En un sistema real la galería vive en el motor del
proveedor, no en la aplicación hospitalaria.

## Cómo mantener esta tabla

Cada página declara sus RF en el comentario de cabecera y los muestra con `<Requisito ids={[...]} />`. Al cambiar un
requisito en la ERS: buscar el ID en el repositorio (`grep -rn "RF-13" app lib/`), actualizar el código y esta tabla en el
mismo cambio.
