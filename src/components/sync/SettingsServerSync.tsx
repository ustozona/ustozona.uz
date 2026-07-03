"use client";

import * as React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  fetchSettingsAction,
  saveSettingsAction,
  type SettingsSaveInput,
} from "@/server/actions/settings";

/* Settings store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Oddiy store — diff'siz, butun snapshot yuboriladi. */

type SettingsState = ReturnType<typeof useSettingsStore.getState>;

function selectSaveInput(s: SettingsState): SettingsSaveInput {
  return {
    name: s.profile.name,
    school: s.profile.school,
    subject: s.profile.subject,
    avatarUrl: s.profile.avatarUrl,
    avatarColor: s.profile.avatarColor,
    academicYear: s.academicYear,
    language: s.language,
    workspaceBackground: s.workspaceBackground,
  };
}

export default function SettingsServerSync() {
  const hydrated = useHydrateStore(useSettingsStore, fetchSettingsAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useSettingsStore,
      select: selectSaveInput,
      push: saveSettingsAction,
      errorMessage: "Sozlamalar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
