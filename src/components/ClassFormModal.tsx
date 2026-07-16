"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { CLASS_ICONS, CLASS_ICON_KEYS, DEFAULT_CLASS_ICON, type ClassIconKey } from "@/lib/class-icons";
import { Dialog, DialogContent, DialogHeaderBar, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyMuted } from "@/components/ui/typography";
import { PlusIcon, XIcon, PaletteIcon, ChevronDownIcon, Clock2Icon, GraduationCap } from "lucide-react";

export type ClassSlot = { day: string; start: string; end: string };
export type ClassFormValues = { name: string; grade: number | null; subject: string; color: ClassColor; icon: ClassIconKey; description: string; slots: ClassSlot[] };

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

/**
 * Sinf yaratish / tahrirlash uchun umumiy modal.
 * Timetable ("+", "Tahrirlash") va Classes ("Yangi sinf") sahifalari ishlatadi.
 */
export function ClassFormModal({
  mode,
  initial,
  onSubmit,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Partial<ClassFormValues>;
  onSubmit: (values: ClassFormValues) => void;
  onClose: () => void;
}) {
  const colorEntries = (Object.entries(CLASS_COLOR_HEX) as [ClassColor, string][]).filter(([n]) => n !== "gray");
  const presetHexes = colorEntries.map(([, hex]) => hex);

  const [name, setName] = useState(initial?.name ?? "");
  const [grade, setGrade] = useState<number | null>(initial?.grade ?? null);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [selectedColor, setSelectedColor] = useState<ClassColor>(
    initial?.color ?? colorEntries[Math.floor(Math.random() * colorEntries.length)][0]
  );
  const [selectedIcon, setSelectedIcon] = useState<ClassIconKey>(initial?.icon ?? DEFAULT_CLASS_ICON);
  const [description, setDescription] = useState(initial?.description ?? "");
  const selectedHex = CLASS_COLOR_HEX[selectedColor];
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const SelectedIcon = CLASS_ICONS[selectedIcon];

  type Slot = ClassSlot & { id: string };
  const [timeSlots, setTimeSlots] = useState<Slot[]>(() =>
    (initial?.slots ?? []).map((s) => ({ ...s, id: Math.random().toString(36).slice(2, 9) }))
  );

  const addTimeSlot = () => setTimeSlots((prev) => [...prev, { id: Math.random().toString(36).slice(2, 9), day: "Dushanba", start: "09:00", end: "10:00" }]);
  const removeTimeSlot = (id: string) => setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  const updateDay = (id: string, day: string) => setTimeSlots((prev) => prev.map((s) => (s.id === id ? { ...s, day } : s)));
  const updateTime = (id: string, key: "start" | "end", val: string) => setTimeSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: val } : s)));

  const canSubmit = name.trim().length > 0;
  const submit = () => onSubmit({ name: name.trim(), grade, subject: subject.trim(), color: selectedColor, icon: selectedIcon, description, slots: timeSlots.map(({ day, start, end }) => ({ day, start, end })) });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[540px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeaderBar
          icon={<GraduationCap className="size-[18px]" aria-hidden />}
          title={mode === "create" ? "Yangi sinf yaratish" : `Sinfni tahrirlash${initial?.name ? `: ${initial.name}` : ""}`}
          description={mode === "create" ? "Sinf nomi, rangi va haftalik jadvalini kiriting." : "Sinf maʼlumotlari va jadvalini yangilang."}
        />

        <ScrollArea className="flex-1">
          <div className="p-6 pt-4 space-y-4">
            {/* Nom + rang */}
            <div className="space-y-2">
              <Label htmlFor="cfm-name">Sinf nomi <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input id="cfm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Algebra 101" className="flex-1" />

                {/* Ikonka tanlash */}
                <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Ikonka tanlash" className="shrink-0 border-0 shadow-sm text-white hover:opacity-90" style={{ backgroundColor: selectedHex }}>
                      <SelectedIcon className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[300px] p-2">
                    <ScrollArea className="h-[244px]">
                      <div
                        className="grid grid-cols-6 gap-1.5 pr-3"
                        // Popover dialog portalidan tashqarida — Dialog scroll-lock gʻildirakni bloklaydi;
                        // shuning uchun viewport'ni qoʻlda skroll qilamiz.
                        onWheel={(e) => {
                          const vp = e.currentTarget.closest("[data-radix-scroll-area-viewport]");
                          if (vp) vp.scrollTop += e.deltaY;
                        }}
                      >
                        {CLASS_ICON_KEYS.map((key) => {
                          const Icon = CLASS_ICONS[key];
                          const active = key === selectedIcon;
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-label={key}
                              aria-pressed={active}
                              onClick={() => { setSelectedIcon(key); setIsIconPickerOpen(false); }}
                              className={cn(
                                "flex items-center justify-center aspect-square rounded-md border transition-colors",
                                active ? "border-transparent text-white" : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                              )}
                              style={active ? { backgroundColor: selectedHex } : undefined}
                            >
                              <Icon className="size-[18px]" />
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                {/* Rang tanlash */}
                <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Rang tanlash" className="shrink-0 border-0 shadow-sm hover:opacity-90" style={{ background: `conic-gradient(${presetHexes.join(", ")}, ${presetHexes[0]})` }}>
                      <PaletteIcon className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-3">
                    <div className="grid grid-cols-5 gap-2 justify-items-center">
                      {colorEntries.map(([colorName, hex]) => (
                        <Button
                          key={colorName}
                          variant="ghost"
                          size="icon-xs"
                          aria-label={colorName}
                          onClick={() => { setSelectedColor(colorName); setIsColorPickerOpen(false); }}
                          className="size-7 rounded-full ring-2 ring-transparent hover:ring-border ring-offset-2 ring-offset-card shadow-sm p-0 min-w-0 min-h-0"
                          style={{ backgroundColor: hex, outline: colorName === selectedColor ? `3px solid ${hex}` : undefined, outlineOffset: "2px" }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sinf + Fan nomi */}
            <div className="flex gap-3">
              <div className="space-y-2 shrink-0">
                <Label>Sinf</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-between rounded-md border border-border px-3 h-9 text-sm w-[140px] bg-card hover:bg-accent/50 transition-colors">
                    <span className={grade === null ? "text-muted-foreground" : ""}>{grade === null ? "Tanlanmagan" : `${grade}-sinf`}</span>
                    <ChevronDownIcon className="size-4 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[140px] max-h-[260px] overflow-y-auto">
                    <DropdownMenuRadioGroup value={grade === null ? "" : String(grade)} onValueChange={(val) => setGrade(val ? Number(val) : null)}>
                      {GRADES.map((g) => <DropdownMenuRadioItem key={g} value={String(g)}>{g}-sinf</DropdownMenuRadioItem>)}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <Label htmlFor="cfm-subject">Fan</Label>
                <Input id="cfm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Masalan, Matematika" />
              </div>
            </div>

            {/* Tavsif */}
            <div className="space-y-2">
              <Label htmlFor="cfm-desc">Tavsif</Label>
              <Input id="cfm-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masalan, 10-sinflar uchun chuqurlashtirilgan matematika" />
            </div>

            {/* Haftalik jadval */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium select-none">Haftalik jadval</Label>
                <Button variant="ghost" size="sm" onClick={addTimeSlot} className="gap-1.5">
                  <PlusIcon className="size-4" />
                  Vaqt qoʻshish
                </Button>
              </div>

              {timeSlots.length === 0 ? (
                <TypographyMuted className="text-sm py-4 text-center border border-dashed rounded-lg">
                  Muntazam jadval yoʻq. Vaqt qoʻshing.
                </TypographyMuted>
              ) : (
                <div className="space-y-3">
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-between rounded-md border border-border px-3 h-9 text-sm w-[130px] shrink-0 bg-card">
                          <span className="truncate">{slot.day}</span>
                          <ChevronDownIcon className="size-4 opacity-50" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[130px]">
                          <DropdownMenuRadioGroup value={slot.day} onValueChange={(val) => updateDay(slot.id, val)}>
                            {DAYS.map((d) => <DropdownMenuRadioItem key={d} value={d}>{d}</DropdownMenuRadioItem>)}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative">
                          <Input type="time" lang="en-GB" step="60" value={slot.start} onChange={(e) => updateTime(slot.id, "start", e.target.value)} className="h-9 w-[78px] pl-2 pr-6 shadow-none [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        <span className="text-muted-foreground text-xs shrink-0">—</span>
                        <div className="relative">
                          <Input type="time" lang="en-GB" step="60" value={slot.end} onChange={(e) => updateTime(slot.id, "end", e.target.value)} className="h-9 w-[78px] pl-2 pr-6 shadow-none [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden" />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <Button variant="ghost" size="icon-sm" onClick={() => removeTimeSlot(slot.id)} className="ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={submit} disabled={!canSubmit}>{mode === "create" ? "Yaratish" : "Saqlash"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
