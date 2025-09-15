# Схематичное изображение не нормализованной схемы БД

## ER-диаграмма системы управления аэропортом

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     USERS       │    │     ROLES       │    │  USER_ROLES     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ user_id (PK)    │◄───┤ role_id (PK)    │    │ user_role_id(PK)│
│ username        │    │ role_name       │    │ user_id (FK)    │
│ email           │    │ description     │    │ role_id (FK)    │
│ password_hash   │    │ permissions     │    │ assigned_at     │
│ first_name      │    │ created_at      │    │ assigned_by(FK) │
│ last_name       │    └─────────────────┘    └─────────────────┘
│ phone           │           │                       │
│ date_of_birth   │           └───────────────────────┘
│ passport_number │
│ created_at      │
│ updated_at      │
│ is_active       │
└─────────────────┘
         │
         │ 1:M
         ▼
┌─────────────────┐
│  AUDIT_LOGS     │
├─────────────────┤
│ log_id (PK)     │
│ user_id (FK)    │
│ action          │
│ table_name      │
│ record_id       │
│ old_values      │
│ new_values      │
│ ip_address      │
│ user_agent      │
│ timestamp       │
└─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    AIRCRAFT     │    │     FLIGHTS     │    │   PASSENGERS    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ aircraft_id(PK) │◄───┤ flight_id (PK)  │    │ passenger_id(PK)│
│ registration_no │    │ flight_number   │    │ user_id (FK)    │
│ model           │    │ aircraft_id(FK) │    │ first_name      │
│ manufacturer    │    │ dep_airport_id  │    │ last_name       │
│ capacity        │    │ arr_airport_id  │    │ passport_number │
│ max_range       │    │ route_id (FK)   │    │ nationality     │
│ status          │    │ gate_id (FK)    │    │ date_of_birth   │
│ purchase_date   │    │ sched_departure │    │ phone           │
│ last_maintenance│    │ sched_arrival   │    │ email           │
│ next_maintenance│    │ actual_departure│    │ special_req     │
└─────────────────┘    │ actual_arrival  │    │ created_at      │
         │              │ status          │    └─────────────────┘
         │ 1:M          │ price           │             │
         ▼              └─────────────────┘             │ 1:M
┌─────────────────┐             │                       ▼
│MAINTENANCE_REC  │             │ 1:M              ┌─────────────────┐
├─────────────────┤             ▼                  │     TICKETS     │
│ maintenance_id  │    ┌─────────────────┐         ├─────────────────┤
│ aircraft_id(FK) │    │  FLIGHT_CREW    │         │ ticket_id (PK)  │
│ maintenance_type│    ├─────────────────┤         │ ticket_number   │
│ description     │    │ crew_id (PK)    │         │ flight_id (FK)  │
│ start_date      │    │ flight_id (FK)  │         │ passenger_id(FK)│
│ end_date        │    │ user_id (FK)    │         │ seat_number     │
│ cost            │    │ position        │         │ class           │
│ technician_id   │    │ assigned_at     │         │ price           │
│ status          │    └─────────────────┘         │ status          │
└─────────────────┘                               │ purchase_date   │
                                                  │ check_in_time   │
                                                  └─────────────────┘
                                                           │
                                                           │ 1:M
                                                           ▼
                                                  ┌─────────────────┐
                                                  │     BAGGAGE     │
                                                  ├─────────────────┤
                                                  │ baggage_id (PK) │
                                                  │ passenger_id(FK)│
                                                  │ flight_id (FK)  │
                                                  │ baggage_tag     │
                                                  │ weight          │
                                                  │ status          │
                                                  │ check_in_time   │
                                                  │ delivery_time   │
                                                  └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TERMINALS     │    │      GATES      │    │    AIRPORTS     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ terminal_id(PK) │◄───┤ gate_id (PK)    │    │ airport_id (PK) │
│ terminal_name   │    │ terminal_id(FK) │    │ iata_code       │
│ terminal_code   │    │ gate_number     │    │ icao_code       │
│ capacity        │    │ status          │    │ airport_name    │
│ status          │    │ capacity        │    │ city            │
│ opening_hours   │    └─────────────────┘    │ country         │
└─────────────────┘             │              │ timezone        │
                                │ 1:M          │ latitude        │
                                ▼              │ longitude       │
                        ┌─────────────────┐    └─────────────────┘
                        │     FLIGHTS     │             │
                        ├─────────────────┤             │ 1:M
                        │ flight_id (PK)  │             ▼
                        │ flight_number   │    ┌─────────────────┐
                        │ aircraft_id(FK) │    │     ROUTES      │
                        │ dep_airport_id  │    ├─────────────────┤
                        │ arr_airport_id  │    │ route_id (PK)   │
                        │ route_id (FK)   │    │ route_name      │
                        │ gate_id (FK)    │    │ dep_airport_id  │
                        │ sched_departure │    │ arr_airport_id  │
                        │ sched_arrival   │    │ distance        │
                        │ actual_departure│    │ duration        │
                        │ actual_arrival  │    │ status          │
                        │ status          │    └─────────────────┘
                        │ price           │             │
                        └─────────────────┘             │ 1:M
                                                       ▼
                                              ┌─────────────────┐
                                              │     FLIGHTS     │
                                              └─────────────────┘
```

## Описание связей

### Связи "Один ко многим" (1:M):
1. **Users → Audit_Logs** - один пользователь может иметь много записей в журнале
2. **Aircraft → Flights** - один самолет может выполнять много рейсов
3. **Aircraft → Maintenance_Records** - один самолет может иметь много записей обслуживания
4. **Flights → Passengers** - один рейс может иметь много пассажиров
5. **Flights → Tickets** - один рейс может иметь много билетов
6. **Flights → Flight_Crew** - один рейс может иметь много членов экипажа
7. **Passengers → Tickets** - один пассажир может иметь много билетов
8. **Passengers → Baggage** - один пассажир может иметь много единиц багажа
9. **Terminals → Gates** - один терминал может иметь много гейтов
10. **Gates → Flights** - один гейт может обслуживать много рейсов
11. **Airports → Flights** - один аэропорт может быть отправлением/прибытием для многих рейсов
12. **Routes → Flights** - один маршрут может использоваться для многих рейсов

### Связи "Многие ко многим" (M:M):
1. **Users ↔ Roles** (через User_Roles) - пользователь может иметь несколько ролей, роль может быть назначена нескольким пользователям
2. **Flights ↔ Users** (через Flight_Crew) - рейс может иметь несколько членов экипажа, пользователь может работать на нескольких рейсах

### Связи "Многие к одному" (M:1):
1. **Tickets → Flights** - много билетов принадлежат одному рейсу
2. **Tickets → Passengers** - много билетов принадлежат одному пассажиру
3. **Baggage → Passengers** - много единиц багажа принадлежат одному пассажиру
4. **Baggage → Flights** - много единиц багажа перевозятся одним рейсом
5. **Flight_Crew → Flights** - много членов экипажа работают на одном рейсе
6. **Flight_Crew → Users** - много записей экипажа относятся к одному пользователю
7. **Maintenance_Records → Aircraft** - много записей обслуживания относятся к одному самолету
8. **Maintenance_Records → Users** - много записей обслуживания могут быть выполнены одним техником

## Особенности не нормализованной схемы

Данная схема является не нормализованной, так как содержит:

1. **Дублирование данных** - информация о пассажирах может дублироваться в таблицах Users и Passengers
2. **Избыточность** - некоторые поля могут быть вычисляемыми (например, возраст пассажира)
3. **Смешанные уровни абстракции** - в одной таблице могут храниться данные разного уровня детализации
4. **Потенциальные аномалии** - при изменении данных в одной таблице может потребоваться обновление в нескольких местах

## Ключевые сущности и их назначение

- **Users** - центральная сущность для всех пользователей системы
- **Flights** - основная бизнес-сущность, связывающая самолеты, пассажиров и маршруты
- **Aircraft** - управление парком самолетов
- **Passengers** - информация о пассажирах
- **Tickets** - коммерческая информация о билетах
- **Airports/Routes** - географическая и маршрутная информация
- **Terminals/Gates** - инфраструктура аэропорта
- **Audit_Logs** - система аудита и безопасности
