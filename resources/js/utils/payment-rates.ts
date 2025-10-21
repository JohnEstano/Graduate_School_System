// Robust, self-contained helpers for per-member receivables

export type PaymentRateRow = {
  program_level: string; // "Masteral" | "Doctorate"
  type: string;          // "Adviser" | "Panel Chair" | "Panel Member" | ...
  defense_type: string;  // "Proposal" | "Pre-final" | "Final"
  amount: number | string;
};

const norm = (s?: string | null) => String(s ?? '').trim().toLowerCase();

export function normalizeDefenseType(s?: string | null): 'proposal' | 'prefinal' | 'final' | '' {
  const t = String(s ?? '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (!t) return '';
  if (t.includes('proposal')) return 'proposal';
  if (t.includes('prefinal') || (t.includes('pre') && t.includes('final'))) return 'prefinal';
  if (t.includes('final')) return 'final';
  return '';
}

export function normalizeProgramLevelStrict(level?: string | null): 'masteral' | 'doctorate' | '' {
  const v = norm(level);
  if (v === 'masteral') return 'masteral';
  if (v === 'doctorate') return 'doctorate';
  return '';
}

export function normalizeProgramLevelLoose(program?: string | null): 'masteral' | 'doctorate' | '' {
  const p = norm(program);
  if (!p) return '';
  // Common indicators for grad levels
  if (/(^|\s)(ms|msc|ma|mba|m\s*\.?\s*s|m\s*\.?\s*a|master)/.test(p)) return 'masteral';
  if (/(^|\s)(phd|ph\.?\s*d|dr|doctor|doctoral|doctorate)/.test(p)) return 'doctorate';
  if (p.includes('master')) return 'masteral';
  if (p.includes('doctor')) return 'doctorate';
  return '';
}

function roleMatches(rateType: string, wantedRole: string) {
  const rt = norm(rateType);
  const rw = norm(wantedRole);
  const isChair = (x: string) => x.includes('chair'); // chair / chairperson
  const isPanelMember = (x: string) => x.includes('panel') && !isChair(x); // exclude chair
  const isAdviser = (x: string) => x.includes('advis'); // adviser/advisor
  if (isChair(rw)) return isChair(rt);
  if (isPanelMember(rw)) return isPanelMember(rt);
  if (isAdviser(rw)) return isAdviser(rt);
  return rt.includes(rw) || rw.includes(rt);
}

// Preferred: when backend provides program_level ("Masteral" | "Doctorate")
export function getMemberReceivableByProgramLevel(
  paymentRates: PaymentRateRow[] | any[],
  programLevel: string | null | undefined,
  defenseType: string | null | undefined,
  role: string
): number | null {
  if (!Array.isArray(paymentRates) || !programLevel || !defenseType || !role) return null;
  const pl = normalizeProgramLevelStrict(programLevel) || normalizeProgramLevelLoose(programLevel);
  const dt = normalizeDefenseType(defenseType);
  if (!pl || !dt) return null;

  const match = paymentRates.find((r: any) => {
    const rpl = normalizeProgramLevelStrict(r.program_level) || normalizeProgramLevelLoose(r.program_level);
    const rdt = normalizeDefenseType(r.defense_type);
    return rpl === pl && rdt === dt && roleMatches(r.type || '', role);
  });

  if (!match) return null;
  const amt = Number(match.amount);
  return Number.isFinite(amt) ? amt : null;
}

// Fallback: infer level from program string when program_level is missing
export function getMemberReceivable(
  paymentRates: PaymentRateRow[] | any[],
  program: string | null | undefined,
  defenseType: string | null | undefined,
  role: string
): number | null {
  if (!Array.isArray(paymentRates) || !program || !defenseType || !role) return null;

  const plWanted = normalizeProgramLevelLoose(program);
  const dtWanted = normalizeDefenseType(defenseType);
  if (!plWanted || !dtWanted) return null;

  const match = paymentRates.find((r: any) => {
    const rpl = normalizeProgramLevelStrict(r.program_level) || normalizeProgramLevelLoose(r.program_level);
    const rdt = normalizeDefenseType(r.defense_type);
    return rpl === plWanted && rdt === dtWanted && roleMatches(r.type || '', role);
  });

  if (!match) return null;
  const amt = Number(match.amount);
  return Number.isFinite(amt) ? amt : null;
}

export function findPanelMember(list: any[], value?: string | number | null) {
  if (!value || !Array.isArray(list)) return null;
  const v = String(value).trim();
  if (!v) return null;

  // exact id match
  const byId = list.find((p: any) => String(p.id) === v);
  if (byId) return byId;

  // numeric id suffix/equality
  if (/^\d+$/.test(v)) {
    const byNumeric = list.find(
      (p: any) => String(p.id) === v || String(p.id).endsWith(`-${v}`)
    );
    if (byNumeric) return byNumeric;
  }

  // name match
  const lower = v.toLowerCase();
  return list.find((p: any) => String(p.name || '').trim().toLowerCase() === lower) || null;
}

// Exact-type matcher (use when you know the precise PaymentRate.type, e.g. "Panel Member 1")
export function getReceivableByType(
  paymentRates: PaymentRateRow[] | any[],
  programLevel: string | null | undefined,
  defenseType: string | null | undefined,
  typeWanted: string
): number | null {
  if (!Array.isArray(paymentRates) || !programLevel || !defenseType || !typeWanted) return null;
  const pl = normalizeProgramLevelStrict(programLevel) || normalizeProgramLevelLoose(programLevel);
  const dt = normalizeDefenseType(defenseType);
  if (!pl || !dt) return null;

  const typeNorm = String(typeWanted).trim().toLowerCase();
  const match = paymentRates.find((r: any) => {
    const rpl = normalizeProgramLevelStrict(r.program_level) || normalizeProgramLevelLoose(r.program_level);
    const rdt = normalizeDefenseType(r.defense_type);
    const rty = String(r.type || '').trim().toLowerCase();
    return rpl === pl && rdt === dt && rty === typeNorm;
  });

  if (!match) return null;
  const amt = Number(match.amount);
  return Number.isFinite(amt) ? amt : null;
}