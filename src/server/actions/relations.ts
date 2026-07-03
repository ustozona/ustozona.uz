"use server";

import { z } from "zod";
import {
  getRelations,
  saveRelations,
  type RelationsPayload,
} from "@/server/dal/relations";

/* Relations server actions — yupqa qatlam: zod-parse → DAL.
   Kichik juftlar toʻplami — butun snapshot saqlanadi. */

const linksSchema = z
  .array(z.string().min(3).max(400).regex(/^[^|]+\|[^|]+$/))
  .max(2000);

export async function fetchRelationsAction(): Promise<RelationsPayload> {
  return getRelations();
}

export async function saveRelationsAction(input: {
  links: string[];
}): Promise<{ ok: true }> {
  await saveRelations(linksSchema.parse(input.links));
  return { ok: true };
}
