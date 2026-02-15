import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function debugGSMArena() {
  const brand = 'Apple';
  const model = 'iPhone 15 Pro';
  const searchQuery = `${brand} ${model}`;

  console.log(`\n🔍 Debugging GSMArena search for: ${searchQuery}\n`);

  const searchUrl = `https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(searchQuery)}`;
  console.log(`URL: ${searchUrl}\n`);

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.gsmarena.com/'
      },
      timeout: 10000
    });

    console.log(`✅ Response received (${response.status})`);

    // Save HTML to file for inspection
    fs.writeFileSync('/tmp/gsmarena-response.html', response.data);
    console.log('📝 HTML saved to: /tmp/gsmarena-response.html\n');

    const $ = cheerio.load(response.data);

    // Look for common patterns
    console.log('=== Analyzing page structure ===\n');

    // Check for different result containers
    const containers = [
      '.makers',
      '.review-header',
      '.section-body',
      '#review-body',
      '.general-specs',
      'div[class*="result"]',
      'div[class*="phone"]',
      'ul > li > a'
    ];

    containers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`✓ Found ${count} element(s) matching: ${selector}`);
        if (count <= 3) {
          $(selector).each((i, el) => {
            const text = $(el).text().trim().substring(0, 80);
            const href = $(el).attr('href');
            console.log(`  [${i}] ${text}${href ? ' -> ' + href : ''}`);
          });
        }
      }
    });

    console.log('\n=== Checking for review items ===');
    const reviewItems = $('div.review-items, ul.review-items, .review-items li');
    console.log(`Found ${reviewItems.length} review items`);

    console.log('\n=== All class names on page ===');
    const classes = new Set<string>();
    $('[class]').each((_, el) => {
      const classList = $(el).attr('class')?.split(' ') || [];
      classList.forEach(c => classes.add(c));
    });
    console.log(Array.from(classes).filter(c => c.includes('phone') || c.includes('result') || c.includes('item') || c.includes('review')).join(', '));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

debugGSMArena().catch(console.error);
