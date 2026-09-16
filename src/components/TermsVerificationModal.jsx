import React, { useState } from 'react';
import { SUPPORTED_CURRENCIES } from '../schemas/aiExtraction.schema.js';

export default function TermsVerificationModal({
  terms,
  onTermsChange,
  onLockTerms,
  onUnlockTerms,
  isLocked,
  lockedFingerprint,
}) {
  const [activeTab, setActiveTab] = useState('rateCards');
  const [auditorName, setAuditorName] = useState('Revenue Auditor');
  const [hasConfirmedAudit, setHasConfirmedAudit] = useState(false);

  // Field change handlers
  const handleBaseChange = (field, value) => {
    onTermsChange({
      ...terms,
      [field]: value,
    });
  };

  const handleRateCardChange = (index, field, value) => {
    const newRateCards = [...(terms.rateCards || [])];
    newRateCards[index] = {
      ...newRateCards[index],
      [field]: field === 'contractRate' || field === 'pageReference' ? parseFloat(value) || 0 : value,
    };
    onTermsChange({
      ...terms,
      rateCards: newRateCards,
    });
  };

  const addRateCard = () => {
    const newRateCards = [
      ...(terms.rateCards || []),
      {
        id: `rc_${Math.random().toString(36).slice(2, 9)}`,
        roleOrItem: 'New Billable Role',
        unit: 'hour',
        contractRate: 100.0,
        pageReference: 1,
        sourceSnippet: 'Manually added rate card item',
      },
    ];
    onTermsChange({ ...terms, rateCards: newRateCards });
  };

  const removeRateCard = (index) => {
    const newRateCards = (terms.rateCards || []).filter((_, idx) => idx !== index);
    onTermsChange({ ...terms, rateCards: newRateCards });
  };

  const handleEscalationChange = (index, field, value) => {
    const newEsc = [...(terms.priceEscalations || [])];
    newEsc[index] = {
      ...newEsc[index],
      [field]: field === 'percentage' || field === 'pageReference' ? parseFloat(value) || 0 : value,
    };
    onTermsChange({ ...terms, priceEscalations: newEsc });
  };

  const addEscalation = () => {
    const newEsc = [
      ...(terms.priceEscalations || []),
      {
        id: `esc_${Math.random().toString(36).slice(2, 9)}`,
        percentage: 5.0,
        frequency: 'annual',
        effectiveDate: '2025-01-01',
        anniversaryMonth: 1,
        pageReference: 1,
        clauseSnippet: 'Annual price escalation clause',
      },
    ];
    onTermsChange({ ...terms, priceEscalations: newEsc });
  };

  const removeEscalation = (index) => {
    const newEsc = (terms.priceEscalations || []).filter((_, idx) => idx !== index);
    onTermsChange({ ...terms, priceEscalations: newEsc });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header & Lock State Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">2</span>
            <h2 className="text-lg font-bold text-white">Human-In-The-Loop (HITL) Terms Review</h2>
            {isLocked ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span>🔒</span> HUMAN LOCKED
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <span>✏️</span> REVIEW & LOCK REQUIRED
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Review the extracted commercial rate cards and contractual escalation clauses. Lock them to permit deterministic reconciliation.
          </p>
        </div>

        {/* Lock / Unlock Actions */}
        <div className="flex items-center gap-3">
          {isLocked ? (
            <button
              type="button"
              onClick={onUnlockTerms}
              className="px-3.5 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🔓</span> Unlock & Edit Terms
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedAudit}
                  onChange={(e) => setHasConfirmedAudit(e.target.checked)}
                  className="rounded border-gray-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>I have verified clauses</span>
              </label>
              <button
                type="button"
                onClick={() => onLockTerms(auditorName)}
                disabled={!hasConfirmedAudit || (terms.rateCards || []).length === 0}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <span>🔒</span> Lock Contract Terms
              </button>
            </div>
          )}
        </div>
      </div>

      {isLocked && lockedFingerprint && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <span>🛡️</span>
            <span>Cryptographic State Fingerprint:</span>
            <code className="font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
              {lockedFingerprint.slice(0, 24)}...
            </code>
          </div>
          <span className="text-gray-400 text-[11px]">Reconciliation Engine: UNLOCKED</span>
        </div>
      )}

      {/* Contract Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-950/60 rounded-xl border border-gray-800/80 text-xs">
        <div>
          <label className="block text-gray-400 font-semibold mb-1">Contract Title</label>
          <input
            type="text"
            value={terms.contractTitle || ''}
            disabled={isLocked}
            onChange={(e) => handleBaseChange('contractTitle', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-white disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 font-semibold mb-1">Currency (ISO-4217)</label>
          <select
            value={terms.currency || 'USD'}
            disabled={isLocked}
            onChange={(e) => handleBaseChange('currency', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-white disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 font-semibold mb-1">Provider / Vendor</label>
          <input
            type="text"
            value={terms.vendorName || ''}
            disabled={isLocked}
            onChange={(e) => handleBaseChange('vendorName', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-white disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 font-semibold mb-1">Client Name</label>
          <input
            type="text"
            value={terms.clientName || ''}
            disabled={isLocked}
            onChange={(e) => handleBaseChange('clientName', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-white disabled:opacity-60 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 space-x-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('rateCards')}
          className={`pb-2 transition-colors ${activeTab === 'rateCards' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Rate Cards ({terms.rateCards?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('escalations')}
          className={`pb-2 transition-colors ${activeTab === 'escalations' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Price Escalations ({terms.priceEscalations?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discounts')}
          className={`pb-2 transition-colors ${activeTab === 'discounts' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Discounts & Commitments
        </button>
      </div>

      {/* Tab 1: Rate Cards Table */}
      {activeTab === 'rateCards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Extracted contracted billable items and unit prices:</span>
            {!isLocked && (
              <button
                type="button"
                onClick={addRateCard}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                + Add Rate Card Item
              </button>
            )}
          </div>
          <div className="overflow-x-auto border border-gray-800 rounded-lg">
            <table className="min-w-full divide-y divide-gray-800 text-xs">
              <thead className="bg-gray-950 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Role / Billable Item</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-right">Contract Rate ({terms.currency})</th>
                  <th className="px-3 py-2 text-center">Page Ref</th>
                  <th className="px-3 py-2 text-left">Source Clause Snippet</th>
                  {!isLocked && <th className="px-3 py-2 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-900/50">
                {(terms.rateCards || []).map((rc, idx) => (
                  <tr key={rc.id || idx} className="hover:bg-gray-800/30">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={rc.roleOrItem}
                        disabled={isLocked}
                        onChange={(e) => handleRateCardChange(idx, 'roleOrItem', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700/80 rounded px-2 py-1 text-white disabled:opacity-70"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={rc.unit || 'hour'}
                        disabled={isLocked}
                        onChange={(e) => handleRateCardChange(idx, 'unit', e.target.value)}
                        className="bg-gray-950 border border-gray-700/80 rounded px-2 py-1 text-white disabled:opacity-70"
                      >
                        <option value="hour">hour</option>
                        <option value="day">day</option>
                        <option value="month">month</option>
                        <option value="fixed">fixed</option>
                        <option value="unit">unit</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={rc.contractRate}
                        disabled={isLocked}
                        onChange={(e) => handleRateCardChange(idx, 'contractRate', e.target.value)}
                        className="w-24 bg-gray-950 border border-gray-700/80 rounded px-2 py-1 text-right font-mono text-emerald-400 font-semibold disabled:opacity-70"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={rc.pageReference || 1}
                        disabled={isLocked}
                        onChange={(e) => handleRateCardChange(idx, 'pageReference', e.target.value)}
                        className="w-14 bg-gray-950 border border-gray-700/80 rounded px-1.5 py-1 text-center font-mono text-gray-300 disabled:opacity-70"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-400 italic text-[11px] max-w-xs truncate" title={rc.sourceSnippet}>
                      {rc.sourceSnippet || 'N/A'}
                    </td>
                    {!isLocked && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRateCard(idx)}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Escalations */}
      {activeTab === 'escalations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Scheduled price escalations and index adjustments:</span>
            {!isLocked && (
              <button
                type="button"
                onClick={addEscalation}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                + Add Escalation Clause
              </button>
            )}
          </div>
          {(terms.priceEscalations || []).map((esc, idx) => (
            <div key={esc.id || idx} className="p-3 bg-gray-950/60 border border-gray-800 rounded-lg space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Increase %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={esc.percentage}
                    disabled={isLocked}
                    onChange={(e) => handleEscalationChange(idx, 'percentage', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-emerald-400 font-mono font-bold disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Effective Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={esc.effectiveDate || ''}
                    disabled={isLocked}
                    onChange={(e) => handleEscalationChange(idx, 'effectiveDate', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Contract Page #</label>
                  <input
                    type="number"
                    value={esc.pageReference || 1}
                    disabled={isLocked}
                    onChange={(e) => handleEscalationChange(idx, 'pageReference', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white disabled:opacity-70"
                  />
                </div>
                {!isLocked && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeEscalation(idx)}
                      className="px-3 py-1 bg-red-950/60 text-red-300 border border-red-800 rounded hover:bg-red-900 text-xs"
                    >
                      Delete Clause
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-400 italic">
                Snippet: {esc.clauseSnippet || 'Contractual annual rate increase'}
              </div>
            </div>
          ))}
          {(terms.priceEscalations || []).length === 0 && (
            <p className="text-xs text-gray-500 italic">No price escalation clauses configured for this contract.</p>
          )}
        </div>
      )}

      {/* Tab 3: Discounts & Minimums */}
      {activeTab === 'discounts' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-lg">
              <label className="block text-gray-300 font-semibold mb-1">Minimum Commitment Amount ({terms.currency})</label>
              <p className="text-[11px] text-gray-400 mb-2">Shortfall rule will alert if total billed falls below this threshold.</p>
              <input
                type="number"
                step="100"
                value={terms.minimumCommitmentAmount || ''}
                placeholder="Optional, e.g. 10000"
                disabled={isLocked}
                onChange={(e) => handleBaseChange('minimumCommitmentAmount', parseFloat(e.target.value) || null)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-emerald-400 font-mono disabled:opacity-70"
              />
            </div>

            <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-lg">
              <label className="block text-gray-300 font-semibold mb-1">Contract End Date</label>
              <p className="text-[11px] text-gray-400 mb-2">Rule will alert on invoices billed beyond contract expiration.</p>
              <input
                type="date"
                value={terms.contractEndDate || ''}
                disabled={isLocked}
                onChange={(e) => handleBaseChange('contractEndDate', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-white disabled:opacity-70"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
