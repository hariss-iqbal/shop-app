import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMemoryExtraction() {
  // Test with Google Pixel 8 Pro
  const phoneUrl = 'https://www.gsmarena.com/google_pixel_8_pro-12545.php';

  console.log(`\n🔍 Testing memory extraction from: ${phoneUrl}\n`);

  try {
    const response = await axios.get(phoneUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    console.log('=== ALL TABLE ROWS WITH MEMORY/RAM/STORAGE ===\n');
    $('tr').each((_, tr) => {
      const $tr = $(tr);
      const header = $tr.find('td.ttl').text().trim();
      const value = $tr.find('td.nfo').text().trim();

      if (header && value && (
        header.toLowerCase().includes('memory') ||
        header.toLowerCase().includes('storage') ||
        header.toLowerCase().includes('ram') ||
        value.toLowerCase().includes('gb ram') ||
        value.toLowerCase().includes('gb') && value.length < 200
      )) {
        console.log(`Header: "${header}"`);
        console.log(`Value: "${value}"`);
        console.log('---');
      }
    });

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testMemoryExtraction().catch(console.error);
