// キャンペーンデータの設定
// campaign.jsonから読み込む
async function renderCampaigns() {
    const container = document.getElementById('campaign-list');

    let campaigns = [];
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`campaigns.json?t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        campaigns = await response.json();
    } catch (e) {
        console.error("Could not load campaigns:", e);
        alert("エラー詳細:\n" + e); // Temporary debugging
        container.innerHTML = `<p style="text-align:center; color:red;">データの読み込みに失敗しました。<br>${e}</p>`;
        return;
    }

    // データがない場合は何もしない
    if (!campaigns || campaigns.length === 0) {
        container.innerHTML = '<p style="text-align:center;">キャンペーンデータが見つかりませんでした。</p>';
        return;
    }

    // 最新更新日を探してTickerにセット
    const lastUpdate = campaigns
        .map(c => new Date(c.lastChecked))
        .sort((a, b) => b - a)[0];

    if (lastUpdate) {
        const dateStr = `${lastUpdate.getFullYear()}/${lastUpdate.getMonth() + 1}/${lastUpdate.getDate()}`;
        const tickerEl = document.getElementById('ticker-content');
        if (tickerEl) tickerEl.innerHTML = `${dateStr}: キャンペーン情報を自動更新しました。`;
    }

    // キャンペーン一覧の生成
    const filtered = campaigns;

    // テーブルヘッダー (PCのみ表示)
    let html = `
            <div class="comparison-header">
                <div>取引所</div>
                <div>最大ボーナス</div>
                <div>おすすめポイント</div>
                <div>詳細</div>
            </div>
        `;

    html += filtered.map((campaign, index) => {
        const borderStyle = `border-left: 4px solid ${campaign.color || '#ccc'};`;
        // タグのスタイル
        const tagStyle = campaign.isRecommended ? 'background:var(--primary); color:white;' : '';

        const merits = campaign.merits || [];
        const demerits = campaign.demerits || [];

        // 個別ページへのリンク（SEO静的ページへ）
        let linkUrl = `detail.html?id=${campaign.id}`;
        if (['coincheck', 'bitflyer', 'bitpoint', 'worldcoin', 'bitget', 'bittrade'].includes(campaign.id)) {
            linkUrl = `${campaign.id}.html`;
        }

        return `
                <a href="${linkUrl}" class="campaign-row" style="${borderStyle} position:relative;">
                    <div class="rank-badge-main" style="position:absolute; top:-10px; left:-10px; background:${index < 3 ? '#fbbf24' : '#94a3b8'}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:5;">
                        ${index + 1}
                    </div>
                    <div class="row-info">
                        <span class="row-name" style="color:${campaign.color}">${campaign.name}</span>
                        <span class="row-tag" style="${tagStyle}">${campaign.tag || ''}</span>
                    </div>
                    <div class="row-bonus">
                        <span class="bonus-highlight" style="color:${campaign.color}">${campaign.bonusAmount}</span>
                        <span class="bonus-sub">${campaign.unit}</span>
                    </div>
                    <div class="row-desc">
                        ${campaign.description}
                        <div class="spec-list">
                            ${merits.slice(0, 2).map(m => `<span class="spec-item spec-merit"><i class="fa-solid fa-thumbs-up"></i> ${m}</span>`).join('')}
                            ${demerits.slice(0, 1).map(d => `<span class="spec-item spec-demerit"><i class="fa-solid fa-triangle-exclamation"></i> ${d}</span>`).join('')}
                        </div>
                    </div>
                    <div class="row-action">
                        <span class="btn-detail">詳細・手順 <i class="fa-solid fa-chevron-right"></i></span>
                    </div>
                </a>
            `;
    }).join('');

    container.innerHTML = `<div class="campaign-table">${html}</div>`;


}

document.addEventListener('DOMContentLoaded', () => {
    // 最終更新日を表示
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    const dateEl = document.getElementById('last-updated-date');
    if (dateEl) dateEl.innerText = dateStr;

    // Sticky Footer Injection
    const bannerLink = document.querySelector('.banner-widget a');
    if (bannerLink) {
        const url = bannerLink.href;
        const footer = document.createElement('div');
        footer.className = 'sticky-footer';
        footer.innerHTML = `
            <a href="${url}" class="sticky-btn" target="_blank" rel="noopener noreferrer">
                キャンペーンに参加して特典をもらう <i class="fa-solid fa-arrow-right" style="margin-left:8px;"></i>
            </a>
        `;
        document.body.appendChild(footer);
    }

    renderCampaigns();
});
