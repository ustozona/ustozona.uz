"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, useInView } from "motion/react";
import { BLOG_POSTS } from "@/lib/blog-posts";

const blogData = BLOG_POSTS;

const uzMonths = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

const Blog = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section ref={sectionRef} className="py-10 md:py-20">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-16">
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* title */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
              className="flex flex-col gap-4 justify-center items-start grow"
            >
              {/* Badge */}
              <Badge
                variant={"outline"}
                className="text-sm font-normal py-1 px-3 h-7"
              >
                Maqolalar
              </Badge>
              {/* Heading */}
              <h2 className="text-foreground text-3xl sm:text-5xl font-semibold">
                Soʻnggi maqolalar
              </h2>
            </motion.div>
            {/* description */}
            <motion.p
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
              className="text-base font-normal text-muted-foreground max-w-xl"
            >
              Baholash, oʻzlashtirish va tizimdan samarali foydalanish boʻyicha
              maqolalar, amaliy maslahatlar va yangiliklar.
            </motion.p>
          </div>
          {/* blogs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogData.map((value, index) => {
              const d = new Date(value.date);
              const formattedDate = `${d.getDate()} ${uzMonths[d.getMonth()]}, ${d.getFullYear()}`;
              return (
                <motion.a
                  href={`/blog/${value.slug}`}
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{ 
                    duration: 1, 
                    delay: index === 0 ? 0.2 : index === 1 ? 0.4 : 0.6, 
                    ease: "easeInOut" 
                  }}
                  className={`group flex flex-col gap-5 ${
                    index === 0 ? "sm:col-span-2" : ""
                  }`}
                >
                  <Card className="p-0 ring-0 border-0 rounded-none shadow-none">
                    <CardContent className="p-0 group flex flex-col gap-5">
                      <div className="w-full aspect-video sm:aspect-auto sm:h-96 overflow-hidden rounded-2xl">
                        <div
                          className={cn(
                            "w-full h-full bg-gradient-to-br transition-transform duration-500 ease-in-out group-hover:scale-110",
                            value.gradient,
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-base font-normal text-muted-foreground">
                          {formattedDate}
                        </p>
                        <p className="text-2xl font-semibold text-foreground">
                          {value.title}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;
