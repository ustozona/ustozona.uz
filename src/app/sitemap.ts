import type { MetadataRoute } from "next";

const PRODUCT_SLUGS = ["baholash", "doska", "shogird", "boshqaruv"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: "https://www.ustozona.uz",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PRODUCT_SLUGS.map((slug) => ({
      url: `https://www.ustozona.uz/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
