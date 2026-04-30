import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Crawlers de redes sociales — necesitan acceso para generar previews
        userAgent: [
          "facebookexternalhit",
          "Twitterbot",
          "WhatsApp",
          "LinkedInBot",
          "TelegramBot",
          "Slackbot",
        ],
        allow: "/",
      },
      {
        // Bots de SEO estándar
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot"],
        allow: "/",
        disallow: ["/admin/", "/api/", "/login"],
      },
      {
        // Resto — permitir páginas públicas
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/login"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
