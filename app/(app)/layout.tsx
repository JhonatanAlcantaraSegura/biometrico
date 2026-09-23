import { GuardaSesion } from '@/components/layout/guarda-sesion';
import { Shell } from '@/components/layout/shell';

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <GuardaSesion>
      <Shell>{children}</Shell>
    </GuardaSesion>
  );
}
