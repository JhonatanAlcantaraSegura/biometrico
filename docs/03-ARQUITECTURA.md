# Arquitectura: del prototipo al sistema

## Módulos de la ERS (sección 7) y su estado

```
┌─────────────────────────────────────────────────────────────┐
│  Sitio público  /            ← app/page.tsx                 │  PROTOTIPADO
│  Panel admin.   /(app)/…     ← app/(app)/ + components/      │  PROTOTIPADO
└─────────────────────────────────────────────────────────────┘
                          │  (hoy: llamadas a `actions`)
┌─────────────────────────────────────────────────────────────┐
│  Gateway / BFF                                               │  NO EXISTE
└─────────────────────────────────────────────────────────────┘
     │            │             │            │            │
┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Episodios│ │ Identidad │ │ Adaptador│ │ Adaptador│ │Orquestador│
│         │ │ e índice  │ │biométrico│ │   ECE    │ │  + avisos │
└─────────┘ └───────────┘ └──────────┘ └──────────┘ └──────────┘
  simulado    simulado      simulado     simulado      simulado
                          │
              ┌───────────────────────┐
              │ Bitácora / eventos    │  simulado (en memoria)
              │ Analítica y calidad   │  simulado
              └───────────────────────┘
```

La fuente de verdad clínica seguirá siendo el ECE designado por la institución. El prototipo nunca se comporta como
sistema de registro: por eso no persiste nada entre recargas.

## La costura: `lib/estado/tienda.ts`

Cada acción del store corresponde a una operación del contrato de la sección 7. Sustituir el store por llamadas HTTP
al gateway no debe obligar a tocar las pantallas.

| Acción del prototipo | Interfaz de la ERS | Operación futura |
|---|---|---|
| `createEncounter` | Entrada/episodio | `POST /encounters` idempotente |
| `recordMilestone` | Entrada/episodio | `POST /encounters/{id}/milestones` con control de versión |
| `attemptIdentity` | Identidad | `POST /identity/verify` → `confirmed \| provisional \| no_match \| ambiguous \| low_confidence \| unavailable` |
| `confirmIdentity` / `unlinkIdentity` | Identidad | `POST /identity/bindings` y evento de corrección de vínculo |
| `readSnapshot` | ECE | `GET /ehr/summary?encounter_id=…` con política de break glass del lado del servidor |
| `enqueue` / `retryOutbox` | ECE | Publicación al *outbox* con `idempotency_key`; reintento con retroceso exponencial |
| `recordDiagnosis` | Código Infarto | `POST /cases/{id}/diagnosis` |
| `activateCode` / `cancelCode` | Código Infarto | `POST /cases/{id}/activation` y su cancelación |
| `acknowledgeAlert` / `escalateAlert` | Código Infarto | Callbacks del bus de notificaciones |
| `decideResource` | Código Infarto | `POST /cases/{id}/resources` |
| `appendAudit` | Bitácora | Escritura sólo anexable en el servicio de auditoría, nunca desde el cliente |

**Advertencia de diseño:** hoy la bitácora se escribe en el cliente porque no hay servidor. En el sistema real la
auditoría se genera **en el backend a partir de la petición recibida**, no a partir de lo que el cliente declare haber
hecho. Un cliente no puede ser la fuente de su propio registro de auditoría.

## Contrato de evento común

Implementado en `lib/datos/eventos.ts` tal como lo define la ERS:

```ts
{ event_id, schema_version, encounter_id, patient_id?, site_id, event_type,
  occurred_at, recorded_at, actor_id, source_system, correlation_id,
  payload, idempotency_key }
```

`occurred_at` y `recorded_at` son campos distintos a propósito: una captura tardía no debe falsear los indicadores.
`idempotency_key` se construye en `lib/ids.ts` a partir de (episodio, tipo de evento, hora de ocurrencia), de modo
que un reintento no crea un segundo caso, nota ni alerta.

## Orden de construcción sugerido

La ERS pone Fase 0 como bloqueador. Dentro de lo que sí se puede avanzar sin cerrar esas decisiones:

1. **Servicio de episodios + bitácora.** No depende de ningún proveedor externo y es lo que sostiene RNF-01: urgencias
   debe funcionar aunque todo lo demás esté caído. Es el primer candidato a backend real.
2. **Adaptador ECE detrás de una interfaz.** Definir el puerto (`EhrPort`) antes de conocer la API del ISSSTE, con una
   implementación de prueba. Así RF-32 no bloquea el resto.
3. **Orquestador de código y avisos.** Necesita el directorio de destinatarios y los tiempos de escalamiento, que son
   decisiones del hospital (sección 12), no de ingeniería.
4. **Identidad.** Último, y sólo cuando exista contrato con un proveedor. Mientras tanto, el índice maestro y la
   conciliación manual ya aportan valor sin biometría.

## Decisiones técnicas del prototipo y su justificación

| Decisión | Por qué | Cuándo revisarla |
|---|---|---|
| Next.js App Router, todo cliente | Despliegue trivial en Vercel y cero servidor que pudiera confundirse con un sistema de registro | Al existir backend: mover lectura a Server Components |
| Partición `/` público vs `/(app)` panel | Dos públicos con necesidades opuestas: el comité necesita contexto y límites, urgencias necesita densidad y velocidad | Sólo si el sitio de la propuesta deja de tener destinatario |
| Dos temas sobre los mismos nombres de token | Ninguna pantalla lleva condicional de tema; lo cambia una clase en el contenedor raíz | Al añadir un tercer contexto (p. ej. pantalla de sala de espera) |
| Contraste calculado por script, no elegido a ojo | `npm run contraste` falla si un par baja del umbral. La población usuaria incluye personal cansado en turno de noche y pantallas viejas | Nunca: el umbral es de norma, no de gusto |
| Estado clínico en memoria; `localStorage` sólo para la sesión | Guardar episodios en el navegador daría la ilusión de un sistema de registro clínico. La sesión sí se guarda para que recargar no expulse a media demostración | Nunca para datos clínicos; el backend es el único destino válido |
| Sin librería de estado externa | El store son ~40 líneas con `useSyncExternalStore`; una dependencia más no aporta | Si el estado del servidor entra en juego, usar un cliente de datos (p. ej. TanStack Query) |
| Tailwind v4 sin sistema de diseño | El prototipo debe poder rehacerse rápido; el sistema de diseño se decide con clínicos | Antes del piloto, con pruebas de usabilidad bajo presión (RNF-08) |
| Sin autenticación | Un login falso invita a confiar en permisos que no existen | Antes de cualquier dato real (RNF-04) |
