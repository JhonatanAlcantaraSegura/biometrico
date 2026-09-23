'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ClipboardCheck,
  Fingerprint,
  Gauge,
  HeartPulse,
  Layers,
  ListChecks,
  Lock,
  LockKeyhole,
  Plug,
  ShieldQuestion,
  Siren,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { DECISIONES_ABIERTAS, INSTITUCION, METAS } from '@/lib/datos/institucion';
import { TODOS_LOS_ROLES } from '@/lib/datos/rutas';
import { InsigniaIdentidad, cx } from '@/components/ui/primitivos';
import { AvisoPrototipo, MarcoPublico, type AnclaPublica } from '@/components/dominio/marco-publico';
import { Revelar } from '@/components/dominio/revelar';
import retinaBiometrica from '@/public/imagenes/hero-biometria-retina.jpg';

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
 * primaria, fotografia a sangre con tipografia blanca encima) con una capa editorial propia
 * de la portada: Geist, titulares grandes, una familia de maquetacion distinta por seccion y
 * entradas al hacer scroll. Ver `app/tema-publico.css`.
 */

/**
 * Fotografia de MARCADOR DE POSICION (picsum.photos), siempre en escala de grises para que
 * no compita con la paleta. Sustituir por fotografia propia de la sede, con permiso, antes
 * de presentar la propuesta fuera del equipo. El patron permitido esta en `next.config.ts`.
 */
function foto(semilla: string, ancho: number, alto: number): string {
  return `https://picsum.photos/seed/${semilla}/${ancho}/${alto}?grayscale`;
}

const ANCLAS: readonly AnclaPublica[] = [
  { id: 'regla', etiqueta: 'La regla invariable' },
  { id: 'recorrido', etiqueta: 'El recorrido' },
  { id: 'identidad', etiqueta: 'Limite de identidad' },
  { id: 'prototipo', etiqueta: 'Que se demuestra' },
  { id: 'pendiente', etiqueta: 'Que falta decidir' },
  { id: 'preguntas', etiqueta: 'Preguntas' },
];

/** Todas salen de `lib/datos`: la portada no puede contradecir al sistema. */
const CIFRAS = [
  { valor: String(METAS.ecgMinutos), unidad: 'min', etiqueta: 'Meta de llegada a ECG' },
  { valor: String(METAS.pciMinutos), unidad: 'min', etiqueta: 'Meta puerta-balon' },
  { valor: String(METAS.fibrinolisisMinutos), unidad: 'min', etiqueta: 'Meta puerta-aguja' },
  { valor: String(TODOS_LOS_ROLES.length), unidad: '', etiqueta: 'Perfiles con permisos propios' },
] as const;

const PRINCIPIOS = [
  {
    titulo: 'Lo que dice el protocolo',
    texto: `El protocolo del IMSS prioriza los sintomas de alarma aun sin identificacion y pide ECG en los primeros ${METAS.ecgMinutos} minutos. Activar el Codigo Infarto corresponde al medico, tras interpretar el ECG e integrar el diagnostico.`,
  },
  {
    titulo: 'Estados independientes',
    texto:
      'El episodio clinico avanza por su cuenta. La identidad cambia por separado y no detiene ninguna transicion clinica.',
  },
  {
    titulo: 'Lo que el escaneo no hace',
    texto:
      'Un resultado biometrico no diagnostica, no prescribe y no activa hemodinamia. La decision se queda con el medico.',
  },
] as const;

const PASOS = [
  {
    Icono: Siren,
    titulo: 'Llegada y triage',
    detalle:
      'Se registran hora, sede y sintomas de alarma, y nace un episodio con identificador temporal y etiqueta de brazalete. El reloj clinico arranca aunque no se sepa el nombre.',
    requisitos: 'RF-01, RF-02, RF-03',
  },
  {
    Icono: Timer,
    titulo: 'ECG sin esperar identidad',
    detalle: `Solicitud, adquisicion, entrega e interpretacion del ECG se registran por separado, cada una con responsable y fuente de hora. Meta de referencia: ${METAS.ecgMinutos} minutos.`,
    requisitos: 'RF-04, RF-21',
  },
  {
    Icono: Fingerprint,
    titulo: 'Identidad en paralelo',
    detalle:
      'Se intenta la via disponible. El resultado puede ser confirmado, provisional, sin coincidencia, multiple, de baja confianza o sin proveedor. Solo “confirmado” abre un expediente.',
    requisitos: 'RF-05, RF-10',
  },
  {
    Icono: HeartPulse,
    titulo: 'Diagnostico y activacion',
    detalle:
      'El medico documenta interpretacion, diagnostico y hora cero clinica, y activa el codigo por accion explicita. Ningun resultado biometrico diagnostica ni activa hemodinamia.',
    requisitos: 'RF-16, RF-17',
  },
  {
    Icono: ClipboardCheck,
    titulo: 'Reperfusion y cierre',
    detalle: `Se registra la ruta que eligio el medico (angioplastia, fibrinolisis o traslado) con sus hitos y tiempos. Metas: ${METAS.pciMinutos} min para angioplastia y ${METAS.fibrinolisisMinutos} min para fibrinolisis.`,
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

/** Las preguntas que se repiten en cada reunion, con respuesta corta. */
const PREGUNTAS = [
  {
    p: '¿Se puede atender a alguien que llega sin documentos ni telefono?',
    r: 'Si. El episodio nace con un identificador temporal y una etiqueta de brazalete. Triage, ECG y activacion avanzan sin esperar a la identidad, que se concilia despues.',
  },
  {
    p: '¿La biometria decide algo clinico?',
    r: 'No. Un resultado biometrico solo propone candidatos. El diagnostico, la hora cero y la activacion del Codigo Infarto son acciones explicitas del medico.',
  },
  {
    p: '¿Que pasa si se cae el expediente o el motor biometrico?',
    r: 'El ingreso sigue funcionando. Las escrituras se encolan con llave idempotente y se reintentan sin duplicarse. Se comprueba con el simulador de fallos del encabezado.',
  },
  {
    p: '¿Quien puede ver el resumen clinico?',
    r: 'Solo los perfiles autorizados y solo con identidad confirmada. Fuera de eso existe el acceso de emergencia, que exige motivo escrito y queda en la bitacora.',
  },
  {
    p: '¿El acceso del prototipo es seguro?',
    r: 'No pretende serlo. Las cuentas se validan en el navegador para enseñar la conducta: intentos, bloqueo y vencimiento de turno. El sistema real verifica al personal en el servidor con MFA.',
  },
] as const;

/** Una sola etiqueta para la unica intencion de conversion de la pagina. */
const CTA = 'Entrar al prototipo';

/** Boton primario de `DESIGN.md`: Azul Electrico, 4 px, sin sombra, hover solo de color. */
const clasePrimario =
  'control inline-flex items-center justify-center gap-2 rounded bg-primario px-6 text-sm font-medium ' +
  'text-primario-texto transition-colors hover:bg-primario-oscuro active:bg-primario-oscuro sm:min-w-52';

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

        <div className={cx(contenedor, 'aparecer pt-24 pb-16 sm:pb-24')}>
          <p className="text-sm font-medium text-primario-texto/80">{INSTITUCION.documentoFuente}</p>
          <h1
            id="hero-titulo"
            className="display mt-5 max-w-5xl text-4xl text-primario-texto md:text-5xl lg:text-[3.5rem]"
          >
            Identificar a la persona no puede retrasar la atencion del infarto.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relajado text-primario-texto/85">
            Triage, ECG y activacion avanzan desde la llegada. La identidad se confirma en paralelo, sin
            detener la atencion.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/acceso" className={clasePrimario}>
              <LockKeyhole className="size-4" aria-hidden />
              {CTA}
            </Link>
            <a
              href="#recorrido"
              className="control inline-flex items-center justify-center rounded bg-fondo px-6 text-sm font-medium text-texto transition-colors hover:bg-superficie sm:min-w-52"
            >
              Ver como opera
            </a>
          </div>
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

        {/* `flex-col-reverse`: se lee la etiqueta antes que el numero. */}
        <dl className={cx(contenedor, 'grid grid-cols-2 gap-x-6 gap-y-12 py-20 sm:py-28 lg:grid-cols-4')}>
          {CIFRAS.map((c, i) => (
            <Revelar key={c.etiqueta} retraso={i * 80} className="flex flex-col-reverse">
              <dt className="mt-3 text-sm text-texto-suave">{c.etiqueta}</dt>
              <dd className="display text-6xl text-texto tabular-nums lg:text-7xl">
                {c.valor}
                {c.unidad && <span className="ml-2 text-xl tracking-normal text-texto-suave">{c.unidad}</span>}
              </dd>
            </Revelar>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------- regla invariable */}
      {/* Manifiesto: una frase grande a todo lo ancho, y tres principios en columnas desiguales. */}
      <section id="regla" aria-labelledby="regla-titulo" className="bg-lienzo-sutil">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar>
            <Activity className="size-7 text-texto" aria-hidden />
            <h2 id="regla-titulo" className="display mt-8 max-w-5xl text-3xl text-texto md:text-5xl">
              El triage, el ECG y la atencion empiezan al llegar la persona.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relajado text-texto-suave">
              Nunca se bloquean por registro, derechohabiencia, biometria, consentimiento, conectividad ni
              disponibilidad del expediente.
            </p>
          </Revelar>

          <div className="mt-20 grid gap-12 md:grid-cols-12 md:gap-8">
            {PRINCIPIOS.map((pr, i) => (
              <Revelar
                key={pr.titulo}
                retraso={i * 100}
                className={cx('border-t border-texto pt-6', i === 0 ? 'md:col-span-6' : 'md:col-span-3')}
              >
                <h3 className={cx('font-medium text-texto', i === 0 ? 'text-xl' : 'text-base')}>{pr.titulo}</h3>
                <p className={cx('mt-3 leading-relajado text-texto-suave', i === 0 ? 'text-base' : 'text-sm')}>
                  {pr.texto}
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
                Cinco momentos, con su reloj y su responsable.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relajado text-texto-suave">
                Cada paso guarda la hora en que ocurrio y la hora en que se capturo, para que una captura
                tardia no falsee los indicadores.
              </p>
              <div className="relative mt-10 hidden aspect-[4/5] overflow-hidden rounded-xl bg-superficie lg:block">
                <Image
                  src={foto('sala-urgencias-monitor', 1000, 1250)}
                  alt="Fotografia ilustrativa en escala de grises"
                  fill
                  sizes="(min-width: 1024px) 36vw, 0px"
                  className="object-cover"
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
                  <p className="mt-3 max-w-xl text-base leading-relajado text-texto-suave">{p.detalle}</p>
                  <p className="mt-4 font-mono text-xs text-texto-suave">{p.requisitos}</p>
                </div>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ limite de identidad */}
      {/* Imagen y texto enfrentados; debajo, las insignias REALES del sistema, no un dibujo. */}
      <section id="identidad" aria-labelledby="identidad-titulo" className="bg-lienzo">
        <div className={cx(contenedor, 'pb-24 sm:pb-36')}>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Revelar className="relative aspect-[4/3] overflow-hidden rounded-xl bg-superficie lg:col-span-7">
              <Image
                src={foto('huella-lector-biometrico', 1600, 1200)}
                alt="Fotografia ilustrativa en escala de grises"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </Revelar>

            <Revelar retraso={120} className="lg:col-span-5">
              <p className="rotulo">El limite que cambia el alcance</p>
              <h2 id="identidad-titulo" className="display mt-3 text-3xl text-texto md:text-4xl">
                <span translate="no">World ID</span> no identifica a un paciente inconsciente.
              </h2>
              <dl className="mt-10 space-y-8">
                <div>
                  <dt className="text-base font-medium text-texto">Lo que World ID si hace</dt>
                  <dd className="mt-2 text-sm leading-relajado text-texto-suave">
                    Demuestra humanidad y unicidad de forma anonima. No entrega nombre ni expediente, y
                    requiere que la persona use su aplicacion. Sirve como factor voluntario{' '}
                    <strong>si antes se vinculo</strong> con el identificador del hospital.
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-texto">Lo que hace falta y no existe todavia</dt>
                  <dd className="mt-2 text-sm leading-relajado text-texto-suave">
                    Un motor de busqueda 1:N contratado, validado y autorizado, con pruebas de falsos
                    positivos y negativos en poblacion real. Un nullifier de un solo uso no sirve como llave
                    persistente del expediente.
                  </dd>
                </div>
              </dl>
            </Revelar>
          </div>

          <Revelar className="mt-16 grid gap-8 rounded-xl bg-lienzo-sutil p-8 sm:p-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h3 className="text-xl font-medium text-texto">Mientras no exista</h3>
              <p className="mt-3 max-w-2xl text-base leading-relajado text-texto-suave">
                Se atiende con identificador temporal y se concilia despues. Si la persona no puede
                confirmar su identidad, incluso un unico candidato queda <strong>provisional</strong>: no se
                fusionan episodios ni se escribe sobre un expediente candidato.
              </p>
            </div>
            <ul aria-label="Estados de identidad del sistema" className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
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
              Lo que se comprueba en pantalla, y lo que no.
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
                        src={foto('simulador-fallos-servidores', 1600, 1100)}
                        alt=""
                        fill
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
              Cinco decisiones que bloquean el desarrollo integrado.
            </h2>
            <p className="mt-5 text-lg leading-relajado text-texto-suave">
              Cada una cambia el diseño, el alcance o la legalidad del piloto. Mientras sigan abiertas, esto es
              lo que se puede construir.
            </p>
          </Revelar>

          <ol
            tabIndex={0}
            aria-label="Decisiones abiertas"
            className="-mx-4 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {DECISIONES_ABIERTAS.map((d, i) => (
              <Revelar
                key={d.clave}
                como="li"
                retraso={i * 70}
                className="flex w-[17rem] shrink-0 snap-start flex-col rounded-xl bg-lienzo-sutil p-7 lg:w-auto"
              >
                <span className="display text-5xl text-aviso tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-10 text-base font-medium text-texto">{d.titulo}</h3>
                <p className="mt-3 text-sm leading-relajado text-texto-suave">{d.detalle}</p>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ preguntas */}
      {/* Preguntas y respuestas a la vista, en dos columnas: nada escondido tras un acordeon. */}
      <section id="preguntas" aria-labelledby="preguntas-titulo" className="bg-lienzo-sutil">
        <div className={cx(contenedor, 'py-24 sm:py-36')}>
          <Revelar className="max-w-3xl">
            <p className="rotulo">Preguntas frecuentes</p>
            <h2 id="preguntas-titulo" className="display mt-3 text-3xl text-texto md:text-5xl">
              Lo que preguntan en la primera reunion.
            </h2>
          </Revelar>
          <dl className="mt-16 grid gap-x-16 gap-y-14 md:grid-cols-2">
            {PREGUNTAS.map((q, i) => (
              <Revelar key={q.p} retraso={(i % 2) * 100}>
                <dt className="text-lg font-medium text-texto">{q.p}</dt>
                <dd className="mt-3 text-base leading-relajado text-texto-suave">{q.r}</dd>
              </Revelar>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- cierre */}
      {/* Cierra con el mismo recurso que abre: fotografia a sangre y tipografia blanca. */}
      <section aria-labelledby="cierre-titulo" className="relative isolate overflow-hidden bg-texto">
        <Image
          src={foto('hospital-pasillo-guardia', 2400, 1200)}
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-texto/75" />
        <Revelar className={cx(contenedor, 'py-28 sm:py-44')}>
          <h2 id="cierre-titulo" className="display max-w-3xl text-3xl text-primario-texto md:text-5xl">
            Recorra el sistema con el perfil que le toca revisar.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relajado text-primario-texto/85">
            {TODOS_LOS_ROLES.length} cuentas de demostracion, una por actor de la ERS.{' '}
            {INSTITUCION.puntosDeControl} puntos de control propuestos: {INSTITUCION.lectoresEscritorio} lectores
            de escritorio y {INSTITUCION.camarasAltaConcurrencia} camara de alta concurrencia, sin compra ni
            prueba de compatibilidad.
          </p>
          <Link href="/acceso" className={cx(clasePrimario, 'mt-10')}>
            <LockKeyhole className="size-4" aria-hidden />
            {CTA}
          </Link>
        </Revelar>
      </section>
    </MarcoPublico>
  );
}
