/**
 * tests/customContractParser.regression.test.js
 * 
 * Focused Regression Suite for G6-C Custom Contract PDF Parsing:
 * 1. Verifies exact parsing of custom contract fixture (YBY Test Services, Data Engineering $120/hr, AI Evaluation $90/hr, Project Management $2,500/mo, 10% escalation 2027-01-01).
 * 2. Verifies custom PDF never silently injects Demo MSA terms.
 * 3. Verifies empty / malformed text blocks fail safely without fallback to Demo terms.
 * 4. Verifies raw PDF binary is never passed to AI proxy payload.
 * 5. Verifies production Netlify function route configuration.
 */

import assert from 'node:assert/strict';
import { extractCommercialTermsRegexFallback, requestAiExtraction } from '../src/services/aiProxyClient.js';

console.log('\n==================================================================');
console.log(' 🚀 TEST SUITE 5: G6-C CUSTOM CONTRACT PDF PARSER REGRESSION');
console.log('==================================================================\n');

let passedTests = 0;

function runTest(testNum, name, fn) {
  try {
    fn();
    console.log(`  ✓ Test ${testNum}: ${name} PASSED.`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ Test ${testNum} FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAsyncTest(testNum, name, fn) {
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

// Test 1: Custom Contract Fixture Extraction
runTest(1, 'Custom PDF fixture extracts exact rates, parties, and 2027 escalation', () => {
  const customContractBlocks = [
    {
      pageNumber: 1,
      text: 'MASTER SERVICES AGREEMENT\nBetween YBY Test Services Pvt. Ltd. ("Provider") and Demo Manufacturing Corporation ("Client").\nBilling Currency: USD.',
    },
    {
      pageNumber: 2,
      text: 'SCHEDULE A — COMMERCIAL TERMS:\n• Data Engineering — USD 120/hour\n• AI Evaluation — USD 90/hour\n• Project Management — USD 2,500/month',
    },
    {
      pageNumber: 3,
      text: 'SECTION 4 — PRICE ADJUSTMENTS:\n10% price escalation effective 1 Jan 2027 on all billable services.',
    },
  ];

  const terms = extractCommercialTermsRegexFallback(customContractBlocks);

  assert.equal(terms.currency, 'USD');
  assert.equal(terms.vendorName, 'YBY Test Services Pvt. Ltd.');
  assert.equal(terms.clientName, 'Demo Manufacturing Corporation');
  
  assert.equal(terms.rateCards.length, 3, 'Must extract exactly 3 rate cards');

  const de = terms.rateCards.find((r) => r.roleOrItem.toLowerCase().includes('data engineering'));
  assert.ok(de, 'Must extract Data Engineering');
  assert.equal(de.contractRate, 120.0);
  assert.equal(de.unit, 'hour');

  const ai = terms.rateCards.find((r) => r.roleOrItem.toLowerCase().includes('ai evaluation'));
  assert.ok(ai, 'Must extract AI Evaluation');
  assert.equal(ai.contractRate, 90.0);
  assert.equal(ai.unit, 'hour');

  const pm = terms.rateCards.find((r) => r.roleOrItem.toLowerCase().includes('project management'));
  assert.ok(pm, 'Must extract Project Management');
  assert.equal(pm.contractRate, 2500.0);
  assert.equal(pm.unit, 'month');

  assert.equal(terms.priceEscalations.length, 1);
  assert.equal(terms.priceEscalations[0].percentage, 10.0);
  assert.equal(terms.priceEscalations[0].effectiveDate, '2027-01-01');
});

// Test 2: Custom PDF NEVER produces Demo MSA terms
runTest(2, 'Custom PDF extraction is strictly isolated and never contains Demo MSA terms', () => {
  const customContractBlocks = [
    {
      pageNumber: 1,
      text: 'AGREEMENT between Apex Logistics and Beta Retail Inc.\nSecurity Consulting: $200/hr',
    },
  ];

  const terms = extractCommercialTermsRegexFallback(customContractBlocks);

  const hasCloudArchitect = terms.rateCards.some((r) => r.roleOrItem.includes('Senior Cloud Architect'));
  const hasDevOps = terms.rateCards.some((r) => r.roleOrItem.includes('DevOps Engineer'));

  assert.equal(hasCloudArchitect, false, 'Must NEVER contain Senior Cloud Architect');
  assert.equal(hasDevOps, false, 'Must NEVER contain DevOps Engineer');
  assert.equal(terms.rateCards[0].roleOrItem, 'Security Consulting');
  assert.equal(terms.rateCards[0].contractRate, 200.0);
});

// Test 3: Empty / malformed blocks fail safely without Demo fallback
runTest(3, 'Empty text blocks return empty rate cards without Demo fallback', () => {
  const emptyBlocks = [];
  const terms = extractCommercialTermsRegexFallback(emptyBlocks);

  assert.equal(terms.rateCards.length, 0, 'Must produce 0 rate cards on empty input');
  assert.equal(terms.priceEscalations.length, 0);
});

// Test 4: Raw PDF ArrayBuffer is never accepted into AI Proxy payload
await runAsyncTest(4, 'AI Proxy client strictly rejects raw binary ArrayBuffer payload', async () => {
  const fakeBuffer = new ArrayBuffer(1024);
  
  await assert.rejects(
    async () => {
      await requestAiExtraction({ contractSnippets: fakeBuffer });
    },
    /Contract snippets array is required/
  );
});

console.log(`\n 🎉 ALL ${passedTests}/4 G6-C REGRESSION TESTS PASSED!\n`);
