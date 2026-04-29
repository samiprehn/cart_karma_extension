const regionEl = document.getElementById('region');
const statusEl = document.getElementById('status');

const DEFAULT_REGION = 'sandiego';
const VALID = /^[a-z][a-z0-9]*$/;

(async () => {
    const { craigslistRegion } = await chrome.storage.local.get('craigslistRegion');
    regionEl.value = craigslistRegion || '';
})();

let saveTimer = null;
function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
}

async function save() {
    const raw = regionEl.value.trim().toLowerCase();
    if (raw && !VALID.test(raw)) {
        statusEl.style.color = '#fca5a5';
        statusEl.textContent = 'Use only lowercase letters/numbers (subdomain only).';
        return;
    }
    await chrome.storage.local.set({ craigslistRegion: raw || DEFAULT_REGION });
    statusEl.style.color = '#4ade80';
    statusEl.textContent = `Saved · using ${raw || DEFAULT_REGION}.craigslist.org`;
}

regionEl.addEventListener('input', scheduleSave);
regionEl.addEventListener('blur', save);
