/**
 * src/schemas/aiExtraction.schema.js
 * 
 * Strict Zod schema for structured contract commercial terms extraction.
 * Guarantees zero malformed or untyped AI responses enter the review or calculation state.
 */

import { z } from 'zod';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

export const RateCardItemSchema = z.object({
  id: z.string().default(() => `rc_${Math.random().toString(36).slice(2, 9)}`),
  roleOrItem: z.string().min(1, 'Role or item description is required'),
  unit: z.enum(['hour', 'day', 'month', 'fixed', 'unit', 'quarter', 'year']).default('hour'),
  contractRate: z.number().positive('Contract rate must be greater than zero'),
  pageReference: z.number().int().positive().default(1),
  sourceSnippet: z.string().default(''),
});

export const PriceEscalationSchema = z.object({
  id: z.string().default(() => `esc_${Math.random().toString(36).slice(2, 9)}`),
  percentage: z.number().nonnegative('Escalation percentage must be non-negative'),
  frequency: z.enum(['annual', 'semi-annual', 'custom', 'none']).default('annual'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be YYYY-MM-DD').nullable().default(null),
  anniversaryMonth: z.number().int().min(1).max(12).nullable().default(null),
  pageReference: z.number().int().positive().default(1),
  clauseSnippet: z.string().default(''),
});

export const DiscountTermSchema = z.object({
  id: z.string().default(() => `disc_${Math.random().toString(36).slice(2, 9)}`),
  percentage: z.number().nonnegative().max(100, 'Discount cannot exceed 100%'),
  condition: z.string().default('Introductory / Volume discount'),
  validUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until date must be YYYY-MM-DD').nullable().default(null),
  maxBillingCycles: z.number().int().positive().nullable().default(null),
  pageReference: z.number().int().positive().default(1),
  clauseSnippet: z.string().default(''),
});

export const ContractCommercialTermsSchema = z.object({
  contractTitle: z.string().default('Master Services Agreement'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').nullable().default(null),
  contractEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').nullable().default(null),
  billingCycle: z.enum(['monthly_in_arrears', 'monthly_in_advance', 'milestone', 'quarterly']).default('monthly_in_arrears'),
  paymentTermsDays: z.number().int().nonnegative().default(30),
  rateCards: z.array(RateCardItemSchema).default([]),
  priceEscalations: z.array(PriceEscalationSchema).default([]),
  discounts: z.array(DiscountTermSchema).default([]),
  minimumCommitmentAmount: z.number().nonnegative().nullable().default(null),
  extractionConfidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'REGEX_FALLBACK']).default('HIGH'),
  extractedAt: z.string().default(() => new Date().toISOString()),
});
