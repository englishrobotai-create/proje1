import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@ornek.com" },
    update: {},
    create: {
      email: "admin@ornek.com",
      name: "Site Yöneticisi",
      passwordHash,
    },
  });

  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      siteTitle: "Kutlu Mali Müşavirlik",
    },
  });

  const existing = await prisma.post.count();
  if (existing === 0) {
    await prisma.post.createMany({
      data: [
        {
          title: "2026 Vergi Takviminde Dikkat Edilecekler",
          slug: "2026-vergi-takviminde-dikkat-edilecekler",
          excerpt:
            "Yıl boyunca kaçırılmaması gereken beyan ve ödeme tarihlerini özetledik.",
          content: `Vergi yükümlülüklerini zamanında yerine getirmek, hem ceza riskini azaltır hem de işletme nakit akışını düzenler.

Bu yazıda e-defter, KDV, muhtasar ve yıllık gelir vergisi takvimine dair pratik hatırlatmalar bulacaksınız.

Önerimiz: kritik tarihler için takvim hatırlatması kurun ve belgelerinizi dönem sonunu beklemeden hazırlayın.`,
          published: true,
        },
        {
          title: "Şirket Kuruluşunda En Sık Yapılan 5 Hata",
          slug: "sirket-kurulusunda-en-sik-yapilan-5-hata",
          excerpt:
            "Yanlış ortaklık yapısı ve eksik belge, sonradan pahalıya mal olabilir.",
          content: `Şirket kuruluşu heyecan verici bir adımdır; ancak aceleyle alınan kararlar uzun vadede maliyet doğurabilir.

En sık görülen hatalar:
1. Yanlış şirket türü seçimi
2. Ortaklık sözleşmesinin eksik bırakılması
3. NACE kodlarının hatalı belirlenmesi
4. Sermaye ve banka süreçlerinin ertelenmesi
5. Muhasebe altyapısının sonraya bırakılması

Kuruluş öncesi kısa bir mali müşavir görüşmesi, bu risklerin çoğunu ortadan kaldırır.`,
          published: true,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
