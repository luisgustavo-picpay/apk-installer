# 📱 Instalador de APK no Android

<p align="center">
  <img src="https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS">
  <img src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android">
</p>

Script interativo que facilita a instalação de aplicativos Android (`.apk`) diretamente pelo computador — **sem precisar de conhecimento técnico**. O script verifica dependências, instala o que for necessário automaticamente, guia na conexão do celular e faz a instalação do app.

---

## �️ App Desktop (Recomendado)

O jeito mais fácil de usar! Baixe o app, arraste para Applications e pronto.

| Sistema | Download |
|:---:|:---:|
| 🍎 **macOS** (Intel + Apple Silicon) | [⬇️ Baixar DMG](../../releases/latest) |

> 💡 O download pode vir como `.dmg` ou `.zip`. Se vier como `.zip`, clique duas vezes — ele extrai o `.dmg` automaticamente. Depois abra o `.dmg` e arraste o **APK Installer** para a pasta **Applications**.
>
> ⚠️ **Primeira abertura no macOS:** como o app não é assinado com certificado Apple, o macOS pode bloquear a abertura. Use uma das opções abaixo:
>
> **Opção 1 — Privacidade e Segurança (tente primeiro):**
> 1. Tente abrir o app normalmente (vai aparecer um aviso)
> 2. Clique em **OK**
> 3. Vá em **Ajustes do Sistema** → **Privacidade e Segurança**
> 4. Role até o final — vai aparecer uma mensagem sobre o "APK Installer"
> 5. Clique em **"Abrir Mesmo Assim"**
>
> **Opção 2 — Terminal (se a opção 1 não funcionar):**
> 1. Arraste o **APK Installer** para a pasta **Applications** (se ainda não fez)
> 2. Abra o **Terminal** (Command ⌘ + Espaço → digite "Terminal")
> 3. Cole o comando abaixo e aperte Enter:
> ```
> xattr -cr "/Applications/APK Installer.app"
> ```
> 4. Abra o app normalmente — agora vai funcionar! ✅

---

## 📥 Download (Scripts)

Clique no botão do seu sistema operacional para baixar o ZIP (inclui o script + guia de instalação):

| Sistema Operacional | Download | Guia Online |
|:---:|:---:|:---:|
| 🍎 **macOS** | [⬇️ Baixar ZIP para Mac](../../raw/main/downloads/apk-installer-mac.zip) | [📖 Ver guia](mac/GUIA.md) |
| 🪟 **Windows** | [⬇️ Baixar ZIP para Windows](../../raw/main/downloads/apk-installer-windows.zip) | [📖 Ver guia](windows/GUIA.md) |

> 💡 **Não sabe qual escolher?** Se você usa um MacBook ou iMac, escolha **macOS**. Se usa um notebook Dell, Lenovo, HP ou PC, escolha **Windows**.
>
> 📦 Cada ZIP contém o **script** + o **guia de instalação em PDF**. Basta extrair e seguir o guia!

---

## 🚀 Como usar — Resumo rápido

### 🍎 No Mac

1. **Baixe** o arquivo `install-apk.sh` (link acima)
2. Abra o **Terminal** (pressione `Command ⌘ + Espaço`, digite "Terminal" e aperte Enter)
3. Navegue até a pasta onde salvou o arquivo:
   ```
   cd ~/Downloads
   ```
4. Dê permissão ao script (só na primeira vez):
   ```
   chmod +x install-apk.sh
   ```
5. Execute:
   ```
   ./install-apk.sh
   ```
6. **Siga as instruções na tela** — o script faz o resto! 🎉

---

### 🪟 No Windows

1. **Baixe** o arquivo `install-apk.bat` (link acima)
2. Encontre o arquivo na pasta de Downloads
3. **Clique duas vezes** no `install-apk.bat`
4. Se aparecer aviso do Windows, clique em **"Mais informações"** → **"Executar assim mesmo"**
5. **Siga as instruções na tela** — o script faz o resto! 🎉

---

## ✨ O que o script faz automaticamente

| Etapa | O que acontece |
|:---:|---|
| 1️⃣ | **Verifica o ADB** — Se não estiver instalado, baixa e instala sozinho |
| 2️⃣ | **Pede o APK** — Basta arrastar o arquivo `.apk` para a janela |
| 3️⃣ | **Encontra o celular** — Lista dispositivos conectados e guia na conexão |
| 4️⃣ | **Instala o app** — Envia e instala o APK no celular automaticamente |

---

## 📱 Preciso preparar meu celular?

Sim! Antes de usar o script, você precisa ativar o **Modo Desenvolvedor** e a **Depuração USB** no celular. Calma, é simples:

### Passo 1 — Ativar o Modo Desenvolvedor

1. No celular, vá em **Configurações** → **Sobre o telefone**
2. Toque **7 vezes seguidas** em **"Número da versão"**
3. Vai aparecer: *"Você agora é um desenvolvedor!"* ✅

### Passo 2 — Ativar Depuração USB

4. Volte para **Configurações**
5. Procure **"Opções do desenvolvedor"** (pode estar dentro de "Sistema")
6. Ative **"Depuração USB"**

### Passo 3 — Conectar ao computador

7. Plugue o cabo USB no celular e no computador
8. No celular, toque em **"Permitir"** no aviso que aparece
9. Marque ✅ **"Sempre permitir deste computador"**

> ⚠️ **Dica importante:** Alguns cabos USB são só de carregamento e não transmitem dados. Se o celular não for reconhecido, **tente outro cabo**.

---

## 💻 Não tenho celular Android. E agora?

Sem problema! Você pode usar um **emulador** (celular virtual no computador):

1. Instale o [Android Studio](https://developer.android.com/studio)
2. Abra e vá em **Device Manager** (ícone de celular)
3. Crie um dispositivo virtual (ex: Pixel 6)
4. Inicie o emulador
5. Execute o script normalmente — ele detecta o emulador automaticamente

---

## ❓ Problemas comuns

<details>
<summary><strong>🍎 Mac: "Permission denied" ao executar</strong></summary>

Execute no Terminal:
```
chmod +x install-apk.sh
```
</details>

<details>
<summary><strong>🍎 Mac: "command not found: adb"</strong></summary>

Execute o script normalmente — ele instala o ADB automaticamente.
Se já executou e o erro persiste, feche o Terminal e abra novamente.
</details>

<details>
<summary><strong>🪟 Windows: "O Windows protegeu seu PC"</strong></summary>

Clique em **"Mais informações"** → **"Executar assim mesmo"**.
Isso é normal para scripts baixados da internet.
</details>

<details>
<summary><strong>🪟 Windows: "adb não é reconhecido"</strong></summary>

Execute o script novamente — ele oferece baixar e instalar o ADB automaticamente.
</details>

<details>
<summary><strong>📱 Celular não aparece / não é reconhecido</strong></summary>

Verifique:
- **Depuração USB** está ativada? (ver seção acima)
- Aceitou a **autorização** que aparece na tela do celular?
- O **cabo USB** transmite dados? (tente outro cabo)
- **No Windows:** pode ser necessário instalar o [driver USB do fabricante](https://developer.android.com/studio/run/oem-usb)
</details>

<details>
<summary><strong>📱 "INSTALL_FAILED_VERSION_DOWNGRADE"</strong></summary>

Já existe uma versão mais nova do app no celular. Desinstale o app atual antes de instalar.
</details>

<details>
<summary><strong>📱 "INSTALL_FAILED_INSUFFICIENT_STORAGE"</strong></summary>

O celular está sem espaço. Libere espaço apagando fotos, vídeos ou apps que não usa.
</details>

---

## 🪟 Drivers USB no Windows

No Windows, alguns celulares precisam de driver extra para serem reconhecidos:

| Marca | Driver |
|---|---|
| Samsung | [Samsung USB Driver](https://developer.samsung.com/android-usb-driver) |
| Google / Pixel | Já vem incluído |
| Xiaomi | [Google USB Driver](https://developer.android.com/studio/run/win-usb) |
| Motorola | [Motorola USB Driver](https://motorola-global-portal.custhelp.com) |
| Outras marcas | Busque: "driver USB + [marca do celular]" |

---

## 📂 Estrutura do repositório

```
📁 apk-installer/
├── 📄 README.md              ← você está aqui
├── 📁 .github/workflows/    ← CI para gerar o DMG automaticamente
├── 📁 desktop-app/          ← app Electron (versão recomendada)
│   ├── 📁 src/
│   │   ├── 🎨 styles.css
│   │   ├── 📄 index.html
│   │   ├── ⚡ renderer.js
│   │   ├── 🔧 main.js
│   │   └── 🔗 preload.js
│   ├── 📁 assets/
│   │   └── 🖼️ icon.icns
│   └── 📄 package.json
├── 📁 mac/
│   ├── 🔧 install-apk.sh     ← script para macOS
│   └── 📖 GUIA.md
└── 📁 windows/
    ├── 🔧 install-apk.bat    ← script para Windows
    └── 📖 GUIA.md
```

---

## 🆘 Precisa de ajuda?

Se tiver qualquer dúvida, não hesite em chamar! 🤙
