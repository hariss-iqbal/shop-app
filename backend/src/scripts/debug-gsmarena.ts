import axios from 'axios';
import * as cheerio from 'cheerio';

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000
    });

    console.log(`✅ Response received (${response.status} ${response.statusText})`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.data.length} bytes\n`);

    const $ = cheerio.load(response.data);

    // Try different selectors
    console.log('Testing different CSS selectors:\n');

    console.log('1. .makers ul li:');
    $('.makers ul li').each((i, el) => {
      console.log(`   [${i}] ${$(el).text().trim().substring(0, 100)}`);
    });

    console.log('\n2. .makers li:');
    $('.makers li').each((i, el) => {
      console.log(`   [${i}] ${$(el).text().trim().substring(0, 100)}`);
    });

    console.log('\n3. All links with "phone" in href:');
    $('a[href*="phone"]').slice(0, 5).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      console.log(`   [${i}] ${text} -> ${href}`);
    });

    console.log('\n4. Body structure (first 500 chars):');
    console.log($('body').text().trim().substring(0, 500));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

debugGSMArena().catch(console.error);
