// Robust, self-contained helpers for per-member receivables

export type PaymentRateRow = {
  program_level: string;
  type: string;
  defense_type: string;
  amount: number | string;
};

export function normalizeDefenseType(s?: string | null): 'proposal' | 'prefinal' | 'final' | '' {
  if (!s) return '';
  const lower = s.toLowerCase().trim();
  if (lower.includes('proposal')) return 'proposal';
  if (lower.includes('pre') || lower.includes('prefinal')) return 'prefinal';
  if (lower.includes('final')) return 'final';
  return '';
}

/**
 * Get receivable amount by program level, defense type, and role
 * FIXED: Maps frontend roles to database types correctly
 */
export function getMemberReceivableByProgramLevel(
  paymentRates: PaymentRateRow[] | any[],
  programLevel?: string | null,
  defenseType?: string | null,
  role?: string | null
): number | null {
  if (!programLevel || !defenseType || !role) return null;

  const normalizedDefenseType = normalizeDefenseType(defenseType);
  if (!normalizedDefenseType) return null;

  // Map role to exact payment rate type
  let rateType = role;
  if (role === 'Chairperson') {
    rateType = 'Panel Chair';
  }

  const rate = paymentRates.find(
    r =>
      r.program_level === programLevel &&
      r.defense_type === defenseType &&
      r.type === rateType
  );

  return rate ? Number(rate.amount) : null;
}

/**
 * Find a panel member by ID or name
 */
export function findPanelMember(
  members: Array<{ id: string; name: string; email?: string }> | null | undefined,
  value?: string | null
): { id: string; name: string; email?: string } | null {
  if (!value || !Array.isArray(members)) return null;
  const v = String(value).trim();
  if (!v) return null;

  // exact id match
  const byId = members.find((p: any) => String(p.id) === v);
  if (byId) return byId;

  // numeric id suffix/equality
  if (/^\d+$/.test(v)) {
    const byNumeric = members.find(
      (p: any) => String(p.id) === v || String(p.id).endsWith(`-${v}`)
    );
    if (byNumeric) return byNumeric;
  }

  // name match
  const lower = v.toLowerCase();
  return members.find((p: any) => String(p.name || '').trim().toLowerCase() === lower) || null;
}

/**
 * Legacy function - kept for backwards compatibility
 * Use getMemberReceivableByProgramLevel instead
 */
export function getMemberReceivable(
  rates: PaymentRateRow[] | any[],
  program?: string | null,
  defenseType?: string | null,
  role?: string | null
): number | null {
  // This should not be used anymore, but keeping for safety
  return null;
}