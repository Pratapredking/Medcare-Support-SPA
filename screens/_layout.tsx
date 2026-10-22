import type { ReactNode } from 'react';

import { MedicalSupportProvider } from '@/context/medical-support';

export default function MedicalSupportLayout({ children }: { children: ReactNode }) {
  return <MedicalSupportProvider>{children}</MedicalSupportProvider>;
}
