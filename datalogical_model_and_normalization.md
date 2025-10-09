# Даталогическая модель и нормализация базы данных системы управления аэропортом

## Анализ текущей схемы на соответствие нормальным формам

### Первая нормальная форма (1НФ)

**Определение:** Все атрибуты должны быть атомарными (неделимыми) и не содержать повторяющихся групп.

**Анализ текущей схемы:**
✅ **СОБЛЮДЕНА** - Все атрибуты в таблицах являются атомарными. Нет составных атрибутов или повторяющихся групп.

### Вторая нормальная форма (2НФ)

**Определение:** Таблица должна быть в 1НФ и все неключевые атрибуты должны полностью зависеть от первичного ключа.

**Анализ текущей схемы:**

#### Нарушения 2НФ:

1. **Таблица Routes:**
   - Первичный ключ: `route_id`
   - Проблема: `departure_airport_id` и `arrival_airport_id` функционально зависят друг от друга, но не от `route_id`
   - Нарушение: Маршрут определяется парой аэропортов, а не отдельным ID

2. **Таблица Flights:**
   - Первичный ключ: `flight_id`
   - Проблема: `departure_airport_id` и `arrival_airport_id` дублируют информацию из Routes
   - Нарушение: Избыточность данных

### Третья нормальная форма (3НФ)

**Определение:** Таблица должна быть в 2НФ и не должно быть транзитивных зависимостей между неключевыми атрибутами.

**Анализ текущей схемы:**

#### Нарушения 3НФ:

1. **Таблица Aircraft:**
   - `model` → `manufacturer` (транзитивная зависимость)
   - Модель самолета определяет производителя

2. **Таблица Airports:**
   - `city` → `country` (транзитивная зависимость)
   - Город определяет страну

3. **Таблица Gates:**
   - `terminal_id` → `terminal_name` (через связь с Terminals)
   - Номер гейта + терминал определяют уникальность

## Нормализованная схема (приведение к 3НФ)

### Изменения для устранения нарушений:

#### 1. Создание таблицы Aircraft_Models
```sql
CREATE TABLE Aircraft_Models (
    model_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    max_range INTEGER NOT NULL CHECK (max_range > 0),
    UNIQUE(model_name, manufacturer)
);
```

#### 2. Создание таблицы Cities
```sql
CREATE TABLE Cities (
    city_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    city_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    UNIQUE(city_name, country)
);
```

#### 3. Модификация таблицы Aircraft
```sql
CREATE TABLE Aircraft (
    aircraft_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    model_id INTEGER NOT NULL,
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    FOREIGN KEY (model_id) REFERENCES Aircraft_Models(model_id)
);
```

#### 4. Модификация таблицы Airports
```sql
CREATE TABLE Airports (
    airport_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4) UNIQUE NOT NULL,
    airport_name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    FOREIGN KEY (city_id) REFERENCES Cities(city_id)
);
```

#### 5. Модификация таблицы Routes
```sql
CREATE TABLE Routes (
    route_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL,
    departure_airport_id INTEGER NOT NULL,
    arrival_airport_id INTEGER NOT NULL,
    distance INTEGER NOT NULL CHECK (distance > 0),
    duration TIME NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (departure_airport_id) REFERENCES Airports(airport_id),
    FOREIGN KEY (arrival_airport_id) REFERENCES Airports(airport_id),
    UNIQUE(departure_airport_id, arrival_airport_id)
);
```

#### 6. Модификация таблицы Gates
```sql
CREATE TABLE Gates (
    gate_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    terminal_id INTEGER NOT NULL,
    gate_number VARCHAR(10) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    FOREIGN KEY (terminal_id) REFERENCES Terminals(terminal_id),
    UNIQUE(terminal_id, gate_number)
);
```

## Даталогическая модель нормализованной БД

### Структура таблиц:

#### 1. Users (Пользователи)
```sql
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    passport_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 2. Roles (Роли)
```sql
CREATE TABLE Roles (
    role_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. User_Roles (Пользовательские роли)
```sql
CREATE TABLE User_Roles (
    user_role_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id),
    UNIQUE(user_id, role_id)
);
```

#### 4. Aircraft_Models (Модели самолетов) - НОВАЯ ТАБЛИЦА
```sql
CREATE TABLE Aircraft_Models (
    model_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    max_range INTEGER NOT NULL CHECK (max_range > 0),
    UNIQUE(model_name, manufacturer)
);
```

#### 5. Aircraft (Самолеты) - МОДИФИЦИРОВАНА
```sql
CREATE TABLE Aircraft (
    aircraft_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    model_id INTEGER NOT NULL,
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    FOREIGN KEY (model_id) REFERENCES Aircraft_Models(model_id)
);
```

#### 6. Cities (Города) - НОВАЯ ТАБЛИЦА
```sql
CREATE TABLE Cities (
    city_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    city_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    UNIQUE(city_name, country)
);
```

#### 7. Airports (Аэропорты) - МОДИФИЦИРОВАНА
```sql
CREATE TABLE Airports (
    airport_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4) UNIQUE NOT NULL,
    airport_name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    FOREIGN KEY (city_id) REFERENCES Cities(city_id)
);
```

#### 8. Routes (Маршруты) - МОДИФИЦИРОВАНА
```sql
CREATE TABLE Routes (
    route_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL,
    departure_airport_id INTEGER NOT NULL,
    arrival_airport_id INTEGER NOT NULL,
    distance INTEGER NOT NULL CHECK (distance > 0),
    duration TIME NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (departure_airport_id) REFERENCES Airports(airport_id),
    FOREIGN KEY (arrival_airport_id) REFERENCES Airports(airport_id),
    UNIQUE(departure_airport_id, arrival_airport_id)
);
```

#### 9. Terminals (Терминалы)
```sql
CREATE TABLE Terminals (
    terminal_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    terminal_name VARCHAR(50) NOT NULL,
    terminal_code VARCHAR(10) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active',
    opening_hours VARCHAR(100)
);
```

#### 10. Gates (Гейты) - МОДИФИЦИРОВАНА
```sql
CREATE TABLE Gates (
    gate_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    terminal_id INTEGER NOT NULL,
    gate_number VARCHAR(10) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    FOREIGN KEY (terminal_id) REFERENCES Terminals(terminal_id),
    UNIQUE(terminal_id, gate_number)
);
```

#### 11. Flights (Рейсы)
```sql
CREATE TABLE Flights (
    flight_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    aircraft_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    gate_id INTEGER,
    scheduled_departure DATETIME NOT NULL,
    scheduled_arrival DATETIME NOT NULL,
    actual_departure DATETIME,
    actual_arrival DATETIME,
    status ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed') DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id),
    FOREIGN KEY (route_id) REFERENCES Routes(route_id),
    FOREIGN KEY (gate_id) REFERENCES Gates(gate_id)
);
```

#### 12. Passengers (Пассажиры)
```sql
CREATE TABLE Passengers (
    passenger_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    passport_number VARCHAR(20) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
```

#### 13. Tickets (Билеты)
```sql
CREATE TABLE Tickets (
    ticket_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    flight_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    seat_number VARCHAR(10),
    class ENUM('economy', 'business', 'first') DEFAULT 'economy',
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    status ENUM('active', 'cancelled', 'used', 'refunded') DEFAULT 'active',
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id),
    FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id)
);
```

#### 14. Baggage (Багаж)
```sql
CREATE TABLE Baggage (
    baggage_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    passenger_id INTEGER NOT NULL,
    flight_id INTEGER NOT NULL,
    baggage_tag VARCHAR(20) UNIQUE NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    status ENUM('checked_in', 'loaded', 'unloaded', 'delivered', 'lost') DEFAULT 'checked_in',
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_time TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id),
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id)
);
```

#### 15. Flight_Crew (Экипаж рейса)
```sql
CREATE TABLE Flight_Crew (
    crew_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    flight_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    position ENUM('pilot', 'co_pilot', 'flight_engineer', 'flight_attendant', 'purser') NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES Flights(flight_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    UNIQUE(flight_id, user_id, position)
);
```

#### 16. Maintenance_Records (Записи технического обслуживания)
```sql
CREATE TABLE Maintenance_Records (
    maintenance_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    aircraft_id INTEGER NOT NULL,
    maintenance_type ENUM('routine', 'repair', 'inspection', 'overhaul') NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    cost DECIMAL(10,2) CHECK (cost >= 0),
    technician_id INTEGER,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id),
    FOREIGN KEY (technician_id) REFERENCES Users(user_id)
);
```

#### 17. Audit_Logs (Журнал аудита)
```sql
CREATE TABLE Audit_Logs (
    log_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
```

## Анализ необходимости денормализации

### Обоснование денормализации:

#### 1. Таблица Flights - добавление аэропортов отправления и прибытия
**Решение:** Оставить денормализацию
**Обоснование:**
- Частые запросы на получение информации о рейсах с аэропортами
- Улучшение производительности запросов
- Уменьшение количества JOIN операций
- Данные аэропортов стабильны и редко изменяются

```sql
-- Денормализованная версия Flights
CREATE TABLE Flights (
    flight_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    aircraft_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    departure_airport_id INTEGER NOT NULL,  -- Денормализация
    arrival_airport_id INTEGER NOT NULL,    -- Денормализация
    gate_id INTEGER,
    scheduled_departure DATETIME NOT NULL,
    scheduled_arrival DATETIME NOT NULL,
    actual_departure DATETIME,
    actual_arrival DATETIME,
    status ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed') DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id),
    FOREIGN KEY (route_id) REFERENCES Routes(route_id),
    FOREIGN KEY (departure_airport_id) REFERENCES Airports(airport_id),
    FOREIGN KEY (arrival_airport_id) REFERENCES Airports(airport_id),
    FOREIGN KEY (gate_id) REFERENCES Gates(gate_id)
);
```

#### 2. Таблица Aircraft - добавление характеристик модели
**Решение:** Оставить денормализацию
**Обоснование:**
- Частые запросы на получение характеристик самолета
- Данные модели самолета стабильны
- Улучшение производительности при расчете загрузки рейсов

```sql
-- Денормализованная версия Aircraft
CREATE TABLE Aircraft (
    aircraft_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    model_id INTEGER NOT NULL,
    model_name VARCHAR(50) NOT NULL,        -- Денормализация
    manufacturer VARCHAR(50) NOT NULL,       -- Денормализация
    capacity INTEGER NOT NULL CHECK (capacity > 0),  -- Денормализация
    max_range INTEGER NOT NULL CHECK (max_range > 0), -- Денормализация
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    FOREIGN KEY (model_id) REFERENCES Aircraft_Models(model_id)
);
```

### Итоговая даталогическая модель с обоснованной денормализацией:

#### Основные принципы денормализации:
1. **Производительность запросов** - уменьшение количества JOIN операций
2. **Стабильность данных** - денормализуются только редко изменяемые данные
3. **Частота использования** - денормализуются часто запрашиваемые данные
4. **Целостность данных** - сохранение ссылочной целостности через внешние ключи

#### Контроль целостности:
- Использование триггеров для синхронизации денормализованных данных
- Регулярная проверка согласованности данных
- Логирование изменений для аудита

## Заключение

База данных приведена к третьей нормальной форме с обоснованной денормализацией для улучшения производительности. Все изменения документированы и обоснованы с точки зрения производительности и целостности данных.

### Ключевые улучшения:
1. Устранение транзитивных зависимостей
2. Создание справочных таблиц для часто используемых данных
3. Обоснованная денормализация для критически важных запросов
4. Сохранение ссылочной целостности
5. Оптимизация структуры для типичных операций системы управления аэропортом
