import type { NextConfig } from "next";

/* Who may show this app inside an <iframe>: the team's PHP app (ห้องยาไทย) has an
   optional "ถาม-ตอบกับน้องขมิ้น" tab that embeds the chat. Space-separated origins,
   e.g. "https://thaiherbalcare.example.com". Unset = only this app's own pages.
   Read at build/start time — set it in the hosting env, then redeploy. */
const embedOrigins = (process.env.EMBED_ALLOWED_ORIGINS ?? "").split(/\s+/).filter(Boolean);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${embedOrigins.join(" ")}`.trim() },
        ],
      },
    ];
  },
};

export default nextConfig;
