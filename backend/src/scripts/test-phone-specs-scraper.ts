import { PhoneSpecsScraperService } from '../services/phone-specs-scraper.service';

/**
 * Test Script for Phone Specs Scraper
 *
 * Usage:
 *   ts-node src/scripts/test-phone-specs-scraper.ts "Apple" "iPhone 15 Pro"
 *   ts-node src/scripts/test-phone-specs-scraper.ts "Samsung" "Galaxy S24 Ultra"
 */

async function testScraper() {
  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: ts-node src/scripts/test-phone-specs-scraper.ts <brand> <model>');
    console.error('   Example: ts-node src/scripts/test-phone-specs-scraper.ts "Apple" "iPhone 15 Pro"');
    process.exit(1);
  }

  const brand = args[0];
  const model = args.slice(1).join(' '); // Join remaining args as model name

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Phone Specifications Scraper - Test Script        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`🔍 Searching for: ${brand} ${model}`);
  console.log('─'.repeat(60));

  const scraper = new PhoneSpecsScraperService();
  const startTime = Date.now();

  try {
    const result = await scraper.fetchSpecs(brand, model);
    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Request completed in ${duration}ms\n`);

    if (result.success && result.data) {
      console.log('✅ SUCCESS - Phone specifications found!\n');

      console.log('📱 Phone Information:');
      console.log(`   Source: ${result.source}`);
      if (result.sourceUrl) {
        console.log(`   URL: ${result.sourceUrl}`);
      }
      console.log();

      // Display RAM options
      console.log('💾 RAM Options (GB):');
      if (result.data.ram.length > 0) {
        console.log(`   Available: ${result.data.ram.join(', ')} GB`);
        console.log(`   Count: ${result.data.ram.length} option(s)`);
      } else {
        console.log('   ⚠️  No RAM information found');
      }
      console.log();

      // Display Storage options
      console.log('💿 Storage Options (GB):');
      if (result.data.storage.length > 0) {
        console.log(`   Available: ${result.data.storage.join(', ')} GB`);
        console.log(`   Count: ${result.data.storage.length} option(s)`);
      } else {
        console.log('   ⚠️  No storage information found');
      }
      console.log();

      // Display Color options
      console.log('🎨 Color Options:');
      if (result.data.colors.length > 0) {
        console.log(`   Available: ${result.data.colors.join(', ')}`);
        console.log(`   Count: ${result.data.colors.length} option(s)`);
      } else {
        console.log('   ⚠️  No color information found');
      }
      console.log();

      // Cache stats
      const cacheStats = scraper.getCacheStats();
      console.log('📊 Cache Statistics:');
      console.log(`   Keys: ${cacheStats.keys}`);
      console.log(`   Hits: ${cacheStats.hits}`);
      console.log(`   Misses: ${cacheStats.misses}`);
      console.log();

      // Summary
      const totalSpecs = result.data.ram.length + result.data.storage.length + result.data.colors.length;
      console.log('📈 Summary:');
      console.log(`   Total specifications found: ${totalSpecs}`);
      console.log(`   RAM variants: ${result.data.ram.length}`);
      console.log(`   Storage variants: ${result.data.storage.length}`);
      console.log(`   Color variants: ${result.data.colors.length}`);

    } else {
      console.log('❌ FAILED - Could not fetch phone specifications\n');
      console.log(`Error: ${result.error}`);
      console.log('\nPossible reasons:');
      console.log('  • Phone model not found on GSMArena');
      console.log('  • Network connectivity issues');
      console.log('  • GSMArena website structure changed');
      console.log('  • Rate limiting or blocking');
    }

  } catch (error) {
    console.log('\n❌ EXCEPTION - An unexpected error occurred\n');
    console.error(error);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Test completed.\n');
}

// Run the test
testScraper().catch(console.error);
