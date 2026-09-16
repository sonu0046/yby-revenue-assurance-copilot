import React, { useState } from 'react';
import { LEAKAGE_CATEGORIES } from '../utils/reconciliationEngine.js';

export default function LeakageAuditDashboard({
  reconciliationResult,
  currency,
  onGenerateEvidencePack,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  if (!reconciliationResult) return null;

  const { totalFindings, totalRecoverableLeakage, findings, categorizedBreakdown } = reconciliationResult;

  const filteredFindings = findings.filter((f) => {
    const matchesCat = selectedCategory === 'ALL' || f.ruleCategory === selectedCategory;
    const matchesSev = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
    return matchesCat && matchesSev;
  });

  const categoryLabels = {
    [LEAKAGE_CATEGORIES.WRONG_UNIT_PRICE]: 'Wrong Unit Price',
    [LEAKAGE_CATEGORIES.MISSED_ESCALATION]: 'Missed Escalation',
    [LEAKAGE_CATEGORIES.INCORRECT_DISCOUNT]: 'Expired Discount',
    [LEAKAGE_CATEGORIES.MISSING_BILLABLE_ITEM]: 'Missing Item / Commitment Shortfall',
    [LEAKAGE_CATEGORIES.PERIOD_MISMATCH]: 'Period Mismatch',
    [LEAKAGE_CATEGORIES.QUANTITY_MISMATCH]: 'Quantity Mismatch',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Top Banner: Total Recoverable Revenue Summary */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-gray-900 to-gray-950 border border-emerald-500/40 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wide border border-emerald-500/30">
                Audit Results
              </span>
              <span className="text-xs text-gray-400 font-mono">100% Deterministic Code</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              <span className="text-emerald-400 font-mono">
                {currency} {totalRecoverableLeakage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              Recoverable Revenue Leakage identified across <strong className="text-white font-mono">{totalFindings}</strong> verified contractual discrepancies.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateEvidencePack}
            className="px-5 py-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>📑</span>
            Generate Audit Evidence Pack
          </button>
        </div>
      </div>

      {/* Category Breakdown Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(categorizedBreakdown || {}).map(([cat, data]) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500 text-white'
                  : 'bg-gray-950/50 border-gray-800 hover:border-gray-700 text-gray-300'
              }`}
            >
              <div className="text-[11px] text-gray-400 truncate">{categoryLabels[cat] || cat}</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                {currency} {data.totalLeakage.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{data.count} finding(s)</div>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-semibold">Severity Filter:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedSeverity === sev
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-xs">Showing {filteredFindings.length} of {findings.length} findings</span>
      </div>

      {/* Findings Item Cards */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => (
          <div
            key={finding.findingId}
            className="p-5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-3 hover:border-gray-700 transition-colors"
          >
            {/* Finding Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  finding.severity === 'HIGH' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {finding.severity}
                </span>
                <span className="font-bold text-sm text-white">
                  {categoryLabels[finding.ruleCategory] || finding.ruleCategory}
                </span>
                <span className="text-[11px] font-mono text-gray-500">#{finding.findingId}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Recoverable Variance: </span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  +{finding.expectedValues.currency} {finding.calculation.varianceAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Traceability Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Contract Clause Traceability */}
              <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px]">
                  <span>📄 Contract Ground Truth</span>
                  <span className="font-mono text-emerald-400">Page {finding.contractReference.pageNumber}</span>
                </div>
                <p className="text-gray-200 italic bg-gray-950/80 p-2 rounded border border-gray-800 text-[11px]">
                  "{finding.contractReference.clauseSnippet}"
                </p>
                <div className="text-gray-400 text-[11px]">
                  Expected Rate: <strong className="text-emerald-300 font-mono">${finding.expectedValues.expectedRate?.toFixed(2)}</strong>
                </div>
              </div>

              {/* Invoice Discrepancy Record */}
              <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px]">
                  <span>🧾 Billed Invoice Record</span>
                  <span className="font-mono text-gray-300">{finding.invoiceReference.invoiceNumber}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-gray-950/80 p-2 rounded border border-gray-800">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Billed Rate:</span>
                    <span className="text-red-300 font-bold">${finding.invoiceReference.billedRate?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Quantity:</span>
                    <span className="text-gray-200">{finding.invoiceReference.billedQuantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Billed Total:</span>
                    <span className="text-gray-200">${finding.invoiceReference.billedTotal?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400">
                  Math Formula: <code className="text-emerald-300 font-mono text-[10px]">{finding.calculation.formula}</code>
                </div>
              </div>
            </div>

            {/* Customer Explanation Note */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-emerald-300 text-[11px]">Draft Customer Explanation Note:</span>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {finding.customerExplanationNote}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
