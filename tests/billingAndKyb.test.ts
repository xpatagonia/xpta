import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createApiApp } from '../src/server/createApp.ts';
import {
  BILLING_CATALOG,
  getBankTransferInstructions,
  verifyMercadoPagoWebhookSignature,
} from '../src/services/billingService.ts';
import {
  formatCuit,
  mapBcraSituationLabel,
  verifyCuitKyb,
} from '../src/services/kybService.ts';

let server: http.Server;
let baseUrl = '';

before(async () => {
  const { app } = createApiApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr !== 'string') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('BILLING_CATALOG exposes authoritative ARS pricing and getBankTransferInstructions omits fake placeholders', () => {
  assert.ok(BILLING_CATALOG.pro.amountArs > 0);
  assert.ok(BILLING_CATALOG.corporativo.amountArs > BILLING_CATALOG.pro.amountArs);
  assert.ok(BILLING_CATALOG.logistica_flota.amountArs > 0);

  const bank = getBankTransferInstructions();
  assert.notEqual(bank.cbu, '0000003100000000000000');
  assert.notEqual(bank.alias, 'patagonia.hub.app');
});

test('verifyMercadoPagoWebhookSignature validates valid HMAC SHA-256 and rejects tampered or malformed signatures', () => {
  const secret = 'test-mp-secret-xpatagonia';
  const dataId = '987654321';
  const requestId = 'req-abc-123';
  const ts = '1730000000';
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const validV1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=${ts},v1=${validV1}`,
      requestIdHeader: requestId,
      dataId,
      secret,
    }),
    true
  );

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=${ts},v1=${'0'.repeat(64)}`,
      requestIdHeader: requestId,
      dataId,
      secret,
    }),
    false
  );

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: `ts=${ts},v1=short-invalid`,
      requestIdHeader: requestId,
      dataId,
      secret,
    }),
    false
  );
});

test('formatCuit, mapBcraSituationLabel, and verifyCuitKyb validate CUIT format cleanly', async () => {
  assert.equal(formatCuit('30712345671'), '30-71234567-1');
  assert.match(mapBcraSituationLabel(1), /Situación 1/);
  assert.match(mapBcraSituationLabel(5), /Situación 5/);
  assert.match(mapBcraSituationLabel(null), /Sin deudas informadas/);

  const invalid = await verifyCuitKyb('20-12345678-0');
  assert.equal(invalid.validFormat, false);
  assert.equal(invalid.verifiedBadge, false);
  assert.match(invalid.message, /CUIT/i);
});

test('GET /api/billing/config returns catalog and bank transfer metadata cleanly', async () => {
  const res = await fetch(`${baseUrl}/api/billing/config`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.mercadopagoConfigured, 'boolean');
  assert.ok(body.bankTransfer);
  assert.notEqual(body.bankTransfer.cbu, '0000003100000000000000');
  assert.ok(Array.isArray(body.catalog));
  assert.ok(body.catalog.length >= 3);
});

test('Protected billing, KYB, and RFQ quote endpoints reject unauthenticated requests (401)', async () => {
  const endpoints: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [
    { method: 'POST', path: '/api/org/plan', body: { planSlug: 'pro' } },
    { method: 'POST', path: '/api/billing/checkout', body: { targetSlug: 'pro', provider: 'bank_transfer' } },
    { method: 'GET', path: '/api/billing/transactions' },
    { method: 'POST', path: '/api/kyb/verify-cuit', body: { cuit: '30-71234567-1' } },
    { method: 'GET', path: '/api/rfqs/1/quotes' },
    { method: 'POST', path: '/api/rfqs/1/quotes', body: { totalPriceArs: 500000 } },
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${baseUrl}${ep.path}`, {
      method: ep.method,
      headers: ep.body ? { 'Content-Type': 'application/json' } : undefined,
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    assert.equal(res.status, 401, `Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
  }
});

test('POST /api/webhooks/mercadopago rejects invalid signature when MP_WEBHOOK_SECRET is configured', async () => {
  const prevSecret = process.env.MP_WEBHOOK_SECRET;
  process.env.MP_WEBHOOK_SECRET = 'webhook-secret-check';
  try {
    const res = await fetch(`${baseUrl}/api/webhooks/mercadopago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'ts=1730000000,v1=invalid-sig',
        'x-request-id': 'req-1',
      },
      body: JSON.stringify({ data: { id: '12345' } }),
    });
    assert.equal(res.status, 401);
  } finally {
    if (prevSecret === undefined) {
      delete process.env.MP_WEBHOOK_SECRET;
    } else {
      process.env.MP_WEBHOOK_SECRET = prevSecret;
    }
  }
});

test('GET /api/public/tracking/:code validates code format and works without auth', async () => {
  const shortRes = await fetch(`${baseUrl}/api/public/tracking/TR`);
  assert.equal(shortRes.status, 400);

  const notFoundRes = await fetch(`${baseUrl}/api/public/tracking/TRK-NOTFOUND`);
  assert.equal(notFoundRes.status, 404);
});
