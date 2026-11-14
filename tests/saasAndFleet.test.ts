import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAAS_PLANS,
  LOGISTICS_MEMBERSHIP,
  resolvePlanConfig,
  canAddOrganizationSeat,
  canAccessLogisticsSuite,
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
