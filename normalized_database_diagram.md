# Диаграмма нормализованной базы данных

## ER-диаграмма нормализованной БД системы управления аэропортом

```mermaid
erDiagram
    Users {
        int user_id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar phone
        date date_of_birth
        varchar passport_number UK
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    Roles {
        int role_id PK
        varchar role_name UK
        text description
        json permissions
        timestamp created_at
    }
    
    User_Roles {
        int user_role_id PK
        int user_id FK
        int role_id FK
        timestamp assigned_at
        int assigned_by FK
    }
    
    Aircraft_Models {
        int model_id PK
        varchar model_name
        varchar manufacturer
        int capacity
        int max_range
    }
    
    Aircraft {
        int aircraft_id PK
        varchar registration_number UK
        int model_id FK
        varchar model_name
        varchar manufacturer
        int capacity
        int max_range
        enum status
        date purchase_date
        date last_maintenance
        date next_maintenance
    }
    
    Cities {
        int city_id PK
        varchar city_name
        varchar country
        varchar timezone
    }
    
    Airports {
        int airport_id PK
        varchar iata_code UK
        varchar icao_code UK
        varchar airport_name
        int city_id FK
        decimal latitude
        decimal longitude
    }
    
    Routes {
        int route_id PK
        varchar route_name
        int departure_airport_id FK
        int arrival_airport_id FK
        int distance
        time duration
        enum status
    }
    
    Terminals {
        int terminal_id PK
        varchar terminal_name
        varchar terminal_code UK
        int capacity
        enum status
        varchar opening_hours
    }
    
    Gates {
        int gate_id PK
        int terminal_id FK
        varchar gate_number
        enum status
        int capacity
    }
    
    Flights {
        int flight_id PK
        varchar flight_number UK
        int aircraft_id FK
        int route_id FK
        int departure_airport_id FK
        int arrival_airport_id FK
        int gate_id FK
        datetime scheduled_departure
        datetime scheduled_arrival
        datetime actual_departure
        datetime actual_arrival
        enum status
        decimal price
    }
    
    Passengers {
        int passenger_id PK
        int user_id FK
        varchar first_name
        varchar last_name
        varchar passport_number
        varchar nationality
        date date_of_birth
        varchar phone
        varchar email
        text special_requirements
        timestamp created_at
    }
    
    Tickets {
        int ticket_id PK
        varchar ticket_number UK
        int flight_id FK
        int passenger_id FK
        varchar seat_number
        enum class
        decimal price
        enum status
        timestamp purchase_date
        timestamp check_in_time
    }
    
    Baggage {
        int baggage_id PK
        int passenger_id FK
        int flight_id FK
        varchar baggage_tag UK
        decimal weight
        enum status
        timestamp check_in_time
        timestamp delivery_time
    }
    
    Flight_Crew {
        int crew_id PK
        int flight_id FK
        int user_id FK
        enum position
        timestamp assigned_at
    }
    
    Maintenance_Records {
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
    
    Audit_Logs {
        int log_id PK
        int user_id FK
        varchar action
        varchar table_name
        int record_id
        json old_values
        json new_values
        varchar ip_address
        text user_agent
        timestamp timestamp
    }

    %% Связи
    Users ||--o{ User_Roles : "has"
    Roles ||--o{ User_Roles : "assigned to"
    Users ||--o{ User_Roles : "assigned by"
    
    Aircraft_Models ||--o{ Aircraft : "model of"
    
    Cities ||--o{ Airports : "located in"
    
    Airports ||--o{ Routes : "departure"
    Airports ||--o{ Routes : "arrival"
    Airports ||--o{ Flights : "departure"
    Airports ||--o{ Flights : "arrival"
    
    Routes ||--o{ Flights : "follows"
    
    Terminals ||--o{ Gates : "contains"
    Gates ||--o{ Flights : "assigned to"
    
    Aircraft ||--o{ Flights : "operates"
    Aircraft ||--o{ Maintenance_Records : "maintained"
    
    Users ||--o{ Passengers : "can be"
    Users ||--o{ Flight_Crew : "works as"
    Users ||--o{ Maintenance_Records : "performs"
    Users ||--o{ Audit_Logs : "performs"
    
    Flights ||--o{ Passengers : "carries"
    Flights ||--o{ Tickets : "sold for"
    Flights ||--o{ Baggage : "transports"
    Flights ||--o{ Flight_Crew : "staffed by"
    
    Passengers ||--o{ Tickets : "purchases"
    Passengers ||--o{ Baggage : "owns"
```

## Описание изменений в нормализации

### Новые таблицы:
1. **Aircraft_Models** - справочник моделей самолетов
2. **Cities** - справочник городов и стран

### Модифицированные таблицы:
1. **Aircraft** - добавлена связь с Aircraft_Models, денормализованы характеристики модели
2. **Airports** - добавлена связь с Cities
3. **Routes** - добавлен уникальный ключ по паре аэропортов
4. **Gates** - добавлен уникальный ключ по терминалу и номеру гейта
5. **Flights** - денормализованы аэропорты отправления и прибытия

### Обоснование денормализации:
- **Aircraft**: характеристики модели денормализованы для быстрого доступа при расчетах загрузки
- **Flights**: аэропорты денормализованы для частых запросов информации о рейсах без JOIN операций

### Преимущества нормализации:
1. Устранение транзитивных зависимостей
2. Снижение избыточности данных
3. Улучшение целостности данных
4. Упрощение обновлений справочной информации

### Преимущества денормализации:
1. Повышение производительности запросов
2. Уменьшение сложности запросов
3. Оптимизация для типичных операций системы
