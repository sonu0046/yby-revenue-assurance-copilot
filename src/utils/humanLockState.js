/**
 * src/utils/humanLockState.js
 * 
 * HITL Finite State Machine & Lock Invalidation Controller.
 * 
 * STATE FLOW:
 * EXTRACTED -> REVIEW_REQUIRED -> EDITED (optional) -> HUMAN_LOCKED -> CALCULATION_ALLOWED
 * 
 * CRITICAL INVARIANT:
 * Any subsequent edit to locked commercial terms invalidates downstream findings
 * and reverts state to REVIEW_REQUIRED.
 */

export const HITL_STATES = {
  IDLE: 'IDLE',
  EXTRACTED: 'EXTRACTED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  EDITED: 'EDITED',
  HUMAN_LOCKED: 'HUMAN_LOCKED',
  CALCULATION_ALLOWED: 'CALCULATION_ALLOWED',
};

/**
 * Generate deterministic signature of commercial terms for integrity checking.
 * Safe for both browser and Node runtime environments.
 */
export function computeTermsFingerprint(terms) {
  if (!terms) return '';
  const normalized = JSON.stringify(terms, Object.keys(terms).sort());
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  return `fp_${Math.abs(hash1).toString(16)}${Math.abs(hash2).toString(16)}`;
}

export class HumanLockManager {
  constructor(initialTerms = null) {
    this.state = HITL_STATES.IDLE;
    this.terms = initialTerms;
    this.lockedTerms = null;
    this.lockedFingerprint = null;
    this.lockedAt = null;
    this.lockedBy = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.getState()));
  }

  getState() {
    return {
      state: this.state,
      isLocked: this.state === HITL_STATES.HUMAN_LOCKED || this.state === HITL_STATES.CALCULATION_ALLOWED,
      canCalculate: this.state === HITL_STATES.HUMAN_LOCKED || this.state === HITL_STATES.CALCULATION_ALLOWED,
      terms: this.terms,
      lockedTerms: this.lockedTerms,
      lockedFingerprint: this.lockedFingerprint,
      lockedAt: this.lockedAt,
    };
  }

  /**
   * Transition to EXTRACTED upon receiving AI or Regex suggestions.
   */
  loadExtraction(extractedTerms) {
    this.terms = extractedTerms;
    this.lockedTerms = null;
    this.lockedFingerprint = null;
    this.lockedAt = null;
    this.state = HITL_STATES.REVIEW_REQUIRED;
    this.notify();
    return this.getState();
  }

  /**
   * User edits a term on the verification screen.
   */
  updateTermField(field, value) {
    if (!this.terms) return;
    this.terms = {
      ...this.terms,
      [field]: value,
    };

    // If currently locked, editing immediately invalidates lock
    if (this.state === HITL_STATES.HUMAN_LOCKED || this.state === HITL_STATES.CALCULATION_ALLOWED) {
      this.lockedTerms = null;
      this.lockedFingerprint = null;
      this.lockedAt = null;
      this.state = HITL_STATES.REVIEW_REQUIRED;
    } else {
      this.state = HITL_STATES.EDITED;
    }

    this.notify();
    return this.getState();
  }

  /**
   * User explicitly confirms and locks commercial terms.
   */
  lockTerms(userIdentifier = 'auditor') {
    if (!this.terms) {
      throw new Error('Cannot lock empty contract terms.');
    }

    const fingerprint = computeTermsFingerprint(this.terms);
    this.lockedTerms = JSON.parse(JSON.stringify(this.terms));
    this.lockedFingerprint = fingerprint;
    this.lockedAt = new Date().toISOString();
    this.lockedBy = userIdentifier;
    this.state = HITL_STATES.HUMAN_LOCKED;

    this.notify();
    return this.getState();
  }

  /**
   * Validate that calculation is permitted on the current terms.
   */
  assertCalculationAllowed() {
    if (this.state !== HITL_STATES.HUMAN_LOCKED && this.state !== HITL_STATES.CALCULATION_ALLOWED) {
      return {
        allowed: false,
        error: `Calculation blocked: Current state is "${this.state}". Commercial terms must be explicitly Human-Locked before financial reconciliation.`,
      };
    }

    const currentFp = computeTermsFingerprint(this.terms);
    if (currentFp !== this.lockedFingerprint) {
      this.state = HITL_STATES.REVIEW_REQUIRED;
      this.notify();
      return {
        allowed: false,
        error: 'Calculation blocked: Contract terms were modified after Human Lock. Please review and re-lock terms.',
      };
    }

    return { allowed: true, lockedTerms: this.lockedTerms };
  }
}
