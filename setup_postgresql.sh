#!/bin/bash

# Скрипт автоматической установки и настройки PostgreSQL для системы управления аэропортом
# Поддерживает Arch Linux, Ubuntu/Debian, CentOS/RHEL/Fedora

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Определение дистрибутива
detect_distro() {
    if [ -f /etc/arch-release ]; then
        DISTRO="arch"
    elif [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    elif [ -f /etc/fedora-release ]; then
        DISTRO="fedora"
    else
        print_error "Неподдерживаемый дистрибутив Linux"
        exit 1
    fi
    print_message "Обнаружен дистрибутив: $DISTRO"
}

# Установка PostgreSQL
install_postgresql() {
    print_message "Установка PostgreSQL..."
    
    case $DISTRO in
        "arch")
            sudo pacman -S postgresql --noconfirm
            ;;
        "debian")
            sudo apt update
            sudo apt install postgresql postgresql-contrib -y
            ;;
        "redhat")
            sudo yum install postgresql-server postgresql-contrib -y
            ;;
        "fedora")
            sudo dnf install postgresql-server postgresql-contrib -y
            ;;
    esac
    
    print_success "PostgreSQL установлен"
}

# Инициализация базы данных
init_database() {
    print_message "Инициализация базы данных..."
    
    case $DISTRO in
        "arch")
            sudo -u postgres initdb -D /var/lib/postgres/data
            ;;
        "debian")
            sudo -u postgres /usr/lib/postgresql/*/bin/initdb -D /var/lib/postgresql/data
            ;;
        "redhat"|"fedora")
            sudo postgresql-setup --initdb
            ;;
    esac
    
    print_success "База данных инициализирована"
}

# Запуск службы PostgreSQL
start_postgresql() {
    print_message "Запуск службы PostgreSQL..."
    
    case $DISTRO in
        "arch")
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        "debian")
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        "redhat"|"fedora")
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
    esac
    
    # Проверка статуса
    if sudo systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL запущен"
    else
        print_error "Не удалось запустить PostgreSQL"
        exit 1
    fi
}

# Создание пользователя и базы данных
create_user_and_database() {
    print_message "Создание пользователя и базы данных..."
    
    # Создание пользователя и базы данных
    sudo -u postgres psql << EOF
CREATE USER airport_admin WITH PASSWORD 'airport123';
CREATE DATABASE airport_management_system OWNER airport_admin;
GRANT ALL PRIVILEGES ON DATABASE airport_management_system TO airport_admin;
\q
EOF
    
    print_success "Пользователь и база данных созданы"
}

# Настройка подключения
configure_connection() {
    print_message "Настройка подключения..."
    
    # Определение пути к конфигурационным файлам
    case $DISTRO in
        "arch")
            CONFIG_DIR="/var/lib/postgres/data"
            ;;
        "debian")
            CONFIG_DIR="/etc/postgresql/*/main"
            ;;
        "redhat"|"fedora")
            CONFIG_DIR="/var/lib/pgsql/data"
            ;;
    esac
    
    # Настройка pg_hba.conf для локальных подключений
    print_message "Настройка pg_hba.conf..."
    echo "local   airport_management_system   airport_admin                md5" | sudo tee -a $CONFIG_DIR/pg_hba.conf
    
    # Настройка postgresql.conf
    print_message "Настройка postgresql.conf..."
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $CONFIG_DIR/postgresql.conf
    
    print_success "Конфигурация обновлена"
}

# Перезапуск PostgreSQL
restart_postgresql() {
    print_message "Перезапуск PostgreSQL..."
    sudo systemctl restart postgresql
    
    if sudo systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL перезапущен"
    else
        print_error "Не удалось перезапустить PostgreSQL"
        exit 1
    fi
}

# Тестирование подключения
test_connection() {
    print_message "Тестирование подключения..."
    
    if PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Подключение к базе данных успешно"
    else
        print_error "Не удалось подключиться к базе данных"
        exit 1
    fi
}

# Создание таблиц и данных
create_tables_and_data() {
    print_message "Создание таблиц и заполнение тестовыми данными..."
    
    # Создание таблиц
    PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system -f physical_model_postgresql.sql
    
    # Заполнение тестовыми данными
    PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system -f test_data_insert.sql
    
    print_success "Таблицы созданы и заполнены данными"
}

# Создание удобных алиасов
create_aliases() {
    print_message "Создание алиасов для удобства работы..."
    
    # Добавление алиасов в .bashrc или .zshrc
    SHELL_CONFIG=""
    if [ -f ~/.bashrc ]; then
        SHELL_CONFIG=~/.bashrc
    elif [ -f ~/.zshrc ]; then
        SHELL_CONFIG=~/.zshrc
    fi
    
    if [ -n "$SHELL_CONFIG" ]; then
        cat >> $SHELL_CONFIG << 'EOF'

# Алиасы для работы с базой данных аэропорта
alias airport-db='PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system'
alias airport-connect='PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system'
alias airport-status='sudo systemctl status postgresql'
alias airport-start='sudo systemctl start postgresql'
alias airport-stop='sudo systemctl stop postgresql'
alias airport-restart='sudo systemctl restart postgresql'
EOF
        print_success "Алиасы добавлены в $SHELL_CONFIG"
        print_warning "Выполните 'source $SHELL_CONFIG' или перезайдите в терминал для применения алиасов"
    fi
}

# Создание скрипта для быстрого подключения
create_connection_script() {
    print_message "Создание скрипта для быстрого подключения..."
    
    cat > connect_to_airport_db.sh << 'EOF'
#!/bin/bash
# Скрипт для подключения к базе данных системы управления аэропортом

echo "Подключение к базе данных системы управления аэропортом..."
echo "Пользователь: airport_admin"
echo "База данных: airport_management_system"
echo ""

PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system
EOF
    
    chmod +x connect_to_airport_db.sh
    print_success "Скрипт подключения создан: ./connect_to_airport_db.sh"
}

# Основная функция
main() {
    print_message "Начало установки и настройки PostgreSQL для системы управления аэропортом"
    print_message "=================================================="
    
    # Проверка прав root
    if [ "$EUID" -eq 0 ]; then
        print_error "Не запускайте скрипт от имени root. Используйте sudo при необходимости."
        exit 1
    fi
    
    # Проверка наличия необходимых файлов
    if [ ! -f "physical_model_postgresql.sql" ]; then
        print_error "Файл physical_model_postgresql.sql не найден в текущей директории"
        exit 1
    fi
    
    if [ ! -f "test_data_insert.sql" ]; then
        print_error "Файл test_data_insert.sql не найден в текущей директории"
        exit 1
    fi
    
    # Выполнение шагов установки
    detect_distro
    install_postgresql
    init_database
    start_postgresql
    create_user_and_database
    configure_connection
    restart_postgresql
    test_connection
    create_tables_and_data
    create_aliases
    create_connection_script
    
    print_message "=================================================="
    print_success "Установка и настройка PostgreSQL завершена успешно!"
    print_message ""
    print_message "Информация для подключения:"
    print_message "  Хост: localhost"
    print_message "  Порт: 5432"
    print_message "  Пользователь: airport_admin"
    print_message "  Пароль: airport123"
    print_message "  База данных: airport_management_system"
    print_message ""
    print_message "Способы подключения:"
    print_message "  1. Используйте алиас: airport-db"
    print_message "  2. Используйте скрипт: ./connect_to_airport_db.sh"
    print_message "  3. Команда: PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system"
    print_message ""
    print_message "Полезные команды:"
    print_message "  airport-status  - статус службы PostgreSQL"
    print_message "  airport-start   - запуск PostgreSQL"
    print_message "  airport-stop    - остановка PostgreSQL"
    print_message "  airport-restart - перезапуск PostgreSQL"
    print_message ""
    print_success "Система готова к использованию!"
}

# Запуск основной функции
main "$@"
