import type { MetadataRoute } from "next";
import { abs } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* `/blog/studio` — maqola yozish paneli (auth bilan himoyalangan).
         Robot uni ocholmaydi, lekin urinib bekorga crawl byudjeti
         sarflaydi; blog lentasidagi «Yozish» tugmasi unga havola beradi. */
      disallow: ["/dashboard", "/api", "/blog/studio"],
    },
    sitemap: abs("/sitemap.xml"),
  };
}
