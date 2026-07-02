// Cart Karma — content script
// On Amazon/Walmart/Target search pages, extract the query from the URL,
// inject a small floating card with one-click links to the same search on
// Etsy, eBay, Craigslist, and OfferUp. Closing the card just hides it
// for the current query; the next distinct search re-injects it.

(function () {
    try {
    const HOST = (location.hostname || '').replace(/^www\./, '');

    // Each entry: path regex the URL must match; then either `param` (read from
    // URL search params) or `pathQuery` (capture group index from the path regex)
    // tells us where the search query lives.
    const SOURCES = {
        'amazon.com':    { path: /^\/s\b/,                   param: 'k' },
        'walmart.com':   { path: /^\/search\b/,              param: 'q' },
        'target.com':    { path: /^\/s\b/,                   param: 'searchTerm' },
        'bestbuy.com':   { path: /^\/site\/searchpage\.jsp/, param: 'st' },
        'lowes.com':     { path: /^\/search\b/,              param: 'searchTerm' },
        'homedepot.com': { path: /^\/s\/([^\/?#]+)/,         pathQuery: 1 },
        'macys.com':     { path: /\/shop\/search/,           param: 'keyword' },
        'nordstrom.com': { path: /^\/sr\b/,                  param: 'keyword' },
        'wayfair.com':   { path: /^\/keyword\.php/,          param: 'keyword' },
        'rei.com':       { path: /^\/search\b/,              param: 'q' },
        'ikea.com':      { path: /\/search\b/,               param: 'q' },
        'petsmart.com':  { path: /^\/search\b/,              param: 'searchTerm' },
        'petco.com':     { path: /\/search\b/,               param: 'query' },
    };

    const cfg = SOURCES[HOST];
    if (!cfg) return;

    let lastQuery = null;
    let craigslistRegion = 'sandiego';

    chrome.storage?.local.get('craigslistRegion').then(r => {
        if (r.craigslistRegion) craigslistRegion = r.craigslistRegion;
    }).catch(() => {});
    chrome.storage?.onChanged.addListener((changes) => {
        if (changes.craigslistRegion) {
            craigslistRegion = changes.craigslistRegion.newValue || 'sandiego';
            // Force re-render so the link updates immediately
            lastQuery = null;
            syncFromUrl();
        }
    });

    function escapeHTML(s) {
        return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function getQuery() {
        const m = location.pathname.match(cfg.path);
        if (!m) return '';
        if (cfg.pathQuery != null) {
            // Query lives in the URL path (e.g. Home Depot /s/cordless+drill)
            const raw = (m[cfg.pathQuery] || '').replace(/\+/g, ' ');
            try { return decodeURIComponent(raw).trim(); }
            catch { return raw.trim(); }
        }
        return (new URLSearchParams(location.search).get(cfg.param) || '').trim();
    }

    function buildAlts(query) {
        const Q = encodeURIComponent(query);
        return [
            { name: 'Etsy',        url: `https://www.etsy.com/search?q=${Q}` },
            { name: 'eBay',        url: `https://www.ebay.com/sch/i.html?_nkw=${Q}` },
            { name: 'Craigslist',  url: `https://${craigslistRegion}.craigslist.org/search/sss?query=${Q}` },
            { name: 'OfferUp',     url: `https://offerup.com/search?q=${Q}` },
            { name: 'FB Marketplace', url: `https://www.facebook.com/marketplace/search/?query=${Q}` },
        ];
    }

    function removeCard() {
        const el = document.getElementById('cart-karma-card');
        if (el) el.remove();
    }

    function showCard(query) {
        removeCard();

        const card = document.createElement('div');
        card.id = 'cart-karma-card';
        const display = query.length > 40 ? query.slice(0, 40) + '…' : query;
        card.innerHTML = `
            <div class="ck-head">
                <span class="ck-title">🌱 Cart Karma</span>
                <button class="ck-close" title="Hide">×</button>
            </div>
            <div class="ck-sub">Same search on:<br><strong>"${escapeHTML(display)}"</strong></div>
            <div class="ck-links">
                ${buildAlts(query).map(a => `<a class="ck-link" href="${a.url}" target="_blank" rel="noopener noreferrer">${a.name} ↗</a>`).join('')}
            </div>
            <div class="ck-foot">
                <a href="https://samiprehn.github.io/cart-karma/" target="_blank" rel="noopener noreferrer">Why? →</a>
            </div>
        `;
        card.querySelector('.ck-close').addEventListener('click', removeCard);
        (document.body || document.documentElement).appendChild(card);
    }

    function syncFromUrl() {
        const query = getQuery();
        if (!query) {
            removeCard();
            lastQuery = null;
            return;
        }
        if (query === lastQuery) return; // already showing for this query
        lastQuery = query;
        showCard(query);
    }

    syncFromUrl();

    // SPA navigation: content scripts run in an isolated world, so patching
    // history.pushState/replaceState never sees the page's calls — poll the
    // URL instead.
    let lastHref = location.href;
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            syncFromUrl();
        }
    }, 1000);
    window.addEventListener('popstate', () => setTimeout(syncFromUrl, 50));
    } catch (err) {
        console.error('[Cart Karma]', err);
    }
})();
