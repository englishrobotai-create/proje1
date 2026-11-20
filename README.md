# Proje1 — Mali Müşavir Web Sitesi

Ayrı kopya modeliyle satılmak üzere hazırlanmış Next.js mali müşavir sitesi.

## Özellikler

- Kurumsal vitrin: Ana sayfa, Hakkımda, Hizmetler, Blog, İletişim
- Admin paneli (`/admin/giris`)
- Blog yazısı ekleme / düzenleme / silme; yazı içinde başlık (`##`, `###`), liste, **kalın** ve bağlantı yazılabilir
- Blog için SEO: sabit yazı adresi (başlık değişince değişmez; elle değiştirilirse eski adres yönlenir), yazıya özel SEO başlığı/açıklaması, yazar, ilk yayın tarihi, otomatik paylaşım görseli (WhatsApp/LinkedIn/X), `BlogPosting` şeması, ilgili yazılar, `/blog/feed.xml` RSS beslemesi
- Site başlığını değiştirme
- Admin > Özet'te “Canlıya hazırlık” kutusu: varsayılan şifre, yer tutucu başlık/iletişim bilgisi, örnek blog yazıları, örnek fotoğraf ve eksik ayarları listeler
- Görüşme talebi formu (konu, ulaşma şekli ve zaman seçimi) ve gelen mesajları panelde görme
- Yeni mesaj gelince ofisin e-postasına bildirim (SMTP; isteğe bağlı, aşağıya bakın)
- KVKK aydınlatma metni sayfası (`/kvkk`); form altından bağlanır, müşteriye özel alanlar Admin > KVKK Metni'nden düzenlenir
- Mükellef Köşesi (isteğe bağlı, varsayılan KAPALI; Admin > Mükellefler'den açılır): mükellefin kendi şifresiyle girip ofise mesaj (başlık + açıklama, isteğe bağlı ek dosya) ve belge gönderdiği, ofisin de aynı şekilde mesaj/tahakkuk/beyanname gibi dosyalar ilettiği, "eksik belgeler" listesi ve "hesap ekstresi" (ücret/ödeme dökümü) bölümü; e-posta bildirimleri (aşağıya bakın)
- Admin > İletişim'de "Mesleki bilgiler" (oda, sicil no, üniversite vb.); Hakkımda ve İletişim sayfalarında görünür

## Kurulum

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

`DATABASE_URL` bir **PostgreSQL** bağlantı adresi olmalıdır (yerelde Docker/PostgreSQL ya da ücretsiz bir Neon/Supabase veritabanı). Eski SQLite (`file:./dev.db`) artık desteklenmez.

Site: [http://localhost:3000](http://localhost:3000)  
Admin: [http://localhost:3000/admin/giris](http://localhost:3000/admin/giris)  
İlk kurulum (hiç yönetici yokken): [http://localhost:3000/admin/kurulum](http://localhost:3000/admin/kurulum)

### İlk yönetici

Veritabanında hiç kullanıcı yoksa `/admin/giris` sizi `/admin/kurulum` sayfasına yönlendirir. Orada kendi e-posta ve şifrenizle (en az 10 karakter) ilk hesabı oluşturursunuz; tarayıcı yeterlidir, bilgisayarda `npm run db:seed` şart değildir.

`npm run db:setup` / `db:seed` hâlâ örnek içerik (hizmetler, örnek blog) için kullanılabilir; seed yalnızca hiç kullanıcı yokken varsayılan yöneticiyi de ekler (`admin@ornek.com` / `Admin123!`). Canlıda seed ile varsayılan şifre bırakmayın; web kurulumunu tercih edin. Yönetici girişi deneme sınırlıdır (IP başına 15 dakikada 20, e-posta başına 8 deneme).

`.env` içindeki `AUTH_SECRET` değerini her müşteri kopyasında yenileyin (örn. `openssl rand -base64 32`; Windows'ta `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Canlıda (`NODE_ENV=production` ve `SITE_URL` localhost değilken) örnek değerle ya da 32 karakterden kısa bir `AUTH_SECRET` ile yönetici ve mükellef girişi çalışmaz; uygulama açık bir hata verir.

## Vercel'e yayın

Proje Vercel'de çalışır; SQLite yerine PostgreSQL, diske yazma yerine Vercel Blob kullanır.

1. **Veritabanı:** Vercel projesinde *Storage* sekmesinden bir Postgres (Neon) ekleyin. `DATABASE_URL` (ve havuzsuz `DATABASE_URL_UNPOOLED`) otomatik eklenir. Üretim derlemesi şemayı `prisma db push` ile kendisi oluşturur/günceller (`scripts/vercel-db-sync.mjs`); önizleme derlemeleri şemaya dokunmaz.
2. **Dosyalar:** *Storage* sekmesinden **Private** bir Blob mağazası ekleyin (`BLOB_READ_WRITE_TOKEN` otomatik eklenir). Mükellef belgeleri gizli olduğundan mağaza mutlaka *private* olmalıdır. Vercel işlevlerinin istek gövdesi sınırı 4,5 MB olduğu için burada tek dosya en çok **4 MB** yüklenebilir (daha büyük dosyalar için doğrudan istemci yüklemesi gerekir).
3. **Ortam değişkenleri:** `AUTH_SECRET` (en az 32 karakter, rastgele) ve `SITE_URL` (örn. `https://musteri-alanadi.com`) değerlerini *Settings > Environment Variables* bölümüne ekleyin; SMTP değişkenleri isteğe bağlıdır (`.env.example`).
4. **İlk yönetici hesabı:** Siteyi açıp `/admin/kurulum` adresine gidin (veya `/admin/giris` — yönlendirir). Kendi e-posta ve şifrenizle hesabı oluşturun. Bilgisayarda komut çalıştırmanız gerekmez.
   İsteğe bağlı: örnek blog/hizmet içeriği için bir kez `npm run db:seed` (Hakkımda/İletişim metinlerini varsayılana döndürür; canlı özelleştirmeden sonra tekrar çalıştırmayın).

Vercel dışında (VPS, yerel) `BLOB_READ_WRITE_TOKEN` tanımlı değilse dosyalar diskte tutulur (`PORTAL_STORAGE_DIR`, `SITE_STORAGE_DIR`), şemayı `npm run db:setup` kurar.

## Müşteriye teslim (ayrı kopya)

1. Bu projeyi kopyalayın
2. Yeni `.env` oluşturun (`AUTH_SECRET` ve müşterinin alan adıyla `SITE_URL` değerlerini yazın)
3. `npm install` ve `npm run db:setup` çalıştırın
4. Hostinge alın (`npm run build` + `npm run start`)
5. Admin şifresini (Admin > Hesabım) ve site başlığını / logosunu / başlık yazı tipi-boyutunu (Admin > Ayarlar) müşteriyle güncelleyin. Varsayılan başlık "SMMM Ad Soyad" yer tutucudur; müşterinin gerçek adı yazılmadan yayına almayın. Logo yüklenmezse `public/smmm.png` kullanılır; yüklenen logo `SITE_STORAGE_DIR` (boşsa `./storage/site`) altında tutulur. Dikkat: `npm run db:seed` Hakkımda/İletişim metinlerini ve başlığı varsayılana geri yazar; müşterinin sitesi özelleştirildikten sonra seed'i yeniden çalıştırmayın
6. Yer tutucu iletişim bilgilerini (e-posta, telefon, adres) ve hizmet/hakkında metinlerini müşteriye özel yazın; yer tutucular arama motorlarına verilmez ama sitede görünür; Admin > Özet'teki “Canlıya hazırlık” kutusu bunlardan hangilerinin kaldığını gösterir. Sosyal medya simgeleri gerçek bir adres girilene kadar sitede gösterilmez (Admin > Sosyal Medya)
7. Admin > Hizmetler'den "Nasıl çalışıyoruz" adımlarını müşterinin kendi çalışma düzenine göre yazın
8. Admin > İletişim > Mesleki Bilgiler'i müşterinin bilgileriyle doldurun. SMMM/YMM Haksız Rekabet ve Reklam Yasağı Yönetmeliği'nin 22. maddesi sitede bu bilgilerin bulunmasını, sitenin odaya bildirilmesini ve meslek unvanı uzantılı bir `.tr` alan adı kullanılmasını ister. Kuralın müşteriye nasıl uygulandığını müşterinin bağlı olduğu oda doğrulamalıdır; bu proje bir uygunluk garantisi vermez.
9. E-posta bildirimi için `.env` içine `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (ve gerekirse `MAIL_FROM`, `NOTIFY_EMAIL`) yazın; ayrıntılar `.env.example` içinde. Ardından Admin > Mesajlar'daki "Test e-postası gönder" düğmesiyle deneyin. SMTP tanımlı değilse bildirim kapalıdır, mesajlar yine panelde görünür. İletişim sayfasındaki e-posta yer tutucu (`ornek-mm.com`) kalırsa bildirim gönderilmez.
10. Admin > KVKK Metni'ni gözden geçirin: saklama süresi, verilerin aktarımı ve (varsa) KEP adresini müşterinin gerçek uygulamasına göre yazın. Metin genel bir şablondur, hukuki görüş değildir; müşterinin bir hukukçuya göstermesi önerilir. Sitede şu an analiz/reklam çerezi yoktur ve metindeki çerez bölümü buna göre yazılmıştır; analiz veya reklam kodu eklenirse bu bölümü ve onay mekanizmasını güncelleyin.
11. Sitedeki butonlarda "ücretsiz" gibi ifadeler kullanmayın; metinleri müşteriye özel yazarken bu kural göz önünde olsun

12. Örnek blog yazılarını ("2026 Vergi Takvimi", "Şirket Kuruluşu") silin veya müşterinin kendi yazılarıyla değiştirin. İkisi de çok kısa örnek metindir; olduğu gibi yayında kalırsa ince içerik olarak değerlendirilebilir ve yanlış/eski bilgi taşıyabilir.
13. Blog yazarken: başlığa müşterinin gerçekten aranacak konusunu koyun (örn. "Limited şirket kuruluş maliyeti"), özetin ilk cümlesinde ana fikri verin, uzun yazıda `##` ara başlıklar kullanın, ilgili hizmet/iletişim sayfasına `[metin](/iletisim)` ile bağlantı verin, kuralları ve tarihleri resmî kaynaktan doğrulayıp kaynağı yazıda belirtin. Düzenli ve özgün yazı, teknik ayarlardan daha çok etkiler; ayarlar yalnızca engel olmamasını sağlar.
14. Paylaşım görselleri `src/assets/og-fonts/` içindeki yazı tipiyle (Newsreader, SIL OFL) sunucuda üretilir; bu klasör projeyle birlikte yayına alınmalıdır. `SITE_URL` tanımlı değilse görsel, canonical ve sitemap adresleri üretilmez.
15a. Hakkımda sayfası fotoğrafı (Admin > Hakkımda > Fotoğraf): site sahibi kendi fotoğrafını yükleyebilir (JPG/PNG/WebP, en çok 4 MB; dosya olduğu gibi sunulur, yeniden boyutlandırılmaz) ya da sayfada hiç fotoğraf göstermemeyi seçebilir. Hiç yüklenmemişse örnek bir illüstrasyon (`public/ornek-profil.webp`) görünür; **müşteriye teslimde kendi fotoğrafıyla değiştirtin ya da gizletin**. Yüklenen dosya `public/` dışında `SITE_STORAGE_DIR` (boşsa `./storage/site`) klasöründe durur; bu klasörü de yedekleyin (`/storage` zaten `.gitignore`'da). Gizlenen fotoğraf herkese açık adresten 404 verir. Durum bilgisi `Setting.aboutPhoto` sütununda tutulur ve ilk kullanımda kendiliğinden eklenir.
15. Mükellef Köşesi'ni kullanacaksanız (Admin > Mükellefler > "Mükellef Köşesi açık olsun"):
    - Belgeler web'den doğrudan erişilemeyen bir klasörde tutulur (`PORTAL_STORAGE_DIR`, boşsa `./storage/portal`). Bu klasörü **düzenli yedekleyin**, depoya (git) koymayın (`/storage` zaten `.gitignore`'da) ve sunucuda yalnızca uygulamayı çalıştıran kullanıcının okuyabildiği bir yere koyun.
    - Mesajlar iki yönlüdür: başlık zorunlu, açıklama ve ek dosya isteğe bağlıdır (ek olmadan da mesaj gönderilebilir). Ek olmayan mesajlar yalnızca veritabanında durur; "Yeni" rozeti, karşı taraf Mesajlar sekmesini/sayfasını açınca kalkar. Önceki sürümde oluşturulmuş veritabanlarına `PortalFile.body` sütunu ilk kullanımda kendiliğinden eklenir.
    - Tek dosya sınırı 25 MB (`PORTAL_MAX_UPLOAD_MB`, en çok 25), mükellef başına toplam alan 500 MB (`PORTAL_QUOTA_MB`). ZIP dosyası da kabul edilir (içeriği denetlenmez: indirip açmadan önce virüs taraması yapın). 25 MB'tan büyük dosyalar (örn. büyük e-defter arşivleri) bu sürümde desteklenmez; gerekirse parçalı yükleme eklenmelidir. Sunucu işlemi gövde sınırı `next.config.ts` içinde 27 MB'dır; **nginx/Apache gibi bir ters vekil kullanıyorsanız `client_max_body_size` değerini en az 27m yapın**, yoksa büyük yüklemeler uygulamaya ulaşmadan reddedilir.
    - Davet, şifre sıfırlama ve bildirim e-postaları için SMTP gerekir (9. madde). SMTP yoksa Admin > Mükellefler'de bağlantılar ekranda gösterilir ve mükellefe sizin iletmeniz gerekir; "Şifremi unuttum" sayfası bunu söyler.
    - Giriş denemeleri IP başına ve e-posta başına sınırlıdır; IP, `x-forwarded-for` başlığından okunur. Ters vekil arkasında bu başlığı **vekilin kendisinin yazdığından** (istemciden geleni ezdiğinden) emin olun.
    - **KVKK:** mükelleflerin belgeleri müşterinin (SMMM) sunucusunda saklanır; veri sorumlusu SMMM'dir. KVKK aydınlatma metnine ve mükelleflerle sözleşmeye bu saklamayı ekletin. Sunucuya erişebilen kişi (siz ya da barındırma firması) dosyalara teknik olarak erişebilir; bu durumda sizin veri işleyen konumunda olabileceğinizi ve müşteriyle bu konuda yazılı bir düzenleme yapmanız gerekebileceğini unutmayın. Bu bir hukuki görüş değildir; müşterinin bir hukukçuya danışması önerilir. Mesleki sır yükümlülüğü SMMM'dedir.
    - Sınırlar: beyanname GİB'e bu sistemden **gönderilmez** (yalnızca dosya iletilir); yüklenen dosyalar virüs taramasından geçmez (yalnızca uzantı + içerik imzası denetlenir); mükellef kendi gönderdiğini silemez (ofis siler); ofisten gelen mesajı "Sil" ile yalnızca kendi listesinden kaldırabilir (ofiste kayıt durur, ofis ekranında "mükellef listesinden sildi" notu görünür); hesap ekstresi bilgi amaçlıdır, fatura/makbuz yerine geçmez; ofis tarafında tek yönetici hesabı vardır (işlem geçmişi/denetim kaydı tutulmaz).

Not: `package.json`'a `nodemailer` eklendi; mevcut kopyalarda `npm install` çalıştırın.

Not: "Nasıl çalışıyoruz" metni `Setting` tablosundaki `servicesProcess` sütununda tutulur. Mesleki bilgiler `professionalInfo`, KVKK alanları `kvkkInfo` sütununda (JSON) tutulur. Blog yazılarının `seoTitle`, `seoDescription`, `slugHistory`, `publishedAt`, `authorName` alanları `Post` tablosundadır. Sütunlar şemada tanımlıdır ve `prisma db push` ile oluşturulur.

Not: Mükellef Köşesi tabloları (`Mukellef`, `PortalToken`, `PortalFile`, `DocRequest`, `LedgerEntry`) ve `Setting.portalEnabled` sütunu da şemada (`prisma/schema.prisma`) tanımlıdır ve `prisma db push` ile oluşturulur. Mükellef oturumu yönetici oturumundan ayrıdır: ayrı çerez (`mm_mukellef`, yalnızca `/mukellef` yoluna gider), `AUTH_SECRET`'tan türetilmiş ayrı imza anahtarı; yönetici ve mükellef oturumları birbirine yetki vermez. `AUTH_SECRET`'ı değiştirmek tüm mükellef oturumlarını da düşürür.
