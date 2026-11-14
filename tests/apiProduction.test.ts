import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiApp } from '../src/server/createApp.ts';
import { resolveUserRoleAndMembership } from '../src/middleware/auth.ts';
import { formatPgError } from '../src/db/index.ts';

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

test('GET /api/health exposes production runtime and integration diagnostics', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.ok(['vercel_serverless', 'node_server'].includes(body.runtime));
  assert.equal(typeof body.databaseConfigured, 'boolean');
  assert.equal(typeof body.supabaseConfigured, 'boolean');
  assert.equal(typeof body.supabaseAdminConfigured, 'boolean');
  assert.equal(typeof body.resendConfigured, 'boolean');
  assert.ok(['resend_https', 'cyberpanel_smtp', 'none'].includes(body.emailOutboundProvider));
  assert.ok(['supermicro', 'public_fallback'].includes(body.osrmMode));
  assert.ok(['active', 'local_queue'].includes(body.n8nMode));
});

test('GET /api/public-config exposes public Supabase runtime config with no-store headers without leaking secrets', async () => {
  const res = await fetch(`${baseUrl}/api/public-config`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get('cache-control'),
    'no-store, no-cache, must-revalidate, max-age=0'
  );
  const body = await res.json();
  assert.equal(typeof body.supabaseUrl, 'string');
  assert.equal(typeof body.supabaseAnonKey, 'string');
  assert.equal('serviceRoleKey' in body, false);
  assert.equal('databaseUrl' in body, false);
});

test('GET /api/site-settings enforces strict no-store cache headers for cross-device sync', async () => {
  const res = await fetch(`${baseUrl}/api/site-settings`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get('cache-control'),
    'no-store, no-cache, must-revalidate, max-age=0'
  );
  assert.equal(res.headers.get('cdn-cache-control'), 'no-store');
  const body = await res.json();
  assert.ok('settings' in body);
  assert.ok(['postgres', 'supabase', 'defaults'].includes(body.source));
});

test('PUT /api/site-settings requires admin authentication', async () => {
  const res = await fetch(`${baseUrl}/api/site-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hero: { backgroundType: 'video', videoUrl: 'https://example.com/v.mp4' } }),
  });
  assert.equal(res.status, 401);
});

test('POST /api/admin/upload-media requires admin authentication', async () => {
  const res = await fetch(`${baseUrl}/api/admin/upload-media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'hero.mp4', mimeType: 'video/mp4', base64Data: 'AAAA' }),
  });
  assert.equal(res.status, 401);
});

test('GET /api/insights enforces no-store cache headers and returns array payload', async () => {
  const res = await fetch(`${baseUrl}/api/insights`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get('cache-control'),
    'no-store, no-cache, must-revalidate, max-age=0'
  );
  const body = await res.json();
  assert.ok(Array.isArray(body.insights));
});

test('POST /api/public/rfq-lead validates required fields and processes valid leads', async () => {
  const badRes = await fetch(`${baseUrl}/api/public/rfq-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test' }),
  });
  assert.equal(badRes.status, 400);

  const okRes = await fetch(`${baseUrl}/api/public/rfq-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company: 'Patagonia Test S.A.',
      email: 'test@patagonia.example',
      category: 'Logística',
      budget: 'USD 10.000',
      details: 'Solicitud de prueba automatizada.',
    }),
  });
  assert.equal(okRes.status, 200);
  const body = await okRes.json();
  assert.equal(body.success, true);
});

test('GET /api/logistics/route returns 400 when coordinates are missing', async () => {
  const res = await fetch(`${baseUrl}/api/logistics/route`);
  assert.equal(res.status, 400);
});

test('POST /api/cron/publish-insight rejects missing or invalid bearer tokens', async () => {
  const missingRes = await fetch(`${baseUrl}/api/cron/publish-insight`, { method: 'POST' });
  assert.equal(missingRes.status, 401);

  const badRes = await fetch(`${baseUrl}/api/cron/publish-insight`, {
    method: 'POST',
    headers: { Authorization: 'Bearer wrong-token-123' },
  });
  assert.equal(badRes.status, 403);
});

test('resolveUserRoleAndMembership promotes bootstrap admin emails and defaults others to vendor', async () => {
  const adminAccess = await resolveUserRoleAndMembership(
    '00000000-0000-0000-0000-000000000001',
    'xpatagonia.com@gmail.com'
  );
  assert.equal(adminAccess.roleName, 'system_admin');

  const regularAccess = await resolveUserRoleAndMembership(
    '00000000-0000-0000-0000-000000000002',
    'proveedor@empresa.example'
  );
  assert.equal(regularAccess.roleName, 'vendor');
});

test('formatPgError unwraps Drizzle cause codes into actionable messages without dumping query params', () => {
  assert.match(
    formatPgError({ message: 'Failed query', cause: { code: '42P01', message: 'relation "site_settings" does not exist' } }),
    /42P01/
  );
  assert.match(
    formatPgError({ message: 'Failed query', cause: { code: '28P01', message: 'password authentication failed for user postgres' } }),
    /Contraseña incorrecta/
  );
  assert.match(
    formatPgError({ message: 'Failed query', cause: { message: 'Tenant or user not found' } }),
    /Pooler/
  );
  assert.match(
    formatPgError({ message: 'Failed query', cause: { code: 'ENETUNREACH', message: 'connect ENETUNREACH' } }),
    /Transaction Pooler/
  );
});
