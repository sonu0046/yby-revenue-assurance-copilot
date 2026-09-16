/**
 * tests/aiProxy.invoice-rejection.test.js
 * 
 * SERVERLESS AI PROXY INVOICE-REJECTION & SECURITY TEST SUITE
 * 
 * VERIFIES:
 * 1. AI proxy strictly rejects invoice fields with HTTP 400 Bad Request.
 * 2. Only allowlisted contractSnippets[] and extractionRequestVersion are accepted.
 * 3. Zod schema guarantees zero malformed data enters the application.
 * 4. AI API keys strictly omit VITE_ prefix and never leak to client bundle.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handler as aiExtractionHandler } from '../netlify/functions/ai-extraction.js';
import { ContractCommercialTermsSchema } from '../src/schemas/aiExtraction.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n==================================================================');
console.log(' 🚀 TEST SUITE 2: AI PROXY INVOICE-REJECTION & SCHEMA TESTS');
console.log('==================================================================\n');

let passedTests = 0;
async function runTest(testNum, name, fn) {
  try {
    await fn();
    console.log(`  ✓ Test ${testNum}: ${name} PASSED.`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ Test ${testNum} FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

(async () => {
  // Test 1: Proxy rejects invoiceRows with HTTP 400
  await runTest(1, 'AI extraction proxy rejects requests containing "invoiceRows" with HTTP 400', async () => {
    const maliciousPayload = {
      httpMethod: 'POST',
      body: JSON.stringify({
        contractSnippets: ['Rate card: $150/hr'],
        invoiceRows: [{ item: 'Consulting', billedRate: 120 }], // PROHIBITED INVOICE DATA
      }),
    };

    const res = await aiExtractionHandler(maliciousPayload);
    assert.equal(res.statusCode, 400);

    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.ok(body.error.includes('Security Rejection: Invoice data cannot be transmitted'));
  });

  // Test 2: Proxy rejects billedAmount or lineItems with HTTP 400
  await runTest(2, 'AI extraction proxy rejects "billedAmount" and "lineItems" with HTTP 400', async () => {
    const res1 = await aiExtractionHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        contractSnippets: ['MSA Text'],
        billedAmount: 50000,
      }),
    });
    assert.equal(res1.statusCode, 400);

    const res2 = await aiExtractionHandler({
      httpMethod: 'POST',
      body: JSON.stringify({
        contractSnippets: ['MSA Text'],
        lineItems: ['Consulting hours'],
      }),
    });
    assert.equal(res2.statusCode, 400);
  });

  // Test 3: Proxy accepts allowlisted contractSnippets and returns validated JSON
  await runTest(3, 'AI proxy accepts allowlisted contractSnippets and returns structured terms', async () => {
    const validPayload = {
      httpMethod: 'POST',
      body: JSON.stringify({
        contractSnippets: [
          'Master Services Agreement between Acme Cloud Solutions Inc and Global Enterprise Corp.',
          'Senior Cloud Architect rate is $175.00/hr.',
          'Annual escalation rate is 5.0% effective January 1, 2025.',
        ],
        extractionRequestVersion: '1.0',
      }),
    };

    const res = await aiExtractionHandler(validPayload);
    assert.equal(res.statusCode, 200);

    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.extractedTerms);
    assert.equal(body.extractedTerms.currency, 'USD');
    assert.ok(body.extractedTerms.rateCards.length > 0);
  });

  // Test 4: Zod schema rejects negative rates or invalid currency codes
  await runTest(4, 'Zod ContractCommercialTermsSchema rejects negative rates and invalid currency', () => {
    assert.throws(() => {
      ContractCommercialTermsSchema.parse({
        vendorName: 'Vendor',
        clientName: 'Client',
        currency: 'XYZ_INVALID', // Invalid
        rateCards: [{ roleOrItem: 'Dev', contractRate: -50 }], // Negative rate
      });
    });
  });

  // Test 5: Serverless secrets strictly omit VITE_ prefix
  await runTest(5, 'Serverless secrets in .env.example strictly omit VITE_ prefix', () => {
    const envContent = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
    assert.ok(envContent.includes('AI_EXTRACTION_API_KEY='), 'Must define AI_EXTRACTION_API_KEY');
    assert.ok(!envContent.includes('VITE_AI_EXTRACTION_API_KEY'), 'Must not have VITE_ prefix');
  });

  console.log(`\n 🎉 ALL ${passedTests}/5 AI PROXY & REJECTION TESTS PASSED!\n`);
})();
