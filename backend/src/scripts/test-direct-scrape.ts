import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDirectScrape() {
  // Test with a known phone page - Samsung Galaxy S24 Ultra
  const phoneUrl = 'https://www.gsmarena.com/samsung_galaxy_s24_ultra-12771.php';

  console.log(`\n🔍 Testing direct scrape from: ${phoneUrl}\n`);

  try {
    const response = await axios.get(phoneUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      timeout: 10000
    });

    console.log(`✅ Response received (${response.status})\n`);

    const $ = cheerio.load(response.data);

    console.log('=== PHONE NAME ===');
    const phoneName = $('.specs-phone-name-title').text();
    console.log(phoneName || 'Not found');

    console.log('\n=== MEMORY SECTION ===');
    $('tr').each((_, tr) => {
      const $tr = $(tr);
      const header = $tr.find('.ttl').text().trim();
      if (header.toLowerCase().includes('memory')) {
        const specs = $tr.find('.nfo').text().trim();
        console.log(`${header}: ${specs}`);
      }
    });

    console.log('\n=== LOOKING FOR RAM ===');
    let ramFound: number[] = [];
    let storageFound: number[] = [];

    $('td.nfo').each((_, el) => {
      const text = $(el).text();

      // RAM pattern
      const ramMatches = text.match(/(\d+)\s*GB\s*RAM/gi);
      if (ramMatches) {
        ramMatches.forEach(m => {
          const val = parseInt(m.match(/(\d+)/)?.[1] || '0');
          if (val > 0 && !ramFound.includes(val)) {
            ramFound.push(val);
          }
        });
      }

      // Storage pattern (GB)
      const storageMatches = text.match(/(\d+)\s*GB(?!\s*RAM)/gi);
      if (storageMatches) {
        storageMatches.forEach(m => {
          const val = parseInt(m.match(/(\d+)/)?.[1] || '0');
          if (val >= 64 && !storageFound.includes(val)) {
            storageFound.push(val);
          }
        });
      }

      // Storage pattern (TB)
      const tbMatches = text.match(/(\d+)\s*TB/gi);
      if (tbMatches) {
        tbMatches.forEach(m => {
          const val = parseInt(m.match(/(\d+)/)?.[1] || '0') * 1024;
          if (!storageFound.includes(val)) {
            storageFound.push(val);
          }
        });
      }
    });

    console.log(`RAM options: ${ramFound.sort((a,b) => a-b).join(', ')} GB`);
    console.log(`Storage options: ${storageFound.sort((a,b) => a-b).join(', ')} GB`);

    console.log('\n=== LOOKING FOR COLORS ===');
    const colors: string[] = [];
    $('tr').each((_, tr) => {
      const $tr = $(tr);
      const header = $tr.find('.ttl').text().trim();
      if (header.toLowerCase().includes('color')) {
        const colorText = $tr.find('.nfo').text().trim();
        console.log(`Colors field: ${colorText}`);

        const colorList = colorText.split(/[,;]/).map(c => c.trim()).filter(c => c.length > 0 && c.length < 50);
        colors.push(...colorList);
      }
    });
    console.log(`Color options: ${colors.join(', ')}`);

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testDirectScrape().catch(console.error);
