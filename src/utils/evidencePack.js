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

export function createEvidencePack({ contractSummary = {}, invoiceSummary = {}, reconciliationResult = {} }) {
  const processedRowCount = invoiceSummary.totalRows ?? invoiceSummary.totalRowsAudited ?? (invoiceSummary.rows?.length || 0);
  const totalBilled = invoiceSummary.totalBilled ?? invoiceSummary.totalBilledAmount ?? 0;
  const fileCount = invoiceSummary.fileCount || 1;

  return {
    packId: `EVP-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    contractSummary: {
      title: contractSummary.title || 'Master Services Agreement',
      vendorName: contractSummary.vendorName || contractSummary.vendor || '',
      clientName: contractSummary.clientName || contractSummary.client || '',
      currency: contractSummary.currency || reconciliationResult.currency || 'USD',
      lockedAt: contractSummary.lockedAt || contractSummary.termsLockedAt || '',
      lockedFingerprint: contractSummary.lockedFingerprint || '',
    },
    invoiceSummary: {
      fileName: invoiceSummary.fileName || '',
      fileCount,
      totalRows: processedRowCount,
      totalBilled,
    },
    contract: {
      title: contractSummary.title || 'Master Services Agreement',
      vendor: contractSummary.vendorName || contractSummary.vendor || '',
      client: contractSummary.clientName || contractSummary.client || '',
      currency: contractSummary.currency || reconciliationResult.currency || 'USD',
      termsLockedAt: contractSummary.lockedAt || contractSummary.termsLockedAt || '',
    },
    invoice: {
      fileCount,
      totalRowsAudited: processedRowCount,
      totalBilledAmount: totalBilled,
    },
    auditSummary: {
      totalDiscrepanciesFound: reconciliationResult.totalFindings ?? (reconciliationResult.findings?.length || 0),
      totalRecoverableRevenue: reconciliationResult.totalRecoverableLeakage || 0,
      currency: reconciliationResult.currency || contractSummary.currency || 'USD',
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
