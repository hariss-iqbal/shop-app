import { SpamPreventionService } from './spam-prevention.service';

/**
 * Spam Prevention Service Tests
 * Verifies honeypot, rate limiting, and reCAPTCHA validation
 */

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('SpamPreventionService Tests');
  console.log('==========================\n');

  // Honeypot Tests
  console.log('Honeypot Validation:');
  {
    const service = new SpamPreventionService();

    const emptyHoneypot = service.checkHoneypot('');
    assert(emptyHoneypot.allowed === true, 'allows empty honeypot');

    const undefinedHoneypot = service.checkHoneypot(undefined);
    assert(undefinedHoneypot.allowed === true, 'allows undefined honeypot');

    const filledHoneypot = service.checkHoneypot('bot-filled-value');
    assert(filledHoneypot.allowed === false, 'rejects filled honeypot');
    assert(filledHoneypot.silent === true, 'honeypot rejection is silent');
    assert(filledHoneypot.reason === 'spam_detected', 'honeypot reason is spam_detected');

    const whitespaceHoneypot = service.checkHoneypot('   ');
    assert(whitespaceHoneypot.allowed === true, 'allows whitespace-only honeypot');
  }

  // Rate Limiting Tests
  console.log('\nRate Limiting:');
  {
    const service = new SpamPreventionService({
      maxSubmissions: 3,
      windowMs: 5 * 60 * 1000
    });

    const ip = '192.168.1.1';

    const first = service.checkRateLimit(ip);
    assert(first.allowed === true, 'allows first submission');

    const second = service.checkRateLimit(ip);
    assert(second.allowed === true, 'allows second submission');

    const third = service.checkRateLimit(ip);
    assert(third.allowed === true, 'allows third submission');

    const fourth = service.checkRateLimit(ip);
    assert(fourth.allowed === false, 'blocks fourth submission');
    assert(fourth.reason === 'rate_limit_exceeded', 'rate limit reason correct');
    assert(fourth.silent === false, 'rate limit is not silent');
  }

  // Rate Limiting - Different IPs
  console.log('\nRate Limiting - Different IPs:');
  {
    const service = new SpamPreventionService({
      maxSubmissions: 2,
      windowMs: 5 * 60 * 1000
    });

    service.checkRateLimit('10.0.0.1');
    service.checkRateLimit('10.0.0.1');
    const blocked = service.checkRateLimit('10.0.0.1');
    assert(blocked.allowed === false, 'blocks IP that exceeded limit');

    const differentIp = service.checkRateLimit('10.0.0.2');
    assert(differentIp.allowed === true, 'allows different IP');
  }

  // Full checkSpam integration
  console.log('\nFull Spam Check Integration:');
  {
    const service = new SpamPreventionService({
      maxSubmissions: 3,
      windowMs: 5 * 60 * 1000,
      recaptchaEnabled: false
    });

    const cleanResult = await service.checkSpam({
      honeypot: '',
      clientIp: '172.16.0.1'
    });
    assert(cleanResult.allowed === true, 'allows clean submission');

    const spamResult = await service.checkSpam({
      honeypot: 'spam-bot',
      clientIp: '172.16.0.2'
    });
    assert(spamResult.allowed === false, 'blocks honeypot spam');
    assert(spamResult.silent === true, 'honeypot block is silent');
  }

  // Record submission
  console.log('\nRecord Submission:');
  {
    const service = new SpamPreventionService({
      maxSubmissions: 2,
      windowMs: 5 * 60 * 1000
    });

    service.recordSubmission('10.0.0.5');
    service.recordSubmission('10.0.0.5');
    const result = service.checkRateLimit('10.0.0.5');
    assert(result.allowed === false, 'records submission and enforces limit');
  }

  console.log(`\n==========================`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
