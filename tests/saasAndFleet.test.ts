import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAAS_PLANS,
  SAAS_MODULES,
  ALL_MODULE_SLUGS,
  LOGISTICS_MEMBERSHIP,
  resolvePlanConfig,
  canAddOrganizationSeat,
  canAccessLogisticsSuite,
  normalizeModuleSlug,
  resolveEffectiveModules,
  buildEntitlementsMap,
  hasModuleEntitlement,
} from '../src/services/saasPlans.ts';

test('SAAS_PLANS defines exact PyME user seat limits: 2 Gratis, 5 Pro, 10 Corporativo', () => {
  assert.equal(SAAS_PLANS.gratis.seatLimit, 2);
  assert.equal(SAAS_PLANS.pro.seatLimit, 5);
  assert.equal(SAAS_PLANS.corporativo.seatLimit, 10);
  assert.equal(LOGISTICS_MEMBERSHIP.slug, 'logistica_flota');
  assert.ok(LOGISTICS_MEMBERSHIP.priceMonthlyArs > 0);
});

test('resolvePlanConfig normalizes legacy and SaaS tier aliases accurately', () => {
  assert.equal(resolvePlanConfig(null).slug, 'gratis');
  assert.equal(resolvePlanConfig('Basic').slug, 'gratis');
  assert.equal(resolvePlanConfig('gratis').seatLimit, 2);
  assert.equal(resolvePlanConfig('Pro Industria').slug, 'pro');
  assert.equal(resolvePlanConfig('premium').seatLimit, 5);
  assert.equal(resolvePlanConfig('Corporativo').slug, 'corporativo');
  assert.equal(resolvePlanConfig('enterprise').seatLimit, 10);
});

test('canAddOrganizationSeat enforces 2, 5, and 10 user seat limits strictly', () => {
  // Plan Gratis (2)
  assert.deepEqual(canAddOrganizationSeat(1, 2), { allowed: true, remaining: 1 });
  const blockedGratis = canAddOrganizationSeat(2, 2);
  assert.equal(blockedGratis.allowed, false);
  assert.equal(blockedGratis.remaining, 0);
  assert.match(blockedGratis.reason || '', /límite de 2 usuarios/);

  // Plan Pro Industria (5)
  assert.deepEqual(canAddOrganizationSeat(4, 5), { allowed: true, remaining: 1 });
  const blockedPro = canAddOrganizationSeat(5, 5);
  assert.equal(blockedPro.allowed, false);
  assert.match(blockedPro.reason || '', /límite de 5 usuarios/);

  // Plan Corporativo (10)
  assert.deepEqual(canAddOrganizationSeat(9, 10), { allowed: true, remaining: 1 });
  const blockedCorp = canAddOrganizationSeat(10, 10);
  assert.equal(blockedCorp.allowed, false);
  assert.match(blockedCorp.reason || '', /límite de 10 usuarios/);
});

test('canAccessLogisticsSuite gates fleet tools behind separate Logistics Membership', () => {
  // Standard PyME without logistics membership -> blocked
  assert.equal(
    canAccessLogisticsSuite({
      logisticsPlanActive: false,
      membershipName: 'Pro Industria',
      userCategory: 'Metalúrgica',
      roleName: 'vendor',
    }),
    false
  );

  // Even a logistics-categorized user without active Logistics Membership is gated unless membership active
  assert.equal(
    canAccessLogisticsSuite({
      logisticsPlanActive: false,
      membershipName: 'Basic',
      userCategory: 'LOGISTICA',
      roleName: 'vendor',
    }),
    false
  );

  // Dedicated Logistics Membership unlocked -> allowed
  assert.equal(
    canAccessLogisticsSuite({
      logisticsPlanActive: true,
      membershipName: 'Basic',
      roleName: 'vendor',
    }),
    true
  );

  // Legacy Logistics membership label -> allowed
  assert.equal(
    canAccessLogisticsSuite({
      logisticsPlanActive: false,
      membershipName: 'Membresía Logística & Flota',
      roleName: 'vendor',
    }),
    true
  );

  // System Admin bypass -> allowed
  assert.equal(
    canAccessLogisticsSuite({
      logisticsPlanActive: false,
      membershipName: 'Basic',
      roleName: 'system_admin',
    }),
    true
  );
});

test('SAAS_MODULES and resolveEffectiveModules compute entitlements across Gratis, Pro, Corporativo, and Add-ons', () => {
  assert.equal(ALL_MODULE_SLUGS.length, 6);
  for (const slug of ALL_MODULE_SLUGS) {
    assert.ok(SAAS_MODULES[slug].priceMonthlyArs > 0);
    assert.ok(SAAS_MODULES[slug].routePath.startsWith('/'));
  }

  assert.equal(normalizeModuleSlug('logistica'), 'logistica_flota');
  assert.equal(normalizeModuleSlug('odoo'), 'erp_sync');
  assert.equal(normalizeModuleSlug('wms'), 'warehousing');

  // Gratis gets chat_b2b only by default
  const gratisModules = resolveEffectiveModules({ planSlug: 'gratis' });
  assert.deepEqual(gratisModules, ['chat_b2b']);
  assert.equal(hasModuleEntitlement({ planSlug: 'gratis' }, 'logistica_flota'), false);

  // Pro gets ecommerce_b2b + chat_b2b, NOT warehousing/erp/logistics
  const proModules = resolveEffectiveModules({ planSlug: 'pro' });
  assert.deepEqual(proModules.sort(), ['chat_b2b', 'ecommerce_b2b'].sort());
  assert.equal(hasModuleEntitlement({ planSlug: 'pro' }, 'warehousing'), false);
  assert.equal(hasModuleEntitlement({ planSlug: 'pro' }, 'logistica_flota'), false);

  // Pro + explicit add-ons unlocks warehousing & logistica_flota cleanly
  const proPlusAddons = resolveEffectiveModules({
    planSlug: 'pro',
    rawActiveModules: ['warehousing', 'logistica'],
  });
  assert.equal(proPlusAddons.includes('warehousing'), true);
  assert.equal(proPlusAddons.includes('logistica_flota'), true);

  // Corporativo gets warehousing, kyb_compliance, erp_sync, ecommerce_b2b, chat_b2b (logistics still separate unless active)
  const corpModules = resolveEffectiveModules({ planSlug: 'corporativo' });
  const corpMap = buildEntitlementsMap(corpModules);
  assert.equal(corpMap.warehousing, true);
  assert.equal(corpMap.kyb_compliance, true);
  assert.equal(corpMap.erp_sync, true);
  assert.equal(corpMap.ecommerce_b2b, true);
  assert.equal(corpMap.chat_b2b, true);
  assert.equal(corpMap.logistica_flota, false);

  // system_admin always gets full entitlements
  assert.equal(hasModuleEntitlement({ planSlug: 'gratis', roleName: 'system_admin' }, 'logistica_flota'), true);
  assert.equal(hasModuleEntitlement({ planSlug: 'gratis', roleName: 'system_admin' }, 'erp_sync'), true);
});

