# Alcance del prototipo

Versión del prototipo: 0.1 · deriva de la ERS v1.1 (17-09-2026).

## Objetivo

Hacer discutible el documento. El prototipo existe para que, en una sola sesión, el comité clínico, TI del hospital y
protección de datos puedan responder tres preguntas:

1. ¿El flujo de urgencias propuesto resiste cuando falla todo lo demás?
2. ¿Las reglas de identidad de la sección 5 producen una interfaz que un médico acepta bajo presión?
3. ¿Qué decisiones de la sección 12 hay que cerrar antes de escribir una línea de backend?

No busca demostrar velocidad, precisión biométrica ni ahorro. Esas son hipótesis de piloto y el prototipo no puede
medirlas.

## Incluido

| Pantalla | Ruta | Estado |
|---|---|---|
| Sitio de la propuesta (landing) | `/` | Funcional. No está en la ERS: se añadió porque la raíz no debe ser el tablero de urgencias |
| Inicio de sesión | `/acceso` | Simulado en el navegador: credenciales de demostración, bloqueo con cuenta regresiva, cuenta desactivada, vencimiento de 12 h y "ver como" en el menú de usuario |
| Ingreso rápido y triage | `/triage` | Funcional con datos locales |
| Identidad y conciliación | `/casos/[id]/identidad` | Funcional, proveedores simulados |
| Resumen clínico | `/casos/[id]/resumen` | Funcional, ECE simulado |
| Puesto del médico | `/casos/[id]` | Funcional |
| Coordinación del código | `/coordinacion` | Funcional |
| Hemodinamia / traslado | `/hemodinamia` | Funcional |
| Calidad y administración | `/calidad`, `/bitacora`, `/integraciones` | Dividida en tres según la matriz de rutas |

Reglas implementadas en el comportamiento, no sólo en el texto:

- El reloj clínico arranca en `arrival_at` y ninguna pantalla lo bloquea (RF-01, RNF-01).
- El episodio provisional se crea en una acción con etiqueta legible (RF-02).
- Los hitos de ECG distinguen "no realizado" de "no documentado" (RF-04).
- La resolución de identidad devuelve los seis estados de la ERS; sólo `confirmado` abre el expediente (RF-05, RF-13).
- World ID queda deshabilitado si el paciente no puede participar (CA-04) y una prueba válida sin vínculo muestra
  "humano verificado, expediente no vinculado" (CA-03).
- Con candidatos múltiples se muestra sólo información mínima y la confirmación exige motivo escrito (RF-10, RF-12).
- Los campos clínicos vacíos se rotulan "sin datos disponibles" (RF-14).
- El acceso de emergencia exige motivo y queda marcado en la bitácora (RF-22, CA-12).
- La activación del código es exclusiva del médico y es idempotente por caso (RF-17, CA-11).
- Las escrituras al ECE se encolan con llave idempotente cuando la integración falla (RF-15, CA-07).
- Rechazar una sala exige motivo y no detiene la atención (RF-19, CA-10).
- Las métricas clínicas y las de identificación se reportan por separado, con los casos sin dato a la vista (RF-26).

## Simulado, no implementado

| Componente | Cómo está en el prototipo | Qué falta para que sea real |
|---|---|---|
| Motor biométrico 1:N | `actions.attemptIdentity` devuelve candidatos fijos | Proveedor contratado, validado y autorizado (RF-09, decisión abierta) |
| World ID | Verificación simulada contra un vínculo local | Contrato, SDK vigente y prueba de continuidad de cuenta (RF-06, RF-07) |
| ECE | `readSnapshot` y la cola devuelven datos sintéticos | API autorizada del ISSSTE, catálogos y sandbox (RF-32) |
| Notificaciones | Se crean en memoria, el acuse se pulsa a mano | Canal real con acuse, reintento y escalamiento (RF-18) |
| Evidencia criptográfica | La bitácora es sólo anexable en memoria | Firma, sello de tiempo y verificación independiente (RF-35) |
| Autenticación | Login simulado en `/acceso` (validación en el cliente, `lib/estado/sesion.ts`) + "ver como" en el menú de usuario + guarda de rutas en el cliente | Identidad de personal, MFA, privilegio mínimo y verificación en el servidor (RNF-04, RF-22) |

## Fuera de alcance

- Persistencia: el estado vive en memoria del navegador y se pierde al recargar. Es deliberado: sin backend no hay
  dónde guardar y guardar en el navegador crearía la ilusión de un sistema de registro.
- RF-27 a RF-30, RF-33, RF-34, RF-36 (fase 2 de la ERS).
- Multi-sede real. `NEXT_PUBLIC_SITE_ID` es una etiqueta; la separación por institución de RNF-09 exige backend.
- Impresión de brazalete: el botón llama a la impresión del navegador, no a una impresora de etiquetas.
- Cualquier medición de latencia, error biométrico, ahorro o ROI.

## Riesgo de leer de más este prototipo

Un prototipo convincente puede hacer parecer resueltas decisiones que siguen abiertas. Al presentarlo conviene decir en
voz alta lo que la portada y la pantalla `/calidad` ya muestran por escrito:

- No hay motor 1:N contratado. La pantalla de identidad funciona porque los candidatos están escritos a mano.
- No hay integración con el ECE ni contrato FHIR acordado.
- No hay autorización del hospital propuesto ni evaluación de impacto en privacidad.
- El selector de perfil no es un control de acceso: la guarda corre en el navegador de quien entra.
