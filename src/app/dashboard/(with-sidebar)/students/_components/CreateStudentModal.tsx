"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MONTHS_UZ } from "@/lib/localization";
import { classColor } from "@/lib/grades-data";
import { useLiveClassInfo } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { User, UserPlus, ChevronDown, Camera, X, CalendarDays, Mars, Venus, Check } from "lucide-react";

export type Gender = "male" | "female";

export type NewStudentInput = {
  firstName: string;
  lastName: string;
  classId: string;
  gender?: Gender;
  birthDate?: string; // yyyy-mm-dd
  parentName?: string;
  parentPhone?: string;
  studentPhone?: string;
  avatarColor: string;
  avatarImage?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClassId: string;
  onCreate: (data: NewStudentInput) => void;
  /** "create" → yangi oʻquvchi qoʻshish; "edit" → mavjudini tahrirlash */
  mode?: "create" | "edit";
  /** edit rejimida boshlangʻich qiymatlar (prefill) */
  initial?: Partial<NewStudentInput>;
};

// Kalendar uchun oʻzbekcha oy/hafta nomlari
const UZ_WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function initialsOf(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

/** yyyy-mm-dd ↔ Date (timezone-xavfsiz, lokal) */
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function fromISO(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatBirth(s: string): string {
  const d = fromISO(s);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function CreateStudentModal({ open, onOpenChange, defaultClassId, onCreate, mode = "create", initial }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFirstName(initial?.firstName ?? "");
      setLastName(initial?.lastName ?? "");
      setGender(initial?.gender ?? "");
      setBirthDate(initial?.birthDate ?? "");
      setParentName(initial?.parentName ?? "");
      setParentPhone(initial?.parentPhone ?? "");
      setStudentPhone(initial?.studentPhone ?? "");
      setAvatarImage(initial?.avatarImage ?? null);
      // edit rejimida qoʻshimcha maydonlardan biri toʻlgan boʻlsa — ochib koʻrsatamiz
      setShowMore(
        mode === "edit" &&
          Boolean(initial?.gender || initial?.birthDate || initial?.parentName || initial?.parentPhone || initial?.studentPhone)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultClassId]);

  // Oʻquvchi joriy ochiq sinfga qoʻshiladi — sinf shu yerda belgilangan, qayta tanlanmaydi
  const selectedClass = useLiveClassInfo(defaultClassId);
  const classHex = selectedClass ? CLASS_COLOR_HEX[classColor(selectedClass)] : CLASS_COLOR_HEX.blue;

  const fullName = `${firstName} ${lastName}`.trim();
  const canSubmit = firstName.trim().length > 0 || lastName.trim().length > 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash uchun
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      classId: defaultClassId,
      gender: gender || undefined,
      birthDate: birthDate || undefined,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      studentPhone: studentPhone.trim() || undefined,
      avatarColor: classHex,
      avatarImage: avatarImage ?? undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[88vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <form className="contents" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        {/* ── Sarlavha ── */}
        <div className="flex shrink-0 items-center gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <DialogTitle className="text-xl">{mode === "edit" ? "Oʻquvchini tahrirlash" : "Yangi oʻquvchi"}</DialogTitle>
              {selectedClass && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <ClassSwatch hex={classHex} className="size-2" />
                  {selectedClass.name}
                </span>
              )}
            </div>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="-mr-1.5 shrink-0 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Yopish</span>
            </Button>
          </DialogClose>
        </div>

        {/* ── Tana ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Avatar — sinf rangi, ixtiyoriy rasm yuklash */}
          <div className="mb-5 flex items-center gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Rasm yuklash"
                className="group relative flex size-16 items-center justify-center overflow-hidden rounded-full text-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: classHex }}
              >
                {avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarImage} alt="" className="size-full object-cover" />
                ) : fullName ? (
                  initialsOf(firstName, lastName)
                ) : (
                  <User className="size-7 opacity-90" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-5" />
                </span>
              </button>
              {avatarImage && (
                <button
                  type="button"
                  onClick={() => setAvatarImage(null)}
                  aria-label="Rasmni olib tashlash"
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Tasvir</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Sinf rangini oladi.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="mt-2 gap-1.5 shadow-none"
              >
                <Camera className="size-3.5" />
                {avatarImage ? "Almashtirish" : "Rasm yuklash"}
              </Button>
            </div>
          </div>

          {/* Ism + Familiya */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ism">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Masalan: Alisher"
                autoFocus
              />
            </Field>
            <Field label="Familiya">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Masalan: Aliyev"
              />
            </Field>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Ism yoki familiya — kamida bittasi yetarli.
          </p>

          {/* Qoʻshimcha (ixtiyoriy) — yashiriladigan */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="mt-5 flex w-full items-center justify-between rounded-md py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Qoʻshimcha maʼlumot
            <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} />
          </button>

          {showMore && (
            <div className="mt-3 grid gap-4 border-t border-border pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">Jins</Label>
                  <div className="flex gap-2">
                    {([
                      ["male", "Oʻgʻil", Mars, "sky"],
                      ["female", "Qiz", Venus, "pink"],
                    ] as [Gender, string, typeof Mars, "sky" | "pink"][]).map(([val, lbl, Icon, tone]) => {
                      const active = gender === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGender(active ? "" : val)}
                          className={cn(
                            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                            active
                              ? tone === "sky"
                                ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                : "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                              : "border-input text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="size-4" />
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tugʻilgan sana — Calendar (popover) */}
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">Tugʻilgan sana</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal shadow-xs",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                        {birthDate ? formatBirth(birthDate) : "Sanani tanlang"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={uz}
                        formatters={{
                          formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                          formatWeekdayName: (date) => UZ_WEEKDAYS[date.getDay()],
                        }}
                        selected={fromISO(birthDate)}
                        defaultMonth={fromISO(birthDate) ?? new Date(2012, 0)}
                        captionLayout="dropdown"
                        startMonth={new Date(2000, 0)}
                        endMonth={new Date(2027, 11)}
                        onSelect={(d) => {
                          setBirthDate(d ? toISO(d) : "");
                          setDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Field label="Ota yoki onasining ismi sharifi">
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Masalan: Dilnoza Karimova (onasi)"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ota-ona telefoni">
                  <Input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+998 90 123-45-67"
                  />
                </Field>
                <Field label="Oʻquvchi telefoni">
                  <Input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="+998 ..."
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button type="submit" disabled={!canSubmit} className="gap-2">
            {mode === "edit" ? <Check className="size-4" /> : <UserPlus className="size-4" />}
            {mode === "edit" ? "Saqlash" : "Qoʻshish"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
