import React, { useState, useRef } from 'react';
import Header from './components/Header.jsx';
import ContractUploader from './components/ContractUploader.jsx';
import TermsVerificationModal from './components/TermsVerificationModal.jsx';
import InvoiceUploader from './components/InvoiceUploader.jsx';
import MappingTable from './components/MappingTable.jsx';
import LeakageAuditDashboard from './components/LeakageAuditDashboard.jsx';
import EvidencePackViewer from './components/EvidencePackViewer.jsx';
import CurrencyMismatchModal from './components/CurrencyMismatchModal.jsx';

import { HumanLockManager, HITL_STATES } from './utils/humanLockState.js';
import { validateCurrencyMatch } from './utils/currencyGuard.js';
import { reconcileContractToInvoices } from './utils/reconciliationEngine.js';
import { createEvidencePack } from './utils/evidencePack.js';
import { extractCommercialTermsRegexFallback } from './services/aiProxyClient.js';

export default function App() {
  // Navigation & Step Tracking
  const [currentStep, setCurrentStep] = useState(1);

  // Core Contract & Lock State
  const lockManagerRef = useRef(new HumanLockManager());
  const [terms, setTerms] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedFingerprint, setLockedFingerprint] = useState(null);
  const [canCalculate, setCanCalculate] = useState(false);

  // Contract Processing State
  const [isProcessingContract, setIsProcessingContract] = useState(false);
  const [contractProgressMsg, setContractProgressMsg] = useState('');
  const [contractFileName, setContractFileName] = useState('');

  // Invoice Data State
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [invoiceColumns, setInvoiceColumns] = useState([]);
  const [isProcessingInvoices, setIsProcessingInvoices] = useState(false);

  // Mappings State
  const [mappings, setMappings] = useState([]);

  // Audit Results State
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [evidencePack, setEvidencePack] = useState(null);

  // Currency Guard Modal State
  const [currencyMismatch, setCurrencyMismatch] = useState({ isOpen: false, contract: '', invoice: '' });

  // --------------------------------------------------------------------------
  // Step 1: Contract Intake & Local / Regex Extraction
  // --------------------------------------------------------------------------
  const handleContractLoaded = async ({ file, fileName, buffer, sampleBlocks }) => {
    setIsProcessingContract(true);
    setContractFileName(fileName);
    setContractProgressMsg('Extracting contract clauses...');

    try {
      let extracted;
      if (sampleBlocks) {
        // Fast path for demo sample
        extracted = extractCommercialTermsRegexFallback(sampleBlocks);
      } else {
        // Mocking text extraction for uploaded PDF
        extracted = extractCommercialTermsRegexFallback([
          { pageNumber: 1, text: `Master Services Agreement for ${fileName}` },
          { pageNumber: 2, text: 'Senior Cloud Architect: $175.00/hour\nDevOps Engineer: $135.00/hour' },
          { pageNumber: 3, text: 'Annual escalation of 5.0% on anniversary' },
        ]);
      }

      lockManagerRef.current.loadExtraction(extracted);
      setTerms(extracted);
      setIsLocked(false);
      setLockedFingerprint(null);
      setCanCalculate(false);
      setCurrentStep(2);
    } catch (err) {
      console.error('Contract extraction error:', err);
    } finally {
      setIsProcessingContract(false);
    }
  };

  // --------------------------------------------------------------------------
  // Step 2: HITL Terms Review & Human Lock
  // --------------------------------------------------------------------------
  const handleTermsChange = (newTerms) => {
    setTerms(newTerms);
    if (isLocked) {
      // Invalidate lock on edit
      lockManagerRef.current.invalidateLock('Auditor edited contract terms');
      setIsLocked(false);
      setLockedFingerprint(null);
      setCanCalculate(false);
      setReconciliationResult(null);
      setEvidencePack(null);
    }
  };

  const handleLockTerms = (auditorName) => {
    lockManagerRef.current.currentTerms = terms;
    const lockResult = lockManagerRef.current.lockTerms(auditorName);
    setIsLocked(true);
    setLockedFingerprint(lockResult.fingerprint);
    setCanCalculate(true);
    setCurrentStep(3); // Proceed to invoice intake
  };

  const handleUnlockTerms = () => {
    lockManagerRef.current.invalidateLock('Auditor unlocked terms');
    setIsLocked(false);
    setLockedFingerprint(null);
    setCanCalculate(false);
    setReconciliationResult(null);
    setEvidencePack(null);
    setCurrentStep(2);
  };

  // --------------------------------------------------------------------------
  // Step 3: In-Browser Invoice Intake
  // --------------------------------------------------------------------------
  const handleInvoicesLoaded = ({ fileName, rows, columns }) => {
    setInvoiceFileName(fileName);
    setInvoiceRows(rows);
    setInvoiceColumns(columns);

    // Currency Guard Check
    const detectedInvoiceCurrency = rows[0]?.currency || terms?.currency || 'USD';
    const currencyCheck = validateCurrencyMatch(terms?.currency || 'USD', detectedInvoiceCurrency);

    if (!currencyCheck.valid) {
      setCurrencyMismatch({
        isOpen: true,
        contract: terms?.currency || 'USD',
        invoice: detectedInvoiceCurrency,
      });
      return;
    }

    setCurrentStep(4); // Move to mapping table
  };

  // --------------------------------------------------------------------------
  // Step 5: Deterministic Reconciliation Execution
  // --------------------------------------------------------------------------
  const handleRunAudit = () => {
    if (!isLocked || !canCalculate || !terms) {
      alert('Cannot calculate: Contract terms must be Human-Locked first.');
      return;
    }

    try {
      const result = reconcileContractToInvoices({
        lockedTerms: terms,
        invoiceRows,
        mappings,
      });

      setReconciliationResult(result);
      setCurrentStep(5);
    } catch (err) {
      alert(`Audit calculation error: ${err.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // Step 6: Evidence Pack Generation
  // --------------------------------------------------------------------------
  const handleGenerateEvidencePack = () => {
    if (!reconciliationResult) return;

    const totalBilled = invoiceRows.reduce((sum, r) => sum + parseFloat(r.total || (r.rate * r.hours) || 0), 0);

    const pack = createEvidencePack({
      contractSummary: {
        title: terms.contractTitle,
        vendorName: terms.vendorName,
        clientName: terms.clientName,
        currency: terms.currency,
        lockedAt: lockManagerRef.current.lockedTimestamp,
        lockedFingerprint,
      },
      invoiceSummary: {
        fileName: invoiceFileName,
        fileCount: 1,
        totalRows: invoiceRows.length,
        totalBilled,
      },
      reconciliationResult,
    });

    setEvidencePack(pack);
    setCurrentStep(6);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      <Header currentStep={currentStep} canCalculate={canCalculate} isLocked={isLocked} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 1: Contract Intake */}
        {currentStep === 1 && (
          <ContractUploader
            onContractLoaded={handleContractLoaded}
            isProcessing={isProcessingContract}
            progressMsg={contractProgressMsg}
          />
        )}

        {/* Step 2: HITL Terms Review & Human Lock */}
        {currentStep === 2 && terms && (
          <TermsVerificationModal
            terms={terms}
            onTermsChange={handleTermsChange}
            onLockTerms={handleLockTerms}
            onUnlockTerms={handleUnlockTerms}
            isLocked={isLocked}
            lockedFingerprint={lockedFingerprint}
          />
        )}

        {/* Step 3: Invoice Intake */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {terms && (
              <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">🔒 Locked Contract:</span>
                  <span className="text-white font-medium">{terms.contractTitle} ({terms.vendorName})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Review Terms
                </button>
              </div>
            )}
            <InvoiceUploader
              onInvoicesLoaded={handleInvoicesLoaded}
              isProcessing={isProcessingInvoices}
              invoiceRows={invoiceRows}
              currency={terms?.currency || 'USD'}
            />
          </div>
        )}

        {/* Step 4: Rate Card Mapping */}
        {currentStep === 4 && terms && (
          <MappingTable
            rateCards={terms.rateCards || []}
            invoiceRows={invoiceRows}
            invoiceColumns={invoiceColumns}
            mappings={mappings}
            onMappingsChange={setMappings}
            onRunAudit={handleRunAudit}
            canCalculate={canCalculate}
            isLocked={isLocked}
          />
        )}

        {/* Step 5: Leakage Audit Dashboard */}
        {currentStep === 5 && reconciliationResult && (
          <LeakageAuditDashboard
            reconciliationResult={reconciliationResult}
            currency={terms?.currency || 'USD'}
            onGenerateEvidencePack={handleGenerateEvidencePack}
          />
        )}

        {/* Step 6: Evidence Pack Viewer */}
        {currentStep === 6 && evidencePack && (
          <EvidencePackViewer
            evidencePack={evidencePack}
            onBackToDashboard={() => setCurrentStep(5)}
          />
        )}
      </main>

      {/* Currency Guard Modal */}
      <CurrencyMismatchModal
        isOpen={currencyMismatch.isOpen}
        contractCurrency={currencyMismatch.contract}
        invoiceCurrency={currencyMismatch.invoice}
        onClose={() => setCurrencyMismatch({ isOpen: false, contract: '', invoice: '' })}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950 py-4 text-center text-xs text-gray-500">
        <p>YBY Revenue Assurance Copilot • Product #3 • Zero-Trust Deterministic Financial Reconciliation</p>
      </footer>
    </div>
  );
}
