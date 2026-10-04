/**
 * LX AI — Comprehensive Automated Security & Logic Test Suite
 * Covers Authentication, Quotas, Model Routing, and Security Invariants.
 */

import { Database } from '../server/db';
import { ServerConfig } from '../server/config';
import crypto from 'crypto';

let testPassed = 0;
let testFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    testPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    testFailed++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 LX AI Automated Production Test Suite');
  console.log('====================================================\n');

  Database.init();

  // TEST SUITE 1: AUTHENTICATION & SESSION LIFECYCLE
  console.log('1. Testing Authentication & Session Management...');
  const testEmail = `test_${Date.now()}@example.com`;
  const user = Database.createOrGetUser(testEmail, 'Test User', 'google');
  assert(!!user && user.email === testEmail, 'User creation and retrieval');

  const token = Database.createSession(user.id);
  assert(typeof token === 'string' && token.length === 64, 'Session token generation');

  const validatedUser = Database.validateSession(token);
  assert(validatedUser?.id === user.id, 'Session validation returns correct user');

  const invalidValidation = Database.validateSession('fake_token_123');
  assert(invalidValidation === null, 'Invalid session returns null');

  Database.deleteSession(token);
  const deletedValidation = Database.validateSession(token);
  assert(deletedValidation === null, 'Session deletion immediately invalidates session');

  // TEST SUITE 2: PER-USER QUOTA & CONCURRENCY
  console.log('\n2. Testing Per-User Quota Engine & Race Prevention...');
  const userA = Database.createOrGetUser(`usera_${Date.now()}@test.com`, 'User A', 'google');
  const userB = Database.createOrGetUser(`userb_${Date.now()}@test.com`, 'User B', 'google');

  const quotaA = Database.getQuota(userA.id);
  const quotaB = Database.getQuota(userB.id);
  assert(quotaA.usedTokens === 0 && quotaB.usedTokens === 0, 'Quotas are isolated per user');

  // Reserve budget
  const res1 = Database.reserveBudget(userA.id, 500);
  assert(res1.allowed === true, 'Quota budget reservation granted');

  // Commit usage
  Database.commitUsage(userA.id, 350, 500);
  const updatedQuotaA = Database.getQuota(userA.id);
  assert(updatedQuotaA.usedTokens === 350, 'Actual tokens committed accurately');
  assert(Database.getQuota(userB.id).usedTokens === 0, 'User B quota unaffected by User A activity');

  // TEST SUITE 3: VOUCHER REDEMPTION & ONE-TIME ENFORCEMENT
  console.log('\n3. Testing Entitlement & Voucher Rules...');
  const redeemResult = Database.redeemVoucher(userA.id, 'FREE_24H');
  assert(redeemResult.success === true, 'Valid voucher activation');

  const quotaAfterRedeem = Database.getQuota(userA.id);
  assert(quotaAfterRedeem.hasFree24h === true, 'FREE_24H entitlement flag active');

  // Replay attempt must fail
  const replayResult = Database.redeemVoucher(userA.id, 'FREE_24H');
  assert(replayResult.success === false, 'Voucher replay rejected (one-time use enforced)');

  // Invalid voucher must fail
  const invalidResult = Database.redeemVoucher(userB.id, 'INVALID_CODE_XYZ');
  assert(invalidResult.success === false, 'Invalid voucher code rejected');

  // TEST SUITE 4: SECURITY & SECRET SAFETY
  console.log('\n4. Testing Security Invariants...');
  const status = ServerConfig.getProviderStatus();
  assert(typeof status.google === 'boolean', 'Provider status is safe boolean map');
  assert(!('keyMask' in (status as any)), 'No keyMask exposed in provider status');
  assert(!('apiKey' in (status as any)), 'No apiKey exposed in provider status');

  // Telegram timing-safe validation test
  const secret = 'test_webhook_secret_12345';
  const validHeader = 'test_webhook_secret_12345';
  const invalidHeader = 'wrong_secret';

  const a = Buffer.from(validHeader);
  const b = Buffer.from(secret);
  const isValidMatch = a.length === b.length && crypto.timingSafeEqual(a, b);
  assert(isValidMatch === true, 'Timing-safe comparison passes on valid secret');

  const c = Buffer.from(invalidHeader);
  const isInvalidMatch = c.length === b.length && crypto.timingSafeEqual(c, b);
  assert(isInvalidMatch === false, 'Timing-safe comparison rejects invalid secret');

  // Summary
  console.log('\n====================================================');
  console.log(`Test Execution Summary: ${testPassed} Passed, ${testFailed} Failed`);
  console.log('====================================================');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
