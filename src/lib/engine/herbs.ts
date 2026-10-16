/* herbs.json, validated once at import. If the data person breaks the shape,
   `npm test` (and the app) fail loudly instead of showing a wrong card. */

import { z } from "zod";
import raw from "@/data/herbs.json";

const Restriction = z.object({
  pregnant: z.boolean(),
  breastfeeding: z.boolean(),
  age_below: z.number().int().positive().nullable(),
  conditions: z.array(z.string()),
  meds: z.array(z.string()),
  flags: z.array(z.string()),
});

const Source = z.object({ name: z.string().min(1), url: z.string().optional() });

/** An entry with full data ("draft" from a provincial source, or "verified"). */
const FullHerbSchema = z.object({
  id: z.string().min(1),
  name_th: z.string().min(1),
  type: z.enum(["single", "formula"]),
  route: z.enum(["oral", "external"]),
  symptoms: z.array(z.string()).min(1),
  form: z.string(),
  dose: z.string().min(1),
  how_to_take: z.string(),
  timing: z.enum(["before_meal", "after_meal", "bedtime", "as_needed"]),
  max_days: z.number().int().positive().nullable(),
  /** Contraindication: always remove. */
  exclude_if: Restriction,
  /** Caution in the source. App policy: also remove, with the reason shown. */
  caution_if: Restriction.extend({ elderly: z.boolean() }),
  cautions: z.array(z.string()),
  side_effects: z.array(z.string()),
  see_doctor_if: z.array(z.string()),
  buying_tip: z.string(),
  image: z.string(),
  sources: z.array(Source).min(1),
  notes: z.array(z.string()),
  /** skin_wound only: which S10 skin types this herb is for. Missing → never offered for skin. */
  skin_types: z.array(z.enum(["itch_bite", "scrape", "small_burn"])).optional(),
  status: z.enum(["draft", "verified"]),
  checked_by: z.string().nullable(),
});

/** Placeholder: herb is on the poster but no dose/contraindication data yet. */
const TodoHerbSchema = z.object({
  id: z.string().min(1),
  name_th: z.string().min(1),
  symptoms: z.array(z.string()).min(1),
  status: z.literal("todo"),
  notes: z.array(z.string()),
  checked_by: z.string().nullable(),
});

export const HerbFileSchema = z.object({
  herbs: z.array(z.union([FullHerbSchema, TodoHerbSchema])),
});

export type Herb = z.infer<typeof FullHerbSchema>;
export type TodoHerb = z.infer<typeof TodoHerbSchema>;

const parsed = HerbFileSchema.parse(raw);

/** Every entry, todo included (for data checks). */
export const ALL_HERBS = parsed.herbs;

/** Entries the engine can recommend. "todo" entries have no data and are never shown. */
export const HERBS: Herb[] = parsed.herbs.filter((h): h is Herb => h.status !== "todo");
