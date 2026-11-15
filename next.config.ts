import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Mükellef Köşesi belge yüklemeleri (tek dosya en çok 25 MB + form alanları). Ters vekil
    // (nginx) kullanıyorsanız orada da client_max_body_size en az 27m olmalı.
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
