import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractOrgAliasId,
  extractEmailAddress,
  computeNextRetryDate,
  parseExpiryDaysRemaining,
} from '../src/services/vpsWorkerService.ts';

test('extractOrgAliasId detects +org<ID> subaddress routing accurately', () => {
  assert.equal(extractOrgAliasId('notificaciones+org42@xpatagonia.online'), 42);
  assert.equal(extractOrgAliasId('Ventas <notificaciones+org7@xpatagonia.online>'), 7);
  assert.equal(extractOrgAliasId('notificaciones@xpatagonia.online'), null);
  assert.equal(extractOrgAliasId('notificaciones+org0@xpatagonia.online'), null);
  assert.equal(extractOrgAliasId(null), null);
});

test('extractEmailAddress parses RFC name and lowercase email cleanly', () => {
  assert.deepEqual(
    extractEmailAddress('"Ing. Carlos Mendoza" <CMendoza@PetroSur-B2B.com.ar>'),
    { email: 'cmendoza@petrosur-b2b.com.ar', name: 'Ing. Carlos Mendoza' }
  );
  assert.deepEqual(extractEmailAddress('compras@operadora.com.ar'), {
    email: 'compras@operadora.com.ar',
    name: 'compras@operadora.com.ar',
  });
});

test('computeNextRetryDate applies exponential backoff and stops after 5 retries (dead_letter)', () => {
  const base = new Date('2026-11-14T12:00:00.000Z');
  assert.equal(computeNextRetryDate(1, base)?.toISOString(), '2026-11-14T12:01:00.000Z');
  assert.equal(computeNextRetryDate(2, base)?.toISOString(), '2026-11-14T12:05:00.000Z');
  assert.equal(computeNextRetryDate(3, base)?.toISOString(), '2026-11-14T12:15:00.000Z');
  assert.equal(computeNextRetryDate(4, base)?.toISOString(), '2026-11-14T12:30:00.000Z');
  assert.equal(computeNextRetryDate(5, base)?.toISOString(), '2026-11-14T13:00:00.000Z');
  assert.equal(computeNextRetryDate(6, base), null);
});

test('parseExpiryDaysRemaining calculates exact UTC days until VTV or insurance expiration', () => {
  const ref = new Date('2026-11-14T15:30:00.000Z');
  assert.equal(parseExpiryDaysRemaining('2026-11-14', ref), 0);
  assert.equal(parseExpiryDaysRemaining('2026-11-29', ref), 15);
  assert.equal(parseExpiryDaysRemaining('2026-11-10', ref), -4);
  assert.equal(parseExpiryDaysRemaining('', ref), null);
  assert.equal(parseExpiryDaysRemaining('fecha-invalida', ref), null);
});
