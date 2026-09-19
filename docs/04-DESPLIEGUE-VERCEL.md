# Despliegue en Vercel

El repositorio es un proyecto Next.js estándar en la raíz. Vercel lo detecta sin configuración adicional.

| Ajuste | Valor |
|---|---|
| Framework Preset | Next.js (detección automática) |
| Root Directory | `./` |
| Build Command | `next build` (por defecto) |
| Output Directory | por defecto |
| Install Command | `npm install` |
| Node.js Version | 22.x o superior |

`vercel.json` fija la región y añade cabeceras: `X-Robots-Tag: noindex`, `nosniff`, `DENY` de framing,
`Referrer-Policy: no-referrer` y `Permissions-Policy` que niega cámara, micrófono y geolocalización. Ese último punto
importa: el prototipo no debe poder pedir la cámara aunque alguien añada código de captura por error.

## Antes de publicar: protege el despliegue

El prototipo no tiene control de acceso propio. En el panel del proyecto, **Settings → Deployment Protection**, activa
una de las dos:

- **Vercel Authentication** — sólo miembros del equipo de Vercel pueden abrirlo.
- **Password Protection** — una contraseña compartida, útil para enseñárselo al hospital.

Sin esto, la URL queda pública. Aunque no haya datos reales, una pantalla de urgencias con aspecto funcional circulando
sin contexto es un riesgo de interpretación: alguien puede tomarla como un sistema aprobado.

## Opción A — desde GitHub (recomendada)

```bash
git init
git add .
git commit -m "Prototipo inicial del front derivado de la ERS v1.1"
gh repo create ERSBiometria --private --source=. --push
```

En Vercel: **Add New → Project → Import Git Repository**, elegir el repo, *Deploy*. Cada push a la rama por defecto
publica producción; cada rama genera una *Preview* con su propia URL, útil para enseñar variantes al comité.

## Opción B — desde la terminal, sin repositorio

```bash
npx vercel          # primer despliegue: preview
npx vercel --prod   # promover a producción
```

`vercel` pide iniciar sesión la primera vez. Si necesitas hacerlo de forma interactiva desde esta sesión de terminal,
escribe `! npx vercel login`.

## Variables de entorno

Ninguna es obligatoria; el prototipo funciona sin configurar nada. Las de `.env.example` sólo cambian etiquetas:

| Variable | Efecto |
|---|---|
| `NEXT_PUBLIC_SITE_ID` | Identificador de sede que aparece en episodios y eventos |
| `NEXT_PUBLIC_ENV_LABEL` | Texto del banner permanente de entorno no clínico |
| `NEXT_PUBLIC_DATA_MODE` | Reservado para cuando exista el gateway; hoy sólo `mock` |

Los placeholders comentados (`ECE_BASE_URL`, `BIOMETRIC_PROVIDER_URL`, `WORLD_ID_APP_ID`) están ahí para documentar qué
hará falta. **No los rellenes con credenciales reales**: este proyecto no tiene backend y cualquier variable
`NEXT_PUBLIC_*` viaja al navegador.

## Comprobaciones antes de cada publicación

```bash
npm run contraste
npm run typecheck
npm run build
```

Las tres pasan en el estado actual. `next build` genera trece rutas; `/casos/[id]` y sus subrutas se sirven bajo
demanda. `npm run contraste` falla si un par de color baja de su umbral, así que conviene correrlo también.

## Qué NO hacer con este despliegue

- No conectarlo a un ECE, a un índice de pacientes ni a un proveedor biométrico reales.
- No cargarle datos de pacientes, ni siquiera "de prueba" tomados de casos reales.
- No usarlo en una demostración sin decir en voz alta lo que la pantalla de Calidad ya declara por escrito: no hay
  motor 1:N contratado, no hay integración con el ECE, no hay autorización institucional y el selector de rol no es un
  control de acceso.
