const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { execFile, exec, spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const os = require('os');

let mainWindow;

// ── Window ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 680,
    minWidth: 620,
    minHeight: 580,
    resizable: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ── ADB helpers ─────────────────────────────────────────────

function getCommonAdbPaths() {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return [
      path.join(home, 'Library/Android/sdk/platform-tools'),
      path.join(home, 'Android/sdk/platform-tools'),
      '/usr/local/share/android-sdk/platform-tools',
      '/opt/homebrew/share/android-commandlinetools/platform-tools',
      '/usr/local/share/android-commandlinetools/platform-tools',
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/opt/homebrew/Caskroom/android-platform-tools/latest/platform-tools',
    ];
  }
  // Windows
  return [
    path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk/platform-tools'),
    path.join(home, 'AppData/Local/Android/Sdk/platform-tools'),
    path.join(process.env.LOCALAPPDATA || '', 'Android/platform-tools'),
    'C:\\Android\\platform-tools',
    'C:\\android-sdk\\platform-tools',
  ];
}

// Ensure common macOS paths are in process.env.PATH for packaged apps
if (process.platform === 'darwin') {
  const extraPaths = ['/opt/homebrew/bin', '/usr/local/bin', '/opt/homebrew/sbin', '/usr/local/sbin'];
  const currentPath = process.env.PATH || '';
  const missing = extraPaths.filter(p => !currentPath.includes(p));
  if (missing.length) {
    process.env.PATH = [...missing, currentPath].join(':');
  }
}

function findAdb() {
  return new Promise((resolve) => {
    const adbName = process.platform === 'win32' ? 'adb.exe' : 'adb';

    // Check PATH first
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    exec(`${whichCmd} adb`, (err, stdout) => {
      if (!err && stdout.trim()) {
        resolve(stdout.trim().split('\n')[0].trim());
        return;
      }

      // Search common paths
      for (const dir of getCommonAdbPaths()) {
        const candidate = path.join(dir, adbName);
        if (fs.existsSync(candidate)) {
          resolve(candidate);
          return;
        }
      }
      resolve(null);
    });
  });
}

function runAdb(adbPath, args) {
  return new Promise((resolve, reject) => {
    execFile(adbPath, args, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

// ── IPC Handlers ────────────────────────────────────────────

ipcMain.handle('check-adb', async () => {
  const adbPath = await findAdb();
  if (!adbPath) return { installed: false, path: null, version: null };

  try {
    const output = await runAdb(adbPath, ['--version']);
    const versionLine = output.split('\n')[0] || '';
    return { installed: true, path: adbPath, version: versionLine.trim() };
  } catch {
    return { installed: false, path: null, version: null };
  }
});

ipcMain.handle('install-adb', async () => {
  if (process.platform === 'darwin') {
    // Find brew in common locations (PATH may be minimal in packaged apps)
    const brewPath = await new Promise((resolve) => {
      const candidates = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'];
      for (const b of candidates) {
        if (fs.existsSync(b)) { resolve(b); return; }
      }
      // Fallback to which
      exec('which brew', (err, stdout) => {
        resolve(!err && stdout.trim() ? stdout.trim() : null);
      });
    });

    if (brewPath) {
      return new Promise((resolve) => {
        const child = spawn(brewPath, ['install', '--cask', 'android-platform-tools'], {
          env: { ...process.env },
        });
        let output = '';
        child.stdout.on('data', (d) => (output += d.toString()));
        child.stderr.on('data', (d) => (output += d.toString()));
        child.on('error', (err) => {
          resolve({
            success: false,
            message: `Erro ao executar brew: ${err.message}`,
            output,
          });
        });
        child.on('close', async (code) => {
          const adbPath = await findAdb();
          resolve({
            success: !!adbPath,
            message: adbPath
              ? 'ADB instalado com sucesso via Homebrew!'
              : `Homebrew retornou código ${code}. Tente no Terminal: brew install --cask android-platform-tools`,
            output,
          });
        });
      });
    }

    // No Homebrew — download directly from Google
    const url = 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';
    const tmpDir = path.join(os.tmpdir(), 'adb-install');
    const zipPath = path.join(tmpDir, 'platform-tools.zip');
    const installDir = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'platform-tools');

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });

    return new Promise((resolve) => {
      const file = fs.createWriteStream(zipPath);
      const doDownload = (downloadUrl) => {
        https.get(downloadUrl, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            doDownload(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            resolve({ success: false, message: `Download falhou (HTTP ${res.statusCode}).`, output: '' });
            return;
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            // Unzip
            exec(`unzip -o "${zipPath}" -d "${tmpDir}"`, (unzipErr, unzipOut, unzipStderr) => {
              if (unzipErr) {
                resolve({ success: false, message: 'Falha ao descompactar.', output: unzipStderr || unzipErr.message });
                return;
              }
              // Copy to final location
              exec(`cp -R "${path.join(tmpDir, 'platform-tools')}/." "${installDir}/"`, async (cpErr) => {
                if (cpErr) {
                  resolve({ success: false, message: 'Falha ao copiar arquivos.', output: cpErr.message });
                  return;
                }
                // Make adb executable
                exec(`chmod +x "${path.join(installDir, 'adb')}"`, async () => {
                  const adbPath = await findAdb();
                  resolve({
                    success: !!adbPath,
                    message: adbPath
                      ? 'ADB instalado com sucesso (download direto)!'
                      : `Arquivo copiado para ${installDir} mas ADB não encontrado no PATH.`,
                    output: unzipOut || '',
                  });
                });
              });
            });
          });
        }).on('error', (e) => {
          resolve({ success: false, message: `Erro no download: ${e.message}`, output: '' });
        });
      };
      doDownload(url);
    });
  }

  // Windows: download platform-tools
  if (process.platform === 'win32') {
    const url = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
    const tmpDir = path.join(os.tmpdir(), 'adb-install');
    const zipPath = path.join(tmpDir, 'platform-tools.zip');
    const installDir = path.join(process.env.LOCALAPPDATA || os.homedir(), 'Android', 'platform-tools');

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });

    return new Promise((resolve) => {
      const file = fs.createWriteStream(zipPath);
      const doDownload = (downloadUrl) => {
        https.get(downloadUrl, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            doDownload(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            resolve({ success: false, message: `Download falhou (HTTP ${res.statusCode}).`, output: '' });
            return;
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            extractAndFinish();
          });
        }).on('error', (e) => resolve({ success: false, message: `Erro no download: ${e.message}`, output: '' }));
      };
      doDownload(url);

      function extractAndFinish() {
        exec(
          `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force"`,
          async (zipErr, zipOut, zipStderr) => {
            if (zipErr) {
              resolve({ success: false, message: 'Falha ao descompactar.', output: zipStderr || zipErr.message });
              return;
            }
            exec(`xcopy /E /Y /Q "${path.join(tmpDir, 'platform-tools', '*')}" "${installDir}\\"`, async (cpErr, cpOut, cpStderr) => {
              if (cpErr) {
                resolve({ success: false, message: 'Falha ao copiar arquivos.', output: cpStderr || cpErr.message });
                return;
              }
              process.env.PATH = `${installDir};${process.env.PATH}`;
              const adbPath = await findAdb();
              resolve({
                success: !!adbPath,
                message: adbPath ? 'ADB instalado com sucesso!' : `Arquivo copiado para ${installDir} mas ADB não encontrado.`,
                output: cpOut || '',
              });
            });
          }
        );
      }
    });
  }

  return { success: false, message: 'Sistema operacional não suportado.' };
});

ipcMain.handle('select-apk', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecione o arquivo APK',
    filters: [{ name: 'Android Package', extensions: ['apk'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    size: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
  };
});

ipcMain.handle('list-devices', async () => {
  const adbPath = await findAdb();
  if (!adbPath) return { devices: [], timedOut: false };

  try {
    await runAdb(adbPath, ['start-server']);
  } catch {
    // ignore
  }

  // Small delay for device detection
  await new Promise((r) => setTimeout(r, 1500));

  const timeoutMs = 20000;
  const devicePromise = (async () => {
    try {
      const output = await runAdb(adbPath, ['devices']);
      const lines = output
        .split('\n')
        .slice(1)
        .filter((l) => l.trim() && !l.startsWith('*'));

      const devices = [];
      for (const line of lines) {
        const [id, status] = line.split('\t').map((s) => s.trim());
        if (!id || !status) continue;

        const isEmulator = id.includes('emulator') || id.startsWith('localhost') || id.match(/^\d+\.\d+\.\d+\.\d+:\d+$/) !== null && false;
        const isEmu = id.includes('emulator');

        let model = isEmu ? 'Emulador Android' : 'Dispositivo';
        let brand = '';
        try {
          const rawModel = (await runAdb(adbPath, ['-s', id, 'shell', 'getprop', 'ro.product.model'])).trim();
          const rawBrand = (await runAdb(adbPath, ['-s', id, 'shell', 'getprop', 'ro.product.brand'])).trim();
          if (rawModel) model = rawModel;
          if (rawBrand) brand = rawBrand;
        } catch {
          // ignore
        }

        devices.push({
          id,
          status,
          model,
          brand,
          label: brand ? `${brand} ${model}` : model,
          isEmulator: isEmu,
        });
      }
      return { devices, timedOut: false };
    } catch {
      return { devices: [], timedOut: false };
    }
  })();

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ devices: [], timedOut: true }), timeoutMs)
  );

  return Promise.race([devicePromise, timeoutPromise]);
});

function parseInstallError(output) {
  const errors = [
    { match: 'INSTALL_FAILED_VERSION_DOWNGRADE', code: 'VERSION_DOWNGRADE',
      title: 'Versão mais antiga que a instalada',
      message: 'O celular já tem uma versão mais nova deste app.',
      tip: 'Desinstale o app atual do celular antes de instalar esta versão. Vá em Configurações > Apps, encontre o app e toque em "Desinstalar".' },
    { match: 'INSTALL_FAILED_INSUFFICIENT_STORAGE', code: 'NO_STORAGE',
      title: 'Sem espaço no dispositivo',
      message: 'O celular não tem espaço suficiente para instalar o app.',
      tip: 'Libere espaço apagando fotos, vídeos ou apps que não usa mais. Verifique em Configurações > Armazenamento.' },
    { match: 'INSTALL_FAILED_ALREADY_EXISTS', code: 'ALREADY_EXISTS',
      title: 'App já está instalado',
      message: 'Uma versão deste app já existe no dispositivo.',
      tip: 'Desinstale a versão atual antes de instalar novamente, ou use a opção de atualização.' },
    { match: 'INSTALL_PARSE_FAILED_NO_CERTIFICATES', code: 'NO_CERTIFICATES',
      title: 'APK sem assinatura válida',
      message: 'O arquivo APK não está assinado corretamente.',
      tip: 'Verifique se o APK foi gerado/exportado corretamente. Peça um novo arquivo ao desenvolvedor.' },
    { match: 'INSTALL_FAILED_UPDATE_INCOMPATIBLE', code: 'UPDATE_INCOMPATIBLE',
      title: 'Atualização incompatível',
      message: 'A assinatura do APK é diferente da versão instalada.',
      tip: 'Desinstale o app existente antes de instalar. Isso acontece quando o app foi assinado com uma chave diferente.' },
    { match: 'INSTALL_FAILED_OLDER_SDK', code: 'OLDER_SDK',
      title: 'Android muito antigo',
      message: 'Este APK requer uma versão mais nova do Android.',
      tip: 'Verifique se o celular atende à versão mínima do Android necessária. Atualize o sistema se possível.' },
    { match: 'INSTALL_FAILED_CONFLICTING_PROVIDER', code: 'CONFLICTING_PROVIDER',
      title: 'Conflito com outro app',
      message: 'Outro app instalado está em conflito com este.',
      tip: 'Geralmente acontece quando há outra versão do app (ex: debug e release). Desinstale a outra versão primeiro.' },
    { match: 'INSTALL_FAILED_NO_MATCHING_ABIS', code: 'NO_MATCHING_ABIS',
      title: 'Arquitetura incompatível',
      message: 'O APK não é compatível com o processador deste dispositivo.',
      tip: 'O APK foi compilado para uma arquitetura diferente (ex: ARM vs x86). Peça uma versão compatível ao desenvolvedor.' },
    { match: 'device offline', code: 'DEVICE_OFFLINE',
      title: 'Dispositivo desconectado',
      message: 'O celular perdeu a conexão durante a instalação.',
      tip: 'Verifique o cabo USB, reconecte o celular e tente novamente. Evite desbloquear/bloquear o celular durante a instalação.' },
    { match: 'INSTALL_FAILED_USER_RESTRICTED', code: 'USER_RESTRICTED',
      title: 'Instalação bloqueada',
      message: 'O dispositivo está bloqueando instalações de fontes externas.',
      tip: 'No celular, vá em Configurações > Segurança e ative "Fontes desconhecidas" ou "Instalar apps desconhecidos".' },
    { match: 'INSTALL_PARSE_FAILED_NOT_APK', code: 'PARSE_FAILED_NOT_APK',
      title: 'Arquivo APK corrompido ou inválido',
      message: 'O Android não conseguiu ler o arquivo APK.',
      tip: 'O arquivo pode estar corrompido ou não é um APK válido. Tente baixar o APK novamente. Se veio de uma URL, verifique se o link é de download direto.' },
    { match: 'INSTALL_PARSE_FAILED_UNEXPECTED_EXCEPTION', code: 'PARSE_FAILED',
      title: 'Erro ao processar o APK',
      message: 'O Android encontrou um erro inesperado ao processar o arquivo.',
      tip: 'O arquivo APK pode estar corrompido. Tente baixar novamente ou peça um novo arquivo ao desenvolvedor.' },
    { match: "filename doesn't end .apk", code: 'INVALID_FILENAME',
      title: 'Nome do arquivo inválido',
      message: 'O ADB não reconheceu o arquivo como APK.',
      tip: 'Selecione o APK novamente. Se o problema persistir, renomeie o arquivo para terminar em .apk e tente de novo.' },
  ];

  for (const e of errors) {
    if (output.includes(e.match)) {
      return { success: false, code: e.code, title: e.title, error: e.message, tip: e.tip };
    }
  }

  return null;
}

// ── Package name extraction ─────────────────────────────────────
function findAapt() {
  return new Promise((resolve) => {
    const home = os.homedir();
    const sdkPaths = process.platform === 'win32'
      ? [path.join(home, 'AppData', 'Local', 'Android', 'Sdk')]
      : [
          path.join(home, 'Library', 'Android', 'sdk'),
          path.join(home, 'Android', 'Sdk'),
          '/usr/local/share/android-sdk',
        ];

    for (const sdk of sdkPaths) {
      const btDir = path.join(sdk, 'build-tools');
      if (!fs.existsSync(btDir)) continue;
      try {
        const versions = fs.readdirSync(btDir).sort().reverse();
        for (const v of versions) {
          const aapt2 = path.join(btDir, v, process.platform === 'win32' ? 'aapt2.exe' : 'aapt2');
          if (fs.existsSync(aapt2)) { resolve(aapt2); return; }
          const aapt = path.join(btDir, v, process.platform === 'win32' ? 'aapt.exe' : 'aapt');
          if (fs.existsSync(aapt)) { resolve(aapt); return; }
        }
      } catch { /* ignore */ }
    }
    resolve(null);
  });
}

function extractPackageName(apkPath) {
  return new Promise(async (resolve) => {
    const aaptPath = await findAapt();
    if (!aaptPath) { resolve(null); return; }

    const isAapt2 = path.basename(aaptPath).startsWith('aapt2');
    const args = isAapt2
      ? ['dump', 'packagename', apkPath]
      : ['dump', 'badging', apkPath];

    execFile(aaptPath, args, { timeout: 10000 }, (err, stdout) => {
      if (err) { resolve(null); return; }
      if (isAapt2) {
        resolve(stdout.trim() || null);
      } else {
        const m = stdout.match(/package:\s*name='([^']+)'/);
        resolve(m ? m[1] : null);
      }
    });
  });
}

ipcMain.handle('get-package-name', async (_event, { apkPath }) => {
  const pkg = await extractPackageName(apkPath);
  return { packageName: pkg };
});

ipcMain.handle('uninstall-app', async (_event, { deviceId, packageName }) => {
  const adbPath = await findAdb();
  if (!adbPath) return { success: false, error: 'ADB não encontrado.' };

  try {
    const output = await new Promise((resolve, reject) => {
      execFile(adbPath, ['-s', deviceId, 'uninstall', packageName], { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) reject(new Error((stderr || '') + (stdout || '') + (err.message || '')));
        else resolve(stdout);
      });
    });
    if (output.includes('Success')) {
      return { success: true };
    }
    return { success: false, error: output.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-apk', async (_event, { deviceId, apkPath }) => {
  const adbPath = await findAdb();
  if (!adbPath) return { success: false, code: 'NO_ADB', title: 'ADB não encontrado', error: 'O ADB não está instalado.', tip: 'Volte ao passo 1 e instale o ADB.' };

  if (!apkPath) return { success: false, code: 'NO_APK_PATH', title: 'Caminho do APK inválido', error: 'O caminho do arquivo APK não foi definido (undefined).', tip: 'Selecione o APK novamente arrastando o arquivo ou clicando para escolher.' };

  if (!fs.existsSync(apkPath)) return { success: false, code: 'APK_NOT_FOUND', title: 'Arquivo APK não encontrado', error: `O arquivo não existe: ${apkPath}`, tip: 'O arquivo pode ter sido movido ou excluído. Selecione o APK novamente.' };

  try {
    const output = await new Promise((resolve, reject) => {
      execFile(adbPath, ['-s', deviceId, 'install', '-r', apkPath], { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) {
          // ADB may return non-zero but still have useful output
          const combined = (stderr || '') + (stdout || '') + (err.message || '');
          reject(new Error(combined));
        } else {
          resolve(stdout);
        }
      });
    });

    if (output.includes('Success')) {
      return { success: true };
    }

    const parsed = parseInstallError(output);
    if (parsed) return parsed;

    return { success: false, code: 'UNKNOWN', title: 'Erro desconhecido', error: output.trim(), tip: 'Tente desinstalar o app do celular e instalar novamente. Se o erro persistir, envie esta mensagem para o suporte.' };
  } catch (err) {
    const parsed = parseInstallError(err.message);
    if (parsed) return parsed;

    return { success: false, code: 'UNKNOWN', title: 'Erro na instalação', error: err.message, tip: 'Verifique se o celular está conectado e tente novamente.' };
  }
});

// ── APK History & Downloads ─────────────────────────────────
function getHistoryPath() {
  return path.join(app.getPath('userData'), 'apk-history.json');
}

function getDownloadsDir() {
  const dir = path.join(app.getPath('userData'), 'apks');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(getHistoryPath(), 'utf-8'));
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(entries, null, 2));
}

ipcMain.handle('get-apk-history', () => loadHistory());

ipcMain.handle('save-apk-to-history', (_event, entry) => {
  const history = loadHistory();
  const idx = history.findIndex(h => h.path === entry.path);
  if (idx >= 0) {
    history[idx] = { ...history[idx], ...entry };
  } else {
    history.unshift(entry);
  }
  saveHistory(history.slice(0, 50));
  return { success: true };
});

ipcMain.handle('remove-from-history', (_event, { filePath }) => {
  const history = loadHistory().filter(h => h.path !== filePath);
  saveHistory(history);
  return { success: true };
});

ipcMain.handle('delete-apk-file', (_event, { filePath }) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const history = loadHistory().filter(h => h.path !== filePath);
    saveHistory(history);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('download-apk', (_event, { url }) => {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return resolve({ success: false, error: 'URL deve começar com http:// ou https://' });
      }
    } catch {
      return resolve({ success: false, error: 'URL inválida.' });
    }

    const downloadsDir = getDownloadsDir();
    let fileName = 'download-' + Date.now() + '.apk';
    const baseName = path.basename(parsed.pathname);
    if (baseName && baseName.toLowerCase().endsWith('.apk')) {
      fileName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    const filePath = path.join(downloadsDir, fileName);

    function doRequest(reqUrl, redirects) {
      if (redirects > 5) {
        return resolve({ success: false, error: 'Muitos redirecionamentos.' });
      }
      const mod = reqUrl.startsWith('https') ? https : require('http');
      mod.get(reqUrl, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return resolve({ success: false, error: `Servidor retornou HTTP ${res.statusCode}` });
        }

        const total = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const file = fs.createWriteStream(filePath);

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total > 0 && mainWindow) {
            mainWindow.webContents.send('download-progress', {
              percent: Math.round((downloaded / total) * 100),
              downloaded,
              total,
            });
          }
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(filePath);
          resolve({
            success: true,
            apk: {
              path: filePath,
              name: fileName,
              size: (stats.size / (1024 * 1024)).toFixed(1) + ' MB',
              source: 'url',
              url,
              downloadedAt: new Date().toISOString(),
            },
          });
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => {});
          resolve({ success: false, error: err.message });
        });
      }).on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    }

    doRequest(url, 0);
  });
});
