"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { MessageSquarePlus } from "lucide-react";
import FeedbackForm from "@/app/dashboard/(with-sidebar)/feedback/_components/FeedbackForm";

/**
 * Header'dagi tezkor fikr-mulohaza tugmasi — istalgan sahifadan, sahifani
 * tark etmasdan fikr yuborish (EMStudio "Send Feedback" naqshi). Forma
 * tanasi umumiy `FeedbackForm`da (sahifadagi inline kompozer bilan bir xil):
 * turkum pillalari, skrinshot Ctrl+V / fayl biriktirish, savol yoʻnaltirishi.
 */
export default function QuickFeedback() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <IconButton aria-label="Fikr bildirish" className="text-muted-foreground">
              <MessageSquarePlus className="size-[17px]" strokeWidth={2} />
            </IconButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Fikr bildirish</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-[560px] max-w-[calc(100vw-1.5rem)] p-4">
        <h3 className="heading-small text-foreground">Fikr bildirish</h3>
        <div className="mt-3">
          <FeedbackForm
            autoFocus
            rows={5}
            submitLabel="Yuborish"
            onSubmitted={() => setOpen(false)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
