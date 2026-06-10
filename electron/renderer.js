// =====================================================================
// microPDF renderer — ShrinkPDF-style UI wired to the real compression
// engine (compress_pdf.py via Electron IPC) + persisted history.
// =====================================================================

const api = window.electronAPI;

// ---- Preset definitions (mapped to real JPEG image-quality 1-100) ----
const PRESETS = {
  high:     { id: 'high',     name: 'High Quality', tag: 'Best fidelity', quality: 90, badge: 'Quality 90', icon: 'shield',
              desc: 'Keeps reports, tax & audit documents print-sharp. Smaller savings.' },
  balanced: { id: 'balanced', name: 'Balanced',     tag: 'Recommended',   quality: 75, badge: 'Quality 75', icon: 'gauge',
              desc: 'Great size / quality trade-off for internal reports & reviews.' },
  small:    { id: 'small',    name: 'Smallest',     tag: 'Max shrink',    quality: 55, badge: 'Quality 55', icon: 'zap',
              desc: 'Maximum shrink for quick email attachments & sharing.' }
};

const PRESET_ICONS = {
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  gauge:  '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  zap:    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
};

const STATUS_MSGS = {
  reading: 'Reading PDF structure…',
  processing: 'Compressing images…',
  saving: 'Saving compressed PDF…'
};

// ---- State ----
const state = {
  view: 'compressor',
  stage: 'idle',          // idle | loaded | compressing | completed
  presetId: 'balanced',
  customQuality: 30,
  outputFolder: '',
  files: [],              // { path, name, size }
  fileStates: [],         // per-file { status, pct, result }
  results: [],            // last run results
  history: [],
  cancelled: false,
  activeIndex: -1
};

// ---- DOM refs ----
const $ = (id) => document.getElementById(id);
const RING_CIRC = 2 * Math.PI * 52; // 326.726

// =====================================================================
// Helpers
// =====================================================================
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function currentQuality() {
  return state.presetId === 'custom' ? state.customQuality : PRESETS[state.presetId].quality;
}

function presetDisplayName() {
  return state.presetId === 'custom' ? `Custom ${state.customQuality}%` : PRESETS[state.presetId].name;
}

function presetColor(name) {
  if (name.startsWith('High')) return '#08826b';
  if (name.startsWith('Balanced')) return '#0a78c8';
  return '#054da2';
}

// =====================================================================
// Window controls
// =====================================================================
$('winMin').addEventListener('click', () => api.windowMinimize());
$('winMax').addEventListener('click', () => api.windowMaximize());
$('winClose').addEventListener('click', () => api.windowClose());
api.onWindowMaximized((isMax) => {
  $('winMax').querySelector('svg').innerHTML = isMax
    ? '<rect x="6" y="6" width="11" height="11" rx="1.5"/><path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3H19a1.5 1.5 0 0 1 1.5 1.5V13a1.5 1.5 0 0 1-1.5 1.5H18"/>'
    : '<rect x="4" y="4" width="16" height="16" rx="2"/>';
});

// =====================================================================
// View switching
// =====================================================================
const VIEW_HEADS = {
  compressor: ['Compressor', 'Optimize PDF documents without losing fidelity'],
  batch:      ['Batch Queue', 'Review every document queued in this session'],
  history:    ['History', 'Your recent compression activity'],
  audit:      ['Audit Logs', 'Access-controlled compression records']
};

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  $('view-' + view).style.display = 'block';

  $('headTitle').textContent = VIEW_HEADS[view][0];
  $('headSub').textContent = VIEW_HEADS[view][1];
  $('addFilesTopBtn').style.display = view === 'batch' ? 'inline-flex' : 'none';

  if (view === 'batch') renderBatch();
  if (view === 'history') renderHistory();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchView(item.dataset.view));
});

// =====================================================================
// Compressor stages
// =====================================================================
function setStage(stage) {
  state.stage = stage;
  $('stage-setup').style.display = (stage === 'idle' || stage === 'loaded') ? 'block' : 'none';
  $('stage-compressing').style.display = stage === 'compressing' ? 'block' : 'none';
  $('stage-completed').style.display = stage === 'completed' ? 'block' : 'none';

  const loaded = stage === 'loaded';
  $('dropZone').style.display = (stage === 'idle') ? 'block' : 'none';
  $('fileBlock').style.display = loaded ? 'block' : 'none';
  $('presetsBlock').style.display = loaded ? 'block' : 'none';
  $('outputBlock').style.display = loaded ? 'block' : 'none';
  $('actionBlock').style.display = loaded ? 'block' : 'none';

  if (loaded) { renderPresets(); refreshCompressButton(); }
}

// =====================================================================
// File handling
// =====================================================================
async function addFiles(paths) {
  for (const p of paths) {
    if (state.files.some(f => f.path === p)) continue;
    const size = await api.getFileSize(p);
    state.files.push({ path: p, name: p.split(/[\\/]/).pop(), size });
  }
  syncFileState();
  setStage(state.files.length ? 'loaded' : 'idle');
  renderFiles();
  updateBatchBadge();
}

function removeFile(index) {
  state.files.splice(index, 1);
  syncFileState();
  if (!state.files.length) setStage('idle');
  else renderFiles();
  updateBatchBadge();
  if (state.view === 'batch') renderBatch();
}

function clearFiles() {
  state.files = [];
  syncFileState();
  setStage('idle');
  updateBatchBadge();
  if (state.view === 'batch') renderBatch();
}

function syncFileState() {
  state.fileStates = state.files.map((_, i) => state.fileStates[i] || { status: 'queued', pct: 0, result: null });
  state.fileStates.length = state.files.length;
}

function renderFiles() {
  const c = $('filesContainer');
  $('fileCount').textContent = state.files.length;
  c.innerHTML = state.files.map((f, i) => `
    <div class="file-card">
      <div class="file-thumb">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
        <span class="pdf-tag">PDF</span>
      </div>
      <div class="file-card-info">
        <div class="file-card-name" title="${f.name}">${f.name}</div>
        <div class="file-card-meta">
          <span class="file-card-size">${formatBytes(f.size)}</span>
          <span class="file-card-ready">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Ready
          </span>
        </div>
      </div>
      <button class="file-remove" data-index="${i}" title="Remove">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      </button>
    </div>`).join('');

  c.querySelectorAll('.file-remove').forEach(b =>
    b.addEventListener('click', () => removeFile(parseInt(b.dataset.index))));
}

// ---- Drag & drop ----
document.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); });
document.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); });

const dropZone = $('dropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => { if (e.target === dropZone) dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('click', async () => {
  const paths = await api.selectFiles();
  if (paths && paths.length) addFiles(paths);
});
dropZone.addEventListener('drop', async e => {
  dropZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files)
    .filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (!files.length) { if (e.dataTransfer.files.length) alert('Please drop PDF files only'); return; }

  const paths = [];
  for (const f of files) {
    let p = f.path || (api.getPathForFile ? api.getPathForFile(f) : null);
    if (p) paths.push(p);
  }
  if (paths.length) addFiles(paths);
  else alert('Could not read file paths. Please use "click to browse" instead.');
});

$('selectFilesBtn').addEventListener('click', async (e) => {
  e.stopPropagation();
  const paths = await api.selectFiles();
  if (paths && paths.length) addFiles(paths);
});
$('clearFilesBtn').addEventListener('click', clearFiles);
$('addFilesTopBtn').addEventListener('click', async () => {
  const paths = await api.selectFiles();
  if (paths && paths.length) { await addFiles(paths); renderBatch(); }
});

// =====================================================================
// Presets
// =====================================================================
function renderPresets() {
  const grid = $('presetGrid');
  grid.innerHTML = Object.values(PRESETS).map(p => {
    const active = state.presetId === p.id;
    return `
    <button type="button" class="preset-card ${active ? 'active' : ''}" data-preset="${p.id}">
      <span class="preset-radio"></span>
      <span class="preset-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PRESET_ICONS[p.icon]}</svg></span>
      <span class="preset-name-row"><span class="preset-name">${p.name}</span><span class="preset-tag">${p.tag}</span></span>
      <span class="preset-badge">${p.badge}</span>
      <span class="preset-desc">${p.desc}</span>
    </button>`;
  }).join('') + `
    <button type="button" class="preset-card ${state.presetId === 'custom' ? 'active' : ''}" data-preset="custom" style="grid-column:1/-1;flex-direction:row;align-items:center;gap:14px;min-height:auto;">
      <span class="preset-radio"></span>
      <span class="preset-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg></span>
      <span style="flex:1;text-align:left;"><span class="preset-name">Custom</span><span class="preset-tag" style="margin-left:7px;">Fine-tune below 50%</span></span>
      <span class="preset-badge" id="customBadgeDisplay">${state.presetId === 'custom' ? 'Quality ' + state.customQuality : '–'}</span>
    </button>`;

  grid.querySelectorAll('.preset-card').forEach(card =>
    card.addEventListener('click', () => selectPreset(card.dataset.preset)));

  $('customPanel').style.display = state.presetId === 'custom' ? 'block' : 'none';
}

function selectPreset(id) {
  state.presetId = id;
  renderPresets();
  $('batchPresetLabel').textContent = presetDisplayName();
}

$('customSlider').addEventListener('input', e => {
  const v = parseInt(e.target.value);
  state.customQuality = v;
  $('customValue').textContent = v + '%';
  const badge = $('customBadgeDisplay');
  if (badge) badge.textContent = 'Quality ' + v;
  $('customHint').style.display = v < 30 ? 'block' : 'none';
  $('batchPresetLabel').textContent = presetDisplayName();
});

// =====================================================================
// Output folder + compress button
// =====================================================================
$('selectOutputBtn').addEventListener('click', async () => {
  const folder = await api.selectOutputFolder();
  if (folder) { state.outputFolder = folder; $('outputPath').value = folder; refreshCompressButton(); }
});

function refreshCompressButton() {
  const btn = $('compressBtn');
  const ready = state.files.length > 0 && !!state.outputFolder;
  btn.disabled = !ready;
  $('compressCountLabel').textContent = state.files.length > 1 ? `${state.files.length} PDFs` : 'PDF';
  $('actionHelper').textContent = !state.outputFolder
    ? 'Select an output folder to begin'
    : 'microPDF keeps text crisp, selectable, and audit-ready';
}

$('compressBtn').addEventListener('click', startCompression);

// =====================================================================
// Compression flow
// =====================================================================
function setRing(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  $('ringProgress').style.strokeDashoffset = (RING_CIRC * (1 - clamped / 100)).toString();
  $('progPct').textContent = Math.round(clamped);
}

// Live status from main.js (per active file)
api.onCompressionStatus(data => {
  if (state.stage !== 'compressing' || state.activeIndex < 0) return;
  const i = state.activeIndex, total = state.files.length;
  const base = (i / total) * 100;
  const span = 100 / total;

  if (data.status === 'reading') {
    $('progStatus').textContent = STATUS_MSGS.reading;
    $('progDetail').textContent = '';
    setRing(base + span * 0.05);
  } else if (data.status === 'processing') {
    $('progStatus').textContent = STATUS_MSGS.processing;
    if (data.currentPage && data.totalPages) {
      $('progDetail').textContent = `Page ${data.currentPage} of ${data.totalPages}`;
      const frac = data.currentPage / data.totalPages;
      const pct = base + span * frac;
      setRing(pct);
      state.fileStates[i] = { status: 'active', pct: Math.round(frac * 100), result: null };
      if (state.view === 'batch') renderBatch();
    }
  } else if (data.status === 'saving') {
    $('progStatus').textContent = STATUS_MSGS.saving;
    $('progDetail').textContent = 'Almost done…';
    setRing(base + span * 0.95);
  }
});

async function startCompression() {
  if (!state.files.length) { switchView('compressor'); return; }
  if (!state.outputFolder) {
    const folder = await api.selectOutputFolder();
    if (!folder) return;
    state.outputFolder = folder; $('outputPath').value = folder;
  }

  if (state.view !== 'compressor') switchView('compressor');
  state.cancelled = false;
  state.results = [];
  state.fileStates = state.files.map(() => ({ status: 'queued', pct: 0, result: null }));
  setStage('compressing');
  setRing(0);

  for (let i = 0; i < state.files.length; i++) {
    if (state.cancelled) break;
    const file = state.files[i];
    state.activeIndex = i;
    $('progFileName').textContent = file.name;
    state.fileStates[i] = { status: 'active', pct: 0, result: null };
    if (state.view === 'batch') renderBatch();

    try {
      const res = await api.compressPDF({
        inputPath: file.path,
        outputFolder: state.outputFolder,
        fileName: file.name,
        quality: currentQuality()
      });
      if (res && res.success) {
        state.results.push({ name: file.name, success: true, ...res });
        state.fileStates[i] = { status: 'done', pct: 100, result: res };
      } else {
        state.results.push({ name: file.name, success: false, error: 'Unsuccessful result' });
        state.fileStates[i] = { status: 'error', pct: 0, result: null };
      }
    } catch (err) {
      state.results.push({ name: file.name, success: false, error: err.message || String(err) });
      state.fileStates[i] = { status: 'error', pct: 0, result: null };
    }

    setRing(((i + 1) / state.files.length) * 100);
    if (state.view === 'batch') renderBatch();
    await new Promise(r => setTimeout(r, 200));
  }

  state.activeIndex = -1;
  if (state.cancelled) { setStage('loaded'); return; }
  await persistResults();
  showCompleted();
  updateBatchBadge();
}

$('cancelBtn').addEventListener('click', () => { state.cancelled = true; });

// =====================================================================
// Completed screen
// =====================================================================
function showCompleted() {
  const ok = state.results.filter(r => r.success);
  const failed = state.results.filter(r => !r.success);
  const origTotal = ok.reduce((s, r) => s + (parseInt(r.originalSize) || 0), 0);
  const compTotal = ok.reduce((s, r) => s + (parseInt(r.compressedSize) || 0), 0);
  const savedPct = origTotal > 0 ? ((origTotal - compTotal) / origTotal * 100) : 0;

  $('doneSavedPct').textContent = savedPct.toFixed(0);
  $('doneSub').textContent = `${ok.length} of ${state.results.length} file${state.results.length > 1 ? 's' : ''} optimized & verified`;
  $('origSize').textContent = formatBytes(origTotal);
  $('compSize').textContent = formatBytes(compTotal);
  $('removedBytes').textContent = formatBytes(origTotal - compTotal);
  $('donePreset').textContent = presetDisplayName();
  $('doneCount').textContent = `${ok.length} / ${state.results.length}`;

  setStage('completed');
  $('compFill').style.width = '0%';
  setTimeout(() => {
    $('compFill').style.width = (origTotal > 0 ? Math.max((compTotal / origTotal) * 100, 3) : 3) + '%';
  }, 90);

  const fbox = $('doneFailed');
  if (failed.length) {
    fbox.style.display = 'block';
    fbox.innerHTML = `<div class="done-failed-title">${failed.length} file(s) failed</div><ul>${
      failed.map(f => `<li>${f.name}: ${f.error}</li>`).join('')}</ul>`;
  } else fbox.style.display = 'none';
}

$('openFolderBtn').addEventListener('click', async () => {
  if (state.outputFolder) {
    try { await api.openFolder(state.outputFolder); }
    catch { alert('Could not open output folder'); }
  }
});

$('compressMoreBtn').addEventListener('click', () => {
  state.files = [];
  state.fileStates = [];
  state.results = [];
  state.outputFolder = '';
  $('outputPath').value = '';
  setStage('idle');
  setRing(0);
  updateBatchBadge();
});

// =====================================================================
// History persistence
// =====================================================================
async function persistResults() {
  const ok = state.results.filter(r => r.success);
  if (!ok.length) return;
  const now = Date.now();
  const entries = ok.map(r => ({
    ts: now,
    name: r.name,
    originalSize: parseInt(r.originalSize) || 0,
    compressedSize: parseInt(r.compressedSize) || 0,
    reduction: parseFloat(r.reduction) || 0,
    preset: presetDisplayName()
  }));
  try { state.history = await api.addHistory(entries); }
  catch { state.history = [...entries, ...state.history]; }
  updateSidebarStats();
}

function updateSidebarStats() {
  const h = state.history;
  const origTotal = h.reduce((s, e) => s + (e.originalSize || 0), 0);
  const compTotal = h.reduce((s, e) => s + (e.compressedSize || 0), 0);
  const saved = origTotal - compTotal;
  const avg = origTotal > 0 ? (saved / origTotal * 100) : 0;

  const f = formatBytes(saved).split(' ');
  $('statSavedValue').textContent = f[0];
  $('statSavedUnit').textContent = f[1] || 'MB';
  $('statSavedSub').textContent = `across ${h.length} document${h.length === 1 ? '' : 's'}`;
  $('statAvgReduction').textContent = avg.toFixed(0) + '%';
  $('statSessionCount').textContent = state.results.filter(r => r.success).length;
}

function renderHistory() {
  const h = state.history;
  const origTotal = h.reduce((s, e) => s + (e.originalSize || 0), 0);
  const compTotal = h.reduce((s, e) => s + (e.compressedSize || 0), 0);
  const avg = origTotal > 0 ? ((origTotal - compTotal) / origTotal * 100) : 0;

  $('histCount').textContent = h.length;
  $('histSaved').textContent = formatBytes(origTotal - compTotal);
  $('histAvg').textContent = avg.toFixed(0) + '%';
  $('histFootInfo').textContent = h.length ? `${h.length} record${h.length === 1 ? '' : 's'} retained` : 'No compressions yet';

  const body = $('histBody');
  if (!h.length) { body.innerHTML = `<div class="table-empty">No compressions yet — your history will appear here.</div>`; return; }

  body.innerHTML = h.map(e => {
    const d = new Date(e.ts);
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const pc = presetColor(e.preset || '');
    return `
    <div class="table-row hist-grid">
      <span class="cell-date">${date}</span>
      <div class="cell-doc">
        <span class="cell-doc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
        <span class="cell-doc-name" title="${e.name}">${e.name}</span>
      </div>
      <div class="hist-reduction"><span>${formatBytes(e.originalSize)}</span><span class="arrow">→</span><span class="comp">${formatBytes(e.compressedSize)}</span></div>
      <span class="hist-saved ta-right">−${(e.reduction || 0).toFixed(0)}%</span>
      <div class="ta-right"><span class="hist-preset" style="color:${pc};border:1px solid ${pc}55;">${e.preset || '—'}</span></div>
    </div>`;
  }).join('');
}

$('clearHistoryBtn').addEventListener('click', async () => {
  state.history = await api.clearHistory();
  updateSidebarStats();
  renderHistory();
});

// =====================================================================
// Batch Queue
// =====================================================================
function updateBatchBadge() {
  const badge = $('navBatchBadge');
  if (state.files.length) { badge.style.display = 'inline-block'; badge.textContent = state.files.length; }
  else badge.style.display = 'none';
}

function renderBatch() {
  const total = state.files.length;
  const active = state.fileStates.filter(s => s.status === 'active').length;
  const queued = state.fileStates.filter(s => s.status === 'queued').length;
  const done = state.fileStates.filter(s => s.status === 'done');
  const savedBytes = done.reduce((s, st) => s + ((st.result?.originalSize || 0) - (st.result?.compressedSize || 0)), 0);

  $('batchTotal').textContent = total;
  $('batchActive').textContent = active;
  $('batchQueued').textContent = queued;
  $('batchSaved').textContent = formatBytes(savedBytes);
  $('batchPresetLabel').textContent = presetDisplayName();

  const body = $('batchBody');
  if (!total) { body.innerHTML = `<div class="table-empty">No files queued. Use “Add files” to build a batch.</div>`; return; }

  body.innerHTML = state.files.map((f, i) => {
    const st = state.fileStates[i] || { status: 'queued', pct: 0, result: null };
    let pill, result = '—', saved = '';
    if (st.status === 'done') {
      pill = `<span class="pill pill-done">Completed</span>`;
      result = `→ ${formatBytes(st.result.compressedSize)}`;
      saved = `<span class="cell-result-saved">−${(st.result.reduction || 0).toFixed(0)}%</span>`;
    } else if (st.status === 'active') {
      pill = `<span class="pill pill-active">${st.pct}%</span><div class="cell-bar"><div class="cell-bar-inner" style="width:${st.pct}%"></div></div>`;
    } else if (st.status === 'error') {
      pill = `<span class="pill pill-error">Failed</span>`;
    } else {
      pill = `<span class="pill pill-queued">Queued</span>`;
    }
    return `
    <div class="table-row batch-grid">
      <div class="cell-doc">
        <span class="cell-doc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>
        <span class="cell-doc-name" title="${f.name}">${f.name}</span>
      </div>
      <span class="cell-size ta-right">${formatBytes(f.size)}</span>
      <div>${pill}</div>
      <div class="ta-right"><span class="cell-result">${result}</span>${saved}</div>
    </div>`;
  }).join('');
}

$('batchCompressAll').addEventListener('click', () => {
  if (!state.files.length) { switchView('compressor'); return; }
  startCompression();
});

// =====================================================================
// Init
// =====================================================================
(async function init() {
  setStage('idle');
  renderPresets();
  try { state.history = await api.getHistory(); } catch { state.history = []; }
  updateSidebarStats();
  updateBatchBadge();
})();
