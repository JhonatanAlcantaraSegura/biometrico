'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ClipboardCheck,
  Fingerprint,
  Gauge,
  HeartPulse,
  IdCard,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  LockKeyhole,
  Plug,
  ServerCrash,
  ShieldCheck,
  ShieldQuestion,
  Siren,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { INSTITUCION, METAS } from '@/lib/datos/institucion';
import { TODOS_LOS_ROLES } from '@/lib/datos/rutas';
import { InsigniaIdentidad, cx } from '@/components/ui/primitivos';
import { AvisoPrototipo, MarcoPublico, type AnclaPublica } from '@/components/dominio/marco-publico';
import { Revelar } from '@/components/dominio/revelar';
import { TarjetasDecision } from '@/components/dominio/tarjetas-decision';
import FoldText from '@/components/FoldText';
import TextType from '@/components/TextType';
import retinaBiometrica from '@/public/imagenes/hero-biometria-retina.jpg';
import ambulancia from '@/public/imagenes/recorrido-ambulancia.jpg';
import pantallasClinicas from '@/public/imagenes/demostracion-pantallas-clinicas.jpg';
import personalClinico from '@/public/imagenes/cierre-personal-clinico.jpg';

/**
 * Sitio publico de la propuesta, en la raiz `/`.
 *
 * El panel administrado vive en `/tablero` (dentro del grupo `(app)`, con guarda y shell).
 * La raiz es esta pagina porque la primera pantalla de una propuesta que todavia no esta
 * autorizada no deberia ser su tablero de urgencias: quien entra sin contexto es un comite
 * que necesita saber que se propone, que queda pendiente y que NO se demuestra.
 *
 * Orden de lectura: lo que el producto promete (hero), la regla que nunca se rompe, el
 * recorrido operativo, el limite de identidad, lo que el prototipo demuestra y, con el
 * mismo peso, lo que sigue sin resolverse. Una propuesta que pone sus bloqueadores al final
 * en letra chica es una propuesta que se aprueba por error.
 *
 * Lenguaje visual: la base de `DESIGN.md` (monocromo, Azul Electrico solo en la accion
 * primaria, fotografia a sangre con tipografia blanca encima; las cuatro fotos viven en
 * `public/imagenes` y comparten la dominante azul del hero) con una capa editorial propia
 * de la portada: Geist, titulares grandes, una familia de maquetacion distinta por seccion y
 * entradas al hacer scroll. Ver `app/tema-publico.css`.
 */

const ANCLAS: readonly AnclaPublica[] = [
  { id: 'regla', etiqueta: 'La regla invariable' },
  { id: 'recorrido', etiqueta: 'El recorrido' },
  { id: 'identidad', etiqueta: 'Limite de identidad' },
  { id: 'prototipo', etiqueta: 'Que se demuestra' },
  { id: 'pendiente', etiqueta: 'Que falta decidir' },
  { id: 'preguntas', etiqueta: 'Preguntas' },
];

/**
 * Cierre del titular del hero, que se teclea y se borra en ciclo (React Bits: TextType). Todas
 * completan "no puede retrasar la atencion del ...": el infarto, y a quien se atiende aunque aun
 * no tenga nombre. La primera es la que lee el lector de pantalla y la que queda fija con
 * movimiento reducido.
 */
const CIERRES_DEL_TITULAR = ['infarto.', 'paciente.', 'desconocido.', 'inconsciente.', 'corazon.'];

/** Todas salen de `lib/datos`: la portada no puede contradecir al sistema. */
const RELOJES = [
  { minutos: METAS.ecgMinutos, etiqueta: 'Llegada a ECG', detalle: 'ECG de 12 derivaciones' },
  { minutos: METAS.fibrinolisisMinutos, etiqueta: 'Puerta-aguja', detalle: 'Fibrinolisis, segun protocolo' },
  { minutos: METAS.pciMinutos, etiqueta: 'Puerta-balon', detalle: 'Angioplastia primaria, segun protocolo' },
] as const;

/** Entrada de las cifras: 350 ms mas lenta que la de `.revelar` (900 ms), que aqui se sentia brusca. */
const DURACION_CIFRAS = 1250;

/** Las barras se dibujan a escala contra la meta mas larga. */
const ESCALA_MINUTOS = Math.max(...RELOJES.map((r) => r.minutos));

/** `clave` va en pleno y `texto` en tono suave (`IA_BRAIN/jerarquia-de-color.md`). */
const PRINCIPIOS = [
  {
    titulo: 'Lo que dice el protocolo',
    clave: `El protocolo del IMSS prioriza los sintomas de alarma aun sin identificacion y pide ECG en los primeros ${METAS.ecgMinutos} minutos.`,
    texto: 'Activar el Codigo Infarto corresponde al medico, tras interpretar el ECG e integrar el diagnostico.',
  },
  {
    titulo: 'Estados independientes',
    clave: 'El episodio clinico avanza por su cuenta.',
    texto: 'La identidad cambia por separado y no detiene ninguna transicion clinica.',
  },
  {
    titulo: 'Lo que el escaneo no hace',
    clave: 'Un resultado biometrico no diagnostica, no prescribe y no activa hemodinamia.',
    texto: 'La decision se queda con el medico.',
  },
] as const;

/**
 * `detalle` va en tono suave y `clave` (la ultima oracion, la que importa) en pleno, segun
 * `IA_BRAIN/jerarquia-de-color.md`. El texto es el mismo de antes, solo partido en dos.
 */
const PASOS = [
  {
    Icono: Siren,
    titulo: 'Llegada y triage',
    detalle:
      'Se registran hora, sede y sintomas de alarma, y nace un episodio con identificador temporal y etiqueta de brazalete.',
    clave: 'El reloj clinico arranca aunque no se sepa el nombre.',
    requisitos: 'RF-01, RF-02, RF-03',
  },
  {
    Icono: Timer,
    titulo: 'ECG sin esperar identidad',
    detalle:
      'Solicitud, adquisicion, entrega e interpretacion del ECG se registran por separado, cada una con responsable y fuente de hora.',
    clave: `Meta de referencia: ${METAS.ecgMinutos} minutos.`,
    requisitos: 'RF-04, RF-21',
  },
  {
    Icono: Fingerprint,
    titulo: 'Identidad en paralelo',
    detalle:
      'Se intenta la via disponible. El resultado puede ser confirmado, provisional, sin coincidencia, multiple, de baja confianza o sin proveedor.',
    clave: 'Solo “confirmado” abre un expediente.',
    requisitos: 'RF-05, RF-10',
  },
  {
    Icono: HeartPulse,
    titulo: 'Diagnostico y activacion',
    detalle:
      'El medico documenta interpretacion, diagnostico y hora cero clinica, y activa el codigo por accion explicita.',
    clave: 'Ningun resultado biometrico diagnostica ni activa hemodinamia.',
    requisitos: 'RF-16, RF-17',
  },
  {
    Icono: ClipboardCheck,
    titulo: 'Reperfusion y cierre',
    detalle: 'Se registra la ruta que eligio el medico (angioplastia, fibrinolisis o traslado) con sus hitos y tiempos.',
    clave: `Metas: ${METAS.pciMinutos} min para angioplastia y ${METAS.fibrinolisisMinutos} min para fibrinolisis.`,
    requisitos: 'RF-20, RF-26',
  },
] as const;

/**
 * Lo que el prototipo demuestra EN EL COMPORTAMIENTO. Cada fila se comprueba en pantalla en
 * menos de un minuto; una afirmacion que solo se puede leer no pertenece aqui.
 */
const DEMOSTRABLE = [
  {
    Icono: Plug,
    titulo: 'El triage no se bloquea',
    detalle:
      'Tumbe el expediente, el motor biometrico y World ID desde el simulador de fallos del encabezado. El ingreso sigue creando episodios y el reloj sigue corriendo.',
    prueba: 'RNF-01, RNF-03, CA-06',
  },
  {
    Icono: Lock,
    titulo: 'Sin identidad confirmada no hay expediente',
    detalle:
      'Un resultado ambiguo deja el resumen clinico cerrado. Abrirlo exige acceso de emergencia con motivo escrito.',
    prueba: 'RF-13, RF-22, CA-03',
  },
  {
    Icono: ShieldQuestion,
    titulo: 'Homonimos y candidatos multiples',
    detalle: 'Dos candidatos con el mismo nombre bloquean la apertura automatica y exigen corroboracion.',
    prueba: 'RF-10, RF-12, CA-05',
  },
  {
    Icono: Layers,
    titulo: 'Escrituras idempotentes',
    detalle: 'Con el expediente caido, reintentar no duplica notas ni crea una segunda activacion.',
    prueba: 'RF-15, CA-07, CA-11',
  },
  {
    Icono: ListChecks,
    titulo: 'Permisos por actor',
    detalle: 'Enfermeria no activa el codigo, recepcion no abre el resumen clinico, traslados no ve la historia.',
    prueba: 'RF-22, seccion 2',
  },
  {
    Icono: Gauge,
    titulo: 'Metricas con huecos visibles',
    detalle: 'Indicadores clinicos y de identificacion por separado. Los casos sin dato se cuentan, no se imputan.',
    prueba: 'RF-26, seccion 9',
  },
] as const;

/** Lo que el prototipo NO demuestra. Mismo peso visual que lo anterior. */
const NO_DEMOSTRABLE = [
  'No hay motor biometrico 1:N contratado ni validado. RF-09 sigue siendo un bloqueador de factibilidad y aqui esta simulado con candidatos escritos a mano.',
  'No hay integracion con el expediente clinico del ISSSTE ni contrato FHIR acordado (RF-32).',
  'No hay autorizacion institucional de la sede propuesta ni evaluacion de impacto en privacidad.',
  'Las latencias de las presentaciones (menos de 2 s de captura, menos de 5 s de identificacion) no se miden: requieren hardware y poblacion reales.',
  'Los ahorros, el retorno y la reduccion del 84 % son hipotesis de linea base, no resultados.',
  'La autenticacion es simulada: las cuentas de demostracion se validan en el navegador, sin servidor ni MFA.',
] as const;

/**
 * Las preguntas que se repiten en cada reunion, con respuesta corta. `veredicto` (la respuesta
 * en una frase) va en pleno y `r` en tono suave (`IA_BRAIN/jerarquia-de-color.md`).
 */
const PREGUNTAS = [
  {
    icono: IdCard,
    p: '¿Se puede atender a alguien que llega sin documentos ni telefono?',
    veredicto: 'Si.',
    r: 'El episodio nace con un identificador temporal y una etiqueta de brazalete. Triage, ECG y activacion avanzan sin esperar a la identidad, que se concilia despues.',
  },
  {
    icono: Fingerprint,
    p: '¿La biometria decide algo clinico?',
    veredicto: 'No.',
    r: 'Un resultado biometrico solo propone candidatos. El diagnostico, la hora cero y la activacion del Codigo Infarto son acciones explicitas del medico.',
  },
  {
    icono: ServerCrash,
    p: '¿Que pasa si se cae el expediente o el motor biometrico?',
    veredicto: 'El ingreso sigue funcionando.',
    r: 'Las escrituras se encolan con llave idempotente y se reintentan sin duplicarse. Se comprueba con el simulador de fallos del encabezado.',
  },
  {
    icono: ShieldCheck,
    p: '¿Quien puede ver el resumen clinico?',
    veredicto: 'Solo los perfiles autorizados y solo con identidad confirmada.',
    r: 'Fuera de eso existe el acceso de emergencia, que exige motivo escrito y queda en la bitacora.',
  },
  {
    icono: KeyRound,
    p: '¿El acceso del prototipo es seguro?',
    veredicto: 'No pretende serlo.',
    r: 'Las cuentas se validan en el navegador para enseñar la conducta: intentos, bloqueo y vencimiento de turno. El sistema real verifica al personal en el servidor con MFA.',
  },
] as const;

/** Una sola etiqueta para la unica intencion de conversion de la pagina. */
const CTA = 'Entrar al prototipo';

/**
 * Boton primario de `DESIGN.md` (Azul Electrico, 4 px, sin sombra, hover solo de color) con la
 * escala de `IA_BRAIN/jerarquia-de-color.md`: la unica accion principal pesa mas que todo lo demas.
 * Lo usan el hero y el cierre.
 */
const clasePrimario =
  'control inline-flex items-center justify-center gap-2.5 rounded bg-primario px-7 py-3.5 text-base font-medium ' +
  'text-primario-texto transition-colors hover:bg-primario-oscuro active:bg-primario-oscuro sm:min-w-64';

/** Contenedor de toda la portada: el ancho maximo de `DESIGN.md` (~1383 px). */
const contenedor = 'mx-auto w-full max-w-[86rem] px-4 sm:px-6';

export default function SitioPublico() {
  return (
    <MarcoPublico anclas={ANCLAS}>
      {/* ---------------------------------------------------------------- hero */}
      {/*
        Fotografia a sangre con tipografia blanca encima, como en `DESIGN.md`: biometria de
        retina, el tema de la propuesta. Va a color (su azul es el mismo registro que el
        Azul Electrico). El velo Carbon es lo que garantiza el contraste del texto blanco, no
        la foto: parejo en movil, donde el texto cubre todo el ancho, y cargado a la izquierda
        en escritorio, donde vive el texto, para dejar el ojo a la vista.
      */}
      <section
        aria-labelledby="hero-titulo"
        className="relative isolate flex min-h-[calc(100dvh-4.25rem)] items-end overflow-hidden bg-texto"
      >
        <Image
          src={retinaBiometrica}
          alt=""
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="asentar -z-20 object-cover object-[65%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-texto/70 lg:bg-transparent lg:bg-[linear-gradient(90deg,rgb(23_26_32/0.88)_0%,rgb(23_26_32/0.78)_45%,rgb(23_26_32/0.2)_78%,rgb(23_26_32/0.1)_100%)]"
        />

        {/*
          Trazo de ECG justo arriba del ojo: el mismo de la pantalla de acceso (`app/acceso`), en
          bucle continuo (`.trazo-ecg-continuo` en `app/globals.css`). Decorativo.
          Se ancla a la FOTO, no al texto. Con la foto a lo ancho (`object-cover`, pantalla de 3:2
          o mas ancha), su ancho es el de la seccion y queda centrada en vertical, asi que un punto
          de la foto en (x, y) cae en `left: x %` y `top: 50 % + (y - 0.5) * 100vw / 1.5`. El borde
          del parpado esta en y = 0.366 de la foto; el trazo (26 % de ancho) va centrado en el ojo,
          x = 0.67, con su borde inferior justo encima del parpado. Solo en `lg` y en pantallas de
          3:2 o mas anchas: en las mas altas la foto se recorta por los lados, el ojo se mueve y el
          trazo quedaria fuera de lugar.
        */}
        <svg
          aria-hidden
          viewBox="0 0 400 80"
          fill="none"
          className="pointer-events-none absolute top-[calc(50%-15.3vw)] left-[54%] hidden w-[26%] text-primario-texto lg:block [@media(max-aspect-ratio:3/2)]:hidden"
        >
          <path
            className="trazo-ecg-continuo"
            pathLength={100}
            d="M0 40 H120 L135 40 L145 18 L155 62 L165 8 L178 70 L188 40 H260 L272 30 L284 40 H400"
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className={cx(contenedor, 'aparecer pt-24 pb-16 sm:pb-24')}>
          {/* Jerarquia por tono, no por color: blanco pleno = lo que importa, blanco atenuado = contexto. */}
          <p className="flex items-center gap-3 text-sm">
            <span className="font-medium text-primario-texto">Propuesta</span>
            <span aria-hidden className="h-px w-8 bg-primario-texto/40" />
            <span className="text-primario-texto/80">{INSTITUCION.documentoFuente}</span>
          </p>
          <h1
            id="hero-titulo"
            className="display mt-6 max-w-4xl text-4xl text-primario-texto md:text-6xl lg:text-7xl"
          >
            <span className="text-primario-texto/60">Identificar a la persona</span> no puede retrasar la
            atencion del{' '}
            {/*
              Todas las palabras, invisibles, en la misma celda de la rejilla: la celda toma el ancho
              de la mas larga (con cursor) y el titular no cambia de lineas ni de alto mientras se
              teclea. `inline-grid` ademas no se parte, igual que una palabra.
            */}
            <span className="inline-grid">
              {CIERRES_DEL_TITULAR.map((palabra) => (
                <span key={palabra} aria-hidden className="invisible col-start-1 row-start-1">
                  {palabra}
                  <span className="ml-1">|</span>
                </span>
              ))}
              <TextType
                as="span"
                text={CIERRES_DEL_TITULAR}
                srText={CIERRES_DEL_TITULAR[0]}
                typingSpeed={75}
                deletingSpeed={40}
                pauseDuration={2600}
                initialDelay={300}
                className="col-start-1 row-start-1"
                // El `tracking-tight` del componente pisaria el interletrado de `.display`.
                style={{ letterSpacing: 'inherit' }}
              />
            </span>
          </h1>
          <p className="mt-8 max-w-xl border-l border-primario-texto/30 pl-5 text-lg leading-relajado text-primario-texto/80">
            <span className="text-primario-texto">Triage, ECG y activacion avanzan desde la llegada.</span> La
            identidad se confirma en paralelo, sin detener la atencion.
          </p>

          {/* Una accion principal clara y una secundaria que no compite: el boton blanco pesaba mas que el azul. */}
          <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Link href="/acceso" className={clasePrimario}>
              <LockKeyhole className="size-4" aria-hidden />
              {CTA}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#recorrido"
              className="control inline-flex items-center gap-2 text-sm font-medium text-primario-texto/80 underline-offset-8 transition-colors hover:text-primario-texto hover:underline"
            >
              Ver como opera
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>
          <p className="mt-4 text-xs text-primario-texto/80">Cuentas de demostracion y datos sinteticos.</p>
        </div>
      </section>

      {/* ------------------------------------------------ aviso y cifras */}
      <section aria-label="Estado de la propuesta y metas" className="bg-lienzo">
        <div className={cx(contenedor, 'pt-10')}>
          <AvisoPrototipo>
            <p className="mt-2">
              ¿Prefiere empezar por los riesgos?{' '}
              <a href="#pendiente" className="font-medium underline underline-offset-4">
                Ver que falta decidir
              </a>
            </p>
          </AvisoPrototipo>
        </div>

        {/*
          Jerarquia de `IA_BRAIN/jerarquia-de-color.md`: en cada cifra, solo el numero va en pleno.
          Los tres relojes comparten una escala (barra = minutos / meta mas larga) para que la
          diferencia entre 10 y 90 se vea, no solo se lea. Los perfiles no son un reloj: van
          aparte, en bloque oscuro.
        */}
        <div className={cx(contenedor, 'grid gap-6 py-20 sm:py-28 lg:grid-cols-12')}>
          <div className="lg:col-span-9">
            <p className="flex items-center gap-3 text-sm">
              <span className="font-medium text-texto">Metas del protocolo</span>
              <span aria-hidden className="h-px w-8 bg-borde" />
              <span className="text-texto-suave">el reloj empieza en la puerta</span>
            </p>
            {/* `flex-col-reverse`: se lee la etiqueta antes que el numero. */}
            <dl className="mt-10 grid gap-x-8 gap-y-12 border-t border-texto pt-10 sm:grid-cols-3">
              {RELOJES.map((r, i) => (
                <Revelar key={r.etiqueta} retraso={i * 80} duracion={DURACION_CIFRAS} className="flex flex-col-reverse">
                  <dt className="mt-5">
                    <span className="block text-base font-medium text-texto">{r.etiqueta}</span>
                    <span className="mt-1 block text-sm text-texto-suave">{r.detalle}</span>
                  </dt>
                  <dd>
                    <span className="display text-6xl text-texto tabular-nums lg:text-7xl">{r.minutos}</span>
                    <span className="ml-2 text-xl text-texto-suave">min</span>
                    <span aria-hidden className="mt-5 block h-1 w-full bg-borde-suave">
                      <span
                        className="block h-full bg-texto"
                        style={{ width: `${(r.minutos / ESCALA_MINUTOS) * 100}%` }}
                      />
                    </span>
                  </dd>
                </Revelar>
              ))}
            </dl>
            <p className="mt-8 text-sm text-texto-suave">
              Barras a escala sobre la meta mas larga ({ESCALA_MINUTOS} min).
            </p>
          </div>

          <Revelar
            retraso={RELOJES.length * 80}
            duracion={DURACION_CIFRAS}
            className="flex flex-col justify-between gap-10 bg-texto p-8 text-primario-texto lg:col-span-3"
          >
            <dl className="flex flex-col-reverse">
              <dt className="mt-3 text-sm text-primario-texto/80">Perfiles con permisos propios</dt>
              <dd className="display text-6xl tabular-nums lg:text-7xl">{TODOS_LOS_ROLES.length}</dd>
            </dl>
            <p className="text-sm text-primario-texto/80">
              Enfermeria no activa el codigo; recepcion no abre el resumen clinico.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ------------------------------------------------- regla invariable */}
      {/* Manifiesto: una frase grande a todo lo ancho, y tres principios en columnas desiguales. */}
      <section id="regla" aria-labelledby="regla-titulo" className="bg-lienzo-sutil">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar>
            <Activity className="size-7 text-texto" aria-hidden />
            {/* Las palabras se despliegan como papel doblado al entrar en pantalla (React Bits: FoldText). */}
            <h2 id="regla-titulo" className="display mt-8 max-w-5xl text-3xl text-texto md:text-5xl">
              <FoldText
                text="El triage, el ECG y la atencion empiezan al llegar la persona."
                splitBy="word"
                trigger="scroll"
                duration={1.15}
                fontSize="inherit"
                fontWeight="inherit"
                color="currentColor"
              />
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relajado text-texto-suave">
              <span className="font-medium text-texto">Nunca se bloquean</span> por registro, derechohabiencia,
              biometria, consentimiento, conectividad ni disponibilidad del expediente.
            </p>
          </Revelar>

          {/*
            Tarjetas blancas sobre el gris de la seccion: la separacion es por tono de superficie,
            sin bordes ni sombras (`DESIGN.md`). El primer principio es el ancla y pesa mas.
          */}
          <div className="mt-20 grid gap-4 md:grid-cols-12">
            {PRINCIPIOS.map((pr, i) => (
              <Revelar
                key={pr.titulo}
                retraso={i * 100}
                className={cx('flex flex-col bg-fondo p-8', i === 0 ? 'md:col-span-6 lg:p-10' : 'md:col-span-3')}
              >
                <span className="text-sm font-medium text-texto-suave tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={cx('mt-10 font-medium text-texto', i === 0 ? 'text-2xl' : 'text-lg')}>{pr.titulo}</h3>
                <p className={cx('mt-4 leading-relajado text-texto-suave', i === 0 ? 'text-lg' : 'text-base')}>
                  <span className="text-texto">{pr.clave}</span> {pr.texto}
                </p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ el recorrido */}
      {/* Columna izquierda fija mientras los cinco momentos pasan a la derecha. */}
      <section id="recorrido" aria-labelledby="recorrido-titulo" className="bg-lienzo">
        <div className={cx(contenedor, 'grid gap-14 py-24 sm:py-36 lg:grid-cols-12 lg:gap-16')}>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <h2 id="recorrido-titulo" className="display text-3xl text-texto md:text-4xl">
                <FoldText
                  text="Cinco momentos, con su reloj y su responsable."
                  splitBy="word"
                  trigger="scroll"
                  duration={1.15}
                  fontSize="inherit"
                  fontWeight="inherit"
                  color="currentColor"
                />
              </h2>
              <p className="mt-5 max-w-md text-base leading-relajado text-texto-suave">
                Cada paso guarda la hora en que ocurrio y la hora en que se capturo, para que una captura
                tardia no falsee los indicadores.
              </p>
              {/*
                Volumen muy ligero, todo en Carbon y blanco (sin colores nuevos):
                - Sombra exterior: la misma de las tarjetas de decisiones.
                - Luz: brillo suave desde arriba a la izquierda, como luz ambiente sobre la foto.
                - Sombra interior: la base se oscurece apenas, asentando la imagen.
                - Filete de luz: 1 px blanco al 12 % por dentro del borde, que despega la foto del fondo.
                Las capas son decorativas (`aria-hidden`) y no reciben el cursor.
              */}
              <div className="relative mt-10 hidden aspect-[4/5] overflow-hidden rounded-xl bg-superficie shadow-[0_1px_2px_rgb(23_26_32/0.04),0_8px_20px_-10px_rgb(23_26_32/0.12)] lg:block">
                <Image
                  src={ambulancia}
                  alt="Ambulancia en movimiento con las luces de emergencia encendidas"
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 36vw, 0px"
                  className="object-cover object-[82%_center]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(255_255_255/0.14),transparent_55%)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(23_26_32/0.22),transparent_40%)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
                />
              </div>
            </div>
          </div>

          <ol className="lg:col-span-7">
            {PASOS.map((p, i) => (
              <Revelar
                key={p.titulo}
                como="li"
                className="grid grid-cols-[3rem_1fr] gap-x-5 border-t border-borde-suave py-10 first:border-t-0 first:pt-0 sm:grid-cols-[4rem_1fr]"
              >
                <span className="display text-3xl text-texto-suave tabular-nums sm:text-4xl" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h3 className="flex items-center gap-3 text-xl font-medium text-texto sm:text-2xl">
                    <p.Icono className="size-5 shrink-0 text-texto-suave" aria-hidden />
                    {p.titulo}
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relajado text-texto-suave">
                    {p.detalle} <span className="text-texto">{p.clave}</span>
                  </p>
                  <p className="mt-4 font-mono text-xs text-texto-suave">{p.requisitos}</p>
                </div>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ limite de identidad */}
      {/*
        Sin fotografia a proposito: el hero ya carga la imagen de biometria. Aqui el visual es
        el propio sistema, con las insignias REALES de identidad y no un dibujo de ellas.
      */}
      <section id="identidad" aria-labelledby="identidad-titulo" className="bg-lienzo">
        <div className={cx(contenedor, 'grid gap-12 pb-24 sm:pb-36 lg:grid-cols-12 lg:gap-16')}>
          <Revelar className="lg:col-span-7">
            <p className="rotulo">El limite que cambia el alcance</p>
            <h2 id="identidad-titulo" className="display mt-3 max-w-3xl text-3xl text-texto md:text-5xl">
              {/* Dos FoldText para conservar `translate="no"` en el nombre; `display: inline` deja que
                  el segundo fluya en la misma linea en vez de saltar entero como bloque. */}
              <span translate="no">
                <FoldText
                  text="World ID"
                  splitBy="word"
                  trigger="scroll"
                  duration={1.15}
                  fontSize="inherit"
                  fontWeight="inherit"
                  color="currentColor"
                  style={{ display: 'inline' }}
                />
              </span>{' '}
              <FoldText
                text="no identifica a un paciente inconsciente."
                splitBy="word"
                trigger="scroll"
                duration={1.15}
                fontSize="inherit"
                fontWeight="inherit"
                color="currentColor"
                style={{ display: 'inline' }}
              />
            </h2>
            <dl className="mt-14 grid gap-10 sm:grid-cols-2">
              <div className="border-t border-texto pt-6">
                <dt className="text-base font-medium text-texto">Lo que World ID si hace</dt>
                <dd className="mt-3 text-sm leading-relajado text-texto-suave">
                  Demuestra humanidad y unicidad de forma anonima. No entrega nombre ni expediente, y
                  requiere que la persona use su aplicacion. Sirve como factor voluntario{' '}
                  <strong>si antes se vinculo</strong> con el identificador del hospital.
                </dd>
              </div>
              <div className="border-t border-texto pt-6">
                <dt className="text-base font-medium text-texto">Lo que hace falta y no existe todavia</dt>
                <dd className="mt-3 text-sm leading-relajado text-texto-suave">
                  Un motor de busqueda 1:N contratado, validado y autorizado, con pruebas de falsos
                  positivos y negativos en poblacion real. Un nullifier de un solo uso no sirve como llave
                  persistente del expediente.
                </dd>
              </div>
            </dl>
          </Revelar>

          <Revelar retraso={120} className="self-end rounded-xl bg-lienzo-sutil p-8 sm:p-10 lg:col-span-5">
            <h3 className="text-xl font-medium text-texto">Mientras no exista</h3>
            <p className="mt-3 text-base leading-relajado text-texto-suave">
              Se atiende con identificador temporal y se concilia despues. Si la persona no puede confirmar
              su identidad, incluso un unico candidato queda <strong>provisional</strong>: no se fusionan
              episodios ni se escribe sobre un expediente candidato.
            </p>
            <ul aria-label="Estados de identidad del sistema" className="mt-8 flex flex-wrap gap-3">
              <li>
                <InsigniaIdentidad estado="provisional" />
              </li>
              <li>
                <InsigniaIdentidad estado="confirmada" />
              </li>
              <li>
                <InsigniaIdentidad estado="en_conflicto" />
              </li>
            </ul>
          </Revelar>
        </div>
      </section>

      {/* ---------------------------------------------------- que se demuestra */}
      {/*
        Bento de seis celdas para seis afirmaciones (4x2 + 2 + 2 en las dos primeras filas,
        2 + 2 + 2 en la tercera): ninguna celda vacia. La celda grande lleva fotografia; la
        segunda, Carbon; el resto, Ceniza Clara.
      */}
      <section id="prototipo" aria-labelledby="prototipo-titulo" className="bg-lienzo-sutil">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar className="max-w-3xl">
            <h2 id="prototipo-titulo" className="display text-3xl text-texto md:text-5xl">
              <FoldText
                text="Lo que se comprueba en pantalla, y lo que no."
                splitBy="word"
                trigger="scroll"
                duration={1.15}
                fontSize="inherit"
                fontWeight="inherit"
                color="currentColor"
              />
            </h2>
            <p className="mt-5 text-lg leading-relajado text-texto-suave">
              Cada afirmacion se verifica en menos de un minuto usando la demostracion. Las que no se pueden
              verificar aqui van escritas con el mismo peso.
            </p>
          </Revelar>

          <ul className="mt-16 grid grid-flow-dense gap-4 md:grid-cols-2 lg:grid-cols-6">
            {DEMOSTRABLE.map((d, i) => {
              const grande = i === 0;
              const oscura = i === 1;
              return (
                <Revelar
                  key={d.titulo}
                  como="li"
                  retraso={(i % 3) * 80}
                  className={cx(
                    'relative isolate flex flex-col justify-end overflow-hidden rounded-xl p-7',
                    grande && 'min-h-[22rem] md:col-span-2 lg:col-span-4 lg:row-span-2 lg:min-h-[30rem]',
                    !grande && 'lg:col-span-2',
                    grande || oscura ? 'bg-texto text-primario-texto' : 'bg-fondo text-texto',
                  )}
                >
                  {grande && (
                    <>
                      <Image
                        src={pantallasClinicas}
                        alt=""
                        fill
                        placeholder="blur"
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="-z-20 object-cover"
                      />
                      <div aria-hidden className="absolute inset-0 -z-10 bg-texto/70" />
                    </>
                  )}
                  <d.Icono
                    className={cx('mb-auto size-6', grande || oscura ? 'text-primario-texto' : 'text-texto')}
                    aria-hidden
                  />
                  <h3 className={cx('mt-10 font-medium', grande ? 'text-2xl sm:text-3xl' : 'text-lg')}>
                    {d.titulo}
                  </h3>
                  <p
                    className={cx(
                      'mt-3 leading-relajado',
                      grande ? 'max-w-lg text-base' : 'text-sm',
                      grande || oscura ? 'text-primario-texto/80' : 'text-texto-suave',
                    )}
                  >
                    {d.detalle}
                  </p>
                  <p
                    className={cx(
                      'mt-4 font-mono text-xs',
                      grande || oscura ? 'text-primario-texto/70' : 'text-texto-suave',
                    )}
                  >
                    {d.prueba}
                  </p>
                </Revelar>
              );
            })}
          </ul>

          <Revelar className="mt-4 rounded-xl bg-aviso-suave p-8 sm:p-12">
            <h3 className="flex items-center gap-3 text-xl font-medium text-aviso">
              <TriangleAlert className="size-5 shrink-0" aria-hidden />
              No se demuestra aqui
            </h3>
            <ul className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
              {NO_DEMOSTRABLE.map((n) => (
                <li key={n} className="text-sm leading-relajado text-aviso">
                  {n}
                </li>
              ))}
            </ul>
          </Revelar>
        </div>
      </section>

      {/* ---------------------------------------------------------- que falta */}
      {/* Fila con desplazamiento horizontal en pantallas chicas; cinco columnas en escritorio. */}
      <section id="pendiente" aria-labelledby="pendiente-titulo" className="bg-lienzo">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar className="max-w-3xl">
            <h2 id="pendiente-titulo" className="display text-3xl text-texto md:text-5xl">
              <FoldText
                text="Cinco decisiones que bloquean el desarrollo integrado."
                splitBy="word"
                trigger="scroll"
                duration={1.15}
                fontSize="inherit"
                fontWeight="inherit"
                color="currentColor"
              />
            </h2>
            <p className="mt-5 text-lg leading-relajado text-texto-suave">
              Cada una cambia el diseño, el alcance o la legalidad del piloto. Mientras sigan abiertas, esto es
              lo que se puede construir.
            </p>
          </Revelar>

          {/* Tarjetas estaticas que se voltean al clic y regresan al salir el cursor. */}
          <TarjetasDecision />
        </div>
      </section>

      {/* ------------------------------------------------------------ preguntas */}
      {/* Preguntas y respuestas a la vista, en dos columnas: nada escondido tras un acordeon. */}
      <section id="preguntas" aria-labelledby="preguntas-titulo" className="bg-lienzo-sutil">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar className="max-w-3xl">
            <p className="rotulo">Preguntas frecuentes</p>
            <h2 id="preguntas-titulo" className="display mt-3 text-3xl text-texto md:text-5xl">
              <FoldText
                text="Lo que preguntan en la primera reunion."
                splitBy="word"
                trigger="scroll"
                duration={1.15}
                fontSize="inherit"
                fontWeight="inherit"
                color="currentColor"
              />
            </h2>
          </Revelar>
          {/*
            Tarjetas `bg-fondo` sobre la banda, con la misma sombra ligerisima que las decisiones.
            En escritorio van 3 + 2 (rejilla de 6); en tableta, 2 + 2 + 1 a todo lo ancho. El icono
            va en un cuadro Carbon con trazo blanco: el unico bloque oscuro de la tarjeta, sin
            agregar color. En la respuesta, el veredicto en pleno y la explicacion en suave.
          */}
          <dl className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {PREGUNTAS.map((q, i) => {
              const Icono = q.icono;
              // La ultima tarjeta va invertida en Carbon: cierra la seccion con peso. Mismos tonos
              // del hero: pleno para pregunta y veredicto, 80 % para la explicacion (11.42:1).
              const oscura = i === PREGUNTAS.length - 1;
              return (
                <Revelar
                  key={q.p}
                  retraso={(i < 3 ? i : i - 3) * 100}
                  className={cx(
                    'flex flex-col rounded-xl p-7 shadow-[0_1px_2px_rgb(23_26_32/0.04),0_8px_20px_-10px_rgb(23_26_32/0.12)] sm:p-8',
                    oscura ? 'bg-texto' : 'bg-fondo',
                    i < 3 ? 'lg:col-span-2' : 'lg:col-span-3',
                    oscura && 'md:col-span-2',
                  )}
                >
                  <span
                    aria-hidden
                    className={cx(
                      'grid size-11 place-items-center rounded-lg',
                      oscura ? 'bg-primario-texto text-texto' : 'bg-texto text-primario-texto',
                    )}
                  >
                    <Icono className="size-5" strokeWidth={1.75} />
                  </span>
                  <dt
                    className={cx(
                      'mt-8 text-lg leading-snug font-medium',
                      oscura ? 'text-primario-texto' : 'text-texto',
                    )}
                  >
                    {q.p}
                  </dt>
                  <dd
                    className={cx(
                      'mt-3 text-base leading-relajado',
                      oscura ? 'text-primario-texto/80' : 'text-texto-suave',
                    )}
                  >
                    <span className={cx('font-medium', oscura ? 'text-primario-texto' : 'text-texto')}>
                      {q.veredicto}
                    </span>{' '}
                    {q.r}
                  </dd>
                </Revelar>
              );
            })}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- cierre */}
      {/*
        Cierra con el mismo recurso que abre: fotografia a sangre y tipografia blanca, con la
        jerarquia de `IA_BRAIN/jerarquia-de-color.md`. El velo va cargado a la izquierda, donde
        vive el texto, y deja ver al personal a la derecha; en movil es parejo porque el texto
        cubre todo el ancho. Las cifras salen del parrafo a una fila propia: numero en pleno,
        etiqueta al 80 %.
      */}
      <section aria-labelledby="cierre-titulo" className="relative isolate overflow-hidden bg-texto">
        <Image
          src={personalClinico}
          alt=""
          fill
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover object-[60%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-texto/80 lg:bg-transparent lg:bg-[linear-gradient(90deg,rgb(23_26_32/0.92)_0%,rgb(23_26_32/0.84)_50%,rgb(23_26_32/0.45)_78%,rgb(23_26_32/0.3)_100%)]"
        />
        <Revelar className={cx(contenedor, 'py-28 sm:py-44')}>
          <p className="flex items-center gap-3 text-sm">
            <span className="font-medium text-primario-texto">Pruebelo</span>
            <span aria-hidden className="h-px w-8 bg-primario-texto/40" />
            <span className="text-primario-texto/80">Prototipo con datos sinteticos</span>
          </p>
          <h2 id="cierre-titulo" className="display mt-6 max-w-3xl text-4xl text-primario-texto md:text-6xl">
            <span className="text-primario-texto/60">Recorra el sistema</span> con el perfil que le toca
            revisar.
          </h2>

          {/*
            Dos bloques gemelos, misma estructura: numero (pleno), rotulo (pleno, chico) y detalle
            (80 %). Cada bloque es `subgrid` de las mismas tres filas: numero, rotulo y detalle
            comparten altura entre columnas, asi que si un texto ocupa mas lineas, la fila crece
            en los dos bloques y todo sigue a la misma altura. `row-start` pone el numero arriba
            sin cambiar el orden del DOM (dt antes que dd). Los 5 puntos de control SON los 4
            lectores + 1 camara: van juntos, no como dos cifras. Los detalles tienen largo
            parecido a proposito, para que los dos bloques cierren a la misma altura.
          */}
          <dl className="mt-12 grid max-w-2xl grid-cols-2 grid-rows-[auto_auto_auto] border-t border-primario-texto/20 pt-8">
            {[
              {
                valor: TODOS_LOS_ROLES.length,
                rotulo: 'Cuentas de demostracion',
                detalle: 'Una por actor de la ERS, cada una con sus propios permisos.',
              },
              {
                valor: INSTITUCION.puntosDeControl,
                rotulo: 'Puntos de control propuestos',
                detalle: `${INSTITUCION.lectoresEscritorio} lectores de escritorio y ${INSTITUCION.camarasAltaConcurrencia} camara de alta concurrencia. Sin compra ni prueba.`,
              },
            ].map((c, i) => (
              <div
                key={c.rotulo}
                className={cx(
                  'row-span-3 grid grid-rows-subgrid',
                  i === 0 ? 'pr-6' : 'border-l border-primario-texto/20 pl-6',
                )}
              >
                <dt className="row-start-2 mt-4 text-sm leading-snug font-medium text-primario-texto">{c.rotulo}</dt>
                <dd className="row-start-1 display text-5xl text-primario-texto tabular-nums md:text-6xl">{c.valor}</dd>
                <dd className="row-start-3 mt-2 text-sm leading-relajado text-primario-texto/80">{c.detalle}</dd>
              </div>
            ))}
          </dl>

          <Link href="/acceso" className={cx(clasePrimario, 'mt-12')}>
            <LockKeyhole className="size-4" aria-hidden />
            {CTA}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Revelar>
      </section>
    </MarcoPublico>
  );
}
