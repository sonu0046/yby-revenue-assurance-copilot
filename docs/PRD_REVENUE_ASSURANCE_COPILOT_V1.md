# 📘 PRODUCT REQUIREMENTS DOCUMENT (PRD)
# YBY Revenue Assurance Copilot — V1

**Product:** YBY Revenue Assurance Copilot  
**Version:** 1.0.0 (MVP)  
**Governance Protocol:** 4-Brothers Commercial & Technical Standard (G6-B Final Locked)  
**Classification:** B2B Financial Revenue Audit & HITL Reconciliation Platform  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
B2B companies (especially IT service agencies, consultancies, staffing firms, and enterprise suppliers) routinely lose **1% to 5% of top-line revenue** to undetected contract-to-invoice billing discrepancies:
- **Missed Price Escalations:** 5% annual CPI or contractual rate increases not applied upon anniversary dates.
- **Incorrect Discount Durations:** Intro discounts (e.g. 15% off first 3 months) continuing indefinitely on monthly billing runs.
- **Wrong Unit Rates / Rate Cards:** Invoicing senior consultants at junior rates or outdated master service agreement (MSA) rates.
- **Missing Billable Add-ons:** Billable cloud infrastructure, overtime, minimum commitment hours, or support retainers omitted from invoices.
- **Contract-Period & Renewal Mismatches:** Invoicing after contract expiry without applying renewal pricing terms.

### 1.2 The Solution
**YBY Revenue Assurance Copilot** is an independent, upload-first revenue audit workstation that extracts commercial terms from Contract PDFs, requires explicit Human Verification & Human Lock, matches contract terms to tabular Invoice data (CSV/XLSX), deterministically calculates financial leakage, and compiles an evidence-backed **Recovery Action & Evidence Pack**.

---

## 2. Core Value Flow: The 4-Stage Chain

$$\text{Detect} \longrightarrow \text{Prove} \longrightarrow \text{Calculate} \longrightarrow \text{Recover}$$

1. **Detect:** Extract commercial terms, rate cards, escalation dates, discounts, and billing rules.
2. **Prove:** Bind every detected discrepancy to the exact contract clause snippet, page number, and invoice row index.
3. **Calculate:** Execute 100% deterministic arithmetic (Zero AI financial calculation) exposing formula, expected amount, actual amount, and variance.
4. **Recover:** Generate ready-to-review recovery notes, supplementary invoice drafts, and dispute packages for the customer finance team.

---

## 3. Strict Architectural Invariants & Scope Boundaries

### 3.1 Non-Negotiable Privacy & Financial Safety Invariants
1. **Zero Invoice Data Transmission:** Tabular invoice files (CSV/XLSX), line items, customer names, and billed amounts **NEVER** leave the browser. Invoices are parsed and reconciled 100% locally in `reconciliation.worker.js`.
2. **AI Boundary Isolation:** Only minimized contract text blocks cross into the serverless AI proxy. Raw binary PDFs are processed locally via `PDF.js` in `contractParser.worker.js`.
3. **Zero AI Financial Math:** AI only provides structured *suggestions* for contract terms. All financial reconciliation calculations are executed by deterministic JavaScript functions.
4. **Human Lock State Machine:** No reconciliation or financial math can run until a human auditor explicitly reviews, edits if needed, and locks the contract terms (`isHumanLocked: true`). Any subsequent edit immediately invalidates downstream findings.
5. **ISO-4217 Currency Guard:** Contract and invoice currencies must resolve to unambiguous ISO-4217 codes (`USD`, `EUR`, `GBP`, `INR`). Mismatched currencies hard-block calculation; silent substitution is prohibited.

### 3.2 V1 Exclusions (Scope Guard)
- ❌ NO ERP/CRM/OAuth live integrations (V1 is upload-first).
- ❌ NO Scanned-PDF OCR (text-based PDFs only; image PDFs rejected gracefully).
- ❌ NO Invoice PDF parsing (Invoices must be structured CSV/XLSX).
- ❌ NO live FX currency conversion.
- ❌ NO autonomous customer emailing or automated banking ledger posting.
- ❌ NO multi-document amendment stacking (deferred to V1.1/V2).

---

## 4. V1 Workflow (Step 1 to Step 8)

```
[ Step 1: Upload Contract PDF ]
        │ (Browser memory ArrayBuffer)
[ Step 2: PDF.js Worker Parsing & Snippet Extraction ]
        │ (Sanitized snippets -> Serverless Proxy -> Zod Schema Validation)
[ Step 3: HITL Verification Screen & Human Lock ] ──> [ HUMAN_LOCKED 🔒 ]
        │
[ Step 4: Upload Invoice CSV/XLSX ]
        │ (Local in-browser PapaParse / XLSX)
[ Step 5: Currency Guard & Manual 1-to-1 Mapping ]
        │
[ Step 6: Deterministic Reconciliation Engine (8 Leakage Categories) ]
        │
[ Step 7: Transparent Evidence & Calculation Inspection ]
        │
[ Step 8: Export Recovery Action & Evidence Pack (PDF / Excel) ]
```

---

## 5. The 8 V1 Leakage Detection Rules

1. **Wrong Unit Price:** Billed unit rate is lower than contract rate card minimum.
2. **Missed Price Escalation:** Invoice date is past contract anniversary, but base year rate is still billed without contractual escalation percentage.
3. **Incorrect Discount:** Discount percentage exceeded contractual cap or billed after discount expiration date.
4. **Missing Billable Item:** Recurring retainer, platform fee, or contracted minimum commitment missing from billing period invoice.
5. **Quantity Mismatch:** Billed hours/units diverge from contracted cap or minimum billing threshold.
6. **Contract-Period Mismatch:** Invoice billing period falls outside active contract effective date range.
7. **Effective-Date Mismatch:** Prorated billing error for mid-month contract start.
8. **Renewal Pricing Mismatch:** Old contract pricing applied post-renewal expiration.

---

## 6. Finding Record & Evidence Pack Schema

Every discrepancy generates an immutable finding object:
```typescript
interface FindingRecord {
  findingId: string;
  ruleCategory: 'WRONG_UNIT_PRICE' | 'MISSED_ESCALATION' | 'INCORRECT_DISCOUNT' | 'MISSING_BILLABLE_ITEM' | 'QUANTITY_MISMATCH' | 'PERIOD_MISMATCH' | 'EFFECTIVE_DATE_MISMATCH' | 'RENEWAL_MISMATCH';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  contractReference: {
    pageNumber: number;
    clauseSnippet: string;
    termKey: string;
  };
  invoiceReference: {
    invoiceNumber: string;
    rowIndex: number;
    itemDescription: string;
    billedRate: number;
    billedQuantity: number;
    billedTotal: number;
  };
  expectedValues: {
    expectedRate: number;
    expectedTotal: number;
    currency: string;
  };
  calculation: {
    formula: string;
    varianceAmount: number; // Positive = Underbilled (Recoverable Revenue)
  };
  status: 'DRAFT' | 'VERIFIED' | 'DISPUTED' | 'CUSTOMER_BILLED' | 'RECOVERED';
  recommendedAction: string;
  customerExplanationNote: string;
  auditTimestamp: string;
}
```

---

## 7. Commercial Model & Pricing Hypotheses

| Plan Tier | Price | Monthly Quota | Features |
|---|---|---|---|
| **Free Trial** | \$0 | 3 Contract Audits / month | Up to 1,000 invoice rows, standard 8-rule audit, screen review. |
| **Pro (Growth)** | \$79 / month | 25 Contract Audits / month | Up to 25,000 invoice rows, Evidence Pack PDF/Excel export, audit log. |
| **Business (Scale)** | \$199 / month | 100 Contract Audits / month | Up to 100,000 invoice rows, multi-currency support, custom dispute templates. |

---

## 8. Governance Status & Technical Readiness
- **Blueprint Status:** 4-Brothers Unanimously Approved 🔒
- **Architecture Status:** G6-B Final Locked 🔒
- **PRD Status:** Approved & Version Controlled
