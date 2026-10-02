"use client";

import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { authClient } from "@/lib/auth-client";
import { displayEmail } from "@/lib/placeholder-email";

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    // `Array.from` — kod nuqtasi boʻyicha: `w[0]` emojining yarmini olib `�` chiqarardi.
    .map((w) => Array.from(w)[0]?.toUpperCase() ?? "")
    .join("");
}

/* Joriy foydalanuvchining koʻrinadigan pasporti — header profil menyusi va
   yon panel pastidagi profil qatori shu bitta manbadan oʻqiydi.

   Sessiya GET soʻrovi 13 ta fon boʻlagini kutmaydi. Settings kelgach
   ustozning tahrirlangan ismi/rasmi ustun turadi; sessiya faqat shu
   akkauntning xavfsiz vaqtinchalik pasporti. Hech qachon boshqa
   foydalanuvchining lokal profilini taxmin qilib koʻrsatmaymiz. */
export function useAccountIdentity() {
  const t = useTranslations("HeaderAccountMenu");
  const profile = useSettingsStore((s) => s.profile);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const { data: session } = authClient.useSession();

  const name = (hydrated && profile.name) || session?.user.name || t("defaultUserName");
  return {
    name,
    email: displayEmail((hydrated && profile.email) || session?.user.email),
    avatarUrl: (hydrated && profile.avatarUrl) || session?.user.image || "",
    initials: initialsOf(name),
    unknown: !(hydrated && profile.name) && !session?.user.name,
    avatarHex: hydrated
      ? CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange
      : undefined,
  };
}

export function AccountAvatar({
  identity,
  size = "sm",
  className,
}: {
  identity: ReturnType<typeof useAccountIdentity>;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { name, avatarUrl, avatarHex, unknown, initials } = identity;
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback style={avatarHex ? { background: avatarHex, color: "white" } : undefined}>
        {unknown ? <UserRound className="size-4" aria-hidden="true" /> : initials}
      </AvatarFallback>
    </Avatar>
  );
}
