import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// POST seed default CMS content
export async function POST(request: Request) {
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Seed default settings
    const defaultSettings = [
      { key: 'logo_url', value: '/logo1.webp', type: 'image' },
      { key: 'site_title', value: 'IDM League', type: 'text' },
      { key: 'hero_title', value: 'Idol Meta', type: 'text' },
      { key: 'hero_subtitle', value: 'Fan Made Edition', type: 'text' },
      { key: 'hero_tagline', value: 'Tempat dancer terbaik berkompetisi. Tournament mingguan, tarkam profesional, dan podium yang menunggu.', type: 'text' },
      { key: 'hero_bg_desktop', value: '/bg-default.jpg', type: 'image' },
      { key: 'hero_bg_mobile', value: '/bg-mobiledefault.jpg', type: 'image' },
      { key: 'nav_cta_male_text', value: 'MALE DIVISION', type: 'text' },
      { key: 'nav_cta_female_text', value: 'FEMALE DIVISION', type: 'text' },
      { key: 'footer_text', value: '© 2026 IDM League — Idol Meta Fan Made Edition. All rights reserved.', type: 'text' },
      { key: 'footer_tagline', value: 'Dance. Compete. Dominate.', type: 'text' },
      { key: 'about_origin_story', value: 'Idol Meta dari Lyto Game — sebuah rhythm game yang menghidupkan panggung virtual. Kami para pemainnya, bermain setiap hari, menari, dan berkompetisi. Tapi lama-kelamaan, rutinitas tanpa tujuan terasa hampa. Tidak ada motivasi, tidak ada sesuatu yang kita kejar bersama.\n\nGame yang kami cintai mulai sepi. Player datang dan pergi tanpa alasan untuk bertahan. Lalu muncul sebuah pertanyaan sederhana: "Kenapa tidak kita buat sendiri alasan untuk terus bermain?"\n\nDari situlah IDM League lahir — bukan dari perusahaan, bukan dari sponsor besar, tapi dari komunitas pemain yang tidak ingin gamenya mati.', type: 'text' },
      { key: 'about_season1_text', value: 'Tahun 2025, Tarkam IDM Season 1 telah digelar dan berjalan sangat baik. Club-club bertarung, peserta bebas mix dari divisi male dan female, dan champion pun dinobatkan. Sambil menunggu dana terkumpul untuk season berikutnya, kami menyelenggarakan Weekly Tournament sebagai ajang berlatih dan bersaing secara individu.', type: 'text' },
      { key: 'about_tagline', value: 'By Players, For Players', type: 'text' },
      { key: 'social_discord_url', value: '#', type: 'text' },
      { key: 'social_instagram_url', value: '#', type: 'text' },
      { key: 'social_youtube_url', value: '#', type: 'text' },
      { key: 'social_whatsapp_url', value: '#', type: 'text' },
      { key: 'donation_qris_image', value: '', type: 'image' },
      { key: 'donation_dana_number', value: '', type: 'text' },
      { key: 'donation_ovo_number', value: '', type: 'text' },
      { key: 'donation_shopeepay_number', value: '', type: 'text' },
      { key: 'donation_payment_holder', value: '', type: 'text' },
      { key: 'donation_payment_notes', value: '', type: 'text' },
      // Registration payment settings
      { key: 'registration_admin_wa_link', value: '', type: 'text' },
      { key: 'registration_payment_instructions', value: 'Silakan transfer biaya pendaftaran sesuai ketentuan yang berlaku ke salah satu metode pembayaran di atas, lalu kirim bukti pembayaran ke admin via WhatsApp.', type: 'text' },
      // Cara Bermain (How It Works) settings
      { key: 'howitworks_label', value: 'Cara Bermain', type: 'text' },
      { key: 'howitworks_title', value: 'Bagaimana Cara Kerjanya?', type: 'text' },
      { key: 'howitworks_subtitle', value: 'Empat langkah sederhana untuk menjadi champion', type: 'text' },
      { key: 'howitworks_step_1_title', value: 'Daftar', type: 'text' },
      { key: 'howitworks_step_1_description', value: 'Daftar sebagai peserta dan pilih divisi Male atau Female', type: 'text' },
      { key: 'howitworks_step_2_title', value: 'Tarkam', type: 'text' },
      { key: 'howitworks_step_2_description', value: 'Ikuti tournament mingguan dan raih kemenangan', type: 'text' },
      { key: 'howitworks_step_3_title', value: 'Kumpulkan Poin', type: 'text' },
      { key: 'howitworks_step_3_description', value: 'Setiap kemenangan memberikan poin untuk peringkat', type: 'text' },
      { key: 'howitworks_step_4_title', value: 'Jadi Champion', type: 'text' },
      { key: 'howitworks_step_4_description', value: 'Raih gelar Season Champion dan MVP', type: 'text' },
      // CTA settings
      { key: 'cta_title', value: 'Siap Menjadi Champion?', type: 'text' },
      { key: 'cta_description', value: 'Bergabung sekarang dan tunjukkan skill-mu di arena Tarkam IDM. Ribuan pemain sudah menunggu!', type: 'text' },
      { key: 'cta_button_primary_text', value: 'Masuk Arena', type: 'text' },
      { key: 'cta_button_secondary_text', value: 'Daftar Sekarang', type: 'text' },
      { key: 'cta_badge_1_value', value: '12+', type: 'text' },
      { key: 'cta_badge_1_label', value: 'Club Terdaftar', type: 'text' },
      { key: 'cta_badge_2_value', value: '120+', type: 'text' },
      { key: 'cta_badge_2_label', value: 'Pemain Aktif', type: 'text' },
      { key: 'cta_badge_3_value', value: '2', type: 'text' },
      { key: 'cta_badge_3_label', value: 'Season', type: 'text' },
      // Background images — managed via admin CMS
      { key: 'bg_male', value: '/bg-male.jpg', type: 'image' },
      { key: 'bg_female', value: '/bg-female.jpg', type: 'image' },
      { key: 'bg_section', value: '/bg-section.jpg', type: 'image' },
    ];

    for (const s of defaultSettings) {
      await db.cmsSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, type: s.type },
        create: s,
      });
    }

    // Seed default sections
    const defaultSections = [
      { slug: 'header', title: 'Header', subtitle: 'Navigasi & Logo', description: 'Pengaturan header dan navigasi website', order: 1 },
      { slug: 'hero', title: 'Hero Section', subtitle: 'Landing Hero', description: 'Bagian utama hero di halaman landing', order: 2 },
      { slug: 'about', title: 'Dari Pemain, Untuk Pemain', subtitle: 'Cerita Kami', description: 'Bagaimana IDM League lahir dari semangat komunitas yang tidak ingin gamenya sepi', order: 3 },
      { slug: 'kompetisi', title: 'Kompetisi', subtitle: 'Tournament & Tarkam', description: 'Informasi tournament mingguan dan tarkam profesional', order: 4 },
      { slug: 'champions', title: 'Season Champion', subtitle: 'Aula Champion', description: 'Juara terbaru dari setiap divisi', order: 5 },
      { slug: 'mvp', title: 'MVP Arena', subtitle: 'Hall of Fame', description: 'Pemain terbaik dari setiap divisi', order: 6 },
      { slug: 'clubs', title: 'Club & Peserta', subtitle: 'Tarkam', description: 'Daftar club dan peserta tarkam', order: 7 },
      { slug: 'howitworks', title: 'Cara Bermain', subtitle: 'Panduan', description: 'Langkah-langkah cara bermain di IDM League', order: 8 },
      { slug: 'cta', title: 'Join Community', subtitle: 'Call to Action', description: 'Ajakan bergabung ke komunitas', order: 9 },
      { slug: 'footer', title: 'Footer', subtitle: 'Informasi', description: 'Bagian bawah website dengan informasi tambahan', order: 10 },
    ];

    for (const s of defaultSections) {
      await db.cmsSection.upsert({
        where: { slug: s.slug },
        update: { title: s.title, subtitle: s.subtitle, description: s.description, order: s.order },
        create: { ...s, isActive: true },
      });
    }

    // Migrate legacy e-wallet _image keys to _number keys
    for (const migration of [
      { from: 'donation_dana_image', to: 'donation_dana_number' },
      { from: 'donation_ovo_image', to: 'donation_ovo_number' },
      { from: 'donation_shopeepay_image', to: 'donation_shopeepay_number' },
    ]) {
      const oldSetting = await db.cmsSetting.findUnique({ where: { key: migration.from } });
      if (oldSetting && oldSetting.value) {
        // Check if it's a phone number (not a URL)
        const isPhoneNumber = oldSetting.value && !oldSetting.value.startsWith('http') && !oldSetting.value.startsWith('/');
        if (isPhoneNumber) {
          // Move value to new number key
          await db.cmsSetting.upsert({
            where: { key: migration.to },
            update: { value: oldSetting.value },
            create: { key: migration.to, value: oldSetting.value, type: 'text' },
          });
          // Clear the old image key
          await db.cmsSetting.update({ where: { key: migration.from }, data: { value: '' } });
        }
      }
    }

    // Remove legacy sections that are no longer on the landing page
    for (const legacySlug of ['gallery', 'sawer']) {
      const legacy = await db.cmsSection.findUnique({ where: { slug: legacySlug } });
      if (legacy) {
        await db.cmsCard.deleteMany({ where: { sectionId: legacy.id } });
        await db.cmsSection.delete({ where: { slug: legacySlug } });
      }
    }

    // Seed default cards for about section (3 milestones)
    const aboutSection = await db.cmsSection.findUnique({ where: { slug: 'about' } });
    if (aboutSection) {
      const existingCards = await db.cmsCard.count({ where: { sectionId: aboutSection.id } });
      if (existingCards === 0) {
        await db.cmsCard.createMany({
          data: [
            { sectionId: aboutSection.id, title: 'Komunitas', subtitle: 'Community', description: 'Pemain Idol Meta berkumpul, saling mengenal, dan membentuk ikatan', tag: 'milestone', tagColor: '#06b6d4', order: 1 },
            { sectionId: aboutSection.id, title: 'Turnamen', subtitle: 'Tournament', description: 'Weekly tournament sebagai ajang berlatih dan bersaing secara individu', tag: 'milestone', tagColor: '#d4a853', order: 2 },
            { sectionId: aboutSection.id, title: 'Tarkam IDM', subtitle: 'Tarkam', description: 'Season 1 sukses digelar — club bertanding, champion dinobatkan', tag: 'milestone', tagColor: '#a855f7', order: 3 },
          ],
        });
      }
    }

    // Seed default cards for hero section (hero badges)
    const heroSection = await db.cmsSection.findUnique({ where: { slug: 'hero' } });
    if (heroSection) {
      const existingCards = await db.cmsCard.count({ where: { sectionId: heroSection.id } });
      if (existingCards === 0) {
        await db.cmsCard.createMany({
          data: [
            { sectionId: heroSection.id, title: 'Season 1', tag: 'badge', tagColor: '#d4a853', order: 1 },
            { sectionId: heroSection.id, title: 'Dance Tournament', tag: 'badge', tagColor: '#d4a853', order: 2 },
            { sectionId: heroSection.id, title: 'Pro League', tag: 'badge', tagColor: '#d4a853', order: 3 },
          ],
        });
      }
    }

    // Seed default cards for CTA section
    const ctaSection = await db.cmsSection.findUnique({ where: { slug: 'cta' } });
    if (ctaSection) {
      const existingCards = await db.cmsCard.count({ where: { sectionId: ctaSection.id } });
      if (existingCards === 0) {
        await db.cmsCard.createMany({
          data: [
            { sectionId: ctaSection.id, title: 'WhatsApp Group', description: 'Bergabung dengan komunitas IDM League di WhatsApp', imageUrl: '', linkUrl: '#', tag: 'Community', tagColor: '#25D366', order: 1 },
            { sectionId: ctaSection.id, title: 'Discord Server', description: 'Chat dan diskusi di server Discord kami', imageUrl: '', linkUrl: '#', tag: 'Chat', tagColor: '#5865F2', order: 2 },
            { sectionId: ctaSection.id, title: 'Instagram', description: 'Follow Instagram untuk update terbaru', imageUrl: '', linkUrl: '#', tag: 'Social', tagColor: '#E4405F', order: 3 },
          ],
        });
      }
    }

    return NextResponse.json({ success: true, message: 'CMS content seeded successfully' });
  } catch (error) {
    console.error('CMS seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
