"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { EMPTY_CLASS_ENV, normalizeClassEnv, type ClassEnvironment } from "@/lib/lesson-models";
import { fetchClassEnvsAction, saveClassEnvAction } from "@/server/actions/class-env";

/* ════════════════════════════════════════════════════════════════════
   SINF PASPORTI — klient keshi (bitta soʻrov, hamma isteʼmolchi).

   Dars studiyasi va dars muharriridagi Reja ustasi bir xil maʼlumotni
   koʻradi: biri oʻzgartirsa ikkinchisi darhol yangilanadi.

   Eski brauzer yozuvi (`ustozona-class-env:<classId>`, Reja ustasi
   localStorage'da saqlardi) serverda shu sinf uchun hech narsa
   boʻlmasa BIR MARTA koʻchiriladi — oʻqituvchi kiritgan sharoit
   yoʻqolmaydi.
   ════════════════════════════════════════════════════════════════════ */

const LEGACY_KEY = (classId: string) => `ustozona-class-env:${classId}`;

type Snapshot = { loaded: boolean; envs: Record<string, ClassEnvironment> };

let snapshot: Snapshot = { loaded: false, envs: {} };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function load() {
  if (snapshot.loaded || loading) return;
  loading = fetchClassEnvsAction()
    .then((envs) => emit({ loaded: true, envs }))
    .catch(() => emit({ loaded: true, envs: snapshot.envs }))
    .finally(() => {
      loading = null;
    });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => snapshot;
const SERVER_SNAPSHOT: Snapshot = { loaded: false, envs: {} };

function readLegacy(classId: string): ClassEnvironment | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY(classId));
    return raw ? normalizeClassEnv(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function useClassEnv(classId: string | null | undefined): {
  env: ClassEnvironment;
  /** Sinf uchun pasport hali toʻldirilmagan (tavsiyalar taxminiy). */
  isDefault: boolean;
  loaded: boolean;
  save: (patch: Partial<ClassEnvironment>) => void;
} {
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);

  useEffect(() => {
    load();
  }, []);

  // Bir martalik koʻchirish: serverda yoʻq, brauzerda bor.
  useEffect(() => {
    if (!classId || !snap.loaded || snap.envs[classId]) return;
    const legacy = readLegacy(classId);
    if (!legacy) return;
    emit({ loaded: true, envs: { ...snapshot.envs, [classId]: legacy } });
    saveClassEnvAction(classId, legacy).catch(() => {
      /* keyingi ochilishda yana urinadi — yozuv brauzerda qoladi */
    });
  }, [classId, snap.loaded, snap.envs]);

  const stored = classId ? snap.envs[classId] : undefined;

  const save = useCallback(
    (patch: Partial<ClassEnvironment>) => {
      if (!classId) return;
      const next = normalizeClassEnv({ ...(snapshot.envs[classId] ?? EMPTY_CLASS_ENV), ...patch });
      emit({ ...snapshot, envs: { ...snapshot.envs, [classId]: next } });
      saveClassEnvAction(classId, next).catch(() => {
        /* Tarmoq xatosi — qiymat shu sessiyada ishlaydi, sahifa yangilansa qayta kiritiladi. */
      });
    },
    [classId],
  );

  return { env: stored ?? EMPTY_CLASS_ENV, isDefault: !stored, loaded: snap.loaded, save };
}
