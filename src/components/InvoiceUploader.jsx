import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function InvoiceUploader({ onInvoicesLoaded, isProcessing, invoiceRows, currency }) {
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const sampleInvoices = [
    {
      invoice_id: 'INV-2024-001',
      date: '2024-01-31',
      description: 'Senior Cloud Architect',
      rate: 150.00, // Underbilled! Contract is $175.00
      hours: 160,
      total: 24000.00,
      currency: 'USD',
    },
    {
      invoice_id: 'INV-2024-002',
      date: '2024-02-28',
      description: 'DevOps Engineer',
      rate: 135.00, // Correct
      hours: 120,
      total: 16200.00,
      currency: 'USD',
    },
    {
      invoice_id: 'INV-2024-003',
      date: '2024-04-15',
      description: 'Senior Cloud Architect',
      rate: 157.50, // Expired discount applied (10% off $175) post March 31!
      hours: 80,
      total: 12600.00,
      discount_percentage: 10.0,
      currency: 'USD',
    },
    {
      invoice_id: 'INV-2025-001',
      date: '2025-02-15', // Post Jan 1, 2025 Escalation date!
      description: 'Senior Cloud Architect',
      rate: 175.00, // Missed 5% annual escalation! Expected $183.75
      hours: 160,
      total: 28000.00,
      currency: 'USD',
    },
    {
      invoice_id: 'INV-2025-002',
      date: '2025-03-31',
      description: 'DevOps Engineer',
      rate: 135.00, // Missed 5% escalation! Expected $141.75
      hours: 100,
      total: 13500.00,
      currency: 'USD',
    },
  ];

  const handleFile = (file) => {
    if (!file) return;
    setErrorMsg(null);

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            onInvoicesLoaded({
              fileName: file.name,
              rows: results.data,
              columns: results.meta.fields || Object.keys(results.data[0]),
            });
          } else {
            setErrorMsg('The uploaded CSV file contains no valid data rows.');
          }
        },
        error: (err) => setErrorMsg(`CSV parse error: ${err.message}`),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (json.length > 0) {
            onInvoicesLoaded({
              fileName: file.name,
              rows: json,
              columns: Object.keys(json[0]),
            });
          } else {
            setErrorMsg('The Excel sheet contains no readable rows.');
          }
        } catch (err) {
          setErrorMsg(`Excel parse error: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMsg('Please upload a valid .CSV or .XLSX invoice data file.');
    }
  };

  const loadSampleInvoices = () => {
    setErrorMsg(null);
    onInvoicesLoaded({
      fileName: 'Sample_Billed_Invoices_2024_2025.csv',
      rows: sampleInvoices,
      columns: Object.keys(sampleInvoices[0]),
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">3</span>
            Invoice Intake (Client-Side Tabular)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Drop billed billing records (CSV / XLSX). Processing is 100% local — zero data is sent across network.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleInvoices}
          disabled={isProcessing}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>⚡</span> Load Sample Billed Invoices
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragOver 
            ? 'border-emerald-400 bg-emerald-950/20' 
            : 'border-gray-700 hover:border-gray-600 bg-gray-950/50'
        }`}
      >
        <p className="text-sm font-medium text-gray-200">
          Drag and drop CSV or Excel (.xlsx) invoice records, or{' '}
          <label className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline font-semibold">
            browse files
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </p>
        <p className="text-xs text-gray-500 mt-1">Supports up to 50,000 billing line items in browser</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Invoice Data Preview Table if rows loaded */}
      {invoiceRows && invoiceRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Loaded <strong>{invoiceRows.length}</strong> invoice billing line items:</span>
            <span className="text-emerald-400 font-mono">Ready for mapping</span>
          </div>
          <div className="overflow-x-auto border border-gray-800 rounded-lg max-h-56">
            <table className="min-w-full divide-y divide-gray-800 text-xs">
              <thead className="bg-gray-950 text-gray-400 sticky top-0">
                <tr>
                  {Object.keys(invoiceRows[0]).slice(0, 7).map((col) => (
                    <th key={col} className="px-3 py-2 text-left uppercase tracking-wider font-semibold text-[11px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-900/50">
                {invoiceRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30">
                    {Object.keys(row).slice(0, 7).map((col, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 text-gray-300 font-mono text-[11px]">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
