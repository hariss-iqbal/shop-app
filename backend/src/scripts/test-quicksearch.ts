import axios from 'axios';

async function testQuickSearch() {
  const query = 'iphone 15 pro';

  console.log(`\n🔍 Testing GSMArena quicksearch for: ${query}\n`);

  try {
    // Try the quicksearch endpoint
    const url = `https://www.gsmarena.com/quicksearch-${encodeURIComponent(query)}.php`;
    console.log(`URL: ${url}\n`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.gsmarena.com/'
      },
      timeout: 10000
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`\nResponse:\n${JSON.stringify(response.data, null, 2)}`);

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${error.response.data.substring(0, 500)}`);
    }
  }
}

testQuickSearch().catch(console.error);
