const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const CAMPAIGNS_FILE = path.join(__dirname, 'campaigns.json');

// Read existing campaigns
let campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_FILE, 'utf8'));

async function fetchPageContent(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        return data;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

function extractAmount(text, regex) {
    const match = text.match(regex);
    return match ? match[1] : null;
}

async function updateCoincheck(campaign) {
    const url = 'https://campaign.coincheck.com/';
    const html = await fetchPageContent(url);

    if (html) {
        const $ = cheerio.load(html);
        const text = $('body').text();

        // Look for referral amounts
        // Patterns: "2,500円" or "1,500円" or "1,000円"
        const amountMatch = text.match(/([0-9,]+)\s*円/);
        if (amountMatch) {
            console.log(`Coincheck: Found potential amount ${amountMatch[1]}`);
            // Note: We might want strict logic to update specific fields, 
            // but for now we log it. Updating the JSON automatically needs caution.
            // If confident: campaign.bonusAmount = amountMatch[1];
        }
    }
    return campaign;
}

async function updateBitflyer(campaign) {
    const url = 'https://bitflyer.com/ja-jp/campaign';
    const html = await fetchPageContent(url);
    if (html) {
        const $ = cheerio.load(html);
        const pageText = $('body').text();

        if (pageText.includes('招待') && (pageText.includes('1,500') || pageText.includes('1500'))) {
            console.log('bitFlyer: Referral 1500 yen mention found.');
        } else if (pageText.includes('招待') && (pageText.includes('1,000') || pageText.includes('1000'))) {
            console.log('bitFlyer: Referral 1000 yen mention found.');
        } else {
            console.log('bitFlyer: Page accessed but no specific referral amount found.');
        }
    }
    return campaign;
}

async function updateBitpoint(campaign) {
    // Checking News/Campaign list
    const url = 'https://www.bitpoint.co.jp/news/campaign/';
    const html = await fetchPageContent(url);
    if (html) {
        const $ = cheerio.load(html);
        // Titles are usually in dl > dd > a
        // Scan for "口座開設"
        let found = false;
        $('dl.news-list > dd').each((i, el) => {
            const text = $(el).text();
            // Less strict check for debugging
            if (text.includes('口座開設')) {
                console.log(`BITPOINT Candidate found: ${text.trim()}`);
                if (text.includes('プレゼント') || text.includes('CP')) {
                    found = true;
                    // Try to extract amount
                    const amount = text.match(/([0-9,]+)円/);
                    if (amount) {
                        console.log(`BITPOINT Amount: ${amount[1]}`);
                    }
                }
            }
        });
        if (!found) {
            console.log('BITPOINT: No specific campaign found. Dumping first 3 items:');
            $('dl.news-list > dd').slice(0, 3).each((i, el) => {
                console.log(`- ${$(el).text().trim().substring(0, 100)}`);
            });
        }
    }
    return campaign;
}

async function updateBittrade(campaign) {
    const url = 'https://www.bittrade.co.jp/ja-jp/campaign/';
    const html = await fetchPageContent(url);
    if (html) {
        const $ = cheerio.load(html);
        // Check for referral keywords
        const text = $('body').text();
        if (text.includes('友達紹介') || text.includes('紹介プログラム')) {
            console.log('BitTrade: Referral program matches found.');
            if (text.includes('1,500') || text.includes('1000') || text.includes('2,000') || text.includes('3,500')) {
                console.log('BitTrade: Found typical bonus amounts in text.');
            } else {
                console.log('BitTrade: Amount not clearly identified.');
            }
        } else {
            console.log('BitTrade: No explicit referral program keywords found on campaign page.');
        }
    }
    return campaign;
}

async function updateBitget(campaign) {
    console.log('Bitget: Skipping auto-update due to anti-bot protection. Please check https://www.bitget.com/ja/events manually.');
    return campaign;
}

async function updateWorldApp(campaign) {
    const url = 'https://worldcoin.org/';
    const html = await fetchPageContent(url);
    if (html) {
        const $ = cheerio.load(html);
        const text = $('body').text();
        // Just verify the site is up and mentions "Download" or "App"
        if (text.includes('Download') || text.includes('App')) {
            console.log('World App: Site is active.');
        }
    }
    return campaign;
}

async function main() {
    console.log('Starting campaign update...');

    for (let campaign of campaigns) {
        console.log(`Checking ${campaign.name}...`);

        // Add a timestamp for when we last checked
        campaign.lastChecked = new Date().toISOString();

        // Routing to specific updaters
        switch (campaign.id) {
            case 'coincheck':
                await updateCoincheck(campaign);
                break;
            case 'bitflyer':
                await updateBitflyer(campaign);
                break;
            case 'bitpoint':
                await updateBitpoint(campaign);
                break;
            case 'bittrade':
                await updateBittrade(campaign);
                break;
            case 'bitget':
                await updateBitget(campaign);
                break;
            case 'worldcoin':
                await updateWorldApp(campaign);
                break;
            default:
                console.log(`No specific scraper for ${campaign.name}, skipping logic.`);
        }

        // Sleep to be polite
        await new Promise(r => setTimeout(r, 2000));
    }

    // Write back
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 4), 'utf8');
    console.log('Campaigns updated successfully.');

    updateSitemap();
}

function updateSitemap() {
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
        let sitemap = fs.readFileSync(sitemapPath, 'utf8');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Update lastmod for all pages to today
        // In a real scenario, we might only update specific pages if their content changed.
        // But for this "daily check" script, updating all ensures Google knows we checked.
        sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${today}</lastmod>`);

        fs.writeFileSync(sitemapPath, sitemap, 'utf8');
        console.log(`Sitemap timestamps updated to ${today}.`);
    } else {
        console.log('sitemap.xml not found, skipping update.');
    }
}

main();
