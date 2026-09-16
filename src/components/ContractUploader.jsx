import React, { useState } from 'react';

export default function ContractUploader({ onContractLoaded, isProcessing, progressMsg }) {
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const sampleContractData = {
    fileName: 'Demo_Enterprise_MSA_2024.pdf',
    textBlocks: [
      {
        pageNumber: 1,
        text: 'MASTER SERVICES AGREEMENT\nBetween Acme Cloud Solutions Inc ("Provider") and Global Enterprise Corp ("Client").\nEffective Date: 2024-01-01. Term: 24 Months through 2025-12-31.\nBilling Currency: USD. Invoices billed monthly in arrears with Net 30 payment terms.',
      },
      {
        pageNumber: 2,
        text: 'SCHEDULE A — COMMERCIAL RATE CARD:\n1. Senior Cloud Architect: $175.00/hour\n2. DevOps Engineer: $135.00/hour\n3. Full Stack Engineer: $110.00/hour\n4. QA Automation Lead: $95.00/hour\n5. Project Manager: $125.00/hour',
      },
      {
        pageNumber: 3,
        text: 'SECTION 4 — COMMERCIAL TERMS & DISCOUNT CONDITIONS:\n4.1 Introductory Discount: A 10.0% introductory discount applies exclusively to Q1 billing through March 31, 2024.\n4.2 Invoices rendered after March 31, 2024 must be billed at full schedule rates.',
      },
      {
        pageNumber: 4,
        text: 'SECTION 5 — ANNUAL PRICE ESCALATION:\n5.1 On the first anniversary of the agreement (January 1, 2025), all contracted hourly rates shall increase by 5.0% across all roles.\n5.2 Minimum Quarterly Commitment: The Client commits to a minimum billing volume of $10,000.00 per quarter.',
      },
    ],
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Please select a valid PDF contract file.');
      return;
    }
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      onContractLoaded({
        file,
        fileName: file.name,
        buffer,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSampleContract = () => {
    setErrorMsg(null);
    onContractLoaded({
      file: null,
      fileName: sampleContractData.fileName,
      sampleBlocks: sampleContractData.textBlocks,
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">1</span>
            Contract Intake & Clause Extraction
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Upload your Master Services Agreement (MSA) or Statement of Work (SOW) in PDF format.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleContract}
          disabled={isProcessing}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span>⚡</span>
          Load Demo Enterprise MSA
        </button>
      </div>

      {/* Drag & Drop Zone */}
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
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver 
            ? 'border-emerald-400 bg-emerald-950/20' 
            : 'border-gray-700 hover:border-gray-600 bg-gray-950/50'
        }`}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <p className="text-sm font-medium text-gray-200">
          Drag and drop your PDF Contract here, or{' '}
          <label className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline font-semibold">
            browse files
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </p>
        <p className="text-xs text-gray-500 mt-1">Supports searchable PDF contracts up to 25MB</p>

        {isProcessing && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-xs text-emerald-400 mt-2 font-mono">{progressMsg || 'Extracting commercial clauses...'}</p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-start gap-2.5 text-xs text-gray-400">
        <span className="text-emerald-400 font-bold text-sm">🔒</span>
        <div>
          <strong className="text-gray-300">Zero-Invoice Transmission Invariant:</strong> Invoices remain 100% in your browser. Contract text is parsed locally and passed through a zero-retention extraction proxy to structure commercial rate cards.
        </div>
      </div>
    </div>
  );
}
