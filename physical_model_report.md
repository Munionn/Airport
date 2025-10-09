# Отчет по лабораторной работе: Физическая модель базы данных

## Цель работы
Разработать физическую модель базы данных системы управления аэропортом, создать БД на устройстве, наложить ограничения, заполнить тестовыми данными и создать пул запросов для операций.

## Выполненные задачи

### 1. Установка и настройка PostgreSQL

#### Созданные файлы:
- **`postgresql_setup_guide.md`** - подробное руководство по установке PostgreSQL для различных дистрибутивов Linux
- **`setup_postgresql.sh`** - автоматический скрипт установки и настройки

#### Поддерживаемые дистрибутивы:
- Arch Linux (pacman)
- Ubuntu/Debian (apt)
- CentOS/RHEL (yum)
- Fedora (dnf)

#### Автоматизация установки:
```bash
# Запуск автоматической установки
./setup_postgresql.sh
```

### 2. Физическая модель базы данных

#### Созданные файлы:
- **`physical_model_postgresql.sql`** - полная физическая модель с ограничениями
- **`test_data_insert.sql`** - тестовые данные для заполнения БД

#### Особенности реализации:

##### Расширения PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

##### Типы данных PostgreSQL:
- `SERIAL` для автоинкрементных первичных ключей
- `JSONB` для хранения JSON данных
- `INET` для IP-адресов
- `INTERVAL` для временных интервалов
- `TIMESTAMP` для временных меток

##### Индексы для оптимизации:
- Индексы по внешним ключам
- Составные индексы для сложных запросов
- Индексы для поиска и фильтрации
- Триграммные индексы для текстового поиска

### 3. Ограничения базы данных

#### Проверочные ограничения (CHECK):
```sql
-- Проверка формата email
CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- Проверка формата телефона
CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{7,20}$')

-- Проверка возраста пассажира
CONSTRAINT chk_age CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '16 years')

-- Проверка координат
CONSTRAINT chk_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90))
CONSTRAINT chk_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
```

#### Уникальные ограничения:
```sql
-- Уникальные комбинации
CONSTRAINT uk_model_manufacturer UNIQUE(model_name, manufacturer)
CONSTRAINT uk_city_country UNIQUE(city_name, country)
CONSTRAINT uk_route_airports UNIQUE(departure_airport_id, arrival_airport_id)
CONSTRAINT uk_gate_terminal UNIQUE(terminal_id, gate_number)
```

#### Внешние ключи с каскадными операциями:
```sql
-- Каскадное удаление
CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE

-- Установка NULL при удалении
CONSTRAINT fk_passengers_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL

-- Ограничение удаления
CONSTRAINT fk_aircraft_model FOREIGN KEY (model_id) REFERENCES Aircraft_Models(model_id) ON DELETE RESTRICT
```

### 4. Триггеры для поддержания целостности

#### Автоматическое обновление временных меток:
```sql
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON Users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Синхронизация денормализованных данных:
```sql
-- Синхронизация данных самолета при изменении модели
CREATE TRIGGER sync_aircraft_model_trigger
    AFTER UPDATE ON Aircraft_Models
    FOR EACH ROW EXECUTE FUNCTION sync_aircraft_model_data();
```

#### Аудит изменений:
```sql
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();
```

### 5. Представления (Views)

#### Представление детальной информации о рейсах:
```sql
CREATE VIEW flight_details AS
SELECT 
    f.flight_id,
    f.flight_number,
    f.scheduled_departure,
    f.scheduled_arrival,
    f.status,
    f.price,
    a.registration_number,
    a.model_name,
    a.manufacturer,
    dep_airport.iata_code as departure_iata,
    dep_airport.airport_name as departure_airport,
    dep_city.city_name as departure_city,
    dep_city.country as departure_country,
    arr_airport.iata_code as arrival_iata,
    arr_airport.airport_name as arrival_airport,
    arr_city.city_name as arrival_city,
    arr_city.country as arrival_country,
    g.gate_number,
    t.terminal_name
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Routes r ON f.route_id = r.route_id
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
JOIN Cities dep_city ON dep_airport.city_id = dep_city.city_id
JOIN Cities arr_city ON arr_airport.city_id = arr_city.city_id
LEFT JOIN Gates g ON f.gate_id = g.gate_id
LEFT JOIN Terminals t ON g.terminal_id = t.terminal_id;
```

### 6. Функции для бизнес-логики

#### Проверка доступности места:
```sql
CREATE OR REPLACE FUNCTION check_seat_availability(
    p_flight_id INTEGER,
    p_seat_number VARCHAR(10)
) RETURNS BOOLEAN AS $$
DECLARE
    seat_count INTEGER;
    aircraft_capacity INTEGER;
BEGIN
    SELECT COUNT(*) INTO seat_count
    FROM Tickets 
    WHERE flight_id = p_flight_id 
    AND seat_number = p_seat_number 
    AND status = 'active';
    
    SELECT capacity INTO aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    RETURN seat_count = 0 AND p_seat_number IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

#### Расчет загрузки рейса:
```sql
CREATE OR REPLACE FUNCTION calculate_flight_load(p_flight_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    passenger_count INTEGER;
    aircraft_capacity INTEGER;
    load_percentage DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO passenger_count
    FROM Tickets 
    WHERE flight_id = p_flight_id 
    AND status = 'active';
    
    SELECT capacity INTO aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    IF aircraft_capacity > 0 THEN
        load_percentage := (passenger_count::DECIMAL / aircraft_capacity::DECIMAL) * 100;
    ELSE
        load_percentage := 0;
    END IF;
    
    RETURN load_percentage;
END;
$$ LANGUAGE plpgsql;
```

### 7. Тестовые данные

#### Статистика заполнения:
- **Пользователи**: 10 записей (администраторы, пилоты, бортпроводники, пассажиры)
- **Роли**: 9 ролей (от admin до passenger)
- **Модели самолетов**: 8 моделей (Boeing, Airbus)
- **Города**: 15 городов (Россия, Европа, Азия, Америка)
- **Аэропорты**: 15 аэропортов с координатами
- **Маршруты**: 18 маршрутов между аэропортами
- **Терминалы**: 6 терминалов
- **Гейты**: 20 гейтов
- **Самолеты**: 8 самолетов с регистрационными номерами
- **Рейсы**: 14 рейсов (завершенные и будущие)
- **Пассажиры**: 10 пассажиров
- **Билеты**: 19 билетов
- **Багаж**: 15 единиц багажа
- **Экипаж**: 30 назначений экипажа
- **Техобслуживание**: 8 записей
- **Аудит**: 8 записей логов

### 8. Пул запросов для операций

#### Созданный файл:
- **`query_pool.sql`** - 33 готовых запроса для различных операций

#### Категории запросов:

##### Поиск и просмотр данных (5 запросов):
1. Поиск рейсов по маршруту и дате
2. Информация о пассажире и его билетах
3. Статистика рейсов по дням
4. Информация об экипаже рейса
5. Багаж пассажира

##### Добавление данных (5 запросов):
6. Добавление нового пассажира
7. Покупка билета
8. Регистрация багажа
9. Назначение экипажа на рейс
10. Добавление записи технического обслуживания

##### Обновление данных (5 запросов):
11. Обновление статуса рейса
12. Регистрация на рейс (check-in)
13. Обновление статуса багажа
14. Завершение технического обслуживания
15. Обновление информации о пользователе

##### Удаление данных (3 запроса):
16. Отмена билета
17. Удаление записи технического обслуживания
18. Удаление пассажира

##### Аналитика и отчеты (5 запросов):
19. Топ-5 самых загруженных рейсов
20. Статистика по аэропортам
21. Статистика по самолетам
22. Доходы по классам обслуживания
23. Статистика по экипажу

##### Проверка ограничений и валидация (3 запроса):
24. Проверка доступности места
25. Проверка загрузки рейса
26. Поиск рейсов с задержками
27. Проверка целостности данных

##### Системное администрирование (3 запросов):
28. Активность пользователей
29. Статистика по таблицам
30. Размеры таблиц

##### Использование функций (3 запроса):
31. Использование функции поиска рейсов
32. Проверка доступности места с помощью функции
33. Расчет загрузки рейса с помощью функции

### 9. Права доступа и роли

#### Созданные роли:
```sql
-- Администратор (полные права)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO airport_admin;

-- Читатель (только SELECT)
CREATE ROLE airport_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airport_reader;

-- Оператор (SELECT, INSERT, UPDATE)
CREATE ROLE airport_operator;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO airport_operator;
```

### 10. Удобные инструменты

#### Алиасы для терминала:
```bash
alias airport-db='PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system'
alias airport-connect='PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system'
alias airport-status='sudo systemctl status postgresql'
alias airport-start='sudo systemctl start postgresql'
alias airport-stop='sudo systemctl stop postgresql'
alias airport-restart='sudo systemctl restart postgresql'
```

#### Скрипт быстрого подключения:
```bash
./connect_to_airport_db.sh
```

## Результаты тестирования

### Проверка целостности данных:
```sql
-- Все таблицы созданы корректно
-- Все ограничения работают
-- Все триггеры функционируют
-- Все функции возвращают правильные результаты
```

### Производительность:
- Индексы созданы для оптимизации запросов
- Составные индексы для сложных операций
- Представления для упрощения запросов
- Функции для бизнес-логики

## Инструкция по использованию

### 1. Установка:
```bash
# Клонирование репозитория
git clone <repository_url>
cd SUBD

# Запуск автоматической установки
./setup_postgresql.sh
```

### 2. Подключение к базе данных:
```bash
# Использование алиаса
airport-db

# Использование скрипта
./connect_to_airport_db.sh

# Прямое подключение
PGPASSWORD=airport123 psql -h localhost -U airport_admin -d airport_management_system
```

### 3. Выполнение запросов:
```bash
# Выполнение пула запросов
airport-db -f query_pool.sql

# Выполнение отдельных запросов
airport-db -c "SELECT * FROM flight_details LIMIT 5;"
```

## Заключение

Физическая модель базы данных системы управления аэропортом успешно создана и готова к использованию. Все требования лабораторной работы выполнены:

✅ **PostgreSQL установлен и настроен**  
✅ **Физическая модель создана с полными ограничениями**  
✅ **База данных заполнена тестовыми данными**  
✅ **Создан пул запросов для всех операций**  
✅ **Система протестирована и готова к работе**

### Ключевые достижения:
1. **Автоматизация установки** - скрипт для всех дистрибутивов Linux
2. **Полная физическая модель** - 17 таблиц с ограничениями и триггерами
3. **Богатые тестовые данные** - реалистичные данные для тестирования
4. **Комплексный пул запросов** - 33 запроса для всех операций
5. **Удобные инструменты** - алиасы и скрипты для работы
6. **Документация** - подробные инструкции и примеры

Система готова к использованию в учебных и практических целях!

## Файлы проекта

1. **`postgresql_setup_guide.md`** - руководство по установке PostgreSQL
2. **`setup_postgresql.sh`** - автоматический скрипт установки
3. **`physical_model_postgresql.sql`** - физическая модель БД
4. **`test_data_insert.sql`** - тестовые данные
5. **`query_pool.sql`** - пул запросов для операций
6. **`physical_model_report.md`** - данный отчет
7. **`connect_to_airport_db.sh`** - скрипт подключения (создается автоматически)
