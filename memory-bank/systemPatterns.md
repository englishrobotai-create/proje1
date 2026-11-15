# System Patterns

- Next.js App Router
- Public site: `src/app/(site)`
- Admin: `src/app/admin`
- Server Actions ile form işlemleri
- Prisma + PostgreSQL (Vercel: Neon; şema `prisma db push` ile)
- Dosyalar: `BLOB_READ_WRITE_TOKEN` varsa özel Vercel Blob, yoksa disk (`src/lib/blob-storage.ts`)
- Cookie JWT oturum (`jose` + `bcryptjs`)
