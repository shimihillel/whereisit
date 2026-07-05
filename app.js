
const STORAGE_KEY = 'eifo-ze-orders-v1';
const SORT_STORAGE_KEY = 'eifo-ze-open-sort-v1';
const DONE_SORT_STORAGE_KEY = 'eifo-ze-done-sort-v1';
const OPEN_CATEGORY_FILTER_STORAGE_KEY = 'eifo-ze-open-category-filter-v1';
const DONE_CATEGORY_FILTER_STORAGE_KEY = 'eifo-ze-done-category-filter-v1';

const categories = [
  { id: 'clothes', label: 'בגדים', color: 'var(--cat-clothes)' },
  { id: 'shoes', label: 'נעליים ותיקים', color: 'var(--cat-shoes)' },
  { id: 'kids', label: 'ילדים', color: 'var(--cat-kids)' },
  { id: 'home', label: 'בית', color: 'var(--cat-home)' },
  { id: 'beauty', label: 'טיפוח', color: 'var(--cat-beauty)' },
  { id: 'gifts', label: 'מתנות', color: 'var(--cat-gifts)' },
  { id: 'gadgets', label: 'חשמל וגאדג׳טים', color: 'var(--cat-gadgets)' },
  { id: 'jewelry', label: 'תכשיטים', color: 'var(--cat-jewelry)' },
  { id: 'stuff', label: 'שטויות חשובות', color: 'var(--cat-stuff)' },
  { id: 'other', label: 'אחר', color: 'var(--cat-other)' }
];

let orders = loadOrders();
let pendingImageData = '';

const els = {
  screens: {
    open: document.getElementById('screen-open'),
    form: document.getElementById('screen-form'),
    done: document.getElementById('screen-done')
  },
  heroSubtitle: document.getElementById('heroSubtitle'),
  openSummary: document.getElementById('openSummary'),
  moodLine: document.getElementById('moodLine'),
  openSearch: document.getElementById('openSearch'),
  openSort: document.getElementById('openSort'),
  openCategoryFilter: document.getElementById('openCategoryFilter'),
  doneSearch: document.getElementById('doneSearch'),
  doneSort: document.getElementById('doneSort'),
  doneCategoryFilter: document.getElementById('doneCategoryFilter'),
  openList: document.getElementById('openList'),
  doneList: document.getElementById('doneList'),
  openCountBadge: document.getElementById('openCountBadge'),
  doneCountBadge: document.getElementById('doneCountBadge'),
  quickAddBtn: document.getElementById('quickAddBtn'),
  navButtons: document.querySelectorAll('.nav-btn'),
  form: document.getElementById('orderForm'),
  editingId: document.getElementById('editingId'),
  formTitle: document.getElementById('formTitle'),
  cancelEdit: document.getElementById('cancelEdit'),
  date: document.getElementById('date'),
  store: document.getElementById('store'),
  item: document.getElementById('item'),
  amount: document.getElementById('amount'),
  tracking: document.getElementById('tracking'),
  note: document.getElementById('note'),
  photo: document.getElementById('photo'),
  imagePreviewWrap: document.getElementById('imagePreviewWrap'),
  imagePreview: document.getElementById('imagePreview'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  categoryChips: document.getElementById('categoryChips'),
  doneSummary: document.getElementById('doneSummary'),
  monthDoneCount: document.getElementById('monthDoneCount'),
  monthDoneAmount: document.getElementById('monthDoneAmount'),
  monthTopCategory: document.getElementById('monthTopCategory'),
  suspiciousStore: document.getElementById('suspiciousStore'),
  funLine: document.getElementById('funLine'),
  backupMount: document.getElementById('backupMount'),
  detailsDialog: document.getElementById('detailsDialog'),
  detailsContent: document.getElementById('detailsContent'),
  closeDetails: document.getElementById('closeDetails')
};

init();

function init() {
  buildCategoryChips();
  buildCategoryFilters();
  setTodayIfEmpty();
  injectBackupUI();
  bindEvents();
  render();
}

function bindEvents() {
  els.navButtons.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));
  els.quickAddBtn.addEventListener('click', () => { resetForm(); showScreen('form'); });
  els.openSearch.addEventListener('input', render);
  els.openSort.value = localStorage.getItem(SORT_STORAGE_KEY) || 'newest';
  els.openSort.addEventListener('change', () => {
    localStorage.setItem(SORT_STORAGE_KEY, els.openSort.value);
    render();
  });
  els.openCategoryFilter.addEventListener('change', () => {
    localStorage.setItem(OPEN_CATEGORY_FILTER_STORAGE_KEY, els.openCategoryFilter.value);
    render();
  });

  els.doneSearch.addEventListener('input', render);
  els.doneSort.value = localStorage.getItem(DONE_SORT_STORAGE_KEY) || 'arrivedRecent';
  els.doneSort.addEventListener('change', () => {
    localStorage.setItem(DONE_SORT_STORAGE_KEY, els.doneSort.value);
    render();
  });
  els.doneCategoryFilter.addEventListener('change', () => {
    localStorage.setItem(DONE_CATEGORY_FILTER_STORAGE_KEY, els.doneCategoryFilter.value);
    render();
  });
  els.photo.addEventListener('change', onImageSelected);
  els.removeImageBtn.addEventListener('click', removeCurrentImage);
  els.form.addEventListener('submit', onSubmitForm);
  els.cancelEdit.addEventListener('click', () => { resetForm(); showScreen('open'); });
  els.closeDetails.addEventListener('click', closeDetails);
  els.detailsDialog.addEventListener('click', (event) => {
    if (event.target === els.detailsDialog) closeDetails();
  });
}

function buildCategoryChips() {
  els.categoryChips.innerHTML = categories.map((category, index) => `
    <label class="category-chip-wrap">
      <input type="radio" name="category" value="${category.id}" ${index === 0 ? 'checked' : ''} />
      <span class="category-chip" style="background:${category.color};">${category.label}</span>
    </label>
  `).join('');
}

function buildCategoryFilters() {
  const options = [
    '<option value="all">הכל</option>',
    ...categories.map(category => `<option value="${category.id}">${category.label}</option>`)
  ].join('');

  els.openCategoryFilter.innerHTML = options;
  els.doneCategoryFilter.innerHTML = options;

  els.openCategoryFilter.value = localStorage.getItem(OPEN_CATEGORY_FILTER_STORAGE_KEY) || 'all';
  els.doneCategoryFilter.value = localStorage.getItem(DONE_CATEGORY_FILTER_STORAGE_KEY) || 'all';
}

function showScreen(screenName) {
  Object.entries(els.screens).forEach(([key, screen]) => {
    screen.classList.toggle('active', key === screenName);
  });
  els.navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.screen === screenName));
  if (els.quickAddBtn) {
    els.quickAddBtn.classList.toggle('is-hidden', screenName === 'form');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onSubmitForm(event) {
  event.preventDefault();
  const payload = collectFormValues();
  if (!payload) return;

  if (els.editingId.value) {
    orders = orders.map(order => order.id === els.editingId.value ? { ...order, ...payload, updatedAt: new Date().toISOString() } : order);
    showToast('עודכן. בלי דרמה.');
  } else {
    orders.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    });
    showToast(randomLine([
      'נכנס למעקב. לא שופטת.',
      'נרשם. לא שאלנו שאלות.',
      'החבילה בדרך, המצפון בטיפול.',
      'בסדר, זה היה נחוץ רגשית.',
      'נוסף לתיק החקירה.',
      'עוד פריט נכנס לעלילה.'
    ]));
  }

  saveOrders();
  resetForm();
  render();
  showScreen('open');
}

function collectFormValues() {
  const categoryInput = document.querySelector('input[name="category"]:checked');
  const payload = {
    date: els.date.value,
    store: els.store.value.trim(),
    item: els.item.value.trim(),
    amount: Number(els.amount.value || 0),
    tracking: els.tracking.value.trim(),
    note: els.note.value.trim(),
    imageData: pendingImageData || '',
    category: categoryInput ? categoryInput.value : 'other'
  };

  if (!payload.store || !payload.item || !payload.date) {
    showToast('חסר משהו קטן בטופס.');
    return null;
  }
  return payload;
}

async function onImageSelected() {
  const file = els.photo.files && els.photo.files[0];
  if (!file) return;

  try {
    pendingImageData = await compressImageFile(file, 1280, 0.82);
    updateImagePreview(pendingImageData);
    showToast('התמונה נוספה.');
  } catch (error) {
    pendingImageData = '';
    updateImagePreview('');
    els.photo.value = '';
    showToast('לא הצלחתי לטעון את התמונה.');
  }
}

function removeCurrentImage() {
  pendingImageData = '';
  els.photo.value = '';
  updateImagePreview('');
}

function updateImagePreview(imageData) {
  const hasImage = Boolean(imageData);
  els.imagePreviewWrap.hidden = !hasImage;
  if (hasImage) {
    els.imagePreview.src = imageData;
  } else {
    els.imagePreview.removeAttribute('src');
  }
}

function compressImageFile(file, maxDimension = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        let width = image.width;
        let height = image.height;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function render() {
  const openOrders = sortOpenOrders(orders.filter(order => order.status === 'open'));
  const doneOrders = sortDoneOrders(orders.filter(order => order.status === 'done'));
  const visibleOpenOrders = filterByCategory(filterOrders(openOrders, els.openSearch.value), els.openCategoryFilter.value);
  const visibleDoneOrders = filterByCategory(filterOrders(doneOrders, els.doneSearch.value), els.doneCategoryFilter.value);

  renderSummary(openOrders, doneOrders);
  renderMonthlyFun(doneOrders);
  renderOpenList(visibleOpenOrders);
  renderDoneList(visibleDoneOrders);
}

function renderSummary(openOrders, doneOrders) {
  const count = openOrders.length;
  const total = openOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const doneCount = doneOrders.length;

  els.openSummary.textContent = `${count} חבילות · ${formatCurrency(total)}`;
  els.openCountBadge.textContent = count;
  els.doneCountBadge.textContent = doneCount;
  els.heroSubtitle.textContent = count === 0
    ? 'אין כרגע חבילות בדרך. זה כמעט מחשיד.'
    : `${count} חבילות בדרך. ${count === 1 ? 'אחת' : count === 2 ? 'אחת לפחות' : 'אחת'} כנראה כבר עושה סיבוב בארץ.`;

  const moods = count === 0
    ? ['האשראי נושם לרווחה בינתיים.', 'שקט חריג בגזרת החבילות.', 'רגע של חסד.', 'אין חבילות בדרך. מוזר, אבל נעים.']
    : ['האשראי לא מגיב כרגע.', 'עוד רגע זה אצלך.', 'הדואר שוב במרדף.', 'יש דברים בדרך, ויש תקווה.'];
  els.moodLine.textContent = moods[Math.floor(Math.random() * moods.length)];

  els.doneSummary.textContent = doneCount === 0
    ? 'כאן כל מה שכבר נחת אצלך.'
    : `${doneCount} פריטים כבר הגיעו ונשמרו כאן.`;
}

function renderMonthlyFun(doneOrders) {
  if (!els.monthDoneCount) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthOrders = doneOrders.filter(order => {
    const baseDate = order.arrivedAt || order.updatedAt || order.date;
    if (!baseDate) return false;
    const date = new Date(baseDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const total = monthOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const topStore = getTopValue(monthOrders, order => normalizeName(order.store));
  const topCategoryId = getTopValue(monthOrders, order => order.category || 'other');
  const topCategory = topCategoryId ? getCategory(topCategoryId).label : '—';

  els.monthDoneCount.textContent = monthOrders.length;
  els.monthDoneAmount.textContent = formatCurrency(total);
  els.monthTopCategory.textContent = topCategory;
  els.suspiciousStore.textContent = topStore || 'אין חשודות';

  els.funLine.textContent = buildFunLine(monthOrders.length, total, topStore, topCategory);
}

function getTopValue(list, mapper) {
  const counts = new Map();
  list.forEach(item => {
    const value = mapper(item);
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  let topValue = '';
  let topCount = 0;
  counts.forEach((count, value) => {
    if (count > topCount) {
      topValue = value;
      topCount = count;
    }
  });

  return topValue;
}

function normalizeName(value) {
  return String(value || '').trim();
}

function buildFunLine(count, total, topStore, topCategory) {
  if (count === 0) {
    return randomLine([
      'החודש עוד אין ראיות. שקט חשוד.',
      'אין עדיין חבילות שהגיעו החודש. הארכיון מחכה.',
      'החודש נקי בינתיים. לא ברור אם זה טוב או מדאיג.'
    ]);
  }

  if (count === 1) {
    return randomLine([
      'חבילה אחת נחתה החודש. פתיחה רגועה יחסית.',
      'יש ראיה אחת בתיק. ממש התחלה של חקירה.',
      'רק חבילה אחת החודש. האשראי כמעט מאמין לך.'
    ]);
  }

  if (topStore && count >= 3) {
    return randomLine([
      `${topStore} מתחילה להיראות כמו דמות חוזרת בעלילה.`,
      `החנות החשודה היא ${topStore}. לא מאשימות, רק מתעדות.`,
      `${topStore} מככבת החודש. מעניין מאוד.`
    ]);
  }

  if (total >= 1000) {
    return randomLine([
      'הסכום החודשי כבר מבקש כוס מים.',
      'זה חודש עם נוכחות. האשראי כנראה הרגיש.',
      'החבילות הגיעו, והסכום בא איתן.'
    ]);
  }

  return randomLine([
    `${count} חבילות הגיעו החודש. סביר, אלגנטי, מתועד.`,
    `הקטגוריה הבולטת: ${topCategory}. יש פה דפוס.`,
    'החודש פעיל, אבל עדיין בגבולות הנחמד.'
  ]);
}

function renderOpenList(list) {
  if (!list.length) {
    els.openList.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">📭</div>
        <h3>אין כרגע חבילות בדרך</h3>
        <p>או שאין חבילות, או שהסינון ממש ספציפי. דרמטי בכל מקרה.</p>
      </div>
    `;
    return;
  }

  els.openList.innerHTML = list.map(order => openCardTemplate(order)).join('');
  bindCardActions(els.openList);
}

function renderDoneList(list) {
  if (!list.length) {
    els.doneList.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-emoji">📦</div>
        <h3>עוד לא נחת פה כלום</h3>
        <p>או שעוד לא הגיע כלום, או שהקטגוריה הזו עדיין נקייה מדי.</p>
      </div>
    `;
    return;
  }

  els.doneList.innerHTML = list.map(order => doneCardTemplate(order)).join('');
  bindCardActions(els.doneList);
}

function openCardTemplate(order) {
  const category = getCategory(order.category);
  const trackingText = order.tracking ? `#${escapeHtml(order.tracking)}` : 'ללא מספר מעקב';
  const imageThumb = order.imageData
    ? `<div class="order-thumb-wrap"><img class="order-thumb" src="${order.imageData}" alt="" /></div>`
    : `<div class="order-thumb-wrap placeholder">📦</div>`;
  return `
    <article class="order-card open-card" data-open-details="${order.id}" style="--pill-color:${category.color};">
      <div class="order-body">
        ${imageThumb}
        <div class="order-text">
          <div class="order-top">
            <div class="order-store-block">
              <h3 class="order-store">${escapeHtml(order.store)}</h3>
              <p class="order-item">${escapeHtml(order.item)}</p>
            </div>
            <div class="order-price">${formatCurrency(order.amount)}</div>
          </div>
          <div class="order-meta">
            <span class="cat-pill">${category.label}</span>
            <span class="order-meta-sep">|</span>
            <span>${formatDate(order.date)}</span>
          </div>
          <div class="order-tracking">${trackingText}</div>
        </div>
      </div>
      <div class="order-actions">
        <button class="text-link-btn" type="button" data-action="details" data-id="${order.id}">‹ פרטים</button>
        <button class="arrived-btn" type="button" data-action="arrive" data-id="${order.id}">הגיע ✓</button>
      </div>
    </article>
  `;
}

function doneCardTemplate(order) {
  const category = getCategory(order.category);
  const imageThumb = order.imageData
    ? `<img class="done-thumb" src="${order.imageData}" alt="" />`
    : `<div class="done-thumb" style="display:grid;place-items:center;color:#c4c0d2;font-size:1.9rem;">📦</div>`;
  return `
    <article class="order-card done-card" data-open-details="${order.id}" style="--pill-color:${category.color};">
      <span class="cat-pill">${category.label}</span>
      ${imageThumb}
      <h3 class="order-store">${escapeHtml(order.store)}</h3>
      <p class="order-item">${escapeHtml(order.item)}</p>
      <span class="order-price">${formatCurrency(order.amount)}</span>
      <span class="order-meta">${formatDate(order.date)}</span>
      <span class="done-label">הגיע</span>
      <button class="text-link-btn" type="button" data-action="details" data-id="${order.id}">‹ פרטים</button>
    </article>
  `;
}

function bindCardActions(order) {
  const category = getCategory(order.category);
  const imageThumb = order.imageData
    ? `<img class="done-thumb" src="${order.imageData}" alt="" />`
    : '';
  return `
    <article class="order-card done-card" data-open-details="${order.id}" style="--dot-color:${category.color}; --pill-color:${category.color};">
      <span class="cat-pill">${category.label}</span>
      ${imageThumb}
      <h3 class="order-store">${escapeHtml(order.store)}</h3>
      <p class="order-item">${escapeHtml(order.item)}</p>
      <span class="order-price">${formatCurrency(order.amount)}</span>
      <span class="order-meta">${formatDate(order.date)}</span>
      <span class="done-label">הגיע</span>
      <button class="text-link-btn" type="button" data-action="details" data-id="${order.id}">פרטים <span>›</span></button>
    </article>
  `;
}

function bindCardActions(container) {
  container.querySelectorAll('[data-open-details]').forEach(card => {
    card.addEventListener('click', () => openDetails(card.dataset.openDetails));
  });
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      handleAction(btn.dataset.action, btn.dataset.id);
    });
  });
}

function handleAction(action, id) {
  if (action === 'arrive') markArrived(id);
  if (action === 'restore') restoreToOpen(id);
  if (action === 'edit') editOrder(id);
  if (action === 'delete') deleteOrder(id);
  if (action === 'copy') copyTracking(id);
  if (action === 'details') openDetails(id);
}

function markArrived(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const hadImage = Boolean(order.imageData);

  orders = orders.map(item => item.id === id
    ? {
        ...item,
        status: 'done',
        imageData: '',
        arrivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    : item
  );

  saveOrders();
  render();
  closeDetails();

  if (hadImage) {
    showToast(randomLine([
      'הגיעה. התמונה נמחקה כדי לשמור על קלילות.',
      'הועבר ל״הגיעו״ והתמונה ירדה.',
      'נחתה אצלך. האפליקציה נשארה רזה.'
    ]));
    return;
  }

  showToast(randomLine([
    'הגיעה. איזה רגע.',
    'נחתה אצלך. ניצחון קטן.',
    'הגיעה! אפשר להפסיק לרענן.',
    'סומן כהגיע. הדרמה הסתיימה.',
    'הועבר לארכיון הניצחונות הקטנים.',
    'עוד תיק נסגר בהצלחה.'
  ]));
}

function restoreToOpen(id) {
  orders = orders.map(order => order.id === id ? { ...order, status: 'open', updatedAt: new Date().toISOString() } : order);
  saveOrders();
  render();
  closeDetails();
  showToast('חזרה לבדרך.');
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
  pendingImageData = order.imageData || '';
  updateImagePreview(pendingImageData);
  els.photo.value = '';
  const categoryInput = document.querySelector(`input[name="category"][value="${order.category || 'other'}"]`);
  if (categoryInput) categoryInput.checked = true;
  els.formTitle.textContent = 'עריכת הזמנה';
  els.cancelEdit.hidden = false;
  closeDetails();
  showScreen('form');
}

function deleteOrder(id) {
  if (!confirm('למחוק כאילו זה לא קרה?')) return;
  orders = orders.filter(order => order.id !== id);
  saveOrders();
  render();
  closeDetails();
  showToast('נמחק. לא נשפוט גם את זה.');
}

function openDetails(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;
  const category = getCategory(order.category);
  const statusAction = order.status === 'open'
    ? `<button class="dialog-btn primary" type="button" data-action="arrive" data-id="${order.id}">הגיע</button>`
    : `<button class="dialog-btn" type="button" data-action="restore" data-id="${order.id}">החזירי לבדרך</button>`;
  const trackingAction = order.tracking
    ? `<button class="dialog-btn" type="button" data-action="copy" data-id="${order.id}">העתקת מעקב</button>`
    : '';

  els.detailsContent.innerHTML = `
    <h3 class="details-title">${escapeHtml(order.store)}</h3>
    <p class="details-sub">${escapeHtml(order.item)}</p>
    ${order.imageData ? `<div class="details-image-wrap"><img class="details-image" src="${order.imageData}" alt="" /></div>` : ''}
    <div class="details-grid">
      <div class="details-row"><strong>סכום</strong><span>${formatCurrency(order.amount)}</span></div>
      <div class="details-row"><strong>תאריך</strong><span>${formatDate(order.date)}</span></div>
      <div class="details-row"><strong>קטגוריה</strong><span>${category.label}</span></div>
      <div class="details-row"><strong>מעקב</strong><span>${escapeHtml(order.tracking || '—')}</span></div>
    </div>
    ${order.note ? `<div class="details-note">${escapeHtml(order.note)}</div>` : ''}
    <div class="details-actions">
      ${statusAction}
      ${trackingAction}
      <button class="dialog-btn" type="button" data-action="edit" data-id="${order.id}">עריכה</button>
      <button class="dialog-btn danger" type="button" data-action="delete" data-id="${order.id}">מחיקה</button>
    </div>
  `;
  els.detailsContent.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
  });
  els.detailsDialog.showModal();
}

function closeDetails() {
  if (els.detailsDialog.open) els.detailsDialog.close();
}

function resetForm() {
  els.form.reset();
  els.editingId.value = '';
  els.formTitle.textContent = 'הוספת הזמנה';
  els.cancelEdit.hidden = true;
  pendingImageData = '';
  updateImagePreview('');
  setTodayIfEmpty();
  const firstCategory = document.querySelector('input[name="category"]');
  if (firstCategory) firstCategory.checked = true;
}

function setTodayIfEmpty() {
  if (!els.date.value) {
    els.date.value = new Date().toISOString().slice(0, 10);
  }
}

function filterOrders(list, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter(order => {
    const categoryLabel = getCategory(order.category).label;
    return [order.store, order.item, order.tracking, order.note, categoryLabel].some(value => String(value || '').toLowerCase().includes(q));
  });
}

function sortDoneOrders(list) {
  const sortMode = els.doneSort ? els.doneSort.value : 'arrivedRecent';
  const sorted = [...list];

  if (sortMode === 'oldest') {
    return sorted.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));
  }

  if (sortMode === 'amountHigh') {
    return sorted.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  }

  if (sortMode === 'amountLow') {
    return sorted.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }

  if (sortMode === 'store') {
    return sorted.sort((a, b) => String(a.store || '').localeCompare(String(b.store || ''), 'he'));
  }

  return sorted.sort((a, b) => new Date(b.arrivedAt || b.updatedAt || b.date || 0) - new Date(a.arrivedAt || a.updatedAt || a.date || 0));
}

function filterByCategory(list, categoryId) {
  if (!categoryId || categoryId === 'all') return list;
  return list.filter(order => (order.category || 'other') === categoryId);
}

function sortOpenOrders(list) {
  const sortMode = els.openSort ? els.openSort.value : 'newest';
  const sorted = [...list];

  if (sortMode === 'oldest') {
    return sorted.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0));
  }

  if (sortMode === 'amountHigh') {
    return sorted.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  }

  if (sortMode === 'amountLow') {
    return sorted.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }

  if (sortMode === 'store') {
    return sorted.sort((a, b) => String(a.store || '').localeCompare(String(b.store || ''), 'he'));
  }

  return sorted.sort(sortByDateDesc);
}

function sortByDateDesc(a, b) {
  return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
}

function getCategory(id) {
  return categories.find(category => category.id === id) || categories[categories.length - 1];
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return `₪${number.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
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

function copyTracking(id) {
  const order = orders.find(item => item.id === id);
  if (!order || !order.tracking) return;
  navigator.clipboard?.writeText(order.tracking);
  showToast('הועתק.');
}

function randomLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
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
  toast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 1900);
}

function injectBackupUI() {
  const panel = document.createElement('div');
  panel.className = 'backup-panel';

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'backup-btn primary';
  exportBtn.textContent = 'הורידי גיבוי';

  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'backup-btn secondary';
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
      version: 'v19-mockup-from-scratch',
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      localStorage: storage
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eifo-ze-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 1000);
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
        Object.entries(backup.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        showToast('שוחזר. טוענת מחדש.');
        setTimeout(() => location.reload(), 700);
      } catch (error) {
        showToast('קובץ הגיבוי לא תקין.');
      }
    };
    reader.readAsText(file);
  });

  panel.append(exportBtn, importBtn, fileInput);
  els.backupMount.appendChild(panel);
}
