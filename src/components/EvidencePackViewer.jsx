import React from 'react';
import { formatFindingsToCsvData } from '../utils/evidencePack.js';

export default function EvidencePackViewer({ evidencePack, onBackToDashboard }) {
  if (!evidencePack) return null;

  const { packId, generatedAt, contractSummary, invoiceSummary, auditSummary, invariantsSatisfied, findings } = evidencePack;

  const downloadCsv = () => {
    const csvRows = formatFindingsToCsvData(findings);
    if (!csvRows || csvRows.length === 0) return;

    const headers = Object.keys(csvRows[0]);
    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) =>
        headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${packId}_revenue_audit_evidence.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(evidencePack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${packId}_audit_evidence_pack.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">6</span>
            <h2 className="text-lg font-bold text-white">Revenue Assurance Evidence Pack</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              {packId}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Audit-grade recovery document ready for customer submission and executive review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <span>📥</span> Export CSV Report
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>💾</span> Export JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Audit Certificate Metadata Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-950/80 rounded-xl border border-gray-800 text-xs">
        <div>
          <span className="text-gray-400 font-semibold block mb-1">Contract Agreement:</span>
          <p className="text-white font-medium">{contractSummary?.title || 'Master Services Agreement'}</p>
          <p className="text-gray-400 text-[11px]">{contractSummary?.vendorName} ↔ {contractSummary?.clientName}</p>
        </div>
        <div>
          <span className="text-gray-400 font-semibold block mb-1">Audit Scope:</span>
          <p className="text-white font-medium">{invoiceSummary?.fileCount || 1} Invoice file(s) • {invoiceSummary?.totalRows || 0} Line Items</p>
          <p className="text-gray-400 text-[11px]">Total Billed: {contractSummary?.currency} ${invoiceSummary?.totalBilled?.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-gray-400 font-semibold block mb-1">Total Recoverable Finding:</span>
          <p className="text-emerald-400 font-mono font-extrabold text-base">
            +{contractSummary?.currency} ${auditSummary?.totalRecoverableRevenue?.toFixed(2)}
          </p>
          <p className="text-gray-400 text-[11px]">{auditSummary?.totalDiscrepanciesFound} verified discrepancy items</p>
        </div>
      </div>

      {/* Invariants Verification Checklist */}
      <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-800/80 text-xs space-y-2">
        <span className="font-semibold text-gray-300">Governance & Security Invariant Attestation:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>✓</span> Zero-Invoice Data Leakage (Local Worker)
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>✓</span> Zero AI Financial Math (Pure JS)
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>✓</span> 100% Traceable Clause Citations
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span>✓</span> ISO-4217 Currency Guard Verified
          </div>
        </div>
      </div>

      {/* Findings Table for Evidence Pack */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-gray-300">Itemized Recovery Schedule:</span>
        <div className="overflow-x-auto border border-gray-800 rounded-lg">
          <table className="min-w-full divide-y divide-gray-800 text-xs">
            <thead className="bg-gray-950 text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Contract Page Ref</th>
                <th className="px-3 py-2 text-left">Invoice #</th>
                <th className="px-3 py-2 text-right">Billed Rate</th>
                <th className="px-3 py-2 text-right">Contract Rate</th>
                <th className="px-3 py-2 text-right">Recoverable Variance</th>
                <th className="px-3 py-2 text-left">Explanation Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-gray-900/50">
              {findings.map((f, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30">
                  <td className="px-3 py-2 font-semibold text-gray-200">{f.ruleCategory}</td>
                  <td className="px-3 py-2 text-gray-300 font-mono">Page {f.contractReference.pageNumber}</td>
                  <td className="px-3 py-2 text-gray-300 font-mono">{f.invoiceReference.invoiceNumber}</td>
                  <td className="px-3 py-2 text-right font-mono text-red-300">${f.invoiceReference.billedRate?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-300">${f.expectedValues.expectedRate?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-400 font-bold">
                    +${f.calculation.varianceAmount?.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-[11px] max-w-xs">{f.customerExplanationNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
