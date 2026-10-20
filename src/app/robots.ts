import type { MetadataRoute } from "next";

// Каталог и книги открыты для индексации, страницы участников закрыты (PRD, раздел 11).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/neighbors/", "/profile", "/shelf", "/admin", "/add", "/welcome", "/login", "/auth/", "/design"],
    },
  };
}
