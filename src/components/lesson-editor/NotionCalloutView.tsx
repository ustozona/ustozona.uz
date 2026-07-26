"use client";

import { useState } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { Check, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch } from "@/components/ui/emoji-picker";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { classTints } from "@/lib/class-colors";
import { NOTION_CALLOUT_COLORS, type NotionCalloutColor } from "./notion-callout-extension";
import { cn } from "@/lib/utils";

/**
 * Notion callout NodeView — ikki ustunli grid: chapda bosiladigan emoji
 * (Apple sprite picker orqali almashtiriladi), oʻngda erkin tahrirlanadigan
 * kontent. Fon-rang tanlagichi kartaning oʻng yuqori burchagida, faqat
 * hover/fokusda koʻrinadi — oʻqish oqimini va PDF chopini ifloslantirmaydi.
 *
 * Kontent endi `notionCalloutTitle` (qalin sarlavha) + `block+` (tana) dan
 * iborat — `NodeViewContent` ikkalasini ham ProseMirror sxemasi boʻyicha
 * avtomatik renderlaydi (bu yerda alohida qoʻl bilan ajratish shart emas,
 * xuddi CalloutView'dagi kabi). */
export default function NotionCalloutView({ node, updateAttributes }: NodeViewProps) {
  const emoji = (node.attrs.emoji as string) || "💡";
  const color = ((node.attrs.color as string) || "gray") as NotionCalloutColor;
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const tint = classTints(color);

  return (
    <NodeViewWrapper
      className="notion-callout"
      style={{ ...tint.tint, ...tint.softBorder }}
      data-color={color}
    >
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            contentEditable={false}
            className="notion-callout-emoji"
            title="Emoji tanlash"
          >
            {/* `apple-emoji-img` SHART: globals.css'dagi blok-rasm qoidasi
                (radius + vertikal margin) emoji sprite'ga tegmasligi uchun. */}
            <AppleEmojiSprite emoji={emoji} className="apple-emoji-img" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-fit p-0">
          <EmojiPicker
            onEmojiSelect={({ emoji: e }) => {
              updateAttributes({ emoji: e });
              setEmojiOpen(false);
            }}
          >
            <EmojiPickerSearch />
            <EmojiPickerContent />
            <EmojiPickerFooter />
          </EmojiPicker>
        </PopoverContent>
      </Popover>

      <NodeViewContent className="notion-callout-content" />

      <div className="notion-callout-controls" contentEditable={false}>
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="notion-callout-color-trigger"
              title="Fon rangi"
              data-open={colorOpen || undefined}
            >
              <Palette className="size-4" style={{ color: tint.solid }} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1.5">
              {NOTION_CALLOUT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    updateAttributes({ color: c });
                    setColorOpen(false);
                  }}
                  className={cn(
                    "size-6 rounded-[6px] border border-black/10 flex items-center justify-center",
                    "transition-transform hover:scale-110 focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                  )}
                  style={{ background: classTints(c).solid }}
                  title={c}
                  aria-pressed={c === color}
                >
                  {c === color && <Check className="size-3.5 text-white drop-shadow-sm" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </NodeViewWrapper>
  );
}
