/**
 * Best-effort parsing of OCR text from a printed medication label into the
 * fields the medication form needs. Deliberately conservative: it only fills a
 * field when reasonably confident and leaves the rest blank for the user to
 * complete during review. Pure + client-safe (no server-only imports).
 */

export interface ParsedLabel {
  name?: string;
  strength?: string;
  unit?: string;
  dose?: number;
  times?: string[]; // "HH:MM" schedule rows inferred from frequency
}

const STRENGTH_RE = /(\d+(?:\.\d+)?)\s*(mg|mcg|ug|ml|g|iu|units?)\b/i;

// "give 1 tablet", "1/2 tab", "administer 2 capsules", etc.
const DOSE_RE =
  /(?:give|administer|take|dispense)?\s*(\d+(?:\.\d+)?|½|¼|¾|1\/2|1\/4|3\/4)\s*(tablets?|tabs?|capsules?|caps?|pills?|chews?|drops?|ml)\b/i;

const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "1/2": 0.5,
  "1/4": 0.25,
  "3/4": 0.75,
};

const UNIT_NORMALIZE: Record<string, string> = {
  tablet: "tablet",
  tablets: "tablet",
  tab: "tablet",
  tabs: "tablet",
  capsule: "capsule",
  capsules: "capsule",
  cap: "capsule",
  caps: "capsule",
  pill: "pill",
  pills: "pill",
  chew: "chew",
  chews: "chew",
  drop: "drop",
  drops: "drop",
  ml: "ml",
};

function toNumber(raw: string): number | undefined {
  if (raw in FRACTIONS) return FRACTIONS[raw];
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Infer schedule times from common frequency phrasings. */
function inferTimes(text: string): string[] | undefined {
  const t = text.toLowerCase();
  if (/(four times|4 times|every 6\s*h|q6)/.test(t)) return ["08:00", "12:00", "16:00", "20:00"];
  if (/(three times|thrice|3 times|every 8\s*h|q8|tid)/.test(t)) return ["08:00", "14:00", "20:00"];
  if (/(twice|two times|2 times|every 12\s*h|q12|bid)/.test(t)) return ["08:00", "20:00"];
  if (/(at bedtime|at night|nightly|hs)\b/.test(t)) return ["21:00"];
  if (/(once|one time|every 24\s*h|q24|daily|sid|once a day)/.test(t)) return ["08:00"];
  return undefined;
}

/** Words that signal a line is an instruction, not the drug name. */
const INSTRUCTION_HINT = /(give|take|administer|tablet|capsule|pill|daily|mouth|with food|times|hours|refill|qty|quantity|exp|lot|rx|dr\.?|veterin|pharmacy)/i;

function inferName(lines: string[], strengthMatch: RegExpMatchArray | null): string | undefined {
  // Prefer the text just before the strength on its line, e.g. "CARPROFEN 75 MG".
  if (strengthMatch) {
    const line = lines.find((l) => STRENGTH_RE.test(l));
    if (line) {
      const before = line.slice(0, line.toLowerCase().indexOf(strengthMatch[0].toLowerCase()));
      const cleaned = before.replace(/[^a-zA-Z\s-]/g, " ").replace(/\s+/g, " ").trim();
      const words = cleaned.split(" ").filter((w) => w.length >= 3);
      if (words.length) return titleCase(words.slice(0, 3).join(" "));
    }
  }
  // Otherwise, the first mostly-alphabetic line that isn't an instruction.
  const candidate = lines.find(
    (l) => /[a-zA-Z]{3,}/.test(l) && !/\d/.test(l) && !INSTRUCTION_HINT.test(l),
  );
  if (candidate) {
    const cleaned = candidate.replace(/[^a-zA-Z\s-]/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length >= 3) return titleCase(cleaned.split(" ").slice(0, 3).join(" "));
  }
  return undefined;
}

export function parseLabel(text: string): ParsedLabel {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedLabel = {};

  const strengthMatch = text.match(STRENGTH_RE);
  if (strengthMatch) {
    result.strength = `${strengthMatch[1]} ${strengthMatch[2].toLowerCase()}`;
  }

  const doseMatch = text.match(DOSE_RE);
  if (doseMatch) {
    const dose = toNumber(doseMatch[1]);
    if (dose != null) result.dose = dose;
    const unit = UNIT_NORMALIZE[doseMatch[2].toLowerCase()];
    if (unit) result.unit = unit;
  }

  const times = inferTimes(text);
  if (times) result.times = times;

  const name = inferName(lines, strengthMatch);
  if (name) result.name = name;

  return result;
}
