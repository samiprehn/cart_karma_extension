# Cart Karma (Chrome extension)

A small companion to the [Cart Karma](https://samiprehn.github.io/cart-karma/) site. When you search on Amazon, Walmart, or Target, a floating card surfaces the same search on Etsy, eBay, Craigslist, and OfferUp — a quiet nudge to check other places before you buy.

## Install (unpacked)

1. Visit `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked** and select this `cart_karma_extension/` directory

## Behavior

- Runs on these retailers' search pages:
  - Amazon, Walmart, Target
  - Best Buy, Home Depot, Lowe's
  - Macy's, Nordstrom, Wayfair
  - REI, IKEA
  - PetSmart, Petco
- Reads the search query from the URL (`?k=`, `?q=`, `?searchTerm=`)
- Shows a small green card top-right with one-click links to the same search on:
  - **Etsy** → `etsy.com/search?q=…`
  - **eBay** → `ebay.com/sch/i.html?_nkw=…`
  - **Craigslist** → `{region}.craigslist.org/search/sss?query=…` (defaults to `sandiego`; configurable via the toolbar popup)
  - **OfferUp** → `offerup.com/search?q=…`
- Click ✕ to dismiss for the rest of the session on that domain. Closing/reopening the browser brings it back.
- Card has a "Why?" link to the Cart Karma site.

## Files

- `manifest.json` — MV3 manifest, content-script-only (no service worker, no popup)
- `content.js` — query extraction, card injection, dismiss logic
- `card.css` — styling
- `icons/` — 16/48/128px

## Permissions

None beyond the host matches in `manifest.json`. The extension never reads or transmits any data — it only constructs URLs from the visible search query and renders a card locally.

## Limitations

- **Craigslist defaults to San Diego.** v2: configurable region.
- **OfferUp uses logged-in / geolocation-based location.** No way to pre-fill region in their URL.
- **No inline result fetching** — just outbound links. Scraping each alt site would be fragile and would touch terms-of-service. Keeping it to links is honest and durable.
