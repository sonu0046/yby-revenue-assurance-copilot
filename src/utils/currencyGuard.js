/**
 * src/utils/currencyGuard.js
 * 
 * ISO-4217 Currency Validation & Mismatch Blocker Guard.
 * 
 * FINANCIAL SAFETY INVARIANTS:
 * 1. Contract currency and invoice currency must match explicitly.
 * 2. Ambiguous or mismatched currencies immediately hard-block calculation.
 * 3. Silent currency substitution or automated conversion is strictly prohibited in V1.
 */

export const CURRENCY_SYMBOLS_MAP = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '₹': 'INR',
  'rs': 'INR',
  'rs.': 'INR',
  'inr': 'INR',
  'usd': 'USD',
  'eur': 'EUR',
  'gbp': 'GBP',
  'aud': 'AUD',
  'cad': 'CAD',
  'sgd': 'SGD',
  'aed': 'AED',
};

export const SUPPORTED_ISO_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

/**
 * Normalize and resolve a raw currency string or symbol to ISO-4217 code.
 */
export function resolveCurrencyCode(rawCurrency) {
  if (!rawCurrency || typeof rawCurrency !== 'string') {
    return { isValid: false, code: null, error: 'Currency is missing or not a string.' };
  }

  const cleaned = rawCurrency.trim().toUpperCase();

  if (SUPPORTED_ISO_CURRENCIES.includes(cleaned)) {
    return { isValid: true, code: cleaned, error: null };
  }

  const lower = rawCurrency.trim().toLowerCase();
  if (CURRENCY_SYMBOLS_MAP[lower]) {
    return { isValid: true, code: CURRENCY_SYMBOLS_MAP[lower], error: null };
  }

  return {
    isValid: false,
    code: null,
    error: `Unsupported or ambiguous currency code: "${rawCurrency}". Supported ISO codes are: ${SUPPORTED_ISO_CURRENCIES.join(', ')}`,
  };
}

/**
 * Validate that contract currency and invoice currency are identical.
 * Hard-blocks calculation if mismatch or ambiguity exists.
 */
export function validateReconciliationCurrency(contractCurrencyRaw, invoiceCurrencyRaw) {
  const contractRes = resolveCurrencyCode(contractCurrencyRaw);
  if (!contractRes.isValid) {
    return {
      canProceed: false,
      blockerCode: 'INVALID_CONTRACT_CURRENCY',
      message: `Contract currency error: ${contractRes.error}`,
      contractCurrency: null,
      invoiceCurrency: null,
    };
  }

  const invoiceRes = resolveCurrencyCode(invoiceCurrencyRaw);
  if (!invoiceRes.isValid) {
    return {
      canProceed: false,
      blockerCode: 'INVALID_INVOICE_CURRENCY',
      message: `Invoice currency error: ${invoiceRes.error}`,
      contractCurrency: contractRes.code,
      invoiceCurrency: null,
    };
  }

  if (contractRes.code !== invoiceRes.code) {
    return {
      canProceed: false,
      blockerCode: 'CURRENCY_MISMATCH_BLOCKED',
      message: `Currency Mismatch Blocked: Contract is denominated in ${contractRes.code} while Invoice is denominated in ${invoiceRes.code}. Cross-currency reconciliation without verified rate agreement is prohibited.`,
      contractCurrency: contractRes.code,
      invoiceCurrency: invoiceRes.code,
    };
  }

  return {
    canProceed: true,
    blockerCode: null,
    message: `Currency verified: Both contract and invoice match ISO-4217 code ${contractRes.code}.`,
    contractCurrency: contractRes.code,
    invoiceCurrency: invoiceRes.code,
  };
}

/**
 * Convenient boolean wrapper for UI checks.
 */
export function validateCurrencyMatch(contractCurrency, invoiceCurrency) {
  const result = validateReconciliationCurrency(contractCurrency, invoiceCurrency);
  return {
    valid: result.canProceed,
    ...result,
  };
}
