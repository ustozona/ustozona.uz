"use client";

import { Node, mergeAttributes } from "@tiptap/core";

/**
 * FigureImage — rasm + ostidagi IZOH (`<figure>` + `<figcaption>`).
 *
 * Nega yalangʻoch `<img>` emas: izohli rasm veb-nashrchilikning standart
 * birligi. Semantik HTML buni `<figure><img><figcaption>` deb belgilaydi
 * (izoh rasmga DASTURIY jihatdan bogʻlanadi — skrinrider uni rasm bilan
 * birga oʻqiydi), va Medium, Substack, Notion, WordPress, NYT — hammasi
 * shu tuzilmani chiqaradi. Izohni rasm ostiga oddiy xatboshi qilib yozish
 * vizual jihatdan oʻxshasa ham, bu bogʻlanishni bermaydi va rasm
 * koʻchirilganda izoh orqada qolib ketadi.
 *
 * TUZILMA QARORI — `content: "inline*"`, alohida `figureCaption` tuguni EMAS
 * (Callout'dagi `calloutTitle` naqshidan farqli). Sabab: `parseHTML` da
 * `contentElement: "figcaption"` bilan PARSER TO'GʻRIDAN-TO'GʻRI mos keladi —
 * figcaption ichidagi inline matn `inline*` ga aynan tushadi, hech qanday
 * avto-wrapping talab qilinmaydi. Alohida tugun boʻlganda parser inline
 * matnni `figureCaption` ichiga oʻrashga majbur boʻlardi va bu round-trip'da
 * izohni yoʻqotish xavfini tugʻdirardi.
 *
 * Eski kontent buzilmaydi: oddiy `Image` kengaytmasi ham roʻyxatda qoladi,
 * shuning uchun ilgari saqlangan yalangʻoch `<img>` avvalgidek oʻqiladi.
 * Yangi rasmlar esa figure sifatida qoʻyiladi.
 */
export interface FigureImageOptions {
  /** Izoh boʻsh boʻlganda koʻrinadigan xira matn. */
  captionPlaceholder: string;
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figureImage: {
      /** Rasmni izoh maydoni bilan birga qoʻyadi (izoh boʻsh boshlanadi). */
      setFigureImage: (attrs: { src: string; alt?: string }) => ReturnType;
    };
  }
}

export const FigureImage = Node.create<FigureImageOptions>({
  name: "figureImage",
  group: "block",
  content: "inline*",
  /* `draggable: false` ATAYLAB. Tiptap'ning oddiy `Image` tuguni draggable
     — u atom (ichida tahrirlanadigan matn yoʻq). Bu yerda esa figcaption
     ichida matn yoziladi: DOM'ga `draggable="true"` qoʻyilsa brauzer
     sichqoncha bilan matn ajratishni tugunni SUDRASH deb talqin qiladi va
     izohni tanlab boʻlmay qoladi. */
  draggable: false,
  /* Izoh maydoni rasmga "yopishgan" boʻlib qolsin — tanlash/oʻchirish
     amallari figure chegarasidan tashqariga tarqalmasin. */
  isolating: true,

  addOptions() {
    return {
      captionPlaceholder: "Rasm izohi",
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        /* Kontent FAQAT figcaption ichidan olinadi — figure ichidagi `<img>`
           alohida tugun sifatida qayta oʻqilmasligi uchun (aks holda u
           `inline*` ga sigʻmay, parser figure'ni erta yopib yuborardi).

           ⛔ SATR shaklida (`contentElement: "figcaption"`) YOZIB BOʻLMAYDI.
           prosemirror-model uni shunday bajaradi:
               contentDOM = dom.querySelector(rule.contentElement)
               this.addAll(contentDOM)          // ← `|| dom` fallback YOʻQ
           Yaʼni figcaption'siz `<figure><img></figure>` uchun `contentDOM`
           null boʻladi va `addAll` ichida `parent.firstChild` TypeError
           tashlaydi. Bunday figure real hayotda tez uchraydi — Wikipedia,
           yangiliklar saytlari va koʻp CMS aynan shu shaklni chiqaradi,
           yaʼni oddiy CTRL+V muharrirni yiqitardi.

           Funksiya shakli boʻsh figcaption yaratib qaytaradi: parser hech
           qachon null olmaydi, kontent esa boʻsh qoladi (`inline*` buni
           qabul qiladi). */
        contentElement: (element) =>
          (element as HTMLElement).querySelector("figcaption") ??
          element.ownerDocument!.createElement("figcaption"),
        getAttrs: (element) => {
          const img = (element as HTMLElement).querySelector("img");
          if (!img) return false; // rasmsiz figure — bizniki emas
          return { src: img.getAttribute("src"), alt: img.getAttribute("alt") };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "figure",
      mergeAttributes(this.options.HTMLAttributes, { class: "editor-figure" }),
      ["img", { src: node.attrs.src, alt: node.attrs.alt ?? "" }],
      [
        "figcaption",
        {
          class: "editor-figcaption",
          /* Xira namuna matni figcaption'ning OʻZIDA turadi: Placeholder
             kengaytmasi `.is-empty` sinfini tugunning TASHQI elementiga
             (`<figure>`) qoʻyadi, CSS `attr()` esa faqat oʻz elementidan
             oʻqiy oladi — shuning uchun ikkisi juftlashadi:
             `.editor-figure.is-empty .editor-figcaption::before`. */
          "data-placeholder": this.options.captionPlaceholder,
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addKeyboardShortcuts() {
    return {
      /* Izoh ichida Enter — yangi qator EMAS, figure'dan CHIQISH. Izoh bir
         satrlik matn (jahon amaliyotida ham shunday); Enter bosilganda
         foydalanuvchi maqolani davom ettirmoqchi boʻladi.
       *
       * ⛔ `editor.isActive(this.name)` bilan tekshirib BOʻLMAYDI. `isActive`
       *    tugun turini butun tanlov ORALIGʻIDA qidiradi (`nodesBetween`),
       *    shuning uchun Ctrl+A dan keyin ham `true` qaytaradi — holbuki
       *    u paytda `$to.depth === 0` va prosemirror'ning `after(0)` ataylab
       *    `RangeError("There is no position after the top-level node")`
       *    tashlaydi, natijada Enter tugmasi butunlay ishlamay qolardi.
       *    `$to.parent` tekshiruvi esa kursor ROSA figure ichidagi matnda
       *    turganini bildiradi — bu yagona toʻgʻri shart. */
      Enter: () => {
        const { $to } = this.editor.state.selection;
        if ($to.depth === 0 || $to.parent.type.name !== this.name) return false;
        const after = $to.after();
        return this.editor
          .chain()
          .insertContentAt(after, { type: "paragraph" })
          .setTextSelection(after + 1)
          .focus()
          .run();
      },
    };
  },
});
