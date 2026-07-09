import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/i18n/seo";

const siteUrl = getSiteUrl();

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
				disallow: ["/admin/", "/api/", "/login"],
			},
		],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
