/**
 * src/workers/reconciliation.worker.js
 * 
 * In-Browser Tabular Invoice Parsing & Deterministic Reconciliation Web Worker.
 * 
 * INVARIANTS:
 * 1. Zero Invoice Network Transmission: 100% processed locally.
 * 2. Pure deterministic math execution.
 * 3. Human-Lock verified terms prerequisite.
 */

/* global self */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { reconcileContractToInvoices } from '../utils/reconciliationEngine.js';
import { validateReconciliationCurrency } from '../utils/currencyGuard.js';

self.onmessage = async (event) => {
  const { type, fileData, fileType, fileName, lockedTerms, mappings } = event.data;

  // 1. Parse Invoice Action
  if (type === 'PARSE_INVOICE_FILE') {
    try {
      let rows = [];
      let headers = [];

      if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        const text = typeof fileData === 'string' ? fileData : new TextDecoder('utf-8').decode(fileData);
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        rows = parsed.data || [];
        headers = parsed.meta?.fields || (rows.length > 0 ? Object.keys(rows[0]) : []);
      } else {
        // Excel parsing via XLSX
        const workbook = XLSX.read(fileData, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      }

      if (rows.length === 0) {
        throw new Error('Invoice file contains zero readable data rows.');
      }

      self.postMessage({
        type: 'INVOICE_PARSE_SUCCESS',
        fileName,
        rowCount: rows.length,
        headers,
        previewRows: rows.slice(0, 10),
        rows,
      });
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        error: `Invoice parsing failed: ${err.message}`,
      });
    }
    return;
  }

  // 2. Run Deterministic Reconciliation Action
  if (type === 'RUN_RECONCILIATION') {
    try {
      if (!lockedTerms) {
        throw new Error('Reconciliation requires verified, Human-Locked contract terms.');
      }

      const invoiceRows = fileData; // Array of invoice row objects
      const invoiceCurrency = event.data.invoiceCurrency || lockedTerms.currency;

      // Currency Guard check
      const currencyValidation = validateReconciliationCurrency(lockedTerms.currency, invoiceCurrency);
      if (!currencyValidation.canProceed) {
        self.postMessage({
          type: 'CURRENCY_BLOCKED',
          error: currencyValidation.message,
          blockerCode: currencyValidation.blockerCode,
        });
        return;
      }

      // Execute deterministic math engine
      const auditResult = reconcileContractToInvoices({
        lockedTerms,
        invoiceRows,
        mappings,
      });

      self.postMessage({
        type: 'RECONCILIATION_SUCCESS',
        auditResult,
      });
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        error: `Reconciliation engine error: ${err.message}`,
      });
    }
  }
};
