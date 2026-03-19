# 📱 Como instalar um APK no Android usando o Mac

Este guia te ajuda a instalar um aplicativo Android (.apk) diretamente do seu Mac — sem precisar de nenhum conhecimento técnico. O script faz quase tudo sozinho!

---

## 📋 O que você vai precisar

- Um Mac (qualquer modelo)
- O arquivo `.apk` do aplicativo (você deve ter recebido por e-mail, WhatsApp, download, etc.)
- Um celular Android **OU** um emulador (celular virtual no computador)
- Se for usar celular: um cabo USB

---

## 🚀 Passo a passo

### 1. Abra o Terminal

O Terminal é um programa que já vem no Mac. Para abrir:

1. Aperte **Command (⌘) + Barra de Espaço** (abre a busca do Mac)
2. Digite **Terminal**
3. Clique no ícone do **Terminal** que aparece

> 💡 **Dica:** O Terminal é aquela tela preta com texto. Não se preocupe, o script vai te guiar!

---

### 2. Navegue até a pasta do script

Quando você receber a pasta com os arquivos, coloque ela em algum lugar fácil de achar (ex: Mesa ou Downloads).

No Terminal, digite:

```
cd ~/Desktop/avd-install
```

> ⚠️ Troque `Desktop/avd-install` pelo caminho real da pasta no seu Mac.
>
> **Jeito fácil:** digite `cd ` (com espaço depois) e **arraste a pasta** para dentro do Terminal. O caminho aparece sozinho!

---

### 3. Dê permissão ao script (só na primeira vez)

```
chmod +x install-apk.sh
```

---

### 4. Execute o script

```
./install-apk.sh
```

A partir daqui o script faz tudo! Ele vai:

1. ✅ **Verificar se o ADB está instalado** — se não estiver, instala sozinho
2. 📦 **Pedir o arquivo APK** — é só arrastar o `.apk` para o Terminal
3. 📱 **Procurar seu celular** — e te ajudar a conectar se necessário
4. 🚀 **Instalar o app** — automaticamente!

---

## 📱 Usando com celular físico (via cabo USB)

Se você escolher conectar um celular de verdade, o script vai mostrar um passo-a-passo na tela. Mas aqui vai um resumo:

### Ativar o "Modo Desenvolvedor" no celular:

1. Vá em **Configurações** > **Sobre o telefone**
2. Toque **7 vezes seguidas** em **"Número da versão"**
3. Vai aparecer a mensagem: *"Você agora é um desenvolvedor!"*

### Ativar "Depuração USB":

4. Volte para **Configurações**
5. Procure **"Opções do desenvolvedor"** (pode estar dentro de "Sistema")
6. Ative **"Depuração USB"**

### Conectar:

7. Plugue o cabo USB no celular e no Mac
8. No celular, toque em **"Permitir"** quando aparecer o aviso de depuração
9. Marque **"Sempre permitir deste computador"** para não pedir de novo

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
| "Permission denied" ao executar | Execute: `chmod +x install-apk.sh` |
| "command not found: adb" | Execute o script novamente — ele instala automaticamente |
| Celular não aparece | Troque o cabo USB / ative Depuração USB / aceite a autorização no celular |
| "INSTALL_FAILED_VERSION_DOWNGRADE" | Desinstale o app antigo do celular antes de instalar |
| Celular pede driver | No Mac normalmente não precisa, mas tente outro cabo |
| Emulador não inicia | Verifique se tem espaço em disco e se o Android Studio está instalado |

---

## 🆘 Ainda com dúvida?

Me chama! 🤙