# Proje1 — Mali Müşavir Web Sitesi

Ayrı kopya modeliyle satılmak üzere hazırlanmış Next.js mali müşavir sitesi.

## Özellikler

- Kurumsal vitrin: Ana sayfa, Hakkımızda, Hizmetler, Blog, İletişim
- Admin paneli (`/admin/giris`)
- Blog yazısı ekleme / düzenleme / silme
- Site başlığını değiştirme
- İletişim formundan gelen mesajları panelde görme

## Kurulum

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000)  
Admin: [http://localhost:3000/admin/giris](http://localhost:3000/admin/giris)

### Varsayılan giriş

- E-posta: `admin@ornek.com`
- Şifre: `Admin123!`

İlk kurulumdan sonra şifreyi değiştirin. `.env` içindeki `AUTH_SECRET` değerini de her müşteri kopyasında yenileyin.

## Müşteriye teslim (ayrı kopya)

1. Bu projeyi kopyalayın
2. Yeni `.env` oluşturun
3. `npm install` ve `npm run db:setup` çalıştırın
4. Hostinge alın (`npm run build` + `npm run start`)
5. Admin şifresini ve site başlığını müşteriyle güncelleyin
