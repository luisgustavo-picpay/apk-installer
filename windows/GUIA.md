# 📱 Como instalar um APK no Android usando o Windows

Este guia te ajuda a instalar um aplicativo Android (.apk) diretamente do seu PC Windows — sem precisar de nenhum conhecimento técnico. O script faz quase tudo sozinho!

---

## 📋 O que você vai precisar

- Um PC com Windows 10 ou 11
- O arquivo `.apk` do aplicativo (você deve ter recebido por e-mail, WhatsApp, download, etc.)
- Um celular Android **OU** um emulador (celular virtual no computador)
- Se for usar celular: um cabo USB

---

## 🚀 Passo a passo

### 1. Coloque os arquivos em uma pasta

Coloque a pasta com o `install-apk.bat` em algum lugar fácil, como a **Área de Trabalho** ou **Downloads**.

---

### 2. Execute o script

**Clique duas vezes** no arquivo `install-apk.bat`.

> 💡 Se o Windows perguntar "Deseja permitir que este app faça alterações?", clique em **Sim**.
>
> 💡 Se aparecer "O Windows protegeu seu PC", clique em **"Mais informações"** e depois **"Executar assim mesmo"**.

---

### 3. Siga as instruções na tela

A partir daqui o script faz tudo! Ele vai:

1. ✅ **Verificar se o ADB está instalado** — se não estiver, oferece baixar e instalar sozinho
2. 📦 **Pedir o arquivo APK** — é só arrastar o `.apk` para a janela
3. 📱 **Procurar seu celular** — e te ajudar a conectar se necessário
4. 🚀 **Instalar o app** — automaticamente!

---

## 📱 Usando com celular físico (via cabo USB)

Se você escolher conectar um celular de verdade, o script mostra um passo-a-passo na tela. Aqui vai um resumo:

### Ativar o "Modo Desenvolvedor" no celular:

1. Vá em **Configurações** > **Sobre o telefone**
2. Toque **7 vezes seguidas** em **"Número da versão"**
3. Vai aparecer a mensagem: *"Você agora é um desenvolvedor!"*

### Ativar "Depuração USB":

4. Volte para **Configurações**
5. Procure **"Opções do desenvolvedor"** (pode estar dentro de "Sistema")
6. Ative **"Depuração USB"**

### Conectar:

7. Plugue o cabo USB no celular e no PC
8. No celular, toque em **"Permitir"** quando aparecer o aviso de depuração
9. Marque **"Sempre permitir deste computador"** para não pedir de novo

### ⚠️ Drivers USB (importante no Windows!)

No Windows, alguns celulares precisam de um driver extra para serem reconhecidos:

| Marca | Onde baixar o driver |
|-------|---------------------|
| **Samsung** | https://developer.samsung.com/android-usb-driver |
| **Google / Pixel** | Já vem incluído automaticamente |
| **Xiaomi** | https://developer.android.com/studio/run/win-usb |
| **Motorola** | https://motorola-global-portal.custhelp.com |
| **LG** | https://www.lg.com/br/suporte/produto |
| **Outros** | Busque no Google: "driver USB [marca do celular]" |

> 💡 **Dica:** Depois de instalar o driver, desconecte e reconecte o cabo USB.

> ⚠️ **O cabo importa!** Alguns cabos são só de carregamento. Se o celular não for reconhecido, tente outro cabo.

---

## 💻 Usando com emulador (sem celular)

Se você não tem um celular Android, pode usar um "celular virtual" no computador:

1. Instale o **Android Studio**: https://developer.android.com/studio
2. Abra o Android Studio
3. Clique em **Device Manager** (ícone de celular na barra lateral)
4. Clique em **"Create Device"**
5. Escolha um modelo (ex: **Pixel 6**) e clique Next
6. Baixe uma imagem do sistema (clique no botão Download) e clique Finish
7. Clique no ▶️ para iniciar o emulador
8. Com o emulador aberto, execute o script

---

## ❓ Problemas comuns

| Problema | Solução |
|----------|---------|
| "O Windows protegeu seu PC" | Clique em "Mais informações" > "Executar assim mesmo" |
| "adb não é reconhecido" | Execute o script novamente — ele instala automaticamente |
| Celular não aparece | Instale o driver USB do fabricante / troque o cabo / ative Depuração USB |
| "INSTALL_FAILED_VERSION_DOWNGRADE" | Desinstale o app antigo do celular antes de instalar |
| Script fecha sozinho | Clique com botão direito no .bat > "Executar como administrador" |
| Emulador não inicia | Verifique se tem espaço em disco e se o Android Studio está instalado |
| Download do ADB falha | Verifique sua conexão com a internet ou tente opção de instalação manual |

---

## 🆘 Ainda com dúvida?

Me chama! 🤙