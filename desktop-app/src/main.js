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
  ];

  for (const e of errors) {
    if (output.includes(e.match)) {
      return { success: false, code: e.code, title: e.title, error: e.message, tip: e.tip };
    }
  }

  return null;
}

ipcMain.handle('install-apk', async (_event, { deviceId, apkPath }) => {
  const adbPath = await findAdb();
  if (!adbPath) return { success: false, code: 'NO_ADB', title: 'ADB não encontrado', error: 'O ADB não está instalado.', tip: 'Volte ao passo 1 e instale o ADB.' };

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
