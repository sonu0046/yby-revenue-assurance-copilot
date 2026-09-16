import React, { useState, useEffect } from 'react';

export default function MappingTable({
  rateCards,
  invoiceRows,
  invoiceColumns,
  mappings,
  onMappingsChange,
  onRunAudit,
  canCalculate,
  isLocked,
}) {
  const [colConfig, setColConfig] = useState({
    rate: '',
    qty: '',
    total: '',
    date: '',
    invoiceId: '',
    desc: '',
  });

  // Auto-detect columns on mount or invoice change
  useEffect(() => {
    if (invoiceColumns && invoiceColumns.length > 0) {
      const findCol = (patterns) => {
        return invoiceColumns.find((c) => patterns.some((p) => c.toLowerCase().includes(p))) || invoiceColumns[0];
      };

      const newConfig = {
        rate: findCol(['rate', 'price', 'unit_price', 'hourly_rate']),
        qty: findCol(['hours', 'qty', 'quantity', 'units']),
        total: findCol(['total', 'amount', 'billed_amount']),
        date: findCol(['date', 'invoice_date', 'billing_date']),
        invoiceId: findCol(['invoice_id', 'invoice_no', 'invoice_number', 'id']),
        desc: findCol(['description', 'role', 'item', 'desc']),
      };
      setColConfig(newConfig);

      // Auto-create initial mappings
      if (rateCards && rateCards.length > 0 && invoiceRows && invoiceRows.length > 0) {
        const autoMappings = invoiceRows.map((row, rIdx) => {
          const rowDesc = String(row[newConfig.desc] || row.description || row.role || '').toLowerCase();
          
          // Fuzzy match against rate cards
          let matchedCard = rateCards.find((rc) => 
            rowDesc.includes(rc.roleOrItem.toLowerCase()) || 
            rc.roleOrItem.toLowerCase().includes(rowDesc)
          );

          if (!matchedCard) {
            matchedCard = rateCards[0]; // fallback
          }

          return {
            rateCardId: matchedCard.id,
            invoiceRowIndex: rIdx,
            billedRateColumn: newConfig.rate,
            billedQtyColumn: newConfig.qty,
            billedTotalColumn: newConfig.total,
            invoiceDateColumn: newConfig.date,
            invoiceNumberColumn: newConfig.invoiceId,
            itemDescColumn: newConfig.desc,
          };
        });
        onMappingsChange(autoMappings);
      }
    }
  }, [invoiceColumns, invoiceRows, rateCards]);

  const handleRowMappingChange = (rowIndex, rateCardId) => {
    const updated = mappings.map((m) => {
      if (m.invoiceRowIndex === rowIndex) {
        return { ...m, rateCardId };
      }
      return m;
    });
    onMappingsChange(updated);
  };

  const handleColChange = (key, value) => {
    const newConfig = { ...colConfig, [key]: value };
    setColConfig(newConfig);

    const updated = mappings.map((m) => ({
      ...m,
      billedRateColumn: newConfig.rate,
      billedQtyColumn: newConfig.qty,
      billedTotalColumn: newConfig.total,
      invoiceDateColumn: newConfig.date,
      invoiceNumberColumn: newConfig.invoiceId,
      itemDescColumn: newConfig.desc,
    }));
    onMappingsChange(updated);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">4</span>
            Contract-to-Invoice Rate Card Mapping
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Bind invoice billing line items to verified contract rate cards for deterministic reconciliation.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAudit}
          disabled={!canCalculate || !isLocked || mappings.length === 0}
          className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <span>🚀</span>
          Execute Leakage Audit Engine
        </button>
      </div>

      {/* Column Schema Mapping Bar */}
      <div className="p-4 bg-gray-950/60 rounded-lg border border-gray-800/80 space-y-2">
        <span className="text-xs font-semibold text-gray-300">Invoice Column Alignment:</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Rate Column</label>
            <select
              value={colConfig.rate}
              onChange={(e) => handleColChange('rate', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Quantity / Hours</label>
            <select
              value={colConfig.qty}
              onChange={(e) => handleColChange('qty', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Total Amount</label>
            <select
              value={colConfig.total}
              onChange={(e) => handleColChange('total', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Invoice Date</label>
            <select
              value={colConfig.date}
              onChange={(e) => handleColChange('date', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Invoice ID</label>
            <select
              value={colConfig.invoiceId}
              onChange={(e) => handleColChange('invoiceId', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Description / Item</label>
            <select
              value={colConfig.desc}
              onChange={(e) => handleColChange('desc', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              {invoiceColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Row-by-Row Rate Card Binding Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="min-w-full divide-y divide-gray-800 text-xs">
          <thead className="bg-gray-950 text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Billed Description</th>
              <th className="px-3 py-2 text-right">Billed Rate</th>
              <th className="px-3 py-2 text-right">Billed Qty</th>
              <th className="px-3 py-2 text-left">Mapped Contract Rate Card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 bg-gray-900/50">
            {invoiceRows.map((row, rIdx) => {
              const curMapping = mappings.find((m) => m.invoiceRowIndex === rIdx);
              const selectedRcId = curMapping?.rateCardId || '';
              const matchedCard = rateCards.find((r) => r.id === selectedRcId);

              return (
                <tr key={rIdx} className="hover:bg-gray-800/30">
                  <td className="px-3 py-2 font-mono text-gray-300">{row[colConfig.invoiceId] || `INV-${rIdx + 1}`}</td>
                  <td className="px-3 py-2 text-gray-300 font-mono">{String(row[colConfig.date] || 'N/A')}</td>
                  <td className="px-3 py-2 text-gray-200 font-medium">{String(row[colConfig.desc] || 'Consulting')}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-300 font-semibold">${parseFloat(row[colConfig.rate] || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-300">{parseFloat(row[colConfig.qty] || 0)}</td>
                  <td className="px-3 py-2">
                    <select
                      value={selectedRcId}
                      onChange={(e) => handleRowMappingChange(rIdx, e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700/80 rounded px-2 py-1 text-emerald-400 font-medium"
                    >
                      {rateCards.map((rc) => (
                        <option key={rc.id} value={rc.id}>
                          {rc.roleOrItem} (${rc.contractRate}/{rc.unit} - p.{rc.pageReference})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
