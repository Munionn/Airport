# Текстовое описание сущностей базы данных системы управления аэропортом

## 1. USERS (Пользователи)

**Назначение:** Центральная таблица для хранения информации о всех пользователях системы

**Описание полей:**
- `user_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор пользователя
- `username` (VARCHAR(50), UNIQUE, NOT NULL) - Логин пользователя для входа в систему
- `email` (VARCHAR(100), UNIQUE, NOT NULL) - Электронная почта пользователя
- `password_hash` (VARCHAR(255), NOT NULL) - Зашифрованный пароль пользователя
- `first_name` (VARCHAR(50), NOT NULL) - Имя пользователя
- `last_name` (VARCHAR(50), NOT NULL) - Фамилия пользователя
- `phone` (VARCHAR(20)) - Номер телефона пользователя
- `date_of_birth` (DATE) - Дата рождения пользователя
- `passport_number` (VARCHAR(20), UNIQUE) - Номер паспорта пользователя
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата и время создания записи
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - Дата и время последнего обновления
- `is_active` (BOOLEAN, DEFAULT TRUE) - Статус активности пользователя

**Связи:**
- Один ко многим с AUDIT_LOGS (один пользователь создает много записей в журнале)
- Многие ко многим с ROLES через USER_ROLES (пользователь может иметь несколько ролей)
- Один к одному с PASSENGERS (пользователь может иметь профиль пассажира)
- Один ко многим с FLIGHT_CREW (пользователь может работать на нескольких рейсах)
- Один ко многим с MAINTENANCE_RECORDS (пользователь может выполнять работы по обслуживанию)

---

## 2. ROLES (Роли)

**Назначение:** Хранение ролей пользователей в системе с их правами доступа

**Описание полей:**
- `role_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор роли
- `role_name` (VARCHAR(50), UNIQUE, NOT NULL) - Название роли (admin, dispatcher, cashier, etc.)
- `description` (TEXT) - Описание роли и ее функций
- `permissions` (JSON) - JSON-объект с правами доступа роли
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата создания роли

**Связи:**
- Многие ко многим с USERS через USER_ROLES (роль может быть назначена нескольким пользователям)

**Примеры ролей:**
- Администратор - полный доступ ко всем функциям
- Диспетчер - управление рейсами и пассажирами
- Кассир - продажа билетов и регистрация
- Сотрудник безопасности - контроль безопасности
- Пассажир - базовые функции для пассажиров

---

## 3. USER_ROLES (Пользовательские роли)

**Назначение:** Промежуточная таблица для связи пользователей с их ролями

**Описание полей:**
- `user_role_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор записи
- `user_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на пользователя
- `role_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на роль
- `assigned_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата назначения роли
- `assigned_by` (INTEGER, FOREIGN KEY) - Кто назначил роль (ссылка на пользователя)

**Связи:**
- Многие к одному с USERS (user_id) - связь с пользователем
- Многие к одному с ROLES - связь с ролью
- Многие к одному с USERS (assigned_by) - кто назначил роль

---

## 4. AIRCRAFT (Самолеты)

**Назначение:** Хранение информации о парке самолетов аэропорта

**Описание полей:**
- `aircraft_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор самолета
- `registration_number` (VARCHAR(20), UNIQUE, NOT NULL) - Регистрационный номер самолета
- `model` (VARCHAR(50), NOT NULL) - Модель самолета (Boeing 737, Airbus A320, etc.)
- `manufacturer` (VARCHAR(50), NOT NULL) - Производитель самолета
- `capacity` (INTEGER, NOT NULL, CHECK (capacity > 0)) - Пассажировместимость
- `max_range` (INTEGER, NOT NULL, CHECK (max_range > 0)) - Максимальная дальность полета в км
- `status` (ENUM('active', 'maintenance', 'retired'), DEFAULT 'active') - Статус самолета
- `purchase_date` (DATE) - Дата покупки самолета
- `last_maintenance` (DATE) - Дата последнего технического обслуживания
- `next_maintenance` (DATE) - Дата следующего планового обслуживания

**Связи:**
- Один ко многим с FLIGHTS (один самолет выполняет много рейсов)
- Один ко многим с MAINTENANCE_RECORDS (один самолет имеет много записей обслуживания)

---

## 5. FLIGHTS (Рейсы)

**Назначение:** Центральная таблица для управления рейсами аэропорта

**Описание полей:**
- `flight_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор рейса
- `flight_number` (VARCHAR(10), UNIQUE, NOT NULL) - Номер рейса (например, SU1234)
- `aircraft_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на самолет
- `departure_airport_id` (INTEGER, NOT NULL, FOREIGN KEY) - Аэропорт отправления
- `arrival_airport_id` (INTEGER, NOT NULL, FOREIGN KEY) - Аэропорт прибытия
- `route_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на маршрут
- `gate_id` (INTEGER, FOREIGN KEY) - Ссылка на гейт
- `scheduled_departure` (DATETIME, NOT NULL) - Плановое время отправления
- `scheduled_arrival` (DATETIME, NOT NULL) - Плановое время прибытия
- `actual_departure` (DATETIME) - Фактическое время отправления
- `actual_arrival` (DATETIME) - Фактическое время прибытия
- `status` (ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'), DEFAULT 'scheduled') - Статус рейса
- `price` (DECIMAL(10,2), NOT NULL, CHECK (price >= 0)) - Базовая цена билета

**Связи:**
- Многие к одному с AIRCRAFT - самолет для рейса
- Многие к одному с AIRPORTS (departure_airport_id) - аэропорт отправления
- Многие к одному с AIRPORTS (arrival_airport_id) - аэропорт прибытия
- Многие к одному с ROUTES - маршрут рейса
- Многие к одному с GATES - гейт для рейса
- Один ко многим с TICKETS - билеты на рейс
- Один ко многим с BAGGAGE - багаж на рейсе
- Один ко многим с FLIGHT_CREW - экипаж рейса

---

## 6. PASSENGERS (Пассажиры)

**Назначение:** Хранение информации о пассажирах аэропорта

**Описание полей:**
- `passenger_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор пассажира
- `user_id` (INTEGER, FOREIGN KEY) - Ссылка на пользователя (опционально)
- `first_name` (VARCHAR(50), NOT NULL) - Имя пассажира
- `last_name` (VARCHAR(50), NOT NULL) - Фамилия пассажира
- `passport_number` (VARCHAR(20), NOT NULL) - Номер паспорта пассажира
- `nationality` (VARCHAR(50), NOT NULL) - Национальность пассажира
- `date_of_birth` (DATE, NOT NULL) - Дата рождения пассажира
- `phone` (VARCHAR(20)) - Номер телефона пассажира
- `email` (VARCHAR(100)) - Электронная почта пассажира
- `special_requirements` (TEXT) - Особые требования пассажира (инвалидность, диета, etc.)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата создания записи

**Связи:**
- Многие к одному с USERS (опционально) - связь с пользователем системы
- Один ко многим с TICKETS - билеты пассажира
- Один ко многим с BAGGAGE - багаж пассажира

---

## 7. TICKETS (Билеты)

**Назначение:** Управление билетами на рейсы

**Описание полей:**
- `ticket_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор билета
- `ticket_number` (VARCHAR(20), UNIQUE, NOT NULL) - Номер билета
- `flight_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на рейс
- `passenger_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на пассажира
- `seat_number` (VARCHAR(10)) - Номер места в самолете
- `class` (ENUM('economy', 'business', 'first'), DEFAULT 'economy') - Класс обслуживания
- `price` (DECIMAL(10,2), NOT NULL, CHECK (price >= 0)) - Цена билета
- `status` (ENUM('active', 'cancelled', 'used', 'refunded'), DEFAULT 'active') - Статус билета
- `purchase_date` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата покупки билета
- `check_in_time` (TIMESTAMP) - Время регистрации на рейс

**Связи:**
- Многие к одному с FLIGHTS - рейс для билета
- Многие к одному с PASSENGERS - пассажир-владелец билета

---

## 8. TERMINALS (Терминалы)

**Назначение:** Управление терминалами аэропорта

**Описание полей:**
- `terminal_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор терминала
- `terminal_name` (VARCHAR(50), NOT NULL) - Название терминала
- `terminal_code` (VARCHAR(10), UNIQUE, NOT NULL) - Код терминала (T1, T2, etc.)
- `capacity` (INTEGER, NOT NULL, CHECK (capacity > 0)) - Вместимость терминала
- `status` (ENUM('active', 'maintenance', 'closed'), DEFAULT 'active') - Статус терминала
- `opening_hours` (VARCHAR(100)) - Часы работы терминала

**Связи:**
- Один ко многим с GATES - гейты в терминале

---

## 9. GATES (Гейты)

**Назначение:** Управление гейтами для посадки пассажиров

**Описание полей:**
- `gate_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор гейта
- `terminal_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на терминал
- `gate_number` (VARCHAR(10), NOT NULL) - Номер гейта (A1, B2, etc.)
- `status` (ENUM('available', 'occupied', 'maintenance'), DEFAULT 'available') - Статус гейта
- `capacity` (INTEGER, NOT NULL, CHECK (capacity > 0)) - Вместимость гейта

**Связи:**
- Многие к одному с TERMINALS - терминал, в котором находится гейт
- Один ко многим с FLIGHTS - рейсы, использующие гейт

---

## 10. BAGGAGE (Багаж)

**Назначение:** Отслеживание багажа пассажиров

**Описание полей:**
- `baggage_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор багажа
- `passenger_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на пассажира
- `flight_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на рейс
- `baggage_tag` (VARCHAR(20), UNIQUE, NOT NULL) - Тег багажа
- `weight` (DECIMAL(5,2), NOT NULL, CHECK (weight > 0)) - Вес багажа в кг
- `status` (ENUM('checked_in', 'loaded', 'unloaded', 'delivered', 'lost'), DEFAULT 'checked_in') - Статус багажа
- `check_in_time` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Время сдачи багажа
- `delivery_time` (TIMESTAMP) - Время выдачи багажа

**Связи:**
- Многие к одному с PASSENGERS - владелец багажа
- Многие к одному с FLIGHTS - рейс для перевозки багажа

---

## 11. AIRPORTS (Аэропорты)

**Назначение:** Справочник аэропортов мира

**Описание полей:**
- `airport_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор аэропорта
- `iata_code` (VARCHAR(3), UNIQUE, NOT NULL) - IATA код аэропорта (SVO, JFK, etc.)
- `icao_code` (VARCHAR(4), UNIQUE, NOT NULL) - ICAO код аэропорта (UUEE, KJFK, etc.)
- `airport_name` (VARCHAR(100), NOT NULL) - Полное название аэропорта
- `city` (VARCHAR(50), NOT NULL) - Город расположения
- `country` (VARCHAR(50), NOT NULL) - Страна расположения
- `timezone` (VARCHAR(50), NOT NULL) - Часовой пояс аэропорта
- `latitude` (DECIMAL(10,8)) - Широта аэропорта
- `longitude` (DECIMAL(11,8)) - Долгота аэропорта

**Связи:**
- Один ко многим с FLIGHTS (departure_airport_id) - аэропорты отправления
- Один ко многим с FLIGHTS (arrival_airport_id) - аэропорты прибытия
- Один ко многим с ROUTES (departure_airport_id) - аэропорты отправления маршрутов
- Один ко многим с ROUTES (arrival_airport_id) - аэропорты прибытия маршрутов

---

## 12. ROUTES (Маршруты)

**Назначение:** Управление маршрутами полетов

**Описание полей:**
- `route_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор маршрута
- `route_name` (VARCHAR(100), NOT NULL) - Название маршрута
- `departure_airport_id` (INTEGER, NOT NULL, FOREIGN KEY) - Аэропорт отправления
- `arrival_airport_id` (INTEGER, NOT NULL, FOREIGN KEY) - Аэропорт прибытия
- `distance` (INTEGER, NOT NULL, CHECK (distance > 0)) - Расстояние маршрута в км
- `duration` (TIME, NOT NULL) - Продолжительность полета
- `status` (ENUM('active', 'inactive'), DEFAULT 'active') - Статус маршрута

**Связи:**
- Многие к одному с AIRPORTS (departure_airport_id) - аэропорт отправления
- Многие к одному с AIRPORTS (arrival_airport_id) - аэропорт прибытия
- Один ко многим с FLIGHTS - рейсы по маршруту

---

## 13. FLIGHT_CREW (Экипаж рейса)

**Назначение:** Связь экипажа с рейсами

**Описание полей:**
- `crew_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор записи
- `flight_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на рейс
- `user_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на пользователя-члена экипажа
- `position` (ENUM('pilot', 'co_pilot', 'flight_engineer', 'flight_attendant', 'purser'), NOT NULL) - Должность в экипаже
- `assigned_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Дата назначения на рейс

**Связи:**
- Многие к одному с FLIGHTS - рейс для экипажа
- Многие к мнеогим  с USERS - член экипажа

---

## 14. MAINTENANCE_RECORDS (Записи технического обслуживания)

**Назначение:** Учет технического обслуживания самолетов

**Описание полей:**
- `maintenance_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор записи
- `aircraft_id` (INTEGER, NOT NULL, FOREIGN KEY) - Ссылка на самолет
- `maintenance_type` (ENUM('routine', 'repair', 'inspection', 'overhaul'), NOT NULL) - Тип обслуживания
- `description` (TEXT, NOT NULL) - Описание выполненных работ
- `start_date` (DATE, NOT NULL) - Дата начала обслуживания
- `end_date` (DATE) - Дата окончания обслуживания
- `cost` (DECIMAL(10,2), CHECK (cost >= 0)) - Стоимость обслуживания
- `technician_id` (INTEGER, FOREIGN KEY) - Ссылка на техника
- `status` (ENUM('scheduled', 'in_progress', 'completed', 'cancelled'), DEFAULT 'scheduled') - Статус обслуживания

**Связи:**
- Многие к одному с AIRCRAFT - самолет для обслуживания
- Многие к одному с USERS - техник, выполняющий обслуживание

---

## 15. AUDIT_LOGS (Журнал аудита)

**Назначение:** Логирование всех действий пользователей в системе

**Описание полей:**
- `log_id` (INTEGER, PRIMARY KEY) - Уникальный идентификатор записи
- `user_id` (INTEGER, FOREIGN KEY) - Ссылка на пользователя, выполнившего действие
- `action` (VARCHAR(100), NOT NULL) - Описание выполненного действия
- `table_name` (VARCHAR(50), NOT NULL) - Название таблицы, с которой работали
- `record_id` (INTEGER) - ID записи, с которой работали
- `old_values` (JSON) - Старые значения полей (для UPDATE/DELETE)
- `new_values` (JSON) - Новые значения полей (для INSERT/UPDATE)
- `ip_address` (VARCHAR(45)) - IP-адрес пользователя
- `user_agent` (TEXT) - Информация о браузере пользователя
- `timestamp` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Время выполнения действия

**Связи:**
- Многие к одному с USERS - пользователь, выполнивший действие

---

## Общие принципы проектирования

### Типы данных:
- **INTEGER** - для идентификаторов и числовых значений
- **VARCHAR(n)** - для текстовых полей с ограниченной длиной
- **TEXT** - для длинных текстовых полей
- **DATE** - для дат без времени
- **DATETIME** - для дат с временем
- **TIMESTAMP** - для автоматических временных меток
- **DECIMAL(p,s)** - для денежных сумм и точных чисел
- **ENUM** - для полей с ограниченным набором значений
- **JSON** - для сложных структур данных
- **BOOLEAN** - для логических значений

### Ограничения:
- **PRIMARY KEY** - первичный ключ
- **FOREIGN KEY** - внешний ключ
- **UNIQUE** - уникальность значения
- **NOT NULL** - обязательное поле
- **CHECK** - проверка значений
- **DEFAULT** - значение по умолчанию

### Связи:
- **1:1** - Один к одному
- **1:M** - Один ко многим
- **M:1** - Многие к одному
- **M:M** - Многие ко многим (через промежуточную таблицу)
