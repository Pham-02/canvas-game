const ITEM_COSTS = {
    hintBtn: 0,
    swapBtn: 0,
    freezeBtn: 0,
    doubleBtn: 0,
    retryBtn: 0
};
 // --- persistence: item counts stored as a JSON object in sessionStorage ---
const ITEM_COUNTS_KEY = "shop_itemCounts";
function getItemCounts() {
  try { return JSON.parse(sessionStorage.getItem(ITEM_COUNTS_KEY)) || {}; }
  catch (e) { return {}; }
}
function setItemCounts(obj) {
  sessionStorage.setItem(ITEM_COUNTS_KEY, JSON.stringify(obj || {}));
}

const closeBtn = document.getElementById('closeShop');
const backdrop = document.getElementById('backdrop');
const info = document.getElementById('shopInfo');



const qtyDecr = document.getElementById("qtyDecr");
const qtyIncr = document.getElementById("qtyIncr");
const qtyInput = document.getElementById("qtyInput"); // matches shop.html
const totalCostEl = document.getElementById("totalCost");

let selectedItemId = null;   // current tile id when opening modal
let currentUnitCost = 0;

// clamp qty and update displayed total
function updateTotalCost() {
  if (!selectedItemId) return;
  let qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  qty = Math.min(qty, 99); // optional max
  qtyInput.value = qty;
  totalCostEl.textContent = currentUnitCost * qty;
}

// qty UI handlers
qtyIncr?.addEventListener('click', () => { qtyInput.value = (parseInt(qtyInput.value || "1",10) + 1); updateTotalCost(); });
qtyDecr?.addEventListener('click', () => { qtyInput.value = Math.max(1, (parseInt(qtyInput.value || "1",10) - 1)); updateTotalCost(); });
qtyInput?.addEventListener('input', updateTotalCost);

function openShop() {
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    info.classList.add('show');
    closeBtn.focus();
    document.addEventListener('keydown', escClose);
}

function closeShop() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    info.classList.remove('show');
    document.removeEventListener('keydown', escClose);
}

function escClose(e) {
    if (e.key === 'Escape') closeShop();
}

closeBtn.addEventListener('click', closeShop);
backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeShop();
});

// Add ability text to tiles
document.querySelectorAll('.tile').forEach(tile => {
    const ability = tile.dataset.ability;
    tile.querySelector('.ability').textContent = ability;
});

// Auto-open shop on load (but no blinking SHOP title anymore)
window.addEventListener('load', () => {
    document.body.classList.add('bg-loaded');
    openShop();
});

const shopInfo = document.getElementById("shopInfo");

const messages = [
    "Boost your chances and win big in every round! Activate these boosts to increase your luck, speed up progress, and rack up more rewards. Don't miss your shot take your Bingo game to the next level!",
    "Every round is a new chance to shine! With the right boosts, you can push forward, aim higher, and claim the rewards you deserve. Believe in your game your next big win is waiting for you!",
    "Level up your play and maximize every round! Unlock powerful boosts to raise your chances, accelerate your wins, and collect even bigger rewards. Don’t hold back turn your Bingo into a winning streak today!"
];

let index = 0;

function changeMessage() {
    shopInfo.classList.remove("fade-in");
    shopInfo.classList.add("fade-out");

    setTimeout(() => {
        index = (index + 1) % messages.length;
        shopInfo.textContent = messages[index];

        shopInfo.classList.remove("fade-out");
        shopInfo.classList.add("fade-in");
    }, 1000); // matches fadeOut duration
}

setInterval(changeMessage, 6000);

// Item purchase system

let coins = parseInt(sessionStorage.getItem("bingoCoins")) || 0;
const coinDisplay = document.getElementById("coinDisplay");
const purchaseModal = document.getElementById("purchaseModal");
const purchaseMessage = document.getElementById("purchaseMessage");
const confirmBtn = document.getElementById("confirmPurchase");
const cancelBtn = document.getElementById("cancelPurchase");

let selectedItem = null;


if (sessionStorage.getItem("bingoCoins")) {
    coins = parseInt(sessionStorage.getItem("bingoCoins"), 0);

}

function updateCoins() {
    const coinDisplay = document.getElementById("coinDisplay");
    if (coinDisplay) coinDisplay.textContent = coins;
}
updateCoins();

// Hook item clicks to open modal
// ...existing code...
// open purchase modal when a tile is clicked
document.querySelectorAll('.tile').forEach(tile => {
  tile.addEventListener('click', () => {
    selectedItemId = tile.id;
    currentUnitCost = ITEM_COSTS[selectedItemId] || 0;
    // show a human-friendly message using tile label if present
    const label = tile.querySelector('.label')?.textContent || selectedItemId;
    purchaseMessage.textContent = `Buy ${label} — ${currentUnitCost} coins each?`;
    // reset qty and total
    qtyInput.value = "1";
    updateTotalCost();
    purchaseModal.classList.add('show'); // shop CSS uses .show to display
  });
});

// Confirm purchase (supports quantity, updates JSON + individual keys, updates global coins)
confirmBtn.addEventListener('click', () => {
  if (!selectedItemId) return;

  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  const unit = ITEM_COSTS[selectedItemId] || 0;
  const total = unit * qty;

  // read saved coins
  let coinsLocal = parseInt(sessionStorage.getItem("bingoCoins") || "0", 10);
  if (coinsLocal < total) {
    purchaseMessage.textContent = "Not enough coins!";
    return;
  }

  // deduct and persist coins, update global coins var and UI
  coinsLocal -= total;
  sessionStorage.setItem("bingoCoins", String(coinsLocal));
  // ensure global `coins` variable used elsewhere reflects new value
  try { window.coins = coinsLocal; } catch (e) { /* in strict contexts fallback */ }
  if (typeof updateCoins === 'function') updateCoins();
  else {
    const cd = document.getElementById("coinDisplay");
    if (cd) cd.textContent = coinsLocal;
  }

  // update JSON counts
  const counts = getItemCounts();
  counts[selectedItemId] = (counts[selectedItemId] || 0) + qty;
  setItemCounts(counts);

  // ALSO write an individual sessionStorage key for compatibility with play HUD
  const itemKey = selectedItemId.replace('Btn', 'Count'); // e.g. hintBtn -> hintCount
  sessionStorage.setItem(itemKey, String(counts[selectedItemId]));

  // update the tile badge immediately
  const tile = document.getElementById(selectedItemId);
  const badge = tile?.querySelector('.badge');
  if (badge) {
    badge.textContent = counts[selectedItemId] > 0 ? counts[selectedItemId] : "";
    badge.style.display = counts[selectedItemId] > 0 ? "inline-block" : "none";
  }

  // close modal
  setTimeout(() => { purchaseModal.classList.remove('show'); }, 150);
});

const btns = {
    hintBtn: document.getElementById("hintOverlay"),
    swapBtn: document.getElementById("swapOverlay"),
    freezeBtn: document.getElementById("freezeOverlay"),
    doubleBtn: document.getElementById("doubleOverlay"),
    retryBtn: document.getElementById("retryOverlay"),
};

/* --- Freeze Snowflake Effect --- */
const canvas = document.getElementById("snowCanvas");
const ctx = canvas.getContext("2d");
let snowflakes = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function createSnowflakes() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 3 + 2;
    const speed = Math.random() * 1 + 0.5;
    return { x, y, radius, speed };
}

function drawSnowflakes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.beginPath();
    snowflakes.forEach((flake) => {
        ctx.moveTo(flake.x, flake.y);
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    });
    ctx.fill();
}

function updateSnowflakes() {
    snowflakes.forEach((flake) => {
        flake.y += flake.speed;
        if (flake.y > canvas.height) {
            flake.y = 0;
            flake.x = Math.random() * canvas.width;
        }
    });
}

function animateSnow() {
    drawSnowflakes();
    updateSnowflakes();
    requestAnimationFrame(animateSnow);
}

function startSnow() {
    snowflakes = [];
    for (let i = 0; i < 100; i++) {
        snowflakes.push(createSnowflakes());
    }
    animateSnow();
}


window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("bingoCoins", coins);
});








function updateItemAvailability() {
    document.querySelectorAll('.tile').forEach(tile => {
        const badge = tile.querySelector('.badge');
        const count = parseInt(badge.textContent) || 0;
        if (count <= 0) {
            tile.classList.add('tile-disabled');
        } else {
            tile.classList.remove('tile-disabled');
        }
    });
}

// Call this after updating item counts, e.g. after purchase
updateItemAvailability();

// On page load, sync HUD counts and unavailable state
window.addEventListener('load', () => {
    ["hintCountHud", "swapCountHud", "freezeCountHud", "doubleCountHud", "retryCountHud"].forEach(id => {
        const hudCount = document.getElementById(id);
        const itemKey = id.replace('Hud', '');
        let count = parseInt(sessionStorage.getItem(itemKey)) || 0;
        if (hudCount) {
            hudCount.textContent = count;
            const hudBox = hudCount.closest('.shop-item-box');
            if (hudBox) {
                if (count > 0) {
                    hudBox.classList.remove('shop-item-unavailable');
                } else {
                    hudBox.classList.add('shop-item-unavailable');
                }
            }
        }
    });
});