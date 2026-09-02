/* ════════════════════════════════════════════════════════════════════
   sync_class_from_uz() — ISH MAYDONI MODELIGA KOʻCHIRISH

   ⛔ MUAMMO (prodda 2026-09-02 da jonli ushlangan)
   Funksiya `NEW.teacher_id` ni oʻqiydi, lekin `classes.teacher_id`
   2026-08-26 da oʻchirilgan (0035_ish_maydoni_kochirish.sql:80).
   PL/pgSQL bunda quyidagini tashlaydi:

       42703 — record "new" has no field "teacher_id"
       PL/pgSQL function sync_class_from_uz() line 8

   Trigger `classes` ga AFTER INSERT osilgani uchun xato butun
   INSERT'ni bekor qiladi → Ustozona'da SINF YARATIB BOʻLMAYDI.
   Ilova buni «Baholar serverga saqlanmadi» deb koʻrsatadi va
   toʻxtovsiz qayta urinadi.

   ✅ YECHIM
   Egalik endi ish maydonida. Telegram id'sini sinfning `workspace_id`
   si orqali — maydon EGASIDAN topamiz.

   ⚠️ MANBA TANLOVI — `workspace_members`, `class_teachers` EMAS
   Trigger AFTER INSERT ON classes, yaʼni `class_teachers` dagi
   «owner» qatori hali yozilmagan boʻlishi mumkin (u alohida amal).
   `workspace_members` esa sinf yaratilishidan ancha oldin mavjud.

   ⚠️ MAKTAB MAYDONI — MAʼNO TOʻLIQ MOS EMAS
   Shaxsiy maydonda (`ws-<teacherId>`) ega = oʻqituvchining oʻzi, yaʼni
   eski xulq aynan saqlanadi. Maktab maydonida esa ega — zavuch/direktor
   boʻlishi mumkin, sinfni oʻtadigan oʻqituvchi emas. U holda bot tomonda
   sinf NOTOʻGʻRI odamda paydo boʻladi.
   Shu sababli quyida FAQAT shaxsiy maydon sinxronlanadi; maktab maydoni
   jimgina oʻtkazib yuboriladi (`RETURN NEW`) — bu «notoʻgʻri odamga
   yozish» dan xavfsizroq. Maktab uchun toʻgʻri qoidani LessonLab tomoni
   bilan kelishgach qoʻshish kerak.
   ════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE FUNCTION public.sync_class_from_uz()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE v_tid text; v_tg bigint; v_ll int;
BEGIN
  IF pg_trigger_depth() > 1
     OR coalesce(current_setting('app.sync_off', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  /* Maydon egasi. Bir nechta ega boʻlsa eng eskisi olinadi — natija
     har chaqiruvda bir xil boʻlsin (aks holda sinxron qaysi hisobga
     tushishi tasodifiy boʻlardi). */
  SELECT wm.teacher_id INTO v_tid
    FROM workspace_members wm
   WHERE wm.workspace_id = NEW.workspace_id
     AND wm.role = 'owner'
   ORDER BY wm.created_at
   LIMIT 1;
  IF v_tid IS NULL THEN RETURN NEW; END IF;

  /* FAQAT shaxsiy maydon — yuqoridagi izohga qarang. */
  IF NEW.workspace_id IS DISTINCT FROM 'ws-' || v_tid THEN RETURN NEW; END IF;

  SELECT telegram_id::bigint INTO v_tg FROM user_telegram WHERE user_id = v_tid;
  IF v_tg IS NULL THEN RETURN NEW; END IF;

  IF EXISTS (SELECT 1 FROM class_links WHERE uz_class_id = NEW.id) THEN RETURN NEW; END IF;

  INSERT INTO bot_classes (user_id, name, subject, grade)
  VALUES (v_tg, NEW.name, NEW.subject, NEW.grade) RETURNING id INTO v_ll;

  INSERT INTO class_links (ll_class_id, uz_class_id, origin, linked_by)
  VALUES (v_ll, NEW.id, 'ustozona', 'shadow');

  RETURN NEW;
END $function$;
