'use client';

import Link from 'next/link';
import {
  Activity,
  ChevronDown,
  LockKeyhole,
  ClipboardCheck,
  Fingerprint,
  Gauge,
  HeartPulse,
  Layers,
  ListChecks,
  Lock,
  Plug,
  ShieldQuestion,
  Siren,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { DECISIONES_ABIERTAS, INSTITUCION, METAS } from '@/lib/datos/institucion';
import { TODOS_LOS_ROLES } from '@/lib/datos/rutas';
import { VistaPrevia } from '@/components/dominio/vista-previa';
import {
  AvisoPrototipo,
  BandaPublica,
  MarcoPublico,
  TarjetaPublica,
  type AnclaPublica,
} from '@/components/dominio/marco-publico';

/**
 * Sitio publico de la propuesta, en la raiz `/`.
 *
 * El panel administrado se mudo a `/tablero` (dentro del grupo `(app)`, con guarda y shell).
 * La raiz es ahora esta pagina porque la primera pantalla de una propuesta que todavia no
 * esta autorizada no deberia ser su tablero de urgencias: quien entra sin contexto es un
 * comite que necesita saber que se propone, que queda pendiente y que NO se demuestra.
 *
 * Lo que hay aqui no es publicidad. Son las preguntas que la ERS deja explicitamente
 * abiertas —autorizacion, expediente, biometria en inconscientes, base juridica, costos—
 * puestas por escrito, mas la regla clinica invariable y el limite de identidad, que son las
 * dos afirmaciones que el documento repite y que el prototipo tiene que respetar.
 *
 * Orden de lectura, y por que: primero lo que el producto promete (hero), luego la regla que
 * nunca se rompe, luego el recorrido operativo, luego lo que el prototipo demuestra de
 * verdad, y al final —con el mismo peso que lo anterior, no escondido— lo que sigue sin
 * resolverse. Una propuesta que pone sus bloqueadores al final en letra chica es una
 * propuesta que se aprueba por error.
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
 * Franja de cifras, al estilo de la "franja de confianza" de URIS-CITAS. Todas salen de
 * `lib/datos`: ninguna se escribe a mano aqui, para que la portada no pueda contradecir
 * al sistema.
 */
const CIFRAS = [
  { valor: String(METAS.ecgMinutos), unidad: 'min', etiqueta: 'Meta de llegada a ECG' },
  { valor: String(METAS.pciMinutos), unidad: 'min', etiqueta: 'Meta puerta-balon' },
  { valor: String(METAS.fibrinolisisMinutos), unidad: 'min', etiqueta: 'Meta puerta-aguja' },
  { valor: String(TODOS_LOS_ROLES.length), unidad: '', etiqueta: 'Perfiles con permisos propios' },
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
    r: 'El ingreso sigue funcionando. Las escrituras al expediente se encolan con llave idempotente y se reintentan sin duplicarse. Se comprueba con el simulador de fallos del encabezado.',
  },
  {
    p: '¿Quien puede ver el resumen clinico?',
    r: 'Solo los perfiles autorizados y solo con identidad confirmada. Fuera de eso existe el acceso de emergencia, que exige motivo escrito y queda marcado en la bitacora.',
  },
  {
    p: '¿El acceso del prototipo es seguro?',
    r: 'No pretende serlo. Las credenciales de demostracion se validan en el navegador para enseñar la conducta: intentos, bloqueo y vencimiento de turno. En el sistema real la identidad del personal se verifica en el servidor con MFA.',
  },
] as const;

const PASOS = [
  {
    n: 1,
    Icono: Siren,
    titulo: 'Llegada y triage',
    detalle:
      'El primer contacto registra hora, sede y sintomas de alarma, y crea un episodio con identificador temporal y etiqueta de brazalete. El reloj clinico arranca aunque no se sepa el nombre.',
    requisitos: 'RF-01, RF-02, RF-03',
  },
  {
    n: 2,
    Icono: Timer,
    titulo: 'ECG sin esperar identidad',
    detalle: `Se registran por separado la solicitud, la adquisicion, la entrega y la interpretacion del ECG, cada una con responsable y fuente de hora. Meta de referencia del protocolo IMSS: ${METAS.ecgMinutos} minutos.`,
    requisitos: 'RF-04, RF-21',
  },
  {
    n: 3,
    Icono: Fingerprint,
    titulo: 'Identidad en paralelo',
    detalle:
      'Se intenta la via disponible y el resultado puede ser confirmado, provisional, sin coincidencia, coincidencias multiples, baja confianza o proveedor no disponible. Solo "confirmado" abre un expediente.',
    requisitos: 'RF-05, RF-10',
  },
  {
    n: 4,
    Icono: HeartPulse,
    titulo: 'Diagnostico y activacion',
    detalle:
      'El medico documenta la interpretacion, el diagnostico y la hora cero clinica, y activa el codigo por accion explicita. Ningun resultado biometrico produce un diagnostico ni activa hemodinamia.',
    requisitos: 'RF-16, RF-17',
  },
  {
    n: 5,
    Icono: ClipboardCheck,
    titulo: 'Reperfusion y cierre',
    detalle: `Se registra la ruta elegida por el medico —angioplastia, fibrinolisis o traslado— con sus hitos y tiempos. Metas de referencia: ${METAS.pciMinutos} min para angioplastia, ${METAS.fibrinolisisMinutos} min para fibrinolisis.`,
    requisitos: 'RF-20, RF-26',
  },
] as const;

/**
 * Lo que el prototipo demuestra EN EL COMPORTAMIENTO. Cada fila se puede comprobar en
 * pantalla en menos de un minuto, y eso es el criterio para estar en esta lista: una
 * afirmacion que solo se puede leer no pertenece aqui.
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
      'Un resultado ambiguo o sin coincidencia deja el resumen clinico cerrado. Abrirlo exige acceso de emergencia con motivo escrito, y queda marcado en la bitacora.',
    prueba: 'RF-13, RF-22, CA-03',
  },
  {
    Icono: ShieldQuestion,
    titulo: 'Homonimos y candidatos multiples',
    detalle:
      'Un episodio de la demostracion llega con dos candidatos del mismo nombre: la apertura automatica esta bloqueada y la conciliacion exige motivo de corroboracion.',
    prueba: 'RF-10, RF-12, CA-05',
  },
  {
    Icono: Layers,
    titulo: 'Escrituras idempotentes',
    detalle:
      'Con el expediente caido las escrituras se encolan con llave idempotente. Reintentar dos veces no duplica notas, y reactivar un codigo no crea una segunda activacion.',
    prueba: 'RF-15, CA-07, CA-11',
  },
  {
    Icono: ListChecks,
    titulo: 'Permisos por actor',
    detalle:
      'Entre con otra cuenta de demostracion o use "ver como" en el menu de usuario: enfermeria no activa el codigo, recepcion no abre el resumen clinico, traslados no ve la historia clinica.',
    prueba: 'RF-22, seccion 2',
  },
  {
    Icono: Gauge,
    titulo: 'Metricas separadas y con huecos visibles',
    detalle:
      'Los indicadores clinicos y los de identificacion se reportan aparte, y los casos sin dato se cuentan en vez de imputarse.',
    prueba: 'RF-26, seccion 9',
  },
] as const;

/** Lo que el prototipo NO demuestra. Mismo peso visual que la lista anterior. */
const NO_DEMOSTRABLE = [
  'No hay motor biometrico 1:N contratado ni validado. RF-09 sigue siendo un bloqueador de factibilidad y aqui esta simulado con candidatos escritos a mano.',
  'No hay integracion con el expediente clinico del ISSSTE ni contrato FHIR acordado (RF-32).',
  'No hay autorizacion institucional de la sede propuesta ni evaluacion de impacto en privacidad.',
  'Las latencias de las presentaciones (menos de 2 s de captura, menos de 5 s de identificacion) no se miden: requieren hardware y poblacion reales.',
  'Los ahorros, el retorno y la reduccion del 84 % son hipotesis de linea base, no resultados.',
  'La autenticacion es simulada: las cuentas de demostracion se validan en el navegador, sin servidor ni MFA. Sirve para enseñar la conducta, no protege nada.',
] as const;

export default function SitioPublico() {
  return (
    <MarcoPublico anclas={ANCLAS}>
      {/* ------------------------------------------------------------------ hero */}
      <section aria-labelledby="hero-titulo" className="bg-lienzo">
        <div className="mx-auto grid max-w-6xl lg:min-h-[calc(100dvh-4.5rem)] items-center gap-12 px-4 py-16 sm:py-seccion lg:grid-cols-12">
          <div className="aparecer lg:col-span-7">
            <p className="rotulo">Especificacion de requerimientos · {INSTITUCION.documentoFuente}</p>

            <h1 id="hero-titulo" className="mt-4 max-w-3xl text-3xl text-texto sm:text-4xl">
              Identificar a la persona no puede retrasar la atencion del infarto.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relajado text-texto-suave">
              Una plataforma de urgencias que reduce el tiempo administrativo de identificacion, recupera
              informacion clinica cuando hay una correspondencia <strong>confirmada</strong>, apoya la
              activacion del Codigo Infarto por personal clinico y mide cada intervalo del proceso. Tambien
              cuando la persona esta inconsciente, sin documentos, sin coincidencia biometrica o con una
              integracion caida.
            </p>

            {/* El par de acciones de `DESIGN.md`: Azul Electrico para la primaria, Ceniza
                Clara para la secundaria, 200 px de ancho y 4 px de radio. */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/acceso"
                className="control inline-flex items-center justify-center gap-2 rounded bg-primario px-6 text-sm font-medium text-primario-texto transition-colors hover:bg-primario-oscuro sm:w-52"
              >
                <LockKeyhole className="size-4" aria-hidden />
                Entrar al prototipo
              </Link>
              <a
                href="#recorrido"
                className="control inline-flex items-center justify-center rounded bg-superficie px-6 text-sm font-medium text-texto transition-colors hover:bg-borde-suave sm:w-52"
              >
                Ver como opera
              </a>
            </div>

            <p className="mt-6 text-sm text-texto-suave">
              ¿Prefiere empezar por los riesgos?{' '}
              <a href="#pendiente" className="font-medium text-texto underline">
                Ver que falta decidir
              </a>
            </p>
          </div>

          <div className="lg:col-span-5">
            <VistaPrevia />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16">
          <AvisoPrototipo className="max-w-3xl" />
        </div>

        {/* Franja de cifras. `flex-col-reverse`: se lee la etiqueta antes que el numero. Sin
            lineas entre columnas: el aire las separa. */}
        <dl className="grid grid-cols-2 bg-lienzo-sutil sm:grid-cols-4">
          {CIFRAS.map((c) => (
            <div key={c.etiqueta} className="flex flex-col-reverse items-center px-3 py-12 text-center">
              <dt className="mt-1 text-sm text-texto-suave">{c.etiqueta}</dt>
              <dd className="titulo text-3xl text-texto sm:text-4xl">
                <span className="tabular-nums">{c.valor}</span>
                {c.unidad && <span className="ml-1 text-lg text-texto-suave">{c.unidad}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------- regla invariable */}
      <BandaPublica
        id="regla"
        rotulo="la afirmacion que no se negocia"
        titulo="El triage, el ECG y la atencion empiezan al llegar la persona"
        descripcion="Nunca se bloquean por registro, derechohabiencia, biometria, consentimiento, conectividad ni disponibilidad del expediente. Todo lo demas del sistema esta subordinado a esta regla."
        Icono={Activity}
        fondo="sutil"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TarjetaPublica titulo="Lo que dice el protocolo">
            <p className="text-sm leading-llano text-texto-suave">
              El protocolo del IMSS prioriza los sintomas de alarma aun sin identificacion y pide ECG en
              los primeros {METAS.ecgMinutos} minutos. La activacion del Codigo Infarto corresponde al
              medico tras interpretar el ECG e integrar el diagnostico.
            </p>
          </TarjetaPublica>
          <TarjetaPublica titulo="Estados independientes">
            <p className="text-sm leading-llano text-texto-suave">
              El episodio clinico avanza por su cuenta. El estado de identidad —provisional, confirmada o
              en conflicto— cambia por separado y no detiene ninguna transicion clinica. Cada cambio
              conserva actor, hora, motivo y estado anterior.
            </p>
          </TarjetaPublica>
          <TarjetaPublica titulo="Lo que el escaneo no hace">
            <p className="text-sm leading-llano text-texto-suave">
              Un resultado biometrico no genera diagnostico, no prescribe tratamiento y no activa
              hemodinamia. La decision clinica se queda con el medico y el sistema solo la registra.
            </p>
          </TarjetaPublica>
        </div>
      </BandaPublica>

      {/* ---------------------------------------------------------- el recorrido */}
      <BandaPublica
        id="recorrido"
        rotulo="como opera"
        titulo="Cinco momentos, con su reloj y su responsable"
        descripcion="Cada paso guarda hora de ocurrencia y hora de captura por separado, para que una captura tardia no falsee los indicadores."
      >
        <ol className="space-y-4">
          {PASOS.map((p) => (
            <li key={p.n}>
              <TarjetaPublica className="flex flex-wrap items-start gap-4">
                <p.Icono className="mt-0.5 size-5 shrink-0 text-texto" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-texto">
                    <span className="mr-2 tabular-nums text-texto-suave">{p.n}.</span>
                    {p.titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-llano text-texto-suave">{p.detalle}</p>
                  <p className="mt-2 font-mono text-xs text-texto-suave">{p.requisitos}</p>
                </div>
              </TarjetaPublica>
            </li>
          ))}
        </ol>
      </BandaPublica>

      {/* ------------------------------------------------------ limite identidad */}
      <BandaPublica
        id="identidad"
        rotulo="el limite que cambia el alcance"
        titulo="World ID no identifica a un paciente inconsciente"
        descripcion="Es la conclusion tecnica con mas consecuencias del documento, y conviene decirla antes de que alguien la descubra a mitad del piloto."
        Icono={Fingerprint}
        fondo="sutil"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TarjetaPublica titulo="Lo que World ID si hace">
            <p className="text-sm leading-llano text-texto-suave">
              Demuestra humanidad y unicidad de forma anonima. No entrega nombre ni expediente, y el
              flujo publico requiere que la persona use su aplicacion y comparta una prueba. Puede servir
              como factor voluntario <strong>si antes se vinculo</strong> con el identificador del
              paciente del hospital.
            </p>
          </TarjetaPublica>
          <TarjetaPublica titulo="Lo que hace falta y no existe todavia">
            <p className="text-sm leading-llano text-texto-suave">
              Reconocer a quien no puede participar exige un motor de busqueda 1:N contratado, validado y
              autorizado, con pruebas de falsos positivos y negativos en poblacion y condiciones reales.
              Un nullifier de un solo uso no sirve como llave persistente de recuperacion del expediente.
            </p>
          </TarjetaPublica>
          <TarjetaPublica titulo="Mientras no exista" className="md:col-span-2">
            <p className="text-sm leading-llano text-texto-suave">
              Se atiende con identificador temporal y se concilia despues. En un paciente que no puede
              confirmar su identidad, incluso un unico candidato permanece <strong>provisional</strong>:
              no se fusionan episodios ni se escriben datos sobre un expediente candidato hasta resolver
              la identidad. Ese comportamiento es lo que el prototipo demuestra.
            </p>
          </TarjetaPublica>
        </div>
      </BandaPublica>

      {/* ----------------------------------------------------- que se demuestra */}
      <BandaPublica
        id="prototipo"
        rotulo="el prototipo"
        titulo="Lo que se puede comprobar en pantalla, y lo que no"
        descripcion="Cada afirmacion de la izquierda se verifica en menos de un minuto usando la demostracion. Las de la derecha no se pueden verificar aqui, y por eso estan escritas con el mismo tamaño."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="rotulo mb-4">se demuestra en el comportamiento</h3>
            <ul className="space-y-3">
              {DEMOSTRABLE.map((d) => (
                <li key={d.titulo}>
                  <TarjetaPublica className="flex items-start gap-3">
                    <d.Icono className="mt-0.5 size-5 shrink-0 text-texto" aria-hidden />
                    <div>
                      <h4 className="text-sm font-medium text-texto">{d.titulo}</h4>
                      <p className="mt-1 text-sm leading-llano text-texto-suave">{d.detalle}</p>
                      <p className="mt-1.5 font-mono text-xs text-texto-suave">{d.prueba}</p>
                    </div>
                  </TarjetaPublica>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="rotulo mb-4">no se demuestra aqui</h3>
            <ul className="space-y-3">
              {NO_DEMOSTRABLE.map((n) => (
                <li key={n}>
                  <div className="flex items-start gap-3 rounded bg-aviso-suave p-4">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden />
                    <p className="text-sm leading-llano text-aviso">{n}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </BandaPublica>

      {/* --------------------------------------------------------- que falta */}
      <BandaPublica
        id="pendiente"
        rotulo="fase 0"
        titulo="Cinco decisiones que bloquean el desarrollo integrado"
        descripcion="No son detalles de implementacion: cada una cambia el diseño, el alcance o la legalidad del piloto. Mientras esten abiertas, lo que se puede construir es esto."
        fondo="sutil"
      >
        <ol className="space-y-3">
          {DECISIONES_ABIERTAS.map((d, i) => (
            <li key={d.clave}>
              <TarjetaPublica className="flex flex-wrap items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-aviso-suave font-medium tabular-nums text-aviso">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-texto">{d.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-llano text-texto-suave">{d.detalle}</p>
                </div>
              </TarjetaPublica>
            </li>
          ))}
        </ol>

      </BandaPublica>

      {/* ------------------------------------------------------------ preguntas */}
      <BandaPublica
        id="preguntas"
        rotulo="preguntas frecuentes"
        titulo="Lo que preguntan en la primera reunion"
        descripcion="Respuestas cortas. El detalle de cada una esta en la ERS y en la trazabilidad por requisito."
      >
        <div className="divide-y divide-borde-suave border-y border-borde-suave">
          {PREGUNTAS.map((q) => (
            <details key={q.p} className="group">
              <summary className="flex min-h-control cursor-pointer items-center justify-between gap-4 py-5 text-left text-base font-medium text-texto transition-colors hover:text-texto-suave">
                {q.p}
                <ChevronDown
                  className="size-5 shrink-0 text-texto-suave transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="max-w-3xl pb-5 text-sm leading-llano text-texto-suave">{q.r}</p>
            </details>
          ))}
        </div>
      </BandaPublica>

      {/* --------------------------------------------------------------- cierre */}
      <section aria-labelledby="cierre-titulo" className="bg-texto text-primario-texto">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:py-seccion-lg md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 id="cierre-titulo" className="titulo text-3xl">
              Recorra el sistema con el perfil que le toca revisar
            </h2>
            <p className="mt-3 text-base leading-llano text-primario-texto/85">
              {TODOS_LOS_ROLES.length} cuentas de demostracion, una por actor de la ERS.{' '}
              {INSTITUCION.puntosDeControl} puntos de control propuestos: {INSTITUCION.lectoresEscritorio}{' '}
              lectores de escritorio y {INSTITUCION.camarasAltaConcurrencia} camara de alta concurrencia, sin
              compra ni prueba de compatibilidad.
            </p>
          </div>
          <Link
            href="/acceso"
            className="control inline-flex shrink-0 items-center justify-center gap-2 rounded bg-primario px-6 text-sm font-medium text-primario-texto transition-colors hover:bg-primario-oscuro sm:w-52"
          >
            <LockKeyhole className="size-4" aria-hidden />
            Iniciar sesion
          </Link>
        </div>
      </section>
    </MarcoPublico>
  );
}
