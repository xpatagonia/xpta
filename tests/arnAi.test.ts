import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ARN_POLICY,
  evaluateHybridDecision,
  analyzeOpportunityWithArn,
  type ArnPolicyRule,
} from '../src/services/arnAiService.ts';
import { validateArgentineCuit } from '../src/server/arnRoutes.ts';

test('evaluateHybridDecision keeps all actions in approval queue under manual mode', () => {
  const manualRule: ArnPolicyRule = {
    ...DEFAULT_ARN_POLICY,
    mode: 'manual',
    autoSendEmails: true,
    autoApproveMaxUsd: 10000,
    minConfidenceScore: 50,
  };

  const decision = evaluateHybridDecision(manualRule, 'send_quote_email', 400, 96);
  assert.equal(decision.shouldAutoExecute, false);
  assert.equal(decision.executionMode, 'manual_approval');
});

test('evaluateHybridDecision respects hybrid mode thresholds, confidence, and channel toggles', () => {
  const hybridDefault: ArnPolicyRule = { ...DEFAULT_ARN_POLICY };

  // Email auto-send is false by default -> holds quote email for 1-click human approval
  const heldEmail = evaluateHybridDecision(hybridDefault, 'send_quote_email', 900, 92);
  assert.equal(heldEmail.shouldAutoExecute, false);
  assert.equal(heldEmail.executionMode, 'manual_approval');

  // Logistics auto-create is true and within USD/confidence thresholds -> auto executes
  const autoLogistics = evaluateHybridDecision(hybridDefault, 'create_logistics_load', 1200, 88);
  assert.equal(autoLogistics.shouldAutoExecute, true);
  assert.equal(autoLogistics.executionMode, 'auto_approved');

  // Inventory reserve when disabled in rule -> manual approval
  const disabledInventory = evaluateHybridDecision(
    { ...hybridDefault, autoReserveInventory: false },
    'reserve_inventory',
    500,
    95
  );
  assert.equal(disabledInventory.shouldAutoExecute, false);
  assert.equal(disabledInventory.executionMode, 'manual_approval');

  // Amount above autoApproveMaxUsd -> manual approval even if autoSendEmails is true
  const hybridEmailEnabled: ArnPolicyRule = {
    ...hybridDefault,
    autoSendEmails: true,
    autoApproveMaxUsd: 2000,
    minConfidenceScore: 80,
  };
  const overBudget = evaluateHybridDecision(hybridEmailEnabled, 'send_quote_email', 2500, 95);
  assert.equal(overBudget.shouldAutoExecute, false);
  assert.equal(overBudget.executionMode, 'manual_approval');

  // Low confidence -> manual approval
  const lowConfidence = evaluateHybridDecision(hybridEmailEnabled, 'send_quote_email', 1000, 74);
  assert.equal(lowConfidence.shouldAutoExecute, false);
  assert.equal(lowConfidence.executionMode, 'manual_approval');

  // Within both USD & confidence limits with autoSendEmails true -> auto executes
  const withinLimits = evaluateHybridDecision(hybridEmailEnabled, 'send_quote_email', 1800, 91);
  assert.equal(withinLimits.shouldAutoExecute, true);
  assert.equal(withinLimits.executionMode, 'auto_approved');
});

test('evaluateHybridDecision executes emails in auto mode only within USD and confidence limits', () => {
  const autoRule: ArnPolicyRule = {
    mode: 'auto',
    autoApproveMaxUsd: 3000,
    minConfidenceScore: 80,
    autoSendEmails: false,
    autoCreateLogistics: true,
    autoReserveInventory: true,
  };

  const allowed = evaluateHybridDecision(autoRule, 'send_quote_email', 1500, 88);
  assert.equal(allowed.shouldAutoExecute, true);
  assert.equal(allowed.executionMode, 'auto_approved');

  const highTicket = evaluateHybridDecision(autoRule, 'send_quote_email', 5500, 95);
  assert.equal(highTicket.shouldAutoExecute, false);
  assert.equal(highTicket.executionMode, 'manual_approval');
});

test('validateArgentineCuit validates AFIP/ARCA check digit accurately', () => {
  assert.equal(validateArgentineCuit('20-11111111-2'), true);
  assert.equal(validateArgentineCuit('30711234566'), true);
  assert.equal(validateArgentineCuit('30-12345678-0'), false);
  assert.equal(validateArgentineCuit('20-1111'), false);
  assert.equal(validateArgentineCuit(''), false);
});

test('analyzeOpportunityWithArn produces structured fallback with draft quote when Gemini key is absent', async () => {
  const prevGemini = process.env.GEMINI_API_KEY;
  const prevCustom = process.env.CUSTOM_GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.CUSTOM_GEMINI_API_KEY;

  try {
    const result = await analyzeOpportunityWithArn({
      source: 'rfq',
      companyName: 'Vaca Muerta Drilling S.A.',
      contactName: 'Laura Méndez',
      contactEmail: 'compras@vm-drilling.example',
      category: 'Válvulas y Tuberías',
      rawText: 'Requerimos urgente cotización de válvulas API 6D para Añelo, presupuesto USD 4500.',
      catalogSummary: '- Válvula Esclusa API 6D (SKU-VAL-01)',
    });

    assert.equal(result.companyName, 'Vaca Muerta Drilling S.A.');
    assert.equal(result.contactEmail, 'compras@vm-drilling.example');
    assert.equal(result.urgency, 'high');
    assert.equal(result.estimatedAmountUsd, 4500);
    assert.match(result.corridor, /Añelo|Vaca Muerta/);
    assert.equal(result.actionType, 'send_quote_email');
    assert.ok(result.draftSubject.length > 5);
    assert.match(result.draftBody, /SKU-VAL-01/);
  } finally {
    if (prevGemini !== undefined) process.env.GEMINI_API_KEY = prevGemini;
    if (prevCustom !== undefined) process.env.CUSTOM_GEMINI_API_KEY = prevCustom;
  }
});
