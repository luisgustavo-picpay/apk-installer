@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================
::  install-apk.bat — Instalador interativo de APK via ADB
::  Para Windows — Versão amigável para não-técnicos
:: ============================================================

title 📱 Instalador de APK no Android

cls
echo.
echo    ╔══════════════════════════════════════╗
echo    ║   📱 Instalador de APK no Android   ║
echo    ║      Versão Windows                  ║
echo    ╚══════════════════════════════════════╝
echo.

:: ══════════════════════════════════════════════════════════════
:: PASSO 1 — Verificar se o ADB esta instalado
:: ══════════════════════════════════════════════════════════════
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Passo 1 de 4 — Verificando instalação
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Tenta encontrar ADB no PATH
where adb >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :adb_found

:: Tenta caminhos comuns do Android SDK no Windows
set "ADB_SEARCH_PATHS=%LOCALAPPDATA%\Android\Sdk\platform-tools;%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools;C:\Android\platform-tools;C:\android-sdk\platform-tools;%ProgramFiles%\Android\platform-tools;%ProgramFiles(x86)%\Android\platform-tools"

for %%P in ("%LOCALAPPDATA%\Android\Sdk\platform-tools" "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools" "C:\Android\platform-tools" "C:\android-sdk\platform-tools") do (
    if exist "%%~P\adb.exe" (
        set "PATH=%%~P;!PATH!"
        echo   [OK] ADB encontrado em: %%~P
        goto :adb_found
    )
)

:: ADB nao encontrado
echo   [!] O ADB nao esta instalado ainda.
echo   O ADB e a ferramenta que permite instalar apps no Android pelo computador.
echo.
echo   Vou tentar instalar automaticamente para voce.
echo.
echo   Escolha como deseja instalar:
echo.
echo   [1] Download automatico (recomendado - nao precisa instalar nada antes)
echo   [2] Via Chocolatey (se voce ja tem o Chocolatey instalado)
echo   [3] Via Scoop (se voce ja tem o Scoop instalado)
echo   [4] Nao quero instalar agora (vou fazer manualmente)
echo.
set /p "INSTALL_METHOD=   Digite o numero da opcao: "

if "!INSTALL_METHOD!"=="1" goto :install_download
if "!INSTALL_METHOD!"=="2" goto :install_choco
if "!INSTALL_METHOD!"=="3" goto :install_scoop
if "!INSTALL_METHOD!"=="4" goto :install_manual
goto :install_manual

:install_download
echo.
echo   [i] Baixando Android Platform-Tools...
echo       Isso pode levar alguns minutos dependendo da internet.
echo.

:: Cria pasta temporaria
set "DOWNLOAD_DIR=%TEMP%\adb-install"
set "INSTALL_DIR=%LOCALAPPDATA%\Android\platform-tools"
mkdir "%DOWNLOAD_DIR%" 2>nul
mkdir "%INSTALL_DIR%" 2>nul

:: Baixa o platform-tools
powershell -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile '%DOWNLOAD_DIR%\platform-tools.zip' -UseBasicParsing } catch { exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Nao consegui baixar. Verifique sua conexao com a internet.
    echo         Tente a opcao de instalacao manual.
    goto :install_manual
)

echo   [i] Extraindo arquivos...
powershell -Command "try { Expand-Archive -Path '%DOWNLOAD_DIR%\platform-tools.zip' -DestinationPath '%DOWNLOAD_DIR%' -Force } catch { exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Nao consegui extrair os arquivos.
    goto :install_manual
)

:: Copia para local definitivo
xcopy /E /Y /Q "%DOWNLOAD_DIR%\platform-tools\*" "%INSTALL_DIR%\" >nul 2>&1

:: Adiciona ao PATH da sessao atual
set "PATH=%INSTALL_DIR%;!PATH!"

:: Adiciona ao PATH do usuario permanentemente
powershell -Command "$oldPath = [Environment]::GetEnvironmentVariable('PATH', 'User'); if ($oldPath -notlike '*platform-tools*') { [Environment]::SetEnvironmentVariable('PATH', '%INSTALL_DIR%;' + $oldPath, 'User') }"

:: Limpa temp
rmdir /S /Q "%DOWNLOAD_DIR%" 2>nul

where adb >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [OK] ADB instalado com sucesso!
    echo       Caminho: %INSTALL_DIR%
    echo       O PATH do sistema foi atualizado automaticamente.
    goto :adb_found
) else (
    echo   [ERRO] Algo deu errado. Tente a instalacao manual.
    goto :install_manual
)

:install_choco
echo.
where choco >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Chocolatey nao encontrado.
    echo         Instale primeiro: https://chocolatey.org/install
    echo         Ou escolha outra opcao de instalacao.
    echo.
    pause
    goto :install_manual
)
echo   [i] Instalando ADB via Chocolatey...
choco install adb -y
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Instalacao falhou. Tente fechar e abrir o terminal.
    goto :install_manual
)
echo   [OK] ADB instalado com sucesso!
goto :adb_found

:install_scoop
echo.
where scoop >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Scoop nao encontrado.
    echo         Instale primeiro: https://scoop.sh
    echo         Ou escolha outra opcao de instalacao.
    echo.
    pause
    goto :install_manual
)
echo   [i] Instalando ADB via Scoop...
scoop install adb
where adb >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   [ERRO] Instalacao falhou.
    goto :install_manual
)
echo   [OK] ADB instalado com sucesso!
goto :adb_found

:install_manual
echo.
echo   Para instalar manualmente:
echo.
echo     1. Abra o navegador e acesse:
echo        https://developer.android.com/tools/releases/platform-tools
echo.
echo     2. Clique em "Download SDK Platform-Tools for Windows"
echo.
echo     3. Extraia o ZIP em uma pasta facil de achar, por exemplo:
echo        C:\Android\platform-tools
echo.
echo     4. Depois execute este script novamente
echo.
goto :fim

:adb_found
for /f "tokens=*" %%v in ('adb --version 2^>^&1 ^| findstr /i "version"') do (
    echo   [OK] ADB pronto: %%v
)
echo.

:: ══════════════════════════════════════════════════════════════
:: PASSO 2 — Solicitar o caminho do APK
:: ══════════════════════════════════════════════════════════════
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Passo 2 de 4 — Selecionar o aplicativo
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   Arraste o arquivo .apk para esta janela e pressione Enter.
echo.
echo   💡 O arquivo APK e o instalador do aplicativo Android.
echo   💡 Se recebeu por e-mail ou download, encontre no Explorador
echo      de Arquivos e arraste para ca.
echo.

:ask_apk
set /p "APK_PATH=   📦 APK: "

:: Remove aspas
set "APK_PATH=!APK_PATH:"=!"

if "!APK_PATH!"=="" (
    echo   [!] Voce nao digitou nada. Tente novamente.
    goto :ask_apk
)

if not exist "!APK_PATH!" (
    echo   [ERRO] Arquivo nao encontrado. Verifique se arrastou corretamente.
    echo   💡 Tente arrastar o arquivo novamente.
    echo.
    goto :ask_apk
)

:: Verifica extensao
set "APK_EXT=!APK_PATH:~-4!"
if /i "!APK_EXT!" NEQ ".apk" (
    echo   [ERRO] Esse arquivo nao e um APK ^(precisa terminar em .apk^).
    echo   💡 Verifique se selecionou o arquivo correto.
    echo.
    goto :ask_apk
)

for %%F in ("!APK_PATH!") do set "APK_NAME=%%~nxF"
echo   [OK] Aplicativo selecionado: !APK_NAME!
echo.

:: ══════════════════════════════════════════════════════════════
:: PASSO 3 — Listar dispositivos conectados
:: ══════════════════════════════════════════════════════════════
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Passo 3 de 4 — Conectar ao dispositivo Android
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   [i] Procurando dispositivos Android conectados...
adb start-server >nul 2>&1
timeout /t 2 /nobreak >nul

:: Conta dispositivos
set "DEVICE_COUNT=0"
for /f "skip=1 tokens=1,2" %%a in ('adb devices 2^>nul') do (
    if "%%b" NEQ "" (
        set /a DEVICE_COUNT+=1
    )
)

if !DEVICE_COUNT! GTR 0 goto :devices_found

echo   [!] Nenhum dispositivo Android encontrado.
echo.
echo   Como deseja prosseguir?
echo.
echo   [1] 📱 Tenho um celular Android — conectar via cabo USB
echo       ^(mais facil e recomendado^)
echo.
echo   [2] 📡 Tenho um celular Android — conectar via Wi-Fi
echo       ^(precisa de Android 11 ou superior^)
echo.
echo   [3] 💻 Nao tenho celular — usar um emulador ^(celular virtual^)
echo       ^(precisa do Android Studio instalado^)
echo.

set /p "OPCAO=   Digite o numero da opcao (ou 'q' para sair): "

if /i "!OPCAO!"=="q" goto :fim

if "!OPCAO!"=="1" (
    echo.
    echo   📱 Conectando via cabo USB — siga estes passos:
    echo.
    echo   No seu celular Android:
    echo.
    echo     1️⃣  Va em Configuracoes ^> Sobre o telefone
    echo     2️⃣  Toque 7 vezes seguidas em "Numero da versao"
    echo        ^(vai aparecer uma mensagem dizendo que o modo desenvolvedor foi ativado^)
    echo     3️⃣  Volte para Configuracoes
    echo     4️⃣  Procure "Opcoes do desenvolvedor" ^(pode estar dentro de "Sistema"^)
    echo     5️⃣  Ative a opcao "Depuracao USB"
    echo     6️⃣  Conecte o cabo USB no celular e no computador
    echo     7️⃣  No celular, vai aparecer um aviso perguntando se permite depuracao
    echo        Marque "Sempre permitir" e toque em "OK"
    echo.
    echo   ⚠️  IMPORTANTE no Windows: se o celular nao for reconhecido,
    echo      pode ser necessario instalar o driver USB do fabricante:
    echo      - Samsung: https://developer.samsung.com/android-usb-driver
    echo      - Google/Pixel: ja incluso automaticamente
    echo      - Outros: busque "driver USB [marca do celular]" no Google
    echo.
    pause
    goto :recheck_devices
)

if "!OPCAO!"=="2" (
    echo.
    echo   📡 Conectando via Wi-Fi — siga estes passos:
    echo.
    echo   No seu celular Android ^(precisa ser Android 11 ou superior^):
    echo.
    echo     1️⃣  Va em Configuracoes ^> Opcoes do desenvolvedor
    echo        ^(se nao aparecer, va em Sobre o telefone e toque 7x em "Numero da versao"^)
    echo     2️⃣  Ative "Depuracao sem fio"
    echo     3️⃣  Toque em "Depuracao sem fio" para abrir os detalhes
    echo     4️⃣  Toque em "Parear com codigo de pareamento"
    echo     5️⃣  Vai aparecer um IP, porta e codigo no celular
    echo.

    set /p "PAIR_ADDR=   Digite o IP:Porta de pareamento que aparece no celular: "
    if "!PAIR_ADDR!" NEQ "" (
        adb pair !PAIR_ADDR!
    )

    echo.
    echo   Agora olhe na tela de "Depuracao sem fio" o IP e porta de conexao
    echo   ^(e diferente do de pareamento^)
    echo.

    set /p "CONN_ADDR=   Digite o IP:Porta de conexao: "
    if "!CONN_ADDR!" NEQ "" (
        adb connect !CONN_ADDR!
    )
    timeout /t 2 /nobreak >nul
    goto :recheck_devices
)

if "!OPCAO!"=="3" (
    echo.

    where emulator >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        :: Tenta caminhos comuns
        for %%P in ("%LOCALAPPDATA%\Android\Sdk\emulator" "%USERPROFILE%\AppData\Local\Android\Sdk\emulator") do (
            if exist "%%~P\emulator.exe" (
                set "PATH=%%~P;!PATH!"
                goto :emulator_found
            )
        )
        echo   [ERRO] O emulador Android nao foi encontrado.
        echo.
        echo   Para usar um emulador voce precisa do Android Studio:
        echo.
        echo     1️⃣  Baixe em: https://developer.android.com/studio
        echo     2️⃣  Instale normalmente
        echo     3️⃣  Abra o Android Studio
        echo     4️⃣  Va em Device Manager ^(icone de celular na lateral^)
        echo     5️⃣  Crie e inicie um dispositivo virtual
        echo     6️⃣  Com o emulador aberto, execute este script novamente
        echo.
        goto :fim
    )

    :emulator_found
    echo   [i] Emuladores disponiveis:
    echo.
    set "AVD_COUNT=0"
    for /f "tokens=*" %%a in ('emulator -list-avds 2^>nul') do (
        set /a AVD_COUNT+=1
        set "AVD_!AVD_COUNT!=%%a"
        echo   [!AVD_COUNT!] %%a
    )

    if !AVD_COUNT! EQU 0 (
        echo   [!] Nenhum emulador encontrado.
        echo.
        echo   Voce precisa criar um emulador no Android Studio:
        echo.
        echo     1️⃣  Abra o Android Studio
        echo     2️⃣  Va em Device Manager
        echo     3️⃣  Clique em "Create Device"
        echo     4️⃣  Escolha um modelo ^(ex: Pixel 6^)
        echo     5️⃣  Baixe uma imagem do sistema e clique Finish
        echo     6️⃣  Inicie o emulador e execute este script novamente
        echo.
        goto :fim
    )

    echo.
    set /p "AVD_CHOICE=   Digite o numero do emulador: "
    set "SELECTED_AVD=!AVD_%AVD_CHOICE%!"

    if "!SELECTED_AVD!"=="" (
        echo   [ERRO] Opcao invalida.
        goto :fim
    )

    echo   [i] Iniciando emulador: !SELECTED_AVD! ...
    echo   💡 Pode demorar um pouco — e normal.
    start "" emulator -avd !SELECTED_AVD!
    echo   [i] Aguardando emulador ficar pronto...
    adb wait-for-device
    timeout /t 8 /nobreak >nul
    goto :recheck_devices
)

echo   [ERRO] Opcao invalida. Execute o script novamente.
goto :fim

:recheck_devices
timeout /t 2 /nobreak >nul
set "DEVICE_COUNT=0"
for /f "skip=1 tokens=1,2" %%a in ('adb devices 2^>nul') do (
    if "%%b" NEQ "" (
        set /a DEVICE_COUNT+=1
    )
)

if !DEVICE_COUNT! EQU 0 (
    echo.
    echo   [ERRO] Ainda nao encontrei nenhum dispositivo.
    echo.
    echo   Possiveis causas:
    echo     - O cabo USB pode ser so de carregamento ^(precisa ser de dados^)
    echo     - A depuracao USB nao esta ativada no celular
    echo     - O celular pediu autorizacao e voce nao aceitou
    echo     - Falta instalar o driver USB do fabricante
    echo     - No emulador: ele ainda esta iniciando — espere e tente novamente
    echo.
    echo   Tente resolver o problema e execute o script novamente.
    goto :fim
)

:devices_found

:: ══════════════════════════════════════════════════════════════
:: PASSO 4 — Selecionar dispositivo e instalar
:: ══════════════════════════════════════════════════════════════
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   Passo 4 de 4 — Instalando o aplicativo
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set "DEV_INDEX=0"
for /f "skip=1 tokens=1,2" %%a in ('adb devices 2^>nul') do (
    if "%%b" NEQ "" (
        set /a DEV_INDEX+=1
        set "DEV_ID_!DEV_INDEX!=%%a"
        set "DEV_STATUS_!DEV_INDEX!=%%b"

        :: Pega modelo e marca
        for /f "tokens=*" %%m in ('adb -s %%a shell getprop ro.product.model 2^>nul') do (
            set "DEV_MODEL_!DEV_INDEX!=%%m"
        )
        for /f "tokens=*" %%b in ('adb -s %%a shell getprop ro.product.brand 2^>nul') do (
            set "DEV_BRAND_!DEV_INDEX!=%%b"
        )

        echo   [!DEV_INDEX!] 📱 !DEV_BRAND_%DEV_INDEX%! !DEV_MODEL_%DEV_INDEX%!   ^(%%a^)
    )
)
echo.

if !DEV_INDEX! EQU 1 (
    set "SELECTED_DEVICE=!DEV_ID_1!"
    set "SELECTED_LABEL=!DEV_BRAND_1! !DEV_MODEL_1!"
    echo   [OK] Dispositivo encontrado: !SELECTED_LABEL!
    goto :do_install
)

set /p "DEV_CHOICE=   Em qual dispositivo deseja instalar? Digite o numero: "
set "SELECTED_DEVICE=!DEV_ID_%DEV_CHOICE%!"
set "SELECTED_LABEL=!DEV_BRAND_%DEV_CHOICE%! !DEV_MODEL_%DEV_CHOICE%!"

if "!SELECTED_DEVICE!"=="" (
    echo   [ERRO] Opcao invalida.
    goto :fim
)

echo   [OK] Dispositivo selecionado: !SELECTED_LABEL!

:do_install
echo.
echo   [i] Instalando !APK_NAME!...
echo   💡 Isso pode levar alguns segundos. Aguarde...
echo.

adb -s !SELECTED_DEVICE! install -r "!APK_PATH!" > "%TEMP%\apk_install_result.txt" 2>&1
set "INSTALL_RESULT=%ERRORLEVEL%"
type "%TEMP%\apk_install_result.txt" | findstr /i "Success" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo   ══════════════════════════════════════════
    echo     ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
    echo   ══════════════════════════════════════════
    echo.
    echo   📦 Aplicativo: !APK_NAME!
    echo   📱 Dispositivo: !SELECTED_LABEL!
    echo.
    echo   Pronto! O app ja deve aparecer na gaveta de apps do seu Android.
    echo   💡 Se nao aparecer, tente reiniciar o celular.
) else (
    echo.
    echo   [ERRO] Nao foi possivel instalar o aplicativo.
    echo.

    type "%TEMP%\apk_install_result.txt" | findstr /i "ALREADY_EXISTS" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   O app ja esta instalado. Desinstale a versao anterior primeiro.
        goto :error_done
    )
    type "%TEMP%\apk_install_result.txt" | findstr /i "INSUFFICIENT_STORAGE" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   O celular esta sem espaco. Libere espaco e tente novamente.
        goto :error_done
    )
    type "%TEMP%\apk_install_result.txt" | findstr /i "NO_CERTIFICATES" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   O arquivo APK nao esta assinado corretamente. Verifique o arquivo.
        goto :error_done
    )
    type "%TEMP%\apk_install_result.txt" | findstr /i "VERSION_DOWNGRADE" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo   Ja existe uma versao mais nova do app instalada.
        echo   Desinstale a versao atual antes de instalar esta.
        goto :error_done
    )

    echo   Detalhes do erro:
    type "%TEMP%\apk_install_result.txt"
    :error_done
)

del "%TEMP%\apk_install_result.txt" 2>nul

:fim
echo.
pause
endlocal