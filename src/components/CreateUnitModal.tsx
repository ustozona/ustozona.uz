"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TypographyMuted } from "@/components/ui/typography";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import { ChevronDownIcon, Lock } from "lucide-react";

export type CreateUnitValues = { name: string; classIds: string[]; description: string };

/**
 * Boʻlim yaratish modali — Mavzular sahifasidagi "Boʻlim qoʻshish" tugmasi ochadi.
 * Nom + sinflarga bogʻlash (multi-select) + tavsif.
 */
export default function CreateUnitModal({
  defaultClassIds = [],
  onSubmit,
  onClose,
}: {
  defaultClassIds?: string[];
  onSubmit: (values: CreateUnitValues) => void;
  onClose: () => void;
}) {
  const selectableClasses = useLiveClasses();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classIds, setClassIds] = useState<string[]>(defaultClassIds);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleClass = (id: string) =>
    setClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selected = selectableClasses.filter((c) => classIds.includes(c.id));
  const canSubmit = name.trim().length > 0 && classIds.length > 0;
  const submit = () => onSubmit({ name: name.trim(), classIds, description: description.trim() });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle>Boʻlim yaratish</DialogTitle>
          <DialogDescription>Darslaringizni tartiblash uchun yangi boʻlim qoʻshing.</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-4">
          {/* Nomi */}
          <div className="space-y-2">
            <Label htmlFor="cum-name">Nomi <span className="text-destructive">*</span></Label>
            <Input
              id="cum-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan, Algebraga kirish, Chiziqli tenglamalar"
              autoFocus
            />
          </div>

          {/* Sinflarga bogʻlash */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              Sinflarga bogʻlash
            </Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center justify-between gap-2 w-full rounded-md border border-border bg-card px-3 min-h-9 py-1.5 text-sm hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {selected.length === 0 ? (
                    <span className="text-muted-foreground">Sinf tanlang...</span>
                  ) : (
                    selected.map((c) => {
                      const hex = CLASS_COLOR_HEX[classColor(c)];
                      return (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${hex} 12%, transparent)`,
                            color: `color-mix(in srgb, ${hex} 55%, var(--foreground))`,
                          }}
                        >
                          <ClassSwatch hex={hex} className="size-1.5 rounded-[3px]" />
                          {c.name}
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDownIcon
                  className={`size-4 opacity-50 shrink-0 transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                />
              </button>
              {pickerOpen && (
                <div className="mt-1 rounded-md border border-border bg-popover p-1 shadow-md max-h-[200px] overflow-y-auto">
                  <div className="space-y-0.5">
                    {selectableClasses.map((c) => {
                      const hex = CLASS_COLOR_HEX[classColor(c)];
                      const checked = classIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleClass(c.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleClass(c.id); } }}
                          className="flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm text-left cursor-pointer hover:bg-muted transition-colors outline-none focus-visible:bg-muted"
                        >
                          <Checkbox checked={checked} className="pointer-events-none" />
                          <ClassSwatch hex={hex} className="size-2" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <TypographyMuted className="text-xs">
              Bu boʻlimdagi darslar shu sinflarga avtomatik biriktiriladi.
            </TypographyMuted>
          </div>

          {/* Tavsif */}
          <div className="space-y-2">
            <Label htmlFor="cum-desc">Tavsif</Label>
            <Textarea
              id="cum-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu boʻlim nimani qamrab olishi haqida qisqa tavsif..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={submit} disabled={!canSubmit}>Boʻlim yaratish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
