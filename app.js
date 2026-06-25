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
  addWide: document.getElementById('addWide'),
  openList: document.getElementById('openList'),
  doneList: document.getElementById('doneList'),
  openSearch: document.getElementById('openSearch'),
  doneSearch: document.getElementById('doneSearch'),
  openSummary: document.getElementById('openSummary'),
  doneSummary: document.getElementById('doneSummary'),
  moodLine: document.getElementById('moodLine'),
  statOpen: document.getElementById('statOpen'),
  statDone: document.getElementById('statDone'),
  statAmount: document.getElementById('statAmount'),
  openBadge: document.getElementById('openBadge'),
  doneBadge: document.getElementById('doneBadge'),
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
  detailsDialog: document.getElementById('detailsDialog'),
  detailsContent: document.getElementById('detailsContent'),
  closeDetails: document.getElementById('closeDetails'),
  backupMount: document.getElementById('backupMount')
};

init();

function init() {
  buildCategoryChips();
  setTodayIfEmpty();
  injectBackupUI();
  bindEvents();
  render();
}

function bindEvents() {
  els.navButtons.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));
  els.addWide.addEventListener('click', () => { resetForm(); showScreen('form'); });
  els.openSearch.addEventListener('input', render);
  els.doneSearch.addEventListener('input', render);
  els.cancelEdit.addEventListener('click', () => { resetForm(); showScreen('open'); });
  els.form.addEventListener('submit', event => { event.preventDefault(); saveOrderFromForm(); });
  els.closeDetails.addEventListener('click', closeDetails);
  els.detailsDialog.addEventListener('click', event => { if (event.target === els.detailsDialog) closeDetails(); });
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
  Object.entries(els.screens).forEach(([key, screen]) => screen.classList.toggle('active', key === name));
  els.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.screen === name));
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
    category: categoryInput ? categoryInput.value : 'other',
    updatedAt: new Date().toISOString()
  };

  if (!payload.store || !payload.item || !payload.date) return;

  if (editingId) {
    orders = orders.map(order => order.id === editingId ? { ...order, ...payload } : order);
    showToast('עודכן. בלי דרמה.');
  } else {
    orders.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status: 'open',
      createdAt: new Date().toISOString(),
      ...payload
    });
    showToast('נכנס למעקב. לא שופטת.');
  }

  saveOrders();
  resetForm();
  showScreen('open');
  render();
}

function render() {
  const openOrders = orders.filter(order => order.status === 'open').sort(sortByDateDesc);
  const doneOrders = orders.filter(order => order.status === 'done').sort((a, b) => new Date(b.arrivedAt || b.updatedAt || b.date) - new Date(a.arrivedAt || a.updatedAt || a.date));
  const filteredOpen = filterOrders(openOrders, els.openSearch.value);
  const filteredDone = filterOrders(doneOrders, els.doneSearch.value);

  renderSummary(openOrders, doneOrders);
  renderOpenList(filteredOpen);
  renderDoneList(filteredDone);
}

function renderSummary(openOrders, doneOrders) {
  const count = openOrders.length;
  const doneCount = doneOrders.length;
  const total = openOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  els.openSummary.textContent = `יש לך ${count} ${count === 1 ? 'חבילה' : 'חבילות'} בדרך`;
  els.statOpen.textContent = count;
  els.statDone.textContent = doneCount;
  els.statAmount.textContent = formatCurrency(total);
  els.openBadge.textContent = count;
  els.doneBadge.textContent = doneCount;
  els.doneSummary.textContent = doneCount ? `${doneCount} ${doneCount === 1 ? 'הזמנה הגיעה' : 'הזמנות הגיעו'} · מצאת משהו מהעבר?` : 'מצאת משהו מהעבר?';

  const moods = count === 0
    ? ['אין כלום בדרך. חשוד מאוד.', 'היקום רגוע מדי. לא טבעי.']
    : ['שימי, זה בדרך אלייך.', 'עוד רגע זה כאן.', 'הדואר עובד בשבילך היום.'];
  els.moodLine.textContent = moods[Math.floor(Math.random() * moods.length)];
}

function renderOpenList(list) {
  if (!list.length) {
    els.openList.innerHTML = `<div class="empty-state"><div class="empty-sticker">📭</div><h3>אין כלום בדרך</h3><p>חשוד מאוד. אבל נזרום.</p></div>`;
    return;
  }
  els.openList.innerHTML = list.map(openCardHtml).join('');
  bindListActions(els.openList);
}

function renderDoneList(list) {
  if (!list.length) {
    els.doneList.innerHTML = `<div class="empty-state"><div class="empty-sticker">📦</div><h3>עוד לא הגיע כלום</h3><p>ברגע שחבילה תגיע, היא תעבור לכאן.</p></div>`;
    return;
  }
  els.doneList.innerHTML = list.map(doneCardHtml).join('');
  bindListActions(els.doneList);
}

function bindListActions(container) {
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
  const tracking = order.tracking ? `#${escapeHtml(order.tracking)}` : 'ללא מספר מעקב';
  return `
    <article class="order-card open-card ${cat.bg}" data-open-details="${order.id}">
      <div class="card-side">
        <span class="status">בדרך</span>
        <div class="side-meta">
          <span class="track">${tracking}</span>
          <span>${formatDate(order.date)}</span>
        </div>
        <button class="arrived-btn" data-action="arrive" data-id="${order.id}" type="button">הגיע</button>
      </div>
      <div class="card-main">
        <div class="card-top">
          <div class="brand">${escapeHtml(shortStore(order.store))}</div>
          <div class="text-block">
            <h3 class="store">${escapeHtml(order.store)}</h3>
            <p class="item">${escapeHtml(order.item)}</p>
            <span class="price">${formatCurrency(order.amount)}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="pill ${cat.cls}">${cat.label}</span>
          ${(order.tracking || order.note) ? `<button class="more-btn" data-action="details" data-id="${order.id}" type="button">פרטים</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function doneCardHtml(order) {
  const cat = getCategory(order.category);
  return `
    <article class="order-card done-card ${cat.bg}" data-open-details="${order.id}">
      <span class="pill ${cat.cls}">${cat.label}</span>
      <h3 class="store">${escapeHtml(order.store)}</h3>
      <p class="item">${escapeHtml(order.item)}</p>
      <span class="price">${formatCurrency(order.amount)}</span>
      <span class="card-footer">${formatDate(order.date)}</span>
      <span class="done-label">הגיע</span>
      <button class="more-btn" data-action="details" data-id="${order.id}" type="button">פרטים</button>
    </article>
  `;
}

function handleAction(action, id) {
  if (action === 'arrive') markArrived(id);
  if (action === 'restore') restoreOrder(id);
  if (action === 'delete') deleteOrder(id);
  if (action === 'edit') editOrder(id);
  if (action === 'copy') copyTracking(id);
  if (action === 'details') openDetails(id);
}

function markArrived(id) {
  orders = orders.map(order => order.id === id ? { ...order, status: 'done', arrivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : order);
  saveOrders();
  closeDetails();
  render();
  showToast('הגיעה. איזה רגע.');
}

function restoreOrder(id) {
  orders = orders.map(order => order.id === id ? { ...order, status: 'open', updatedAt: new Date().toISOString() } : order);
  saveOrders();
  closeDetails();
  render();
}

function deleteOrder(id) {
  if (!confirm('למחוק כאילו זה לא קרה?')) return;
  orders = orders.filter(order => order.id !== id);
  saveOrders();
  closeDetails();
  render();
}

function editOrder(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;
  els.editingId.value = order.id;
  els.date.value = order.date || '';
  els.store.value = order.store || '';
  els.item.value = order.item || '';
  els.amount.value = order.amount || '';
  els.tracking.value = order.tracking || '';
  els.note.value = order.note || '';
  const input = document.querySelector(`input[name="category"][value="${order.category || 'other'}"]`);
  if (input) input.checked = true;
  els.formTitle.textContent = 'עריכת הזמנה';
  els.cancelEdit.hidden = false;
  closeDetails();
  showScreen('form');
}

function openDetails(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;
  const cat = getCategory(order.category);
  const statusAction = order.status === 'open'
    ? `<button class="dialog-action primary" data-action="arrive" data-id="${order.id}" type="button">הגיע</button>`
    : `<button class="dialog-action soft" data-action="restore" data-id="${order.id}" type="button">החזירי לבדרך</button>`;
  const copyButton = order.tracking ? `<button class="dialog-action" data-action="copy" data-id="${order.id}" type="button">העתקת מעקב</button>` : '';
  els.detailsContent.innerHTML = `
    <h2 class="details-title">${escapeHtml(order.store)}</h2>
    <p class="details-item">${escapeHtml(order.item)}</p>
    <div class="details-grid">
      <div class="details-row"><b>סכום</b><span>${formatCurrency(order.amount)}</span></div>
      <div class="details-row"><b>תאריך</b><span>${formatDate(order.date)}</span></div>
      <div class="details-row"><b>קטגוריה</b><span>${cat.label}</span></div>
      <div class="details-row"><b>מעקב</b><span>${escapeHtml(order.tracking || '—')}</span></div>
    </div>
    ${order.note ? `<div class="details-note">${escapeHtml(order.note)}</div>` : ''}
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
  els.detailsDialog.showModal();
}

function closeDetails() {
  if (els.detailsDialog.open) els.detailsDialog.close();
}

function copyTracking(id) {
  const order = orders.find(item => item.id === id);
  if (!order || !order.tracking) return;
  navigator.clipboard?.writeText(order.tracking);
  showToast('הועתק.');
}

function resetForm() {
  els.form.reset();
  els.editingId.value = '';
  els.formTitle.textContent = 'הוספת הזמנה';
  els.cancelEdit.hidden = true;
  setTodayIfEmpty();
  const first = document.querySelector('input[name="category"]');
  if (first) first.checked = true;
}

function setTodayIfEmpty() {
  if (!els.date.value) els.date.value = new Date().toISOString().slice(0, 10);
}

function filterOrders(list, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(order => [order.store, order.item, order.tracking, order.note, getCategory(order.category).label]
    .some(value => String(value || '').toLowerCase().includes(q)));
}

function sortByDateDesc(a, b) {
  return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
}

function getCategory(categoryId) {
  return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
}

function shortStore(store) {
  const clean = String(store || '').trim();
  if (!clean) return 'SHOP';
  const latin = clean.replace(/[^A-Za-z0-9 ]/g, '').trim();
  if (latin) {
    const parts = latin.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }
  return clean.slice(0, 2);
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return `₪ ${number.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { toast.hidden = true; }, 1900);
}

function injectBackupUI() {
  const panel = document.createElement('div');
  panel.className = 'backup-panel';
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'backup-export';
  exportBtn.textContent = 'הורידי גיבוי';
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'backup-import';
  importBtn.textContent = 'שחזרי מגיבוי';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.hidden = true;

  exportBtn.addEventListener('click', () => {
    const storage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      storage[key] = localStorage.getItem(key);
    }
    const backup = {
      app: 'איפה זה?!',
      version: 'clean-rebuild',
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      localStorage: storage
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eifo-ze-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    showToast('הגיבוי ירד.');
  });

  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!backup.localStorage) throw new Error('bad backup');
        Object.entries(backup.localStorage).forEach(([key, value]) => localStorage.setItem(key, value));
        showToast('שוחזר. טוענת מחדש.');
        setTimeout(() => location.reload(), 700);
      } catch (error) {
        showToast('קובץ גיבוי לא תקין.');
      }
    };
    reader.readAsText(file);
  });

  panel.append(exportBtn, importBtn, fileInput);
  els.backupMount.appendChild(panel);
}
