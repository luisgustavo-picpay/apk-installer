# 📱 Instalador de APK no Android

Aplicativo desktop que facilita a instalação de aplicativos Android (`.apk`) diretamente pelo computador — **sem precisar de conhecimento técnico**. O app verifica dependências, instala o que for necessário automaticamente, guia na conexão do celular e faz a instalação do app.

---

## 🖥️ App Desktop

O jeito mais fácil de usar! Baixe o app para seu sistema e instale.

| Sistema | Download |
|:---:|:---:|
| 🍎 **macOS** (Intel + Apple Silicon) | [⬇️ Baixar DMG](../../releases/latest) |
| 🪟 **Windows** (64-bit) | [⬇️ Baixar EXE](../../releases/latest) |

<details>
<summary>🍎 <strong>Instruções para macOS</strong></summary>

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


</details>

<details>
<summary>🪟 <strong>Instruções para Windows</strong></summary>

> 💡 Baixe o arquivo `.exe` e execute. O instalador é automático — instala e abre o app.
>
> ⚠️ **SmartScreen do Windows:** como o app não tem assinatura digital, o Windows pode mostrar "O Windows protegeu seu computador". Para continuar:
> 1. Clique em **"Mais informações"**
> 2. Clique em **"Executar assim mesmo"**
>
> Isso acontece apenas na primeira execução. Depois disso o app abre normalmente.

</details>

---

##  Preciso preparar meu celular?

Sim! Antes de usar o app, você precisa ativar o **Modo Desenvolvedor** e a **Depuração USB** no celular. Calma, é simples:

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
5. Execute o app normalmente — ele detecta o emulador automaticamente

---

## ❓ Problemas comuns

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
├── 📄 README.md
├── 📁 .github/workflows/     ← CI para gerar DMG e EXE
└── 📁 desktop-app/           ← app Electron
    ├── 📁 src/
    │   ├── 🎨 styles.css
    │   ├── 📄 index.html
    │   ├── ⚡ renderer.js
    │   ├── 🔧 main.js
    │   └── 🔗 preload.js
    ├── 📁 assets/
    │   └── 🖼️ icon.png
    ├── 📁 scripts/
    │   └── 🔧 afterPack.js
    └── 📄 package.json
```

---

## 🆘 Precisa de ajuda?

Se tiver qualquer dúvida, não hesite em chamar! 🤙
