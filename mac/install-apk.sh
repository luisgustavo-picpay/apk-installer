#!/bin/zsh

# ============================================================
#  install-apk.sh — Instalador interativo de APK via ADB
#  Para macOS — Versão amigável para não-técnicos
# ============================================================

# ── Cores ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info()    { printf "${CYAN}ℹ  %s${NC}\n" "$1"; }
success() { printf "${GREEN}✔  %s${NC}\n" "$1"; }
warn()    { printf "${YELLOW}⚠  %s${NC}\n" "$1"; }
error()   { printf "${RED}✖  %s${NC}\n" "$1"; }
header()  { printf "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n  ${BOLD}%s${NC}\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n\n" "$1"; }
dica()    { printf "${DIM}  💡 %s${NC}\n" "$1"; }
separador() { echo ""; }

clear

cat << 'BANNER'

   ╔══════════════════════════════════════╗
   ║   📱 Instalador de APK no Android   ║
   ║      Versão macOS                    ║
   ╚══════════════════════════════════════╝

BANNER

# ── Tentar encontrar ADB em caminhos comuns ──────────────────
find_adb() {
    if command -v adb &>/dev/null; then
        return 0
    fi

    local common_paths=(
        "$HOME/Library/Android/sdk/platform-tools"
        "$HOME/Android/sdk/platform-tools"
        "/usr/local/share/android-sdk/platform-tools"
        "/opt/homebrew/share/android-commandlinetools/platform-tools"
        "/usr/local/share/android-commandlinetools/platform-tools"
    )

    for p in "${common_paths[@]}"; do
        if [[ -x "$p/adb" ]]; then
            export PATH="$p:$PATH"
            info "ADB encontrado em: $p"
            return 0
        fi
    done

    return 1
}

# ── Tentar encontrar emulator em caminhos comuns ─────────────
find_emulator() {
    if command -v emulator &>/dev/null; then
        return 0
    fi

    local common_paths=(
        "$HOME/Library/Android/sdk/emulator"
        "$HOME/Android/sdk/emulator"
        "/usr/local/share/android-sdk/emulator"
    )

    for p in "${common_paths[@]}"; do
        if [[ -x "$p/emulator" ]]; then
            export PATH="$p:$PATH"
            return 0
        fi
    done

    return 1
}

# ══════════════════════════════════════════════════════════════
# PASSO 1 — Verificar se o ADB está instalado
# ══════════════════════════════════════════════════════════════
header "Passo 1 de 4 — Verificando instalação"

if find_adb; then
    local_version=$(adb --version 2>/dev/null | head -1)
    success "Tudo certo! ADB já está instalado."
    dica "$local_version"
    separador
else
    warn "O ADB não está instalado ainda."
    info "O ADB é a ferramenta que permite instalar apps no Android pelo computador."
    separador

    echo "  Vou instalar tudo automaticamente para você."
    echo "  Isso pode demorar alguns minutos na primeira vez."
    separador

    # Verificar/Instalar Homebrew primeiro
    if ! command -v brew &>/dev/null; then
        info "Primeiro preciso instalar o Homebrew (gerenciador de pacotes do macOS)..."
        info "Pode ser que peça sua senha do Mac — é normal!"
        separador

        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Adicionar Homebrew ao PATH (Apple Silicon e Intel)
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi

        if ! command -v brew &>/dev/null; then
            error "Não consegui instalar o Homebrew automaticamente."
            echo ""
            echo "  Tente instalar manualmente:"
            echo "  1. Abra o Safari e acesse: https://brew.sh"
            echo "  2. Copie o comando que aparece no site"
            echo "  3. Cole no Terminal e pressione Enter"
            echo "  4. Depois, execute este script novamente"
            echo ""
            exit 1
        fi
        success "Homebrew instalado!"
    fi

    info "Instalando o ADB... (pode levar alguns minutos)"
    separador

    brew install --cask android-platform-tools 2>/dev/null || brew install android-platform-tools 2>/dev/null

    if ! find_adb; then
        error "Não consegui instalar o ADB automaticamente."
        echo ""
        echo "  Tente estes passos:"
        echo "  1. Feche o Terminal"
        echo "  2. Abra novamente"
        echo "  3. Execute este script outra vez"
        echo ""
        exit 1
    fi

    success "ADB instalado com sucesso!"
    separador
fi

# ══════════════════════════════════════════════════════════════
# PASSO 2 — Solicitar o APK
# ══════════════════════════════════════════════════════════════
header "Passo 2 de 4 — Selecionar o aplicativo (APK)"

echo "  ${BOLD}Arraste o arquivo .apk para esta janela${NC} e pressione Enter."
separador
dica "O arquivo APK é o instalador do aplicativo Android."
dica "Se você recebeu por e-mail ou download, encontre-o no Finder"
dica "e arraste ele para cá."
separador

while true; do
    printf "  ${CYAN}📦 APK: ${NC}"
    read -r apk_path

    # Remove aspas e espaços extras que o terminal adiciona ao arrastar
    apk_path="${apk_path//\'/}"
    apk_path="${apk_path//\"/}"
    apk_path="${apk_path## }"
    apk_path="${apk_path%% }"
    # Remove backslash de escape em espaços (quando arrasta do Finder)
    apk_path="${apk_path//\\ / }"

    if [[ -z "$apk_path" ]]; then
        warn "Você não digitou nada. Tente novamente."
        continue
    fi

    if [[ ! -f "$apk_path" ]]; then
        error "Arquivo não encontrado. Verifique se arrastou corretamente."
        dica "Tente arrastar o arquivo novamente."
        separador
        continue
    fi

    if [[ "${apk_path##*.}" != "apk" ]]; then
        error "Esse arquivo não é um APK (precisa terminar em .apk)."
        dica "Verifique se selecionou o arquivo correto."
        separador
        continue
    fi

    break
done

apk_name=$(basename "$apk_path")
success "Aplicativo selecionado: $apk_name"
separador

# ══════════════════════════════════════════════════════════════
# PASSO 3 — Detectar dispositivos
# ══════════════════════════════════════════════════════════════
header "Passo 3 de 4 — Conectar ao dispositivo Android"

info "Procurando dispositivos Android conectados..."
adb start-server &>/dev/null 2>&1 || true
sleep 2

detect_devices() {
    adb devices 2>/dev/null | tail -n +2 | grep -v '^$' | grep -v '^[[:space:]]*$' || true
}

devices_output=$(detect_devices)

if [[ -z "$devices_output" ]]; then
    warn "Nenhum dispositivo Android encontrado."
    separador
    echo "  ${BOLD}Como deseja prosseguir?${NC}"
    separador
    echo "  ${BOLD}[1]${NC} 📱 Tenho um celular Android — quero conectar via ${BOLD}cabo USB${NC}"
    echo "      ${DIM}(mais fácil e recomendado)${NC}"
    separador
    echo "  ${BOLD}[2]${NC} 📡 Tenho um celular Android — quero conectar via ${BOLD}Wi-Fi${NC}"
    echo "      ${DIM}(precisa de Android 11 ou superior)${NC}"
    separador
    echo "  ${BOLD}[3]${NC} 💻 Não tenho celular — quero usar um ${BOLD}emulador${NC} (celular virtual)"
    echo "      ${DIM}(precisa do Android Studio instalado)${NC}"
    separador

    printf "  ${YELLOW}Digite o número da opção: ${NC}"
    read -r opcao

    case "$opcao" in
        1)
            separador
            echo "  ${BOLD}📱 Conectando via cabo USB — siga estes passos:${NC}"
            separador
            echo "  ${BOLD}No seu celular Android:${NC}"
            echo ""
            echo "    1️⃣  Vá em ${BOLD}Configurações${NC} > ${BOLD}Sobre o telefone${NC}"
            echo "    2️⃣  Toque 7 vezes seguidas em ${BOLD}\"Número da versão\"${NC}"
            echo "       (vai aparecer uma mensagem dizendo que o modo desenvolvedor foi ativado)"
            echo "    3️⃣  Volte para ${BOLD}Configurações${NC}"
            echo "    4️⃣  Procure ${BOLD}\"Opções do desenvolvedor\"${NC} (pode estar dentro de \"Sistema\")"
            echo "    5️⃣  Ative a opção ${BOLD}\"Depuração USB\"${NC}"
            echo "    6️⃣  Conecte o cabo USB no celular e no Mac"
            echo "    7️⃣  No celular, vai aparecer um aviso perguntando se permite depuração"
            echo "       Marque ${BOLD}\"Sempre permitir\"${NC} e toque em ${BOLD}\"OK\"${NC}"
            separador
            printf "  ${YELLOW}Quando tiver feito tudo isso, pressione Enter...${NC}"
            read -r
            ;;
        2)
            separador
            echo "  ${BOLD}📡 Conectando via Wi-Fi — siga estes passos:${NC}"
            separador
            echo "  ${BOLD}No seu celular Android (precisa ser Android 11 ou superior):${NC}"
            echo ""
            echo "    1️⃣  Vá em ${BOLD}Configurações${NC} > ${BOLD}Opções do desenvolvedor${NC}"
            echo "       (se não aparecer, vá em Sobre o telefone e toque 7x em \"Número da versão\")"
            echo "    2️⃣  Ative ${BOLD}\"Depuração sem fio\"${NC}"
            echo "    3️⃣  Toque em ${BOLD}\"Depuração sem fio\"${NC} para abrir os detalhes"
            echo "    4️⃣  Toque em ${BOLD}\"Parear com código de pareamento\"${NC}"
            echo "    5️⃣  Vai aparecer um IP, porta e código no celular"
            separador

            printf "  ${CYAN}Digite o IP:Porta de pareamento que aparece no celular: ${NC}"
            read -r pair_addr
            if [[ -n "$pair_addr" ]]; then
                adb pair "$pair_addr" 2>/dev/null
            fi

            separador
            echo "  Agora olhe na tela de ${BOLD}\"Depuração sem fio\"${NC} o IP e porta de conexão"
            echo "  (é diferente do de pareamento)"
            separador

            printf "  ${CYAN}Digite o IP:Porta de conexão: ${NC}"
            read -r connect_addr
            if [[ -n "$connect_addr" ]]; then
                adb connect "$connect_addr" 2>/dev/null
            fi
            sleep 2
            ;;
        3)
            separador
            find_emulator

            if ! command -v emulator &>/dev/null; then
                error "O emulador Android não foi encontrado."
                separador
                echo "  Para usar um emulador você precisa do Android Studio."
                echo ""
                echo "    1️⃣  Baixe em: ${BOLD}https://developer.android.com/studio${NC}"
                echo "    2️⃣  Instale normalmente"
                echo "    3️⃣  Abra o Android Studio"
                echo "    4️⃣  Vá em ${BOLD}Device Manager${NC} (ícone de celular na lateral)"
                echo "    5️⃣  Crie e inicie um dispositivo virtual"
                echo "    6️⃣  Com o emulador aberto, execute este script novamente"
                separador
                exit 1
            fi

            avds=$(emulator -list-avds 2>/dev/null || true)
            if [[ -z "$avds" ]]; then
                warn "Nenhum emulador (AVD) encontrado."
                separador
                echo "  Você precisa criar um emulador no Android Studio:"
                echo ""
                echo "    1️⃣  Abra o Android Studio"
                echo "    2️⃣  Vá em ${BOLD}Device Manager${NC}"
                echo "    3️⃣  Clique em ${BOLD}\"Create Device\"${NC}"
                echo "    4️⃣  Escolha um modelo (ex: Pixel 6)"
                echo "    5️⃣  Baixe uma imagem do sistema e clique Finish"
                echo "    6️⃣  Inicie o emulador e execute este script novamente"
                separador
                exit 1
            fi

            info "Emuladores disponíveis:"
            separador
            i=1
            declare -a avd_list=()
            while IFS= read -r avd; do
                printf "  ${BOLD}[%d]${NC} %s\n" "$i" "$avd"
                avd_list+=("$avd")
                ((i++))
            done <<< "$avds"

            separador
            printf "  ${YELLOW}Digite o número do emulador: ${NC}"
            read -r avd_choice

            if [[ -z "$avd_choice" ]] || (( avd_choice < 1 || avd_choice > ${#avd_list[@]} )); then
                error "Opção inválida."
                exit 1
            fi

            selected_avd="${avd_list[$((avd_choice))]}"
            info "Iniciando emulador: $selected_avd ..."
            dica "Pode demorar um pouco — é normal."
            emulator -avd "$selected_avd" &>/dev/null &
            info "Aguardando emulador ficar pronto..."
            adb wait-for-device
            sleep 8
            ;;
        *)
            error "Opção inválida. Execute o script novamente."
            exit 1
            ;;
    esac

    # Verificar novamente
    sleep 2
    devices_output=$(detect_devices)

    if [[ -z "$devices_output" ]]; then
        error "Ainda não encontrei nenhum dispositivo."
        separador
        echo "  Possíveis causas:"
        echo "    • O cabo USB pode ser só de carregamento (precisa ser de dados)"
        echo "    • A depuração USB não está ativada no celular"
        echo "    • O celular pediu autorização e você não aceitou"
        echo "    • No emulador: ele ainda está iniciando — espere e tente novamente"
        separador
        echo "  Tente resolver o problema e execute o script novamente."
        separador
        exit 1
    fi
fi

# ══════════════════════════════════════════════════════════════
# PASSO 4 — Selecionar dispositivo e instalar
# ══════════════════════════════════════════════════════════════
header "Passo 4 de 4 — Instalando o aplicativo"

declare -a device_ids=()
declare -a device_labels=()
i=1

while IFS=$'\t' read -r id dev_status; do
    id="${id%% *}"
    model=$(adb -s "$id" shell getprop ro.product.model 2>/dev/null || echo "Dispositivo")
    model="${model//$'\r'/}"
    brand=$(adb -s "$id" shell getprop ro.product.brand 2>/dev/null || echo "")
    brand="${brand//$'\r'/}"

    if [[ -n "$brand" ]]; then
        label="$brand $model"
    else
        label="$model"
    fi

    printf "  ${BOLD}[%d]${NC} 📱 %s  ${DIM}(%s)${NC}\n" "$i" "$label" "$id"
    device_ids+=("$id")
    device_labels+=("$label")
    ((i++))
done <<< "$devices_output"

separador

if (( ${#device_ids[@]} == 1 )); then
    selected_device="${device_ids[1]}"
    selected_label="${device_labels[1]}"
    success "Dispositivo encontrado: $selected_label"
else
    printf "  ${YELLOW}Em qual dispositivo deseja instalar? Digite o número: ${NC}"
    read -r dev_choice

    if [[ -z "$dev_choice" ]] || (( dev_choice < 1 || dev_choice > ${#device_ids[@]} )); then
        error "Opção inválida."
        exit 1
    fi

    selected_device="${device_ids[$((dev_choice))]}"
    selected_label="${device_labels[$((dev_choice))]}"
    success "Dispositivo selecionado: $selected_label"
fi

separador
info "Instalando $apk_name..."
dica "Isso pode levar alguns segundos. Aguarde..."
separador

install_output=$(adb -s "$selected_device" install -r "$apk_path" 2>&1)

if echo "$install_output" | grep -q "Success"; then
    separador
    echo "  ${GREEN}${BOLD}══════════════════════════════════════════${NC}"
    echo "  ${GREEN}${BOLD}  ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!   ${NC}"
    echo "  ${GREEN}${BOLD}══════════════════════════════════════════${NC}"
    separador
    echo "  📦 Aplicativo: ${BOLD}$apk_name${NC}"
    echo "  📱 Dispositivo: ${BOLD}$selected_label${NC}"
    separador
    echo "  ${BOLD}Pronto!${NC} O app já deve aparecer na gaveta de apps do seu Android."
    dica "Se não aparecer, tente reiniciar o celular."
    separador
else
    separador
    error "Não foi possível instalar o aplicativo."
    separador

    if echo "$install_output" | grep -q "INSTALL_FAILED_ALREADY_EXISTS"; then
        echo "  O app já está instalado. Tente desinstalar a versão anterior primeiro."
    elif echo "$install_output" | grep -q "INSTALL_FAILED_INSUFFICIENT_STORAGE"; then
        echo "  O celular está sem espaço. Libere espaço e tente novamente."
    elif echo "$install_output" | grep -q "INSTALL_PARSE_FAILED_NO_CERTIFICATES"; then
        echo "  O arquivo APK não está assinado corretamente. Verifique o arquivo."
    elif echo "$install_output" | grep -q "INSTALL_FAILED_VERSION_DOWNGRADE"; then
        echo "  Já existe uma versão mais nova do app instalada."
        echo "  Desinstale a versão atual antes de instalar esta."
    else
        echo "  Detalhes do erro:"
        echo "  $install_output"
    fi
    separador
    exit 1
fi