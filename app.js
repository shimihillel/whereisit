const STORAGE_KEY = 'eifo-ze-orders-v1';

const categories = [
  { id: 'clothes', label: 'בגדים', cls: 'cat-clothes', bg: 'bg-clothes' },
  { id: 'shoes', label: 'נעליים ותיקים', cls: 'cat-shoes', bg: 'bg-shoes' },
  { id: 'kids', label: 'ילדים', cls: 'cat-kids', bg: 'bg-kids' },
  { id: 'home', label: 'בית', cls: 'cat-home', bg: 'bg-home' },
  { id: 'beauty', label: 'טיפוח', cls: 'cat-beauty', bg: 'bg-beauty' },
  { id: 'gifts', label: 'מתנות', cls: 'cat-gifts', bg: 'bg-gifts' },
  { id: 'gadgets', label: 'חשמל וגאדג׳טים', cls: 'cat-gadgets', bg: 'bg-gadgets' },
  { id: 'jewelry', label: 'תכשיטים', cls: 'cat-jewelry', bg: 'bg-jewelry' },
  { id: 'stuff', label: 'שטויות חשובות', cls: 'cat-stuff', bg: 'bg-stuff' },
  { id: 'other', label: 'אחר', cls: 'cat-other', bg: 'bg-other' }
];

let orders = loadOrders();
let activeDetailsId = null;

const els = {
  screens: {
    open: document.getElementById('screen-open'),
    form: document.getElementById('screen-form'),
    done: document.getElementById('screen-done')
  },
  navButtons: document.querySelectorAll('.nav-btn'),
  addFab: document.getElementById('addFab'),
  openList: document.getElementById('openList'),
  doneList: document.getElementById('doneList'),
  openSearch: document.getElementById('openSearch'),
  doneSearch: document.getElementById('doneSearch'),
  openSummary: document.getElementById('openSummary'),
  doneSummary: document.getElementById('doneSummary'),
  moodLine: document.getElementById('moodLine'),
  form: document.getElementById('orderForm'),
  formTitle: document.getElementById('formTitle'),
  cancelEdit: document.getElementById('cancelEdit'),
  editingId: document.getElementById('editingId'),
  date: document.getElementById('date'),
  store: document.getElementById('store'),
  item: document.getElementById('item'),
  amount: document.getElementById('amount'),
  tracking: document.getElementById('tracking'),
  note: document.getElementById('note'),
  categoryChips: document.getElementById('categoryChips'),
  emptyTemplate: document.getElementById('emptyTemplate'),
  detailsDialog: document.getElementById('detailsDialog'),
  detailsContent: document.getElementById('detailsContent'),
  closeDetails: document.getElementById('closeDetails')
};

init();

function init() {
  buildCategoryChips();
  setTodayIfEmpty();
  bindEvents();
  render();
}

function bindEvents() {
  els.navButtons.forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  els.addFab.addEventListener('click', () => {
    resetForm();
    showScreen('form');
  });

  els.openSearch.addEventListener('input', render);
  els.doneSearch.addEventListener('input', render);
  els.cancelEdit.addEventListener('click', () => {
    resetForm();
    showScreen('open');
  });

  els.form.addEventListener('submit', event => {
    event.preventDefault();
    saveOrderFromForm();
  });

  els.closeDetails.addEventListener('click', closeDetails);
  els.detailsDialog.addEventListener('click', event => {
    if (event.target === els.detailsDialog) closeDetails();
  });
}

function buildCategoryChips() {
  els.categoryChips.innerHTML = categories.map((cat, index) => `
    <label class="category-option">
      <input type="radio" name="category" value="${cat.id}" ${index === 0 ? 'checked' : ''} />
      <span class="${cat.cls}">${cat.label}</span>
    </label>
  `).join('');
}

function showScreen(name) {
  Object.entries(els.screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === name);
  });
  els.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.screen === name));
  els.addFab.hidden = name === 'form';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveOrderFromForm() {
  const editingId = els.editingId.value;
  const categoryInput = document.querySelector('input[name="category"]:checked');
  const payload = {
    date: els.date.value,
    store: els.store.value.trim(),
    item: els.item.value.trim(),
    amount: Number(els.amount.value || 0),
    tracking: els.tracking.value.trim(),
    note: els.note.value.trim(),
    category: categoryInput?.value || 'other',
    updatedAt: new Date().toISOString()
  };

  if (!payload.store || !payload.item || !payload.date) {
    showToast('חסר משהו קטן, גוגי לא מלשין אבל האפליקציה צריכה לדעת.');
    return;
  }

  if (editingId) {
    orders = orders.map(order => order.id === editingId ? { ...order, ...payload } : order);
    showToast('עודכן. החבילה חזרה להיות מסודרת, בערך.');
  } else {
    orders.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status: 'open',
      createdAt: new Date().toISOString(),
      ...payload
    });
    showToast('נוסף למעקב. לא שופטת, רק מתעדת.');
  }

  saveOrders();
  resetForm();
  showScreen('open');
  render();
}

function render() {
  const openOrders = orders
    .filter(order => order.status === 'open')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const doneOrders = orders
    .filter(order => order.status === 'done')
    .sort((a, b) => new Date(b.arrivedAt || b.updatedAt || b.date) - new Date(a.arrivedAt || a.updatedAt || a.date));

  renderSummary(openOrders, doneOrders);
  renderList(els.openList, filterOrders(openOrders, els.openSearch.value), 'open');
  renderList(els.doneList, filterOrders(doneOrders, els.doneSearch.value), 'done');
}

function renderSummary(openOrders, doneOrders) {
  const count = openOrders.length;
  const total = openOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  els.openSummary.textContent = `בדרך אלייך עכשיו: ${count} ${count === 1 ? 'חבילה' : 'חבילות'} · ${formatCurrency(total)}`;
  els.doneSummary.textContent = doneOrders.length
    ? `${doneOrders.length} ${doneOrders.length === 1 ? 'הזמנה הגיעה' : 'הזמנות הגיעו'} · מצאת משהו מהעבר?`
    : 'מצאת משהו מהעבר?';

  const moods = count === 0
    ? ['אין כלום בדרך. חשוד מאוד.', 'היקום רגוע מדי. לא טבעי.']
    : ['זה לא בזבוז אם זה עוד לא הגיע.', 'לחכות לחבילות זה הקרדיו החדש.', 'שימי, מה הזמנת הפעם?'];
  els.moodLine.textContent = moods[Math.floor(Math.random() * moods.length)];
}

function renderList(container, list, type) {
  if (!list.length) {
    const empty = els.emptyTemplate.content.cloneNode(true);
    empty.querySelector('h3').textContent = type === 'open' ? 'אין כלום בדרך' : 'עוד לא הגיע כלום';
    empty.querySelector('p').textContent = type === 'open'
      ? 'חשוד מאוד. אבל נזרום.'
      : 'ברגע שחבילה תגיע, היא תעבור לכאן כמו נס קטן.';
    container.innerHTML = '';
    container.appendChild(empty);
    return;
  }

  container.innerHTML = list.map(order => type === 'open' ? openCardHtml(order) : doneCardHtml(order)).join('');

  container.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      handleAction(button.dataset.action, button.dataset.id);
    });
  });

  container.querySelectorAll('[data-open-details]').forEach(card => {
    card.addEventListener('click', () => openDetails(card.dataset.openDetails));
  });
}

function openCardHtml(order) {
  const cat = getCategory(order.category);
  return `
    <article class="order-card open-card ${cat.bg}" data-open-details="${order.id}">
      <div class="card-main">
        <div class="card-top">
          <h3 class="store">${escapeHtml(order.store)}</h3>
          <span class="price">${formatCurrency(order.amount)}</span>
        </div>
        <p class="item">${escapeHtml(order.item)}</p>
        <div class="card-footer">
          <span>${formatDate(order.date)}</span>
          <span>·</span>
          <span class="category-pill ${cat.cls}">${cat.label}</span>
          ${(order.tracking || order.note) ? '<button class="more-btn" data-action="details" data-id="' + order.id + '" type="button">פרטים</button>' : ''}
        </div>
      </div>
      <button class="arrived-btn" data-action="arrive" data-id="${order.id}" type="button">הגיע!</button>
    </article>
  `;
}

function doneCardHtml(order) {
  const cat = getCategory(order.category);
  return `
    <article class="order-card history-card ${cat.bg}" data-open-details="${order.id}">
      <h3 class="store">${escapeHtml(order.store)}</h3>
      <p class="item">${escapeHtml(order.item)}</p>
      <span class="category-pill ${cat.cls}">${cat.label}</span>
      <span class="price">${formatCurrency(order.amount)}</span>
      <span class="card-footer">${formatDate(order.date)}</span>
      <span class="arrived-label">✓ הגיע</span>
      <button class="more-btn" data-action="details" data-id="${order.id}" type="button">פרטים</button>
    </article>
  `;
}

function openDetails(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;
  activeDetailsId = id;
  const cat = getCategory(order.category);
  const tracking = order.tracking || '—';
  const note = order.note ? `<div class="details-note">${escapeHtml(order.note)}</div>` : '';
  const statusAction = order.status === 'open'
    ? `<button class="dialog-action primary" data-action="arrive" data-id="${order.id}" type="button">הגיע!</button>`
    : `<button class="dialog-action soft" data-action="restore" data-id="${order.id}" type="button">החזירי לבדרך</button>`;
  const copyButton = order.tracking
    ? `<button class="dialog-action" data-action="copy" data-id="${order.id}" type="button">העתקת מעקב</button>`
    : '';

  els.detailsContent.innerHTML = `
    <h3 class="details-title">${escapeHtml(order.store)}</h3>
    <p class="details-item">${escapeHtml(order.item)}</p>
    <span class="category-pill ${cat.cls}">${cat.label}</span>
    <div class="details-grid">
      <div class="details-row"><b>סכום</b><span>${formatCurrency(order.amount)}</span></div>
      <div class="details-row"><b>הוזמן</b><span>${formatDate(order.date)}</span></div>
      <div class="details-row"><b>מעקב</b><span>${escapeHtml(tracking)}</span></div>
    </div>
    ${note}
    <div class="dialog-actions">
      ${statusAction}
      ${copyButton}
      <button class="dialog-action" data-action="edit" data-id="${order.id}" type="button">עריכה</button>
      <button class="dialog-action danger" data-action="delete" data-id="${order.id}" type="button">מחיקה</button>
    </div>
  `;

  els.detailsContent.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => handleAction(button.dataset.action, button.dataset.id));
  });

  if (!els.detailsDialog.open) els.detailsDialog.showModal();
}

function closeDetails() {
  activeDetailsId = null;
  if (els.detailsDialog.open) els.detailsDialog.close();
}

function handleAction(action, id) {
  if (action === 'details') {
    openDetails(id);
    return;
  }

  const order = orders.find(item => item.id === id);
  if (!order) return;

  if (action === 'arrive') {
    order.status = 'done';
    order.arrivedAt = new Date().toISOString();
    showToast('ברוכה הבאה הביתה, חבילה קטנה.');
    closeDetails();
  }

  if (action === 'restore') {
    order.status = 'open';
    delete order.arrivedAt;
    showToast('הוחזרה לבדרך. הדרמה ממשיכה.');
    closeDetails();
  }

  if (action === 'delete') {
    const ok = window.confirm('למחוק כאילו זה לא קרה?');
    if (!ok) return;
    orders = orders.filter(item => item.id !== id);
    showToast('נמחק. לא ראינו, לא שמענו.');
    closeDetails();
  }

  if (action === 'edit') {
    fillForm(order);
    closeDetails();
    showScreen('form');
    return;
  }

  if (action === 'copy') {
    copyTracking(order.tracking);
    return;
  }

  saveOrders();
  render();
}

function fillForm(order) {
  els.formTitle.textContent = 'עריכת הזמנה';
  els.cancelEdit.hidden = false;
  els.editingId.value = order.id;
  els.date.value = order.date || todayString();
  els.store.value = order.store || '';
  els.item.value = order.item || '';
  els.amount.value = order.amount || '';
  els.tracking.value = order.tracking || '';
  els.note.value = order.note || '';
  const input = document.querySelector(`input[name="category"][value="${order.category || 'other'}"]`);
  if (input) input.checked = true;
}

function resetForm() {
  els.form.reset();
  els.formTitle.textContent = 'הוספת הזמנה';
  els.cancelEdit.hidden = true;
  els.editingId.value = '';
  setTodayIfEmpty(true);
  const firstCategory = document.querySelector('input[name="category"]');
  if (firstCategory) firstCategory.checked = true;
}

function setTodayIfEmpty(force = false) {
  if (force || !els.date.value) els.date.value = todayString();
}

function filterOrders(list, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(order => [order.store, order.item, order.tracking, order.note, getCategory(order.category).label]
    .some(value => String(value || '').toLowerCase().includes(q)));
}

function getCategory(id) {
  return categories.find(cat => cat.id === id) || categories[categories.length - 1];
}

function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: num % 1 ? 2 : 0 }).format(num);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : demoOrders();
  } catch (error) {
    console.warn('Could not load orders', error);
    return demoOrders();
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function demoOrders() {
  return [
    {
      id: 'demo-1',
      status: 'open',
      date: '2026-06-22',
      store: 'ZARA',
      item: 'שמלה מנומרת',
      amount: 199,
      tracking: 'ZR-8421',
      note: 'בשם המדע והסטייל',
      category: 'clothes',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      status: 'open',
      date: '2026-06-20',
      store: 'AliExpress',
      item: 'עגילי כוכבים',
      amount: 48,
      tracking: '',
      note: '',
      category: 'jewelry',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      status: 'done',
      date: '2026-06-12',
      store: 'H&M',
      item: 'טי שירט',
      amount: 79,
      tracking: 'HM-555',
      note: '',
      category: 'clothes',
      createdAt: new Date().toISOString(),
      arrivedAt: new Date().toISOString()
    },
    {
      id: 'demo-4',
      status: 'done',
      date: '2026-06-10',
      store: 'iHerb',
      item: 'סרום ויטמין סי',
      amount: 64,
      tracking: 'IH-1208',
      note: 'לא להכניס עוד סרומים לשגרה בלי לחשוב',
      category: 'beauty',
      createdAt: new Date().toISOString(),
      arrivedAt: new Date().toISOString()
    }
  ];
}

async function copyTracking(tracking) {
  if (!tracking) return;
  try {
    await navigator.clipboard.writeText(tracking);
    showToast('מספר המעקב הועתק. עכשיו אפשר לרדוף אחרי הדואר.');
  } catch (error) {
    showToast(`מספר מעקב: ${tracking}`);
  }
}

function showToast(message) {
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}


/* === Backup / Restore tools === */
(function setupBackupRestoreTools() {
  const STORAGE_KEY_CANDIDATES = [
    "eifo-ze-orders-v1",
    "eifoZeOrders",
    "eifo-ze-orders",
    "orders",
    "whereisit-orders",
    "shimiOrders"
  ];

  function findOrdersStorageKey() {
    for (const key of STORAGE_KEY_CANDIDATES) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return key;
        if (parsed && Array.isArray(parsed.orders)) return key;
      } catch (e) {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const raw = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some(item => item && (item.store || item.item || item.amount))) {
          return key;
        }
        if (parsed && Array.isArray(parsed.orders)) return key;
      } catch (e) {}
    }

    return "eifo-ze-orders-v1";
  }

  function getAllAppData() {
    const storage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      storage[key] = localStorage.getItem(key);
    }

    return {
      app: "איפה זה?!",
      version: "v2-soft-backup",
      exportedAt: new Date().toISOString(),
      origin: location.origin,
      href: location.href,
      storageKey: findOrdersStorageKey(),
      localStorage: storage
    };
  }

  function downloadBackup() {
    const data = getAllAppData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `eifo-ze-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    alert("הגיבוי ירד לקובץ. עכשיו אפשר לנשום.");
  }

  function restoreBackupFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!backup || !backup.localStorage) {
          alert("זה לא נראה כמו קובץ גיבוי תקין של איפה זה?!");
          return;
        }

        Object.entries(backup.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        alert("שוחזר! האפליקציה תיטען מחדש עכשיו.");
        location.reload();
      } catch (e) {
        alert("לא הצלחתי לקרוא את קובץ הגיבוי.");
      }
    };
    reader.readAsText(file);
  }

  function injectBackupUI() {
    if (document.querySelector(".backup-panel")) return;

    const panel = document.createElement("div");
    panel.className = "backup-panel";

    const title = document.createElement("div");
    title.className = "backup-title";
    title.textContent = "גיבוי ושחזור";

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "backup-action backup-export";
    exportBtn.textContent = "הורידי גיבוי";
    exportBtn.addEventListener("click", downloadBackup);

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = "backup-action backup-import";
    importBtn.textContent = "שחזרי מגיבוי";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.hidden = true;

    importBtn.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) restoreBackupFromFile(input.files[0]);
    });

    panel.append(title, exportBtn, importBtn, input);

    const main = document.querySelector("main") || document.querySelector(".app") || document.body;
    main.appendChild(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBackupUI);
  } else {
    injectBackupUI();
  }
})();
