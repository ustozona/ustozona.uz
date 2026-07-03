export type BlogPost = {
  slug: string;
  gradient: string;
  title: string;
  date: string;
  description: string;
  author: {
    name: string;
    website: string;
    websiteName: string;
    image: string;
  };
};

const defaultAuthor = {
  name: "Ustozona jamoasi",
  website: "https://ustozona.uz",
  websiteName: "Ustozona",
  image:
    "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-2.webp",
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "formativ-va-summativ-baholash",
    gradient: "from-sky-200 to-blue-100",
    title: "Formativ va summativ baholash: farqi nimada?",
    date: "2026-06-10",
    description:
      "Ikki baholash turining maqsadi, vaqti va oʻquvchi oʻzlashtirishiga taʼsiri — amaliy misollar bilan.",
    author: defaultAuthor,
  },
  {
    slug: "standartlar-boyicha-ozlashtirish",
    gradient: "from-teal-200 to-emerald-100",
    title: "Standartlar boʻyicha oʻzlashtirishni kuzatish",
    date: "2026-06-04",
    description:
      "Har bir oʻquvchining standartlar kesimida qay darajada oʻzlashtirayotganini tizimli kuzatish usullari.",
    author: defaultAuthor,
  },
  {
    slug: "qogozli-jurnaldan-elektron-jurnalga",
    gradient: "from-amber-200 to-orange-100",
    title: "Qogʻozli jurnaldan elektron jurnalga oʻtish",
    date: "2026-05-28",
    description:
      "Elektron jurnalga oʻtishning bosqichlari, ustozlar uchun afzalliklari va koʻp uchraydigan xatolar.",
    author: defaultAuthor,
  },
];

export const getPostBySlug = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);
