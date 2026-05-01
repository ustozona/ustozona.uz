"use client";

import { FileText, Copy, Tag, Plus } from "lucide-react";

type Props = {
  onSelect: (type: "assignment" | "reuse" | "topic") => void;
  onClose: () => void;
};

export default function CreateMenu({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-11 z-50 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1.5">
        <MenuItem
          icon={<FileText className="size-4 text-foreground" />}
          label="Topshiriq"
          onClick={() => onSelect("assignment")}
        />
        <MenuItem
          icon={<Copy className="size-4 text-foreground" />}
          label="Qayta ishlatish"
          onClick={() => onSelect("reuse")}
        />
        <MenuItem
          icon={<Tag className="size-4 text-foreground" />}
          label="Mavzu"
          onClick={() => onSelect("topic")}
        />
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
    >
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export { Plus };
