import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/server/dal/blog";
import { abs } from "@/lib/site-url";

const PRODUCT_SLUGS = ["baholash", "doska", "shogird", "boshqaruv"] as const;

/* ⚠️ `sitemap.ts` — Next uchun oddiy Route Handler, va u STANDART HOLDA
   KESHLANADI. Bu qatorsiz bazadan olingan maqolalar build paytida
   muzlatiladi: yangi maqola nashr qilinsa, keyingi deploy'gacha
   sitemap'ga tushmaydi (2026-09-01 da jonli sitemap'dagi `lastmod`
   aynan deploy vaqtini koʻrsatib turgan edi).

   Bir soat — muvozanat: qidiruv robotlari sitemap'ni bundan tez-tez
   soʻramaydi, baza esa har soʻrovda urilmaydi. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  /* Baza yetib bormasa sitemap butunlay yiqilmasin — statik qismi
     baribir chiqsin. Boʻsh sitemap qaytgani, 500 qaytganidan yaxshi:
     Google 500 ni takroriy xato deb belgilaydi. */
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts();
  } catch {
    posts = [];
  }

  return [
    {
      url: abs("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PRODUCT_SLUGS.map((slug) => ({
      url: abs(`/${slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: abs("/blog"),
      lastModified: posts[0] ? new Date(posts[0].updatedAt) : lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: abs(`/blog/${post.slug}`),
      /* `publishPost` har nashrda `updatedAt` ni ham yangilaydi, yaʼni u
         har doim `publishedAt` dan katta yoki teng. Kamchiligi: qoralama
         tahrir qilinsa ham suriladi — robot bekorga bir marta qaytadi,
         lekin hech qachon oʻzgarishni oʻtkazib yubormaydi. Bu tomonga
         xato qilgan maʼqul. */
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
