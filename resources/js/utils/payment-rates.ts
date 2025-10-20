/**
 * Payment Rates Utility
 * 
 * This module provides helper functions for matching committee member roles
 * to payment rates and calculating receivable amounts.
 */

export type ProgramLevel = 'Masteral' | 'Doctorate';
export type DefenseType = 'Proposal' | 'Pre-final' | 'Final';
export type MemberRole = 'Adviser' | 'Panel Chair' | 'Panel Member 1' | 'Panel Member 2' | 'Panel Member 3' | 'Panel Member 4';

export interface PaymentRate {
  id?: number;
  program_level: ProgramLevel;
  type: string;
  defense_type: DefenseType;
  amount: number | string;
}

export interface CommitteeMember {
  id?: number | null;
  name: string;
  email?: string | null;
  role?: string;
  assigned_name?: string | null;
  status?: 'pending' | 'assigned' | 'confirmed';
}

/**
 * Normalizes program level to standard format
 * Handles variations like "MS", "PhD", "Masteral", "Doctorate"
 * 
 * @param level - The program level string to normalize
 * @returns Normalized program level or null if invalid
 */
export function normalizeProgramLevelLoose(level?: string | null): ProgramLevel | null {
  if (!level) return null;
  
  const normalized = level.toLowerCase().trim();
  
  // Masteral variations
  if (
    normalized.includes('master') ||
    normalized === 'ms' ||
    normalized === 'm.s.' ||
    normalized.includes('masteral')
  ) {
    return 'Masteral';
  }
  
  // Doctorate variations
  if (
    normalized.includes('doctor') ||
    normalized === 'phd' ||
    normalized === 'ph.d.' ||
    normalized.includes('doctorate')
  ) {
    return 'Doctorate';
  }
  
  return null;
}

/**
 * Normalizes defense type to standard format
 * Handles variations like "Proposal Defense", "Pre-Final", "Final Defense"
 * 
 * @param type - The defense type string to normalize
 * @returns Normalized defense type or null if invalid
 */
export function normalizeDefenseType(type?: string | null): DefenseType | null {
  if (!type) return null;
  
  const normalized = type.toLowerCase().trim();
  
  // Proposal variations
  if (
    normalized.includes('proposal') ||
    normalized === 'prop'
  ) {
    return 'Proposal';
  }
  
  // Pre-final variations
  if (
    normalized.includes('pre-final') ||
    normalized.includes('prefinal') ||
    normalized.includes('pre final')
  ) {
    return 'Pre-final';
  }
  
  // Final variations
  if (
    normalized.includes('final') && 
    !normalized.includes('pre')
  ) {
    return 'Final';
  }
  
  return null;
}

/**
 * Checks if a committee member role matches a payment rate type
 * 
 * @param memberRole - The role of the committee member
 * @param rateType - The payment rate type
 * @returns True if the role matches the rate type
 */
export function roleMatches(memberRole?: string | null, rateType?: string | null): boolean {
  if (!memberRole || !rateType) return false;
  
  const role = memberRole.toLowerCase().trim();
  const type = rateType.toLowerCase().trim();
  
  // Exact match after normalization
  if (role === type) return true;
  
  // Adviser variations
  if (
    (role.includes('adviser') || role.includes('advisor')) &&
    (type.includes('adviser') || type.includes('advisor'))
  ) {
    return true;
  }
  
  // Panel Chair variations
  if (
    (role.includes('chair') || role === 'chairperson') &&
    type.includes('chair')
  ) {
    return true;
  }
  
  // Panel Member variations
  if (role.includes('panel') && type.includes('panel')) {
    // Check for specific panel member numbers
    const roleMatch = role.match(/panel\s*(?:member\s*)?(\d+)/i);
    const typeMatch = type.match(/panel\s*member\s*(\d+)/i);
    
    if (roleMatch && typeMatch) {
      return roleMatch[1] === typeMatch[1];
    }
    
    // Generic panel member match (for backward compatibility)
    if (!roleMatch && !typeMatch) {
      return true;
    }
  }
  
  // Panelist variations (treat as panel members)
  if (role.includes('panelist') && type.includes('panel member')) {
    const roleMatch = role.match(/panelist\s*(\d+)/i);
    const typeMatch = type.match(/panel\s*member\s*(\d+)/i);
    
    if (roleMatch && typeMatch) {
      return roleMatch[1] === typeMatch[1];
    }
  }
  
  return false;
}

/**
 * Gets the receivable amount for a committee member based on their role
 * 
 * @param member - The committee member
 * @param programLevel - The program level (Masteral/Doctorate)
 * @param defenseType - The defense type (Proposal/Pre-final/Final)
 * @param paymentRates - Array of payment rates
 * @returns The receivable amount or null if not found
 */
export function getMemberReceivable(
  member: CommitteeMember,
  programLevel: string | null | undefined,
  defenseType: string | null | undefined,
  paymentRates: PaymentRate[]
): number | null {
  if (!member.role) return null;
  
  const normalizedProgram = normalizeProgramLevelLoose(programLevel);
  const normalizedDefense = normalizeDefenseType(defenseType);
  
  if (!normalizedProgram || !normalizedDefense) return null;
  
  // Find matching payment rate
  const matchingRate = paymentRates.find(rate => {
    return (
      rate.program_level === normalizedProgram &&
      rate.defense_type === normalizedDefense &&
      roleMatches(member.role, rate.type)
    );
  });
  
  if (!matchingRate) return null;
  
  // Convert amount to number if it's a string
  const amount = typeof matchingRate.amount === 'string' 
    ? parseFloat(matchingRate.amount) 
    : matchingRate.amount;
  
  return isNaN(amount) ? null : amount;
}

/**
 * Determines the status of a committee member assignment
 * 
 * @param member - The committee member
 * @returns Status string: 'Assigned' if member has a name, 'Pending confirmation' otherwise
 */
export function getMemberStatus(member: CommitteeMember): string {
  if (member.assigned_name || member.name) {
    return 'Assigned';
  }
  return 'Pending confirmation';
}

/**
 * Formats a PHP currency amount
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatPhp(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }
  
  return `₱${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Gets all committee members with their receivable amounts
 * 
 * @param members - Array of committee members
 * @param programLevel - The program level
 * @param defenseType - The defense type
 * @param paymentRates - Array of payment rates
 * @returns Array of members with calculated receivables
 */
export function getCommitteeMembersWithReceivables(
  members: CommitteeMember[],
  programLevel: string | null | undefined,
  defenseType: string | null | undefined,
  paymentRates: PaymentRate[]
) {
  return members.map(member => ({
    ...member,
    receivable: getMemberReceivable(member, programLevel, defenseType, paymentRates),
    status: getMemberStatus(member)
  }));
}
