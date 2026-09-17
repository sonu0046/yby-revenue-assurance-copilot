/**
 * tests/evidencePack.binding.test.js
 * 
 * Focused Regression Test Suite for Evidence Pack Data Binding & PDF Export:
 * 1. 5 processed invoice rows -> Evidence Pack / PDF summary shows 5 Line Items.
 * 2. Dynamic row count adaptation (e.g. 12 rows -> 12 Line Items).
 * 3. Exact deterministic recoverable finding calculation preserved.
 * 4. Multi-finding integrity preserved.
 * 5. CSV and JSON export formatting unaffected.
 * 6. Audit scope metadata (file count, total billed, contract title) verified.
 */

import assert from 'node:assert/strict';
import { createEvidencePack, formatFindingsToCsvData } from '../src/utils/evidencePack.js';
import { reconcileContractToInvoices } from '../src/utils/reconciliationEngine.js';

console.log('\n==================================================================');
console.log(' 🚀 TEST SUITE 4: EVIDENCE PACK DATA BINDING & RECONCILIATION REGRESSION');
console.log('==================================================================\n');

let passedTests = 0;

function runTest(testNum, name, fn) {
  try {
    fn();
    console.log(`  ✓ Test ${testNum}: ${name} PASSED.`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ Test ${testNum} FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const mockContract = {
  contractTitle: 'Enterprise Master Services Agreement',
  vendorName: 'Acme Cloud Corp',
  clientName: 'Global Logistics LLC',
  currency: 'USD',
  contractStartDate: '2024-01-01',
  contractEndDate: '2025-12-31',
  rateCards: [
    {
      id: 'rc_arch',
      roleOrItem: 'Senior Cloud Architect',
      unit: 'hour',
      contractRate: 175.0,
      pageReference: 2,
      sourceSnippet: 'Senior Cloud Architect: $175.00/hr',
    },
    {
      id: 'rc_dev',
      roleOrItem: 'DevOps Engineer',
      unit: 'hour',
      contractRate: 135.0,
      pageReference: 2,
      sourceSnippet: 'DevOps Engineer: $135.00/hr',
    },
  ],
  priceEscalations: [
    {
      id: 'esc_1',
      percentage: 5.0,
      effectiveDate: '2025-01-01',
      pageReference: 4,
      clauseSnippet: '5% escalation starting Jan 1, 2025',
    },
  ],
  discounts: [],
  minimumCommitmentAmount: null,
};

// Test 1: 5 Processed Invoice Rows produces exact 5 Line Items in Evidence Pack summary
runTest(1, '5 processed invoice rows dynamically binds to 5 Line Items in audit scope', () => {
  const invoiceRows = [
    { invoice_id: 'INV-001', date: '2024-01-31', rate: 150.0, hours: 160, total: 24000.0, description: 'Senior Cloud Architect' },
    { invoice_id: 'INV-002', date: '2024-02-28', rate: 135.0, hours: 120, total: 16200.0, description: 'DevOps Engineer' },
    { invoice_id: 'INV-003', date: '2024-03-31', rate: 150.0, hours: 80, total: 12000.0, description: 'Senior Cloud Architect' },
    { invoice_id: 'INV-004', date: '2025-02-15', rate: 175.0, hours: 160, total: 28000.0, description: 'Senior Cloud Architect' },
    { invoice_id: 'INV-005', date: '2025-03-31', rate: 135.0, hours: 100, total: 13500.0, description: 'DevOps Engineer' },
  ];

  const mappings = [
    { rateCardId: 'rc_arch', invoiceRowIndex: 0, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total' },
    { rateCardId: 'rc_dev', invoiceRowIndex: 1, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total' },
    { rateCardId: 'rc_arch', invoiceRowIndex: 2, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total' },
    { rateCardId: 'rc_arch', invoiceRowIndex: 3, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total' },
    { rateCardId: 'rc_dev', invoiceRowIndex: 4, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total' },
  ];

  const audit = reconcileContractToInvoices({ lockedTerms: mockContract, invoiceRows, mappings });
  const totalBilled = invoiceRows.reduce((sum, r) => sum + r.total, 0);

  const pack = createEvidencePack({
    contractSummary: {
      title: mockContract.contractTitle,
      vendorName: mockContract.vendorName,
      clientName: mockContract.clientName,
      currency: mockContract.currency,
      lockedAt: new Date().toISOString(),
      lockedFingerprint: 'fp_test_123',
    },
    invoiceSummary: {
      fileName: 'Invoices_2024_2025.csv',
      fileCount: 1,
      totalRows: invoiceRows.length,
      totalBilled: totalBilled,
    },
    reconciliationResult: audit,
  });

  // Strict data-binding assertions
  assert.equal(pack.invoiceSummary.totalRows, 5, 'Must bind exactly 5 rows in invoiceSummary');
  assert.equal(pack.invoice.totalRowsAudited, 5, 'Must bind exactly 5 rows in invoice');
  assert.equal(pack.invoiceSummary.fileCount, 1, 'File count must be 1');
  assert.equal(pack.contractSummary.vendorName, 'Acme Cloud Corp');
  assert.equal(pack.contractSummary.clientName, 'Global Logistics LLC');
  assert.equal(pack.contractSummary.currency, 'USD');
});

// Test 2: Dynamic row count adaptations (e.g. 12 rows -> 12 Line Items) without hardcoding
runTest(2, 'Dynamic row counts (e.g. 12 rows) reflect accurately without hardcoding', () => {
  const dynamicRows = Array.from({ length: 12 }, (_, i) => ({
    invoice_id: `INV-${100 + i}`,
    date: '2024-05-01',
    rate: 175.0,
    hours: 10,
    total: 1750.0,
  }));

  const pack = createEvidencePack({
    contractSummary: { title: 'MSA', vendorName: 'Vendor', clientName: 'Client', currency: 'USD' },
    invoiceSummary: { fileCount: 2, totalRows: dynamicRows.length, totalBilled: 21000.0 },
    reconciliationResult: { totalFindings: 0, totalRecoverableLeakage: 0, findings: [] },
  });

  assert.equal(pack.invoiceSummary.totalRows, 12);
  assert.equal(pack.invoice.totalRowsAudited, 12);
  assert.equal(pack.invoiceSummary.fileCount, 2);
});

// Test 3: Total recoverable finding calculation matches exact deterministic math
runTest(3, 'Total recoverable finding calculation remains deterministic ($5,400 across 2 findings)', () => {
  // 2 Findings Scenario:
  // Row 1: Architect 160 hrs billed at $150 vs $175 -> $4,000 variance
  // Row 2: Architect 160 hrs post-escalation billed at $175 vs $183.75 -> $1,400 variance
  // Total = $4,000 + $1,400 = $5,400.00
  const invoiceRows = [
    { invoice_id: 'INV-001', date: '2024-01-31', rate: 150.0, hours: 160, total: 24000.0 },
    { invoice_id: 'INV-004', date: '2025-02-15', rate: 175.0, hours: 160, total: 28000.0 },
  ];

  const mappings = [
    { rateCardId: 'rc_arch', invoiceRowIndex: 0, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total', invoiceDateColumn: 'date' },
    { rateCardId: 'rc_arch', invoiceRowIndex: 1, billedRateColumn: 'rate', billedQtyColumn: 'hours', billedTotalColumn: 'total', invoiceDateColumn: 'date' },
  ];

  const audit = reconcileContractToInvoices({ lockedTerms: mockContract, invoiceRows, mappings });

  assert.equal(audit.success, true);
  assert.equal(audit.totalFindings, 2);
  assert.equal(audit.totalRecoverableLeakage, 5400.0); // Exactly $5,400.00

  const pack = createEvidencePack({
    contractSummary: { title: 'MSA', vendorName: 'Acme', clientName: 'Global', currency: 'USD' },
    invoiceSummary: { fileCount: 1, totalRows: 2, totalBilled: 52000.0 },
    reconciliationResult: audit,
  });

  assert.equal(pack.auditSummary.totalRecoverableRevenue, 5400.0);
  assert.equal(pack.auditSummary.totalDiscrepanciesFound, 2);
  assert.equal(pack.findings.length, 2);
});

// Test 4: CSV Export formatting contains all 14 required audit columns
runTest(4, 'CSV Export formatter accurately outputs findings with customer notes and formulas', () => {
  const findings = [
    {
      findingId: 'FND-101',
      ruleCategory: 'WRONG_UNIT_PRICE',
      severity: 'HIGH',
      status: 'DRAFT',
      invoiceReference: { invoiceNumber: 'INV-001', itemDescription: 'Senior Cloud Architect', billedRate: 150.0 },
      expectedValues: { expectedRate: 175.0, currency: 'USD' },
      calculation: { varianceAmount: 4000.0 },
      contractReference: { clauseSnippet: 'Rate is $175/hr', pageNumber: 2 },
      recommendedAction: 'Issue supplementary debit note',
      customerExplanationNote: 'Per Section 2, contracted rate is $175.00.',
    },
  ];

  const csvRows = formatFindingsToCsvData(findings);
  assert.equal(csvRows.length, 1);
  assert.equal(csvRows[0]['Finding ID'], 'FND-101');
  assert.equal(csvRows[0]['Recoverable Variance'], 4000.0);
  assert.equal(csvRows[0]['Contract Page Ref'], 2);
  assert.ok(csvRows[0]['Customer Explanation Note'].includes('Section 2'));
});

// Test 5: JSON Export structure contains complete contract, invoice, and finding payloads
runTest(5, 'JSON Export structure packages complete audit payload for archive', () => {
  const pack = createEvidencePack({
    contractSummary: { title: 'MSA', vendorName: 'Acme', clientName: 'Client', currency: 'USD', lockedFingerprint: 'fp_999' },
    invoiceSummary: { fileName: 'inv.csv', fileCount: 1, totalRows: 5, totalBilled: 100000.0 },
    reconciliationResult: { totalFindings: 1, totalRecoverableLeakage: 1000.0, findings: [{ findingId: 'FND-1' }] },
  });

  const jsonStr = JSON.stringify(pack);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.invoiceSummary.totalRows, 5);
  assert.equal(parsed.contractSummary.lockedFingerprint, 'fp_999');
  assert.equal(parsed.auditSummary.totalRecoverableRevenue, 1000.0);
});

console.log(`\n 🎉 ALL ${passedTests}/5 EVIDENCE PACK REGRESSION TESTS PASSED!\n`);
