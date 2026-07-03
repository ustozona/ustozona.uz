// Comparative Judgement (CJ) — oddiy reyting (v3 §9 Q6).
// Ochiq/subʼektiv ishlar uchun: oʻqituvchi juft-juft taqqoslaydi, gʻoliblar toʻplanadi.
// MVP: gʻalaba soni boʻyicha reyting (toʻliq Bradley–Terry keyin). Maqsad — relativ
// sifat tartibi, mutlaq ball emas (Daisy: ishonchli ranking > sub'ektiv mutlaq baho).

export interface Judgement {
  leftId: string;
  rightId: string;
  winnerId: string;
}

export interface CJRank {
  scriptId: string;
  wins: number;
  comparisons: number;
  /** Gʻalaba ulushi (0–1). */
  score: number;
}

/** Juft taqqoslashlardan reyting hisoblaydi (gʻalaba ulushi boʻyicha). */
export function rankScripts(scriptIds: string[], judgements: Judgement[]): CJRank[] {
  const wins = new Map<string, number>();
  const comps = new Map<string, number>();
  for (const id of scriptIds) {
    wins.set(id, 0);
    comps.set(id, 0);
  }
  for (const j of judgements) {
    comps.set(j.leftId, (comps.get(j.leftId) ?? 0) + 1);
    comps.set(j.rightId, (comps.get(j.rightId) ?? 0) + 1);
    wins.set(j.winnerId, (wins.get(j.winnerId) ?? 0) + 1);
  }
  return scriptIds
    .map((id) => {
      const w = wins.get(id) ?? 0;
      const c = comps.get(id) ?? 0;
      return { scriptId: id, wins: w, comparisons: c, score: c ? w / c : 0 };
    })
    .sort((a, b) => b.score - a.score || b.comparisons - a.comparisons);
}

/**
 * Keyingi taqqoslash juftini tanlaydi — eng kam taqqoslangan ikkitasini.
 * (Adaptiv CJ soddalashtirilgan koʻrinishi.)
 */
export function nextPair(scriptIds: string[], judgements: Judgement[]): [string, string] | null {
  if (scriptIds.length < 2) return null;
  const comps = new Map<string, number>(scriptIds.map((id) => [id, 0]));
  const seen = new Set<string>();
  for (const j of judgements) {
    comps.set(j.leftId, (comps.get(j.leftId) ?? 0) + 1);
    comps.set(j.rightId, (comps.get(j.rightId) ?? 0) + 1);
    seen.add(pairKey(j.leftId, j.rightId));
  }
  const sorted = [...scriptIds].sort((a, b) => (comps.get(a) ?? 0) - (comps.get(b) ?? 0));
  // Eng kam taqqoslangandan boshlab, hali taqqoslanmagan juftni qidiramiz.
  for (let i = 0; i < sorted.length; i++) {
    for (let k = i + 1; k < sorted.length; k++) {
      if (!seen.has(pairKey(sorted[i], sorted[k]))) return [sorted[i], sorted[k]];
    }
  }
  return null; // hamma juft taqqoslangan
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
