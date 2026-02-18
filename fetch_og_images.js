const axios = require('axios');
const cheerio = require('cheerio');

const urls = {
    coincheck: 'https://campaign.coincheck.com/',
    bitflyer: 'https://bitflyer.com/ja-jp/cam',
    bitpoint: 'https://www.bitpoint.co.jp/campaign/',
    bybit: 'https://www.bybit.com/ja-JP/',
    bitget: 'https://www.bitget.com/ja/',
    mexc: 'https://www.mexc.com/ja-JP',
    worldcoin: 'https://worldcoin.org/'
};

async function fetchOgImage(id, url) {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            console.log(`${id}: ${ogImage}`);
        } else {
            console.log(`${id}: No og:image found`);
        }
    } catch (e) {
        console.log(`${id}: Error fetching ${url} - ${e.message}`);
    }
}

(async () => {
    console.log("Fetching OG images...");
    for (const [id, url] of Object.entries(urls)) {
        await fetchOgImage(id, url);
    }
})();
