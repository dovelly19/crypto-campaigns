const axios = require('axios');

const urls = [
    'https://campaign.coincheck.com/',
    'https://coincheck.com/ja/campaigns',
    'https://bitflyer.com/ja-jp/cam',
    'https://bitflyer.com/ja-jp/campaign',
    'https://www.bitpoint.co.jp/campaign/',
    'https://www.bitpoint.co.jp/news/campaign/',
    'https://www.bittrade.co.jp/ja-jp/campaign/',
    'https://www.bitget.com/ja/events',
    'https://www.bitget.com/ja/welfare',
    'https://worldcoin.org/'
];

async function checkUrl(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });
        console.log(`[OK] ${url} - Status: ${response.status}`);
        return true;
    } catch (error) {
        console.log(`[FAIL] ${url} - ${error.message}`);
        if (error.response) {
            console.log(`       Status: ${error.response.status}`);
        }
        return false;
    }
}

async function main() {
    console.log('Diagnosing Campaign URLs...');
    for (const url of urls) {
        await checkUrl(url);
    }
}

main();
