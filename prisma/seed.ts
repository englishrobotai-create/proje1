import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from "../src/lib/default-admin";

const prisma = new PrismaClient();

async function main() {
  // Yönetici e-postası Admin > Hesabım'dan değiştirilebildiği için varsayılan yönetici yalnızca
  // hiç kullanıcı yoksa oluşturulur; aksi halde seed yeniden çalışınca varsayılan şifreli
  // ikinci bir yönetici doğardı.
  if ((await prisma.user.count()) === 0) {
    await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        name: "Site Yöneticisi",
        passwordHash: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
      },
    });
  }

  const siteTitle = "SMMM Ad Soyad";

  const aboutDefaults = {
    aboutIntro:
      "SMMM Ad Soyad, işletmelerin vergi ve muhasebe süreçlerini düzenli, anlaşılır ve denetlenebilir şekilde yönetmesi için kurulmuş bir mali müşavirlik ofisidir.",
    aboutApproachTitle: "Çalışma yaklaşımımız",
    aboutApproachText:
      "Her müşteriye aynı standart kaliteyi sunarız: net iletişim, zamanında teslim ve belgelenmiş süreçler. Amacımız yalnızca beyanları tamamlamak değil, işletmenizin mali kararlarını daha sağlam temellere oturtmaktır.",
    aboutScopeTitle: "Kimlerle çalışıyoruz",
    aboutScopeText:
      "Limited şirketler, anonim şirketler, şahıs işletmeleri ve serbest meslek sahipleriyle çalışıyoruz. Sektör fark etmeksizin ortak ihtiyacınız düzen ve güvenilir danışmanlıktır.",
    aboutPromiseTitle: "Ne vaat ediyoruz",
    aboutPromiseText:
      "Kaçırılmayan tarihler, anlaşılır raporlar ve ihtiyaç anında hızlı dönüş. Büyürken yanınızda duran bir mali iş ortağı olmayı hedefleriz.",
    contactHeroTitle: "Birlikte planlayalım",
    contactHeroText:
      "SMMM Ad Soyad ile görüşmek için formu doldurun. Mesajınız doğrudan ofisimize ulaşır.",
    contactEmail: "info@ornek-mm.com",
    contactPhone: "+90 (212) 000 00 00",
    contactAddress: "İstanbul, Türkiye",
    contactHours: "Hafta içi 09:00 – 18:00",
  };

  await prisma.setting.upsert({
    where: { id: "main" },
    update: {
      siteTitle,
      externalNewsUrl: "https://www.ozcankutlu.com/api/news",
      externalNewsLabel: "Güncel Mali Gelişmeler",
      ...aboutDefaults,
    },
    create: {
      id: "main",
      siteTitle,
      // Sosyal medya varsayılan olarak boş: gerçek adresler Admin > Sosyal Medya'dan girilir.
      facebook: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      youtube: "",
      whatsapp: "",
      externalNewsUrl: "https://www.ozcankutlu.com/api/news",
      externalNewsLabel: "Güncel Mali Gelişmeler",
      ...aboutDefaults,
    },
  });

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        {
          title: "Muhasebe ve defter tutma",
          description:
            "Günlük evrak takibi, e-defter/e-fatura süreçleri ve dönem sonu kapanışları.",
          sortOrder: 0,
        },
        {
          title: "Vergi danışmanlığı",
          description:
            "KDV, stopaj, kurumlar ve gelir vergisi planlaması ile beyan yönetimi.",
          sortOrder: 1,
        },
        {
          title: "Bordro ve SGK",
          description:
            "Personel bordrosu, bildirge ve işe giriş-çıkış işlemlerinin düzenli yürütülmesi.",
          sortOrder: 2,
        },
        {
          title: "Şirket kuruluşu",
          description:
            "Doğru şirket türü seçimi, kuruluş evrakları ve ilk dönem muhasebe kurulumu.",
          sortOrder: 3,
        },
        {
          title: "Mali analiz",
          description:
            "Dönemsel özetler, nakit akışı görünümü ve yönetim kararları için sade raporlar.",
          sortOrder: 4,
        },
        {
          title: "Denetim hazırlığı",
          description:
            "Kontroller öncesi belge düzeni, risk taraması ve süreç iyileştirme önerileri.",
          sortOrder: 5,
        },
      ],
    });
  }

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
