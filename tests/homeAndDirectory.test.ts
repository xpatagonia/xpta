import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiApp } from '../src/server/createApp.ts';
import {
  computePctChange,
  computeBrechaBluePct,
  buildMarketAlerts,
} from '../src/services/marketService.ts';
import {
  B2B_COMPANIES,
  ENTITY_TYPE_CONFIG,
  sortCompaniesBySubscriptionTier,
  type DirectoryEntityType,
} from '../src/lib/b2bDirectoryData.ts';

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

test('computePctChange calculates signed percentage changes safely', () => {
  const up = computePctChange(110, 100);
  assert.equal(up.pct, 10);
  assert.equal(up.label, '+10.00%');
  assert.equal(up.isPositive, true);

  const down = computePctChange(95, 100);
  assert.equal(down.pct, -5);
  assert.equal(down.label, '-5.00%');
  assert.equal(down.isPositive, false);

  const invalid = computePctChange(100, 0);
  assert.equal(invalid.pct, 0);
  assert.equal(invalid.label, '0.00%');
});

test('computeBrechaBluePct computes Blue vs Oficial spread', () => {
  assert.equal(computeBrechaBluePct(1650, 1500), 10);
  assert.equal(computeBrechaBluePct(1500, 0), 0);
});

test('buildMarketAlerts returns at most 3 prioritized alerts including Brent & Brecha', () => {
  const alerts = buildMarketAlerts({
    btcChange24h: 2.35,
    btcUsd: 92000,
    brentPrice: 76.5,
    brentChangePct: 1.45,
    brentMode: 'live',
    currencies: [
      {
        symbol: 'USD BLUE',
        name: 'Dólar Blue',
        buy: 1580,
        sell: 1620,
        change: '+1.20%',
        changePct: 1.2,
        isPositive: true,
        source: 'DolarApi',
        dataMode: 'live',
        updatedAt: new Date().toISOString(),
      },
    ],
    brechaBluePct: 12.5,
  });

  assert.ok(alerts.length > 0 && alerts.length <= 3);
  assert.equal(alerts[0].symbol, 'BRENT');
  assert.equal(alerts[0].severity, 'up');
  assert.equal(alerts[1].symbol, 'BTC');
});

test('B2B directory covers all 4 entity types and maintains subscription tier order', () => {
  const requiredTypes: DirectoryEntityType[] = ['empresa', 'emprendimiento', 'profesional', 'servicio'];
  for (const type of requiredTypes) {
    assert.ok(ENTITY_TYPE_CONFIG[type].label.length > 0);
    const matching = B2B_COMPANIES.filter((c) => c.entityType === type);
    assert.ok(matching.length >= 2, `Expected at least 2 curated records for entityType=${type}`);
  }

  const sorted = sortCompaniesBySubscriptionTier(B2B_COMPANIES);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(
      sorted[i - 1].tierPriority <= sorted[i].tierPriority,
      'Companies must remain sorted by tierPriority ascending'
    );
  }
});

test('GET /api/market-data returns unified snapshot with alerts, dataMode, and currencies', async () => {
  const res = await fetch(`${baseUrl}/api/market-data`);
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(typeof body.updatedAt, 'string');
  assert.equal(typeof body.brechaBluePct, 'number');
  assert.ok(body.btc && typeof body.btc.usd === 'number');
  assert.ok(Array.isArray(body.currencies) && body.currencies.length > 0);
  assert.ok(Array.isArray(body.patagonia) && body.patagonia.length > 0);
  assert.ok(Array.isArray(body.alerts) && body.alerts.length > 0);

  for (const item of body.patagonia) {
    assert.ok(['live', 'official_reference'].includes(item.dataMode));
    assert.equal(typeof item.updatedAt, 'string');
  }
});

test('GET /api/directory filters by entityType and masks sensitive data uniformly for public visitors', async () => {
  const types: DirectoryEntityType[] = ['empresa', 'emprendimiento', 'profesional', 'servicio'];
  for (const entityType of types) {
    const res = await fetch(`${baseUrl}/api/directory?entityType=${entityType}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.isMemberAuthorized, false);
    assert.ok(Array.isArray(body.companies) && body.companies.length > 0);
    for (const actor of body.companies) {
      assert.equal(actor.entityType, entityType);
      assert.equal(actor.protectedMasked, true);
      assert.equal(actor.cuit, '••-••••••••-•');
      assert.equal(actor.email, '');
      assert.equal(actor.phone, '');
      assert.equal(actor.whatsapp, '');
      if (actor.credentialLabel) {
        assert.match(actor.credentialLabel, /Solo Miembros/);
      }
    }
  }
});
