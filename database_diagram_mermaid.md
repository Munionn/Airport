# Mermaid ER-диаграмма базы данных аэропорта

```mermaid
erDiagram
    USERS {
        int user_id PK
        string username UK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        date date_of_birth
        string passport_number UK
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }

    ROLES {
        int role_id PK
        string role_name UK
        text description
        json permissions
        timestamp created_at
    }

    USER_ROLES {
        int user_role_id PK
        int user_id FK
        int role_id FK
        timestamp assigned_at
        int assigned_by FK
    }

    AIRCRAFT {
        int aircraft_id PK
        string registration_number UK
        string model
        string manufacturer
        int capacity
        int max_range
        enum status
        date purchase_date
        date last_maintenance
        date next_maintenance
    }

    FLIGHTS {
        int flight_id PK
        string flight_number UK
        int aircraft_id FK
        int departure_airport_id FK
        int arrival_airport_id FK
        int route_id FK
        int gate_id FK
        datetime scheduled_departure
        datetime scheduled_arrival
        datetime actual_departure
        datetime actual_arrival
        enum status
        decimal price
    }

    PASSENGERS {
        int passenger_id PK
        int user_id FK
        string first_name
        string last_name
        string passport_number
        string nationality
        date date_of_birth
        string phone
        string email
        text special_requirements
        timestamp created_at
    }

    TICKETS {
        int ticket_id PK
        string ticket_number UK
        int flight_id FK
        int passenger_id FK
        string seat_number
        enum class
        decimal price
        enum status
        timestamp purchase_date
        timestamp check_in_time
    }

    TERMINALS {
        int terminal_id PK
        string terminal_name
        string terminal_code UK
        int capacity
        enum status
        string opening_hours
    }

    GATES {
        int gate_id PK
        int terminal_id FK
        string gate_number
        enum status
        int capacity
    }

    BAGGAGE {
        int baggage_id PK
        int passenger_id FK
        int flight_id FK
        string baggage_tag UK
        decimal weight
        enum status
        timestamp check_in_time
        timestamp delivery_time
    }

    AIRPORTS {
        int airport_id PK
        string iata_code UK
        string icao_code UK
        string airport_name
        string city
        string country
        string timezone
        decimal latitude
        decimal longitude
    }

    ROUTES {
        int route_id PK
        string route_name
        int departure_airport_id FK
        int arrival_airport_id FK
        int distance
        time duration
        enum status
    }

    FLIGHT_CREW {
        int crew_id PK
        int flight_id FK
        int user_id FK
        enum position
        timestamp assigned_at
    }

    MAINTENANCE_RECORDS {
        int maintenance_id PK
        int aircraft_id FK
        enum maintenance_type
        text description
        date start_date
        date end_date
        decimal cost
        int technician_id FK
        enum status
    }

    AUDIT_LOGS {
        int log_id PK
        int user_id FK
        string action
        string table_name
        int record_id
        json old_values
        json new_values
        string ip_address
        text user_agent
        timestamp timestamp
    }

    %% Связи
    USERS ||--o{ AUDIT_LOGS : "creates"
    USERS ||--o{ USER_ROLES : "has"
    ROLES ||--o{ USER_ROLES : "assigned_to"
    USERS ||--o{ USER_ROLES : "assigned_by"
    
    AIRCRAFT ||--o{ FLIGHTS : "operates"
    AIRCRAFT ||--o{ MAINTENANCE_RECORDS : "maintained"
    
    FLIGHTS ||--o{ TICKETS : "has"
    FLIGHTS ||--o{ BAGGAGE : "transports"
    FLIGHTS ||--o{ FLIGHT_CREW : "staffed_by"
    
    PASSENGERS ||--o{ TICKETS : "purchases"
    PASSENGERS ||--o{ BAGGAGE : "owns"
    USERS ||--o| PASSENGERS : "profile"
    
    TERMINALS ||--o{ GATES : "contains"
    GATES ||--o{ FLIGHTS : "serves"
    
    AIRPORTS ||--o{ FLIGHTS : "departure"
    AIRPORTS ||--o{ FLIGHTS : "arrival"
    AIRPORTS ||--o{ ROUTES : "departure"
    AIRPORTS ||--o{ ROUTES : "arrival"
    
    ROUTES ||--o{ FLIGHTS : "follows"
    
    USERS ||--o{ FLIGHT_CREW : "works_as"
    USERS ||--o{ MAINTENANCE_RECORDS : "performs"
```

## Описание связей

### Связи "Один ко многим" (1:M):
- **USERS → AUDIT_LOGS** - один пользователь создает много записей в журнале
- **AIRCRAFT → FLIGHTS** - один самолет выполняет много рейсов
- **AIRCRAFT → MAINTENANCE_RECORDS** - один самолет имеет много записей обслуживания
- **FLIGHTS → TICKETS** - один рейс имеет много билетов
- **FLIGHTS → BAGGAGE** - один рейс перевозит много багажа
- **FLIGHTS → FLIGHT_CREW** - один рейс обслуживается многими членами экипажа
- **PASSENGERS → TICKETS** - один пассажир покупает много билетов
- **PASSENGERS → BAGGAGE** - один пассажир имеет много единиц багажа
- **TERMINALS → GATES** - один терминал содержит много гейтов
- **GATES → FLIGHTS** - один гейт обслуживает много рейсов
- **AIRPORTS → FLIGHTS** - один аэропорт является отправлением/прибытием для многих рейсов
- **AIRPORTS → ROUTES** - один аэропорт участвует в многих маршрутах
- **ROUTES → FLIGHTS** - один маршрут используется для многих рейсов
- **USERS → FLIGHT_CREW** - один пользователь работает на многих рейсах
- **USERS → MAINTENANCE_RECORDS** - один пользователь выполняет много работ по обслуживанию

### Связи "Многие ко многим" (M:M):
- **USERS ↔ ROLES** (через USER_ROLES) - пользователь может иметь несколько ролей, роль может быть назначена нескольким пользователям
- **FLIGHTS ↔ USERS** (через FLIGHT_CREW) - рейс может иметь несколько членов экипажа, пользователь может работать на нескольких рейсах

### Связи "Один к одному" (1:1):
- **USERS ↔ PASSENGERS** - пользователь может иметь профиль пассажира (опционально)

## Особенности диаграммы

1. **Первичные ключи (PK)** - уникальные идентификаторы сущностей
2. **Внешние ключи (FK)** - ссылки на первичные ключи других таблиц
3. **Уникальные ключи (UK)** - поля с ограничением уникальности
4. **Типы данных** - указаны основные типы (int, string, date, enum, etc.)
5. **Связи** - показаны все типы связей между сущностями

## Использование диаграммы

Эта Mermaid диаграмма может быть отображена в:
- GitHub/GitLab (автоматически)
- VS Code с расширением Mermaid
- Онлайн редакторах (mermaid.live)
- Документации проектов

Диаграмма наглядно показывает структуру базы данных и все взаимосвязи между сущностями системы управления аэропортом.
