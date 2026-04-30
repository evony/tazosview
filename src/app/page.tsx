import { ClientApp } from '@/components/idm/client-app';

export const metadata = {
  title: 'TARKAM — Idol Meta Fan Made Edition',
  description: 'Komunitas Idol meta Indonesia. Turnamen mingguan, leaderboard, dan lebih banyak lagi.',
  openGraph: {
    title: 'TARKAM — Idol Meta Fan Made Edition',
    description: 'Komunitas Idol meta Indonesia',
    type: 'website',
  },
};

export default function Home() {
  return (
    <>
      {/* Preload hero background — browser starts downloading before JS loads */}
      <link
        rel="preload"
        as="image"
        href="https://res.cloudinary.com/dagoryri5/image/upload/f_auto,q_auto:eco,w_1920/v1777405283/cms/backgrounds/WhatsApp_Image_2026-04-29_at_02_25_43.jpg"
        fetchPriority="high"
      />
      <ClientApp />
    </>
  );
}
