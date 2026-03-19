// ── State ───────────────────────────────────────────
let currentStep = 0;
let selectedApk = null;
let selectedDevice = null;
let openMenuEl = null;
let editingEntry = null;
let loadedHistoryEntries = [];

// ── Navigation ──────────────────────────────────────
function goToStep(n) {
  document.querySelectorAll('.step-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`step-${n}`).classList.add('active');

  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.remove('active');
    d.classList.toggle('done', i < n);
    d.classList.toggle('active', i === n);
  });

  currentStep = n;

  if (n === 1) { updateHistoryBadge(); hideHistory(); }
  if (n === 2) loadDevices();
  if (n === 3) doInstall();
}

// ── Step 0: Dependency Dashboard ────────────────────
function setDepStatus(id, ok, detail) {
  const row = document.getElementById(`dep-${id}`);
  const statusEl = document.getElementById(`dep-${id}-status`);
  row.classList.remove('ok', 'err');
  row.classList.add(ok ? 'ok' : 'err');
  statusEl.innerHTML = ok
    ? '<span class="status-badge status-ok" style="padding:4px 10px; font-size:11px;">✔ OK</span>'
    : '<span class="status-badge status-err" style="padding:4px 10px; font-size:11px;">✖ Ausente</span>';
  if (detail) {
    document.getElementById(`dep-${id}-desc`).textContent = detail;
  }
}

async function checkDeps() {
  const actions = document.getElementById('adb-actions');
  const installBox = document.getElementById('dep-install-box');

  // Platform (instant)
  const platformDesc = document.getElementById('dep-platform-desc');
  const platformStatus = document.getElementById('dep-platform-status');
  const ua = navigator.userAgent;
  const isMac = ua.includes('Mac');
  platformDesc.textContent = isMac ? 'macOS' : 'Windows';
  document.getElementById('dep-platform').classList.add('ok');
  platformStatus.innerHTML = '<span class="status-badge status-ok" style="padding:4px 10px; font-size:11px;">✔ OK</span>';

  // ADB check
  const result = await window.api.checkAdb();

  if (result.installed) {
    setDepStatus('adb', true, result.version);

    // Check server
    document.getElementById('dep-server-status').innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
    const response = await window.api.listDevices();
    const devCount = (response.devices || []).length;
    setDepStatus('server', true, 'Servidor rodando — ' + devCount + ' dispositivo(s)');

    installBox.style.display = 'none';
    actions.innerHTML = '<button class="btn btn-primary" onclick="goToStep(1)">Tudo pronto — Continuar →</button>';
    actions.style.display = 'flex';
  } else {
    setDepStatus('adb', false, 'Não encontrado no sistema');
    setDepStatus('server', false, 'Depende do ADB');

    installBox.style.display = 'block';
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="doInstallAdb()">⬇️ Instalar ADB automaticamente</button>
    `;
    actions.style.display = 'flex';
  }
}

async function doInstallAdb() {
  const actions = document.getElementById('adb-actions');
  const installBox = document.getElementById('dep-install-box');

  actions.style.display = 'none';
  installBox.style.display = 'none';
  document.getElementById('dep-adb-status').innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
  document.getElementById('dep-adb-desc').textContent = 'Instalando... pode levar alguns minutos';
  document.getElementById('dep-adb').classList.remove('ok', 'err');

  const result = await window.api.installAdb();

  if (result.success) {
    // Re-run full check to update all statuses
    await checkDeps();
  } else {
    setDepStatus('adb', false, 'Falha na instalação — ' + result.message);
    installBox.innerHTML = `<div class="help-box"><strong>❌ Instalação falhou</strong><br>${result.message}<br>Tente instalar manualmente.</div>`;
    installBox.style.display = 'block';
    actions.innerHTML = '<button class="btn btn-secondary" onclick="doInstallAdb()">Tentar novamente</button>';
    actions.style.display = 'flex';
  }
}

// ── Step 1: APK Selection ───────────────────────────
const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('click', async () => {
  const apk = await window.api.selectApk();
  if (apk) setApk(apk);
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.apk')) {
    setApk({
      path: file.path,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      source: 'file',
    });
  }
});

function setApk(apk, skipMeta) {
  selectedApk = apk;
  dropzone.style.display = 'none';
  document.getElementById('url-section').style.display = 'none';
  document.getElementById('btn-show-history').style.display = 'none';
  const info = document.getElementById('apk-info');
  info.style.display = 'block';
  const sourceBadge = apk.source === 'url'
    ? '<span style="font-size:10px; padding:2px 6px; background:rgba(108,92,231,0.15); color:var(--accent); border-radius:4px;">URL</span>'
    : '<span style="font-size:10px; padding:2px 6px; background:rgba(0,214,143,0.15); color:var(--green); border-radius:4px;">Arquivo</span>';
  info.innerHTML = `
    <div class="apk-selected">
      <div class="icon">📦</div>
      <div class="info">
        <div class="name">${apk.customLabel || apk.name}</div>
        <div class="size">${apk.size} ${sourceBadge}</div>
        ${apk.description ? '<div style="font-size:11px; color:var(--text-dim); margin-top:4px;">' + apk.description + '</div>' : ''}
      </div>
      <span style="color: var(--green); font-size: 20px;">✓</span>
    </div>
  `;
  if (skipMeta) {
    document.getElementById('apk-meta').style.display = 'none';
  } else {
    document.getElementById('apk-meta').style.display = 'flex';
  }
  document.getElementById('apk-custom-name').value = apk.customLabel || '';
  document.getElementById('apk-description').value = apk.description || '';
  document.getElementById('apk-actions').style.display = 'flex';
}

function resetApk() {
  selectedApk = null;
  dropzone.style.display = 'block';
  document.getElementById('url-section').style.display = 'block';
  document.getElementById('btn-show-history').style.display = 'flex';
  document.getElementById('apk-info').style.display = 'none';
  document.getElementById('apk-meta').style.display = 'none';
  document.getElementById('apk-actions').style.display = 'none';
  document.getElementById('url-input').value = '';
  document.getElementById('apk-custom-name').value = '';
  document.getElementById('apk-description').value = '';
  document.getElementById('download-status').style.display = 'none';
}

// ── Step 2: Devices ─────────────────────────────────
function createDeviceItem(d) {
  const item = document.createElement('div');
  item.className = 'device-item';
  item.innerHTML = `
    <div class="icon">${d.isEmulator ? '💻' : '📱'}</div>
    <div class="info">
      <div class="name">${d.label}</div>
      <div class="id">${d.id}${d.status !== 'device' ? ' <span style="color:var(--yellow);">[' + d.status + ']</span>' : ''}</div>
    </div>
    <div class="check">✓</div>
  `;
  item.addEventListener('click', () => {
    document.querySelectorAll('.device-item').forEach((el) => el.classList.remove('selected'));
    item.classList.add('selected');
    selectedDevice = d.id;
    document.getElementById('btn-install').disabled = false;
  });
  return item;
}

async function loadDevices() {
  const loading = document.getElementById('device-loading');
  const results = document.getElementById('device-results');
  const noDevices = document.getElementById('no-devices');
  const actions = document.getElementById('device-actions');

  loading.style.display = 'block';
  results.style.display = 'none';
  noDevices.style.display = 'none';
  actions.style.display = 'none';
  selectedDevice = null;

  const response = await window.api.listDevices();
  const devices = response.devices || [];
  const timedOut = response.timedOut || false;

  loading.style.display = 'none';

  if (devices.length === 0) {
    const noDevEl = document.getElementById('no-devices');
    // Show timeout-specific message if applicable
    if (timedOut) {
      noDevEl.querySelector('h2').textContent = 'Tempo de busca esgotado';
      noDevEl.querySelector('p').textContent = 'Não foi possível detectar dispositivos em 20 segundos. Verifique a conexão e tente novamente.';
    } else {
      noDevEl.querySelector('h2').textContent = 'Nenhum dispositivo encontrado';
      noDevEl.querySelector('p').textContent = 'Verifique se o celular está conectado e a Depuração USB ativada';
    }
    noDevices.style.display = 'block';
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="refreshDevices()">🔄 Procurar novamente</button>
    `;
    actions.style.display = 'flex';
    return;
  }

  const list = document.getElementById('device-list');
  list.innerHTML = '';

  const physical = devices.filter(d => !d.isEmulator);
  const emulators = devices.filter(d => d.isEmulator);

  document.getElementById('device-count-label').textContent =
    devices.length === 1 ? '1 dispositivo encontrado' : `${devices.length} dispositivos encontrados`;

  // Physical devices section
  if (physical.length > 0) {
    const header = document.createElement('div');
    header.className = 'device-section-header';
    header.innerHTML = '📱 Dispositivos físicos';
    list.appendChild(header);
    physical.forEach(d => list.appendChild(createDeviceItem(d)));
  }

  // Emulators section
  if (emulators.length > 0) {
    const header = document.createElement('div');
    header.className = 'device-section-header';
    header.innerHTML = '💻 Emuladores';
    list.appendChild(header);
    emulators.forEach(d => list.appendChild(createDeviceItem(d)));
  }

  // Auto-select if only one device
  const allItems = list.querySelectorAll('.device-item');
  if (allItems.length === 1) {
    allItems[0].click();
  }

  results.style.display = 'block';
  actions.innerHTML = `
    <button class="btn btn-secondary" onclick="refreshDevices()">🔄 Atualizar</button>
    <button class="btn btn-primary" id="btn-install" ${selectedDevice ? '' : 'disabled'} onclick="goToStep(3)">Instalar →</button>
  `;
  actions.style.display = 'flex';
}

function refreshDevices() {
  loadDevices();
}

// ── Step 3: Install ─────────────────────────────────
async function doInstall() {
  const installView = document.getElementById('installing-view');
  const resultView = document.getElementById('result-view');
  const details = document.getElementById('installing-details');

  installView.style.display = 'block';
  resultView.style.display = 'none';

  details.textContent = `Enviando ${selectedApk.name} para o dispositivo...`;

  const result = await window.api.installApk(selectedDevice, selectedApk.path);

  installView.style.display = 'none';
  resultView.style.display = 'block';

  if (result.success) {
    // Read user metadata
    const customLabel = document.getElementById('apk-custom-name').value.trim();
    const description = document.getElementById('apk-description').value.trim();
    selectedApk.customLabel = customLabel || selectedApk.customLabel || '';
    selectedApk.description = description || selectedApk.description || '';

    // Save to history
    await window.api.saveApkToHistory({
      path: selectedApk.path,
      name: selectedApk.name,
      size: selectedApk.size,
      customLabel: selectedApk.customLabel,
      description: selectedApk.description,
      source: selectedApk.source || 'file',
      url: selectedApk.url || null,
      installedAt: new Date().toISOString(),
      downloadedAt: selectedApk.downloadedAt || null,
    });

    const isDownloaded = selectedApk.source === 'url';
    const deleteBtn = isDownloaded
      ? `<button class="btn btn-secondary" onclick="deleteCurrentApk()" id="btn-delete-apk">🗑️ Excluir APK baixado</button>`
      : '';

    resultView.innerHTML = `
      <div class="result-card success">
        <div class="result-icon">🎉</div>
        <h2 style="color: var(--green);">Instalação concluída!</h2>
        <p style="margin-top: 8px;">
          <strong style="color: var(--text);">${selectedApk.name}</strong><br>
          foi instalado com sucesso no dispositivo.
        </p>
        <p style="margin-top: 12px;">O app já deve aparecer na gaveta de apps do Android.</p>
      </div>
      <div class="actions" style="margin-top: 16px;">
        <button class="btn btn-secondary" onclick="startOver()">Instalar outro APK</button>
        ${deleteBtn}
      </div>
    `;
  } else {
    const errorCode = result.code || 'UNKNOWN';
    const errorTitle = result.title || 'Falha na instalação';
    const errorMsg = result.error || 'Erro desconhecido.';
    const errorTip = result.tip || '';

    let tipHtml = '';
    if (errorTip) {
      tipHtml = `
        <div class="error-tip">
          <div class="tip-label">💡 Como resolver</div>
          <div class="tip-text">${errorTip}</div>
        </div>
      `;
    }

    const uninstallCodes = ['VERSION_DOWNGRADE', 'ALREADY_EXISTS', 'UPDATE_INCOMPATIBLE', 'CONFLICTING_PROVIDER'];
    let uninstallHtml = '';
    if (uninstallCodes.includes(errorCode)) {
      uninstallHtml = `<button class="btn btn-danger" onclick="uninstallAndRetry()" id="btn-uninstall">🗑️ Desinstalar app e tentar novamente</button>`;
    }

    resultView.innerHTML = `
      <div class="result-card error">
        <div class="result-icon">😞</div>
        <h2 style="color: var(--red);">${errorTitle}</h2>
        <p style="margin-top: 8px;">${errorMsg}</p>
        <div style="margin-top: 10px;">
          <span style="font-size:10px; padding:3px 8px; background:var(--bg-hover); border-radius:6px; color:var(--text-dim); font-family:monospace;">${errorCode}</span>
        </div>
      </div>
      ${tipHtml}
      <div class="actions" style="margin-top: 12px;">
        <button class="btn btn-secondary" onclick="goToStep(2)">← Voltar</button>
        ${uninstallHtml}
        <button class="btn btn-primary" onclick="goToStep(3)">Tentar novamente</button>
      </div>
    `;
  }
}

function startOver() {
  selectedApk = null;
  selectedDevice = null;
  resetApk();
  goToStep(1);
}

// ── Download by URL ─────────────────────────────────
async function downloadFromUrl() {
  const urlInput = document.getElementById('url-input');
  const btn = document.getElementById('btn-download');
  const statusEl = document.getElementById('download-status');
  const label = document.getElementById('download-label');
  const percent = document.getElementById('download-percent');
  const bar = document.getElementById('download-bar');
  const url = urlInput.value.trim();

  if (!url) { urlInput.focus(); return; }

  btn.disabled = true;
  btn.textContent = '⏳';
  urlInput.disabled = true;
  statusEl.style.display = 'block';
  label.textContent = 'Conectando...';
  percent.textContent = '';
  bar.style.width = '0%';

  window.api.onDownloadProgress((data) => {
    label.textContent = 'Baixando...';
    percent.textContent = data.percent + '%';
    bar.style.width = data.percent + '%';
  });

  const result = await window.api.downloadApk(url);

  window.api.removeDownloadProgress();
  btn.disabled = false;
  btn.textContent = '⬇️ Baixar';
  urlInput.disabled = false;

  if (result.success) {
    statusEl.style.display = 'none';
    // Save to history automatically
    await window.api.saveApkToHistory(result.apk);
    setApk(result.apk);
  } else {
    label.textContent = '❌ ' + result.error;
    percent.textContent = '';
    bar.style.width = '100%';
    bar.style.background = 'var(--red)';
    setTimeout(() => {
      statusEl.style.display = 'none';
      bar.style.background = '';
    }, 4000);
  }
}

// ── APK History ─────────────────────────────────────
async function showHistory() {
  document.getElementById('apk-select-view').style.display = 'none';
  document.getElementById('apk-history-view').style.display = 'block';
  await renderHistory();
}

function hideHistory() {
  document.getElementById('apk-history-view').style.display = 'none';
  document.getElementById('apk-select-view').style.display = 'contents';
}

async function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const entries = await window.api.getApkHistory();

  if (entries.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  list.style.display = 'flex';
  empty.style.display = 'none';
  list.innerHTML = '';
  loadedHistoryEntries = entries;

  for (const entry of entries) {
    const badgeClass = entry.source === 'url' ? 'url' : 'file';
    const badgeText = entry.source === 'url' ? '🔗 URL' : '📁 Arquivo';
    const dateStr = entry.installedAt
      ? new Date(entry.installedAt).toLocaleDateString('pt-BR')
      : entry.downloadedAt
        ? new Date(entry.downloadedAt).toLocaleDateString('pt-BR')
        : '';
    const displayName = entry.customLabel || entry.name;
    const descHtml = entry.description
      ? `<div style="font-size:11px; color:var(--text-dim); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${entry.description}</div>`
      : '';
    const fileNameHtml = entry.customLabel
      ? `<div style="font-size:10px; color:var(--text-dim); font-family:monospace; margin-top:1px;">${entry.name}</div>`
      : '';

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div style="font-size:24px;">📦</div>
      <div class="hi-info">
        <div class="hi-name">${displayName}</div>
        ${fileNameHtml}
        ${descHtml}
        <div class="hi-meta">
          <span>${entry.size}</span>
          <span class="hi-badge ${badgeClass}">${badgeText}</span>
          ${dateStr ? '<span>' + dateStr + '</span>' : ''}
        </div>
      </div>
      <div class="hi-actions">
        <button class="hi-btn" title="Menu" onclick="event.stopPropagation(); toggleMenu(this, '${entry.path.replace(/'/g, "\\'")}')">⋮</button>
      </div>
    `;
    item.addEventListener('click', () => selectFromHistory(entry));
    list.appendChild(item);
  }

  // Update badge count
  updateHistoryCount(entries.length);
}

function toggleMenu(btnEl, entryPath) {
  closeAllMenus();
  const container = btnEl.closest('.hi-actions');
  const entry = loadedHistoryEntries.find(e => e.path === entryPath);
  if (!entry) return;

  const rect = btnEl.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'hi-menu';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  menu.innerHTML = `
    <button class="hi-menu-item" onclick="event.stopPropagation(); closeAllMenus(); editFromHistory('${entryPath.replace(/'/g, "\\'")}')">✏️ Editar</button>
    <button class="hi-menu-item danger" onclick="event.stopPropagation(); closeAllMenus(); deleteFromHistory('${entryPath.replace(/'/g, "\\'")}')">🗑️ Excluir</button>
  `;
  document.body.appendChild(menu);
  openMenuEl = menu;

  // If menu goes below viewport, flip upward
  const menuRect = menu.getBoundingClientRect();
  if (menuRect.bottom > window.innerHeight) {
    menu.style.top = (rect.top - menuRect.height - 4) + 'px';
  }

  setTimeout(() => {
    document.addEventListener('click', closeAllMenus, { once: true });
  }, 0);
}

function closeAllMenus() {
  document.querySelectorAll('.hi-menu').forEach(m => m.remove());
  openMenuEl = null;
}

function editFromHistory(entryPath) {
  const entry = loadedHistoryEntries.find(e => e.path === entryPath);
  if (!entry) return;
  editingEntry = entry;
  document.getElementById('edit-filename').textContent = entry.name;
  document.getElementById('edit-custom-name').value = entry.customLabel || '';
  document.getElementById('edit-description').value = entry.description || '';
  document.getElementById('edit-overlay').classList.add('visible');
}

function closeEditOverlay() {
  document.getElementById('edit-overlay').classList.remove('visible');
  editingEntry = null;
}

async function saveEditOverlay() {
  if (!editingEntry) return;
  editingEntry.customLabel = document.getElementById('edit-custom-name').value.trim();
  editingEntry.description = document.getElementById('edit-description').value.trim();
  await window.api.saveApkToHistory(editingEntry);
  closeEditOverlay();
  await renderHistory();
}

async function selectFromHistory(entry) {
  hideHistory();
  setApk(entry, true);
  goToStep(2);
}

async function deleteFromHistory(filePath) {
  await window.api.deleteApkFile(filePath);
  await renderHistory();
  const entries = await window.api.getApkHistory();
  updateHistoryCount(entries.length);
}

async function deleteCurrentApk() {
  if (!selectedApk) return;
  const btn = document.getElementById('btn-delete-apk');
  btn.disabled = true;
  btn.textContent = '⏳ Excluindo...';
  const result = await window.api.deleteApkFile(selectedApk.path);
  if (result.success) {
    btn.textContent = '✅ APK excluído';
    btn.style.color = 'var(--green)';
    btn.style.borderColor = 'var(--green)';
  } else {
    btn.textContent = '❌ Falha ao excluir';
    btn.disabled = false;
  }
}

// ── URL input enter key ─────────────────────────────
document.getElementById('url-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') downloadFromUrl();
});

// ── Load history count on step 1 ────────────────────
function updateHistoryCount(count) {
  const el = document.getElementById('history-count');
  if (count > 0) {
    el.textContent = count;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

async function updateHistoryBadge() {
  const entries = await window.api.getApkHistory();
  updateHistoryCount(entries.length);
}

async function uninstallAndRetry() {
  const btn = document.getElementById('btn-uninstall');
  const resultView = document.getElementById('result-view');

  btn.disabled = true;
  btn.textContent = '⏳ Obtendo nome do pacote...';

  const { packageName } = await window.api.getPackageName(selectedApk.path);

  if (!packageName) {
    btn.disabled = false;
    btn.textContent = '🗑️ Desinstalar app e tentar novamente';
    resultView.insertAdjacentHTML('beforeend', `
      <div class="error-tip" style="margin-top: 8px; border-color: rgba(255,107,107,0.3);">
        <div class="tip-label">⚠️ Não foi possível detectar o pacote</div>
        <div class="tip-text">Não encontramos o <strong>aapt/aapt2</strong> do Android SDK para ler o pacote do APK. Desinstale manualmente pelo celular em <strong>Configurações > Apps</strong>.</div>
      </div>
    `);
    return;
  }

  btn.textContent = `⏳ Desinstalando ${packageName}...`;

  const result = await window.api.uninstallApp(selectedDevice, packageName);

  if (result.success) {
    resultView.innerHTML = `
      <div class="result-card success">
        <div class="result-icon">✅</div>
        <h2 style="color: var(--green);">App desinstalado!</h2>
        <p style="margin-top: 8px;"><strong style="color: var(--text);">${packageName}</strong> foi removido do dispositivo.</p>
        <p style="margin-top: 4px; color: var(--text-dim);">Reinstalando automaticamente...</p>
      </div>
    `;
    await new Promise(r => setTimeout(r, 1000));
    doInstall();
  } else {
    btn.disabled = false;
    btn.textContent = '🗑️ Desinstalar app e tentar novamente';
    resultView.insertAdjacentHTML('beforeend', `
      <div class="error-tip" style="margin-top: 8px; border-color: rgba(255,107,107,0.3);">
        <div class="tip-label">⚠️ Falha ao desinstalar</div>
        <div class="tip-text">${result.error || 'Erro desconhecido'}. Tente desinstalar manualmente pelo celular.</div>
      </div>
    `);
  }
}

// ── Init ────────────────────────────────────────────
checkDeps();
