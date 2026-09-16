/**
 * src/utils/evidencePack.js
 * 
 * Evidence Pack Builder & Finding Lifecycle Manager.
 * 
 * CORE VALUE DIFFERENTIATOR:
 * Packages contract clause snippet, page reference, invoice row reference,
 * transparent math, finding status, and customer-facing explanation note.
 */

export const FINDING_STATUSES = {
  DRAFT: 'DRAFT',
  VERIFIED: 'VERIFIED',
  DISPUTED: 'DISPUTED',
  CUSTOMER_BILLED: 'CUSTOMER_BILLED',
  RECOVERED: 'RECOVERED',
};

export function createEvidencePack({ contractSummary, invoiceSummary, reconciliationResult }) {
  return {
    packId: `EVP-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    contract: {
      title: contractSummary.title || 'Master Services Agreement',
      vendor: contractSummary.vendorName,
      client: contractSummary.clientName,
      currency: contractSummary.currency,
      termsLockedAt: contractSummary.lockedAt,
    },
    invoice: {
      fileCount: invoiceSummary.fileCount || 1,
      totalRowsAudited: invoiceSummary.totalRows || 0,
      totalBilledAmount: invoiceSummary.totalBilled || 0,
    },
    auditSummary: {
      totalDiscrepanciesFound: reconciliationResult.totalFindings || 0,
      totalRecoverableRevenue: reconciliationResult.totalRecoverableLeakage || 0,
      currency: reconciliationResult.currency || 'USD',
    },
    findings: reconciliationResult.findings || [],
  };
}

/**
 * Generate CSV export data representation of findings.
 */
export function formatFindingsToCsvData(findings) {
  if (!Array.isArray(findings)) return [];
  return findings.map((f, i) => ({
    'Finding ID': f.findingId,
    'Rule Category': f.ruleCategory,
    'Severity': f.severity,
    'Status': f.status,
    'Invoice No': f.invoiceReference?.invoiceNumber || '',
    'Invoice Item': f.invoiceReference?.itemDescription || '',
    'Billed Rate': f.invoiceReference?.billedRate || 0,
    'Expected Rate': f.expectedValues?.expectedRate || 0,
    'Currency': f.expectedValues?.currency || '',
    'Recoverable Variance': f.calculation?.varianceAmount || 0,
    'Contract Clause Snippet': f.contractReference?.clauseSnippet || '',
    'Contract Page Ref': f.contractReference?.pageNumber || '',
    'Recommended Recovery Action': f.recommendedAction || '',
    'Customer Explanation Note': f.customerExplanationNote || '',
  }));
}
