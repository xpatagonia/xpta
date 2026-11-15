import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiApp } from '../src/server/createApp.ts';
import { verifyMercadoPagoWebhookSignature } from '../src/services/billingService.ts';

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

test('CORS strict origin validation allows official domains and blocks lookalikes/arbitrary vercel apps', async () => {
  const allowedOriginRes = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://www.xpatagonia.online' },
  });
  assert.equal(allowedOriginRes.status, 200);
  assert.equal(
    allowedOriginRes.headers.get('access-control-allow-origin'),
    'https://www.xpatagonia.online'
  );

  const localOriginRes = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:3000' },
  });
  assert.equal(localOriginRes.status, 200);
  assert.equal(
    localOriginRes.headers.get('access-control-allow-origin'),
    'http://localhost:3000'
  );

  for (const evilOrigin of [
    'https://xpatagonia.online.evil.com',
    'https://malicious.vercel.app',
    'https://evil-xpatagonia.online',
  ]) {
    const blockedRes = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: evilOrigin },
    });
    assert.equal(
      blockedRes.headers.get('access-control-allow-origin'),
      null,
      `Evil origin ${evilOrigin} must not receive CORS allow header`
    );
    assert.ok(blockedRes.status >= 400, `Expected 4xx/5xx for blocked CORS origin ${evilOrigin}`);
  }
});

test('verifyMercadoPagoWebhookSignature fails closed when secret is empty', () => {
  assert.equal(
    verifyMercadoPagoWebhookSignature({
      signatureHeader: 'ts=1730000000,v1=' + 'a'.repeat(64),
      requestIdHeader: 'req-1',
      dataId: '12345',
      secret: '',
    }),
    false
  );
});

test('POST /api/webhooks/mercadopago fails closed (401) when MP_WEBHOOK_SECRET is unset', async () => {
  const prevSecret = process.env.MP_WEBHOOK_SECRET;
  delete process.env.MP_WEBHOOK_SECRET;
  try {
    const res = await fetch(`${baseUrl}/api/webhooks/mercadopago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { id: '999' } }),
    });
    assert.equal(res.status, 401);
  } finally {
    if (prevSecret !== undefined) process.env.MP_WEBHOOK_SECRET = prevSecret;
  }
});

test('POST /api/webhooks/odoo fails closed without configured secret (503) and rejects wrong secret (403)', async () => {
  const prevN8n = process.env.N8N_SHARED_SECRET;
  const prevOdoo = process.env.ODOO_WEBHOOK_SECRET;
  delete process.env.N8N_SHARED_SECRET;
  delete process.env.ODOO_WEBHOOK_SECRET;

  try {
    const unconfiguredRes = await fetch(`${baseUrl}/api/webhooks/odoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'odoo.invoice.paid' }),
    });
    assert.equal(unconfiguredRes.status, 503);

    process.env.ODOO_WEBHOOK_SECRET = 'super-secret-odoo-key';
    const wrongRes = await fetch(`${baseUrl}/api/webhooks/odoo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-odoo-webhook-secret': 'wrong-secret',
      },
      body: JSON.stringify({ event: 'odoo.invoice.paid' }),
    });
    assert.equal(wrongRes.status, 403);

    const validRes = await fetch(`${baseUrl}/api/webhooks/odoo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-odoo-webhook-secret': 'super-secret-odoo-key',
      },
      body: JSON.stringify({ event: 'odoo.invoice.paid', invoiceRef: 'FAC-001' }),
    });
    assert.equal(validRes.status, 200);
  } finally {
    if (prevN8n === undefined) delete process.env.N8N_SHARED_SECRET;
    else process.env.N8N_SHARED_SECRET = prevN8n;

    if (prevOdoo === undefined) delete process.env.ODOO_WEBHOOK_SECRET;
    else process.env.ODOO_WEBHOOK_SECRET = prevOdoo;
  }
});

test('Sensitive admin, AI, mail, ARN, and fleet routes reject unauthenticated access (401)', async () => {
  const routes: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [
    { method: 'GET', path: '/api/emails' },
    { method: 'POST', path: '/api/emails/send', body: { to: 'a@b.com', subject: 'hi', text: 'test' } },
    { method: 'POST', path: '/api/generate-insights' },
    { method: 'POST', path: '/api/admin/upload-media', body: { filename: 'x.png', mimeType: 'image/png', base64Data: 'AA==' } },
    { method: 'POST', path: '/api/admin/users/user-1/role', body: { roleName: 'system_admin' } },
    { method: 'POST', path: '/api/admin/billing/1/approve' },
    { method: 'POST', path: '/api/admin/billing/1/reject' },
    { method: 'POST', path: '/api/logistics/contracts', body: { title: 'Test' } },
    { method: 'POST', path: '/api/arn/triage-inbox' },
    { method: 'POST', path: '/api/chat/messages', body: { message: 'hola' } },
    { method: 'POST', path: '/api/cron/publish-insight' },
  ];

  for (const r of routes) {
    const res = await fetch(`${baseUrl}${r.path}`, {
      method: r.method,
      headers: r.body ? { 'Content-Type': 'application/json' } : undefined,
      body: r.body ? JSON.stringify(r.body) : undefined,
    });
    assert.equal(res.status, 401, `Expected 401 on ${r.method} ${r.path}, got ${res.status}`);
  }
});

test('POST /api/cron/publish-insight rejects invalid bearer secret (403)', async () => {
  const prevCron = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'cron-secret-123';
  try {
    const res = await fetch(`${baseUrl}/api/cron/publish-insight`, {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-cron-token' },
    });
    assert.equal(res.status, 403);
  } finally {
    if (prevCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevCron;
  }
});

test('GET /api/public/tracking/:code rejects malformed tracking codes (400)', async () => {
  for (const badCode of ['TR', 'TR$123', 'abc_invalid!']) {
    const res = await fetch(`${baseUrl}/api/public/tracking/${encodeURIComponent(badCode)}`);
    assert.equal(res.status, 400, `Expected 400 for malformed tracking code ${badCode}, got ${res.status}`);
  }
});

test('POST /api/public/rfq-lead validates email format (400) and enforces rate limiting (429)', async () => {
  const badEmailRes = await fetch(`${baseUrl}/api/public/rfq-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company: 'Patagonia Test SA',
      email: 'not-an-email',
      details: 'Requerimos válvulas API 6D',
    }),
  });
  assert.equal(badEmailRes.status, 400);

  let hitRateLimit = false;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${baseUrl}/api/public/rfq-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'Patagonia Test SA',
        email: 'compras@patagoniatest.com.ar',
        details: 'Requerimos válvulas API 6D',
      }),
    });
    if (res.status === 429) {
      hitRateLimit = true;
      break;
    }
    assert.equal(res.status, 200);
  }
  assert.equal(hitRateLimit, true, 'Expected rate limiter to trigger HTTP 429 on /api/public/rfq-lead');
});
