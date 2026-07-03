'use client';

import { useRouter } from 'next/navigation';
import Storefront from '@/components/Storefront';
import WhatsAppSimulator from '@/components/WhatsAppSimulator';

export default function Home() {
  const router = useRouter();

  const handleOpenAdmin = () => {
    router.push('/admin');
  };

  return (
    <div className="app-shell">
      <Storefront onOpenAdmin={handleOpenAdmin} />
      <WhatsAppSimulator />
    </div>
  );
}
