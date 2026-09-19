import type { Metadata, Viewport } from 'next';
import './globals.css';
import { INSTITUCION } from '@/lib/datos/institucion';

export const metadata: Metadata = {
  title: `${INSTITUCION.marca} · propuesta tecnica`,
  description:
    'Prototipo navegable de identificacion del paciente y orquestacion del Codigo Infarto. Datos sinteticos, sin integraciones reales.',
  // El prototipo no se indexa: una pantalla de urgencias con aspecto funcional circulando
  // sin contexto es un riesgo de interpretacion, no de datos.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  /*
   * Un solo esquema, claro. La paleta esta medida contra WCAG 2.1 AA y no tiene variante
   * oscura: inventarla romperia esa garantia en silencio.
   */
  colorScheme: 'light',
  /*
   * La barra del navegador en Android y la de iOS en modo standalone toman este color. Es el
   * verde azulado del sitio publico, porque quien abre esta direccion sin contexto ve la
   * propuesta, no el sistema.
   *
   * El panel administrado lo pisa con el azul institucional en `app/(app)/layout.tsx`: un
   * `viewport` de segmento anidado gana sobre el de la raiz. Sin eso, urgencias tendria el
   * marco del navegador en verde sobre una aplicacion azul.
   */
  themeColor: '#0f5257',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
