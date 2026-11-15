import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paylaşım görseli yazı tipleri çalışma anında dosyadan okunur (src/lib/og-image.tsx). Vercel gibi
  // izole ortamlarda sunucu paketine girdiklerinden emin olmak için açıkça belirtilir.
  outputFileTracingIncludes: {
    "/og": ["./src/assets/og-fonts/**/*"],
    "/blog/\\[slug\\]/og": ["./src/assets/og-fonts/**/*"],
  },
  experimental: {
    // Mükellef Köşesi belge yüklemeleri (tek dosya en çok 25 MB + form alanları). Ters vekil
    // (nginx) kullanıyorsanız orada da client_max_body_size en az 27m olmalı. Vercel'de platform
    // sınırı 4,5 MB'tır; orada tek dosya 4 MB ile sınırlanır (src/lib/portal-files.ts).
    serverActions: { bodySizeLimit: "27mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
