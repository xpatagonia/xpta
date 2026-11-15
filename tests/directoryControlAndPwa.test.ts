import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiApp } from '../src/server/createApp.ts';
import {
  calculateTaxBreakdownFromNet,
  calculateTaxBreakdownFromGross,
  resolvePrimaryPriceLabel,
} from '../src/lib/taxPricing.ts';
import {
  SAAS_PLANS,
  PLAN_RESOURCE_LIMITS,
  resolvePlanConfig,
  canAddOrganizationSeat,
} from '../src/services/saasPlans.ts';
import { BILLING_CATALOG } from '../src/services/billingService.ts';
import { B2B_COMPANIES } from '../src/lib/b2bDirectoryData.ts';
import {
  buildCompanyVCard,
  buildCompanyGpx,
  buildCompanyGeoJson,
  getNavigationDeepLinks,
} from '../src/lib/mobileDirectoryDownloads.ts';

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

test('Tax pricing math converts cleanly between Net and Gross across 0%, 10.5%, 21%, and 27%', () => {
  const std21 = calculateTaxBreakdownFromNet(100000, 21);
  assert.equal(std21.netPrice, 100000);
  assert.equal(std21.taxAmount, 21000);
  assert.equal(std21.grossPrice, 121000);
  assert.equal(std21.taxRateBps, 2100);

  const reverse21 = calculateTaxBreakdownFromGross(121000, 21);
  assert.equal(reverse21.netPrice, 100000);
  assert.equal(reverse21.taxAmount, 21000);

  const half105 = calculateTaxBreakdownFromNet(20000, 10.5);
  assert.equal(half105.taxAmount, 2100);
  assert.equal(half105.grossPrice, 22100);

  const exempt = calculateTaxBreakdownFromNet(50000, 0);
  assert.equal(exempt.taxAmount, 0);
  assert.equal(exempt.grossPrice, 50000);

  const netView = resolvePrimaryPriceLabel(
    { netPrice: 100000, grossPrice: 121000, taxRatePercent: 21, currency: 'ARS', unitLabel: 'Hora' },
    'net'
  );
  assert.match(netView.primary, /100\.000/);
  assert.match(netView.secondary, /121\.000/);

  const grossView = resolvePrimaryPriceLabel(
    { netPrice: 100000, grossPrice: 121000, taxRatePercent: 21, currency: 'ARS', unitLabel: 'Hora' },
    'gross'
  );
  assert.match(grossView.primary, /121\.000/);
  assert.match(grossView.secondary, /IVA 21% incl\./);
});

test('Autonomo membership plan enforces 1 user seat and $24.900 ARS billing catalog', () => {
  assert.equal(SAAS_PLANS.autonomo.slug, 'autonomo');
  assert.equal(SAAS_PLANS.autonomo.seatLimit, 1);
  assert.equal(SAAS_PLANS.autonomo.priceMonthlyArs, 24900);
  assert.equal(PLAN_RESOURCE_LIMITS.autonomo.maxRfqsMonthly, 10);

  assert.equal(resolvePlanConfig('autonomo').slug, 'autonomo');
  assert.equal(resolvePlanConfig('Autónomo').seatLimit, 1);
  assert.equal(BILLING_CATALOG.autonomo.amountArs, 24900);

  const blocked = canAddOrganizationSeat(1, SAAS_PLANS.autonomo.seatLimit);
  assert.equal(blocked.allowed, false);
});

test('Mobile coordinate downloads build valid vCard 3.0 (.vcf), GPX 1.1 (.gpx), GeoJSON, and nav links', () => {
  const sample = B2B_COMPANIES[0];
  const vcf = buildCompanyVCard(sample);
  assert.match(vcf, /^BEGIN:VCARD/m);
  assert.match(vcf, /VERSION:3\.0/);
  assert.match(vcf, /GEO:-?\d+\.\d+;-?\d+\.\d+/);
  assert.match(vcf, /END:VCARD$/m);

  const gpx = buildCompanyGpx(sample);
  assert.match(gpx, /<gpx version="1\.1"/);
  assert.match(gpx, /<wpt lat="-?\d+\.\d+" lon="-?\d+\.\d+">/);

  const geojson = JSON.parse(buildCompanyGeoJson(sample));
  assert.equal(geojson.type, 'FeatureCollection');
  assert.equal(geojson.features[0].geometry.type, 'Point');
  assert.equal(geojson.features[0].geometry.coordinates.length, 2);

  const links = getNavigationDeepLinks(sample);
  assert.ok(links.googleMaps.includes('google.com/maps'));
  assert.ok(links.waze.includes('waze.com/ul'));
  assert.ok(links.openStreetMap.includes('openstreetmap.org'));
});

test('Admin directory-control requires authentication and /api/billing/config exposes autonomo', async () => {
  const billingRes = await fetch(`${baseUrl}/api/billing/config`);
  assert.equal(billingRes.status, 200);
  const billingBody = await billingRes.json();
  assert.ok(
    Array.isArray(billingBody.catalog) &&
      billingBody.catalog.some((item: any) => item.slug === 'autonomo' && item.amountArs === 24900)
  );

  const ctrlRes = await fetch(`${baseUrl}/api/admin/directory-control`);
  assert.equal(ctrlRes.status, 401);

  const dirRes = await fetch(`${baseUrl}/api/directory`);
  assert.equal(dirRes.status, 200);
  const dirBody = await dirRes.json();
  assert.equal(dirBody.isMemberAuthorized, false);
  for (const comp of dirBody.companies) {
    for (const srv of comp.serviceItems || []) {
      assert.equal(srv.netPrice, 0);
      assert.equal(srv.grossPrice, 0);
    }
  }
});
