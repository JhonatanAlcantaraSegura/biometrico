import type { Viewport } from 'next';
import { GuardaSesion } from '@/components/layout/guarda-sesion';
import { Shell } from '@/components/layout/shell';

/**
 * El marco del navegador vuelve al AZUL institucional dentro del sistema.
 *
 * La raiz declara el verde azulado porque su publico es el comite que lee la propuesta; de
 * aqui para adentro el publico es el personal de urgencias, y la aplicacion que va a ver es
 * azul. Un `viewport` de segmento anidado gana sobre el de la raiz, asi que esto basta para
 * que las dos mitades del producto tengan cada una su marco, sin condicionales en tiempo de
 * ejecucion.
 */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0b4f6c',
};

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <GuardaSesion>
      <Shell>{children}</Shell>
    </GuardaSesion>
  );
}
