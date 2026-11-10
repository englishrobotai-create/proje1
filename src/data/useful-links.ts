export type UsefulLink = {
  title: string;
  href: string;
  description: string;
};

export type UsefulLinkGroup = {
  category: string;
  links: UsefulLink[];
};

export const usefulLinkGroups: UsefulLinkGroup[] = [
  {
    category: "Vergi ve Gelir İdaresi",
    links: [
      {
        title: "Gelir İdaresi Başkanlığı",
        href: "https://www.gib.gov.tr",
        description: "Resmi duyurular, mevzuat ve vergi bilgilendirmeleri.",
      },
      {
        title: "İnteraktif Vergi Dairesi",
        href: "https://ivd.gib.gov.tr",
        description: "Borç sorgulama, ödeme ve vergi işlemleri.",
      },
      {
        title: "Dijital Vergi Dairesi",
        href: "https://dijital.gib.gov.tr",
        description: "Yeni nesil GİB dijital hizmetler portalı.",
      },
      {
        title: "e-Beyanname",
        href: "https://ebeyanname.gib.gov.tr",
        description: "Beyanname gönderme ve kontrol işlemleri.",
      },
      {
        title: "e-Fatura Portalı",
        href: "https://efatura.gib.gov.tr",
        description: "e-Fatura mükellefiyet ve belge süreçleri.",
      },
      {
        title: "e-Defter",
        href: "https://www.edefter.gov.tr",
        description: "Elektronik defter oluşturma ve berat yükleme.",
      },
      {
        title: "e-Arşiv Fatura",
        href: "https://earsivportal.efatura.gov.tr",
        description: "e-Arşiv fatura düzenleme ve sorgulama.",
      },
      {
        title: "Hazır Beyan Sistemi",
        href: "https://hazirbeyan.gib.gov.tr",
        description: "Gelir vergisi hazır beyan işlemleri.",
      },
    ],
  },
  {
    category: "SGK ve Çalışma Hayatı",
    links: [
      {
        title: "Sosyal Güvenlik Kurumu",
        href: "https://www.sgk.gov.tr",
        description: "SGK duyuruları ve genel bilgilendirme.",
      },
      {
        title: "e-SGK / e-Bildirge",
        href: "https://ebildirge.sgk.gov.tr",
        description: "Aylık prim ve hizmet belgesi işlemleri.",
      },
      {
        title: "İŞKUR",
        href: "https://www.iskur.gov.tr",
        description: "İstihdam teşvikleri ve işgücü hizmetleri.",
      },
      {
        title: "Çalışma ve Sosyal Güvenlik Bakanlığı",
        href: "https://www.csgb.gov.tr",
        description: "İş hukuku ve çalışma mevzuatı.",
      },
      {
        title: "Alo 170",
        href: "https://www.alo170.gov.tr",
        description: "Çalışma hayatı bilgilendirme hattı.",
      },
      {
        title: "Kariyer Kapısı",
        href: "https://isealimkariyerkapisi.cbiko.gov.tr",
        description: "Kamu istihdam ilanları ve başvurular.",
      },
    ],
  },
  {
    category: "e-Devlet ve Resmi İşlemler",
    links: [
      {
        title: "e-Devlet Kapısı",
        href: "https://www.turkiye.gov.tr",
        description: "Kimlik, vergi, SGK ve resmi hizmetler.",
      },
      {
        title: "Resmî Gazete",
        href: "https://www.resmigazete.gov.tr",
        description: "Yayımlanan kanun, tebliğ ve yönetmelikler.",
      },
      {
        title: "Mevzuat Bilgi Sistemi",
        href: "https://www.mevzuat.gov.tr",
        description: "Güncel mevzuat metinlerine erişim.",
      },
      {
        title: "UYAP Vatandaş Portal",
        href: "https://vatandas.uyap.gov.tr",
        description: "Dava ve icra dosyası sorgulama.",
      },
      {
        title: "MERSİS",
        href: "https://mersis.ticaret.gov.tr",
        description: "Ticaret sicili ve şirket sorgulama.",
      },
      {
        title: "Ticaret Bakanlığı",
        href: "https://www.ticaret.gov.tr",
        description: "Ticaret, gümrük ve şirket düzenlemeleri.",
      },
    ],
  },
  {
    category: "Bankacılık, Finans ve Ekonomi",
    links: [
      {
        title: "TCMB",
        href: "https://www.tcmb.gov.tr",
        description: "Kurlar, faiz ve merkez bankası duyuruları.",
      },
      {
        title: "Hazine ve Maliye Bakanlığı",
        href: "https://www.hmb.gov.tr",
        description: "Maliye politikası ve kamu maliyesi.",
      },
      {
        title: "BDDK",
        href: "https://www.bddk.org.tr",
        description: "Bankacılık düzenleme ve denetleme.",
      },
      {
        title: "SPK",
        href: "https://www.spk.gov.tr",
        description: "Sermaye piyasası mevzuatı.",
      },
      {
        title: "KAP",
        href: "https://www.kap.org.tr",
        description: "Kamuyu aydınlatma platformu.",
      },
      {
        title: "TÜİK",
        href: "https://www.tuik.gov.tr",
        description: "Enflasyon, istihdam ve istatistikler.",
      },
    ],
  },
  {
    category: "Meslek ve Sektör Kaynakları",
    links: [
      {
        title: "TÜRMOB",
        href: "https://www.turmob.org.tr",
        description: "Mali müşavirlik meslek örgütü.",
      },
      {
        title: "İSMMMO",
        href: "https://www.ismmmo.org.tr",
        description: "İstanbul SMMM Odası kaynakları.",
      },
      {
        title: "Ankara SMMM Odası",
        href: "https://www.asmmmo.org.tr",
        description: "Ankara oda duyuruları ve eğitimler.",
      },
      {
        title: "TESMER",
        href: "https://www.tesmer.org.tr",
        description: "Staj ve mesleki eğitim süreçleri.",
      },
      {
        title: "KGK",
        href: "https://www.kgk.gov.tr",
        description: "Kamu Gözetimi, Muhasebe ve Denetim.",
      },
      {
        title: "TOBB",
        href: "https://www.tobb.org.tr",
        description: "Ticaret odaları ve iş dünyası.",
      },
    ],
  },
  {
    category: "Şirket, Teşvik ve Uygulama",
    links: [
      {
        title: "KOSGEB",
        href: "https://www.kosgeb.gov.tr",
        description: "KOBİ destek ve teşvik programları.",
      },
      {
        title: "Yatırım Teşvik Sistemi",
        href: "https://www.sanayi.gov.tr",
        description: "Sanayi ve yatırım teşvik bilgileri.",
      },
      {
        title: "KAPİTAL / Şirket İşlemleri Rehberi",
        href: "https://www.ticaret.gov.tr/sirketler",
        description: "Şirket kuruluş ve işlem rehberleri.",
      },
      {
        title: "Gümrükler Genel Müdürlüğü",
        href: "https://gumrukler.ticaret.gov.tr",
        description: "İthalat-ihracat ve gümrük işlemleri.",
      },
      {
        title: "e-İmza / Kamu SM",
        href: "https://kamusm.gov.tr",
        description: "Elektronik imza ve sertifika işlemleri.",
      },
      {
        title: "KEP Rehberi",
        href: "https://www.pttem.gov.tr",
        description: "Kayıtlı elektronik posta bilgilendirmesi.",
      },
    ],
  },
];

export const usefulLinkCount = usefulLinkGroups.reduce(
  (total, group) => total + group.links.length,
  0,
);
