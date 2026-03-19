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
    ];
  }
  // Windows
  return [
    path.join(process.env.LOCALAPPDATA || '', 'Android/Sdk/platform-tools'),
    path.join(home, 'AppData/Local/Android/Sdk/platform-tools'),
    'C:\\Android\\platform-tools',
    'C:\\android-sdk\\platform-tools',
  ];
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
    return new Promise((resolve) => {
      const child = spawn('brew', ['install', '--cask', 'android-platform-tools'], {
        shell: true,
      });
      let output = '';
      child.stdout.on('data', (d) => (output += d.toString()));
      child.stderr.on('data', (d) => (output += d.toString()));
      child.on('close', async (code) => {
        const adbPath = await findAdb();
        resolve({
          success: !!adbPath,
          message: adbPath ? 'ADB instalado com sucesso!' : 'Falha na instalação. Tente manualmente.',
          output,
        });
      });
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
      https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          https.get(res.headers.location, (res2) => {
            res2.pipe(file);
            file.on('finish', () => {
              file.close();
              extractAndFinish();
            });
          });
        } else {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            extractAndFinish();
          });
        }
      }).on('error', () => resolve({ success: false, message: 'Falha no download.' }));

      function extractAndFinish() {
        exec(
          `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force"`,
          async () => {
            // Copy files
            exec(`xcopy /E /Y /Q "${path.join(tmpDir, 'platform-tools', '*')}" "${installDir}\\"`, async () => {
              process.env.PATH = `${installDir};${process.env.PATH}`;
              const adbPath = await findAdb();
              resolve({
                success: !!adbPath,
                message: adbPath ? 'ADB instalado com sucesso!' : 'Falha na instalação.',
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
  if (!adbPath) return [];

  try {
    await runAdb(adbPath, ['start-server']);
  } catch {
    // ignore
  }

  // Small delay for device detection
  await new Promise((r) => setTimeout(r, 1500));

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

      let model = 'Dispositivo';
      let brand = '';
      try {
        model = (await runAdb(adbPath, ['-s', id, 'shell', 'getprop', 'ro.product.model'])).trim();
        brand = (await runAdb(adbPath, ['-s', id, 'shell', 'getprop', 'ro.product.brand'])).trim();
      } catch {
        // ignore
      }

      devices.push({ id, status, model, brand, label: brand ? `${brand} ${model}` : model });
    }
    return devices;
  } catch {
    return [];
  }
});

ipcMain.handle('install-apk', async (_event, { deviceId, apkPath }) => {
  const adbPath = await findAdb();
  if (!adbPath) return { success: false, error: 'ADB não encontrado.' };

  try {
    const output = await new Promise((resolve, reject) => {
      execFile(adbPath, ['-s', deviceId, 'install', '-r', apkPath], { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || stdout || err.message));
        else resolve(stdout);
      });
    });

    if (output.includes('Success')) {
      return { success: true };
    }

    // Parse common errors
    if (output.includes('INSTALL_FAILED_VERSION_DOWNGRADE'))
      return { success: false, error: 'Já existe uma versão mais nova instalada. Desinstale primeiro.' };
    if (output.includes('INSTALL_FAILED_INSUFFICIENT_STORAGE'))
      return { success: false, error: 'Celular sem espaço. Libere espaço e tente novamente.' };
    if (output.includes('INSTALL_FAILED_ALREADY_EXISTS'))
      return { success: false, error: 'App já instalado. Desinstale a versão anterior.' };
    if (output.includes('INSTALL_PARSE_FAILED_NO_CERTIFICATES'))
      return { success: false, error: 'APK não está assinado corretamente.' };

    return { success: false, error: output.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
