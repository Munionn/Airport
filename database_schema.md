# Описание сущностей базы данных системы управления аэропортом

## Список сущностей

### 1. Users (Пользователи)
**Тип связи:** Один ко многим с другими сущностями
**Описание:** Основная таблица пользователей системы

### 2. Roles (Роли)
**Тип связи:** Многие ко многим с Users
**Описание:** Роли пользователей в системе

### 3. User_Roles (Пользовательские роли)
**Тип связи:** Промежуточная таблица для связи Users и Roles
**Описание:** Связь пользователей с их ролями

### 4. Aircraft (Самолеты)
**Тип связи:** Один ко многим с Flights
**Описание:** Информация о самолетах

### 5. Flights (Рейсы)
**Тип связи:** Один ко многим с Passengers, Tickets, Flight_Crew
**Описание:** Информация о рейсах

### 6. Passengers (Пассажиры)
**Тип связи:** Один ко многим с Tickets, Baggage
**Описание:** Информация о пассажирах

### 7. Tickets (Билеты)
**Тип связи:** Многие к одному с Flights, Passengers
**Описание:** Информация о билетах

### 8. Terminals (Терминалы)
**Тип связи:** Один ко многим с Gates
**Описание:** Информация о терминалах аэропорта

### 9. Gates (Гейты)
**Тип связи:** Один ко многим с Flights
**Описание:** Информация о гейтах

### 10. Baggage (Багаж)
**Тип связи:** Многие к одному с Passengers
**Описание:** Информация о багаже пассажиров

### 11. Flight_Crew (Экипаж рейса)
**Тип связи:** Многие к одному с Flights, Users
**Описание:** Связь экипажа с рейсами

### 12. Airports (Аэропорты)
**Тип связи:** Один ко многим с Flights (аэропорт отправления и прибытия)
**Описание:** Информация об аэропортах

### 13. Routes (Маршруты)
**Тип связи:** Один ко многим с Flights
**Описание:** Информация о маршрутах

### 14. Maintenance_Records (Записи технического обслуживания)
**Тип связи:** Один ко многим с Aircraft
**Описание:** Записи о техническом обслуживании самолетов

### 15. Audit_Logs (Журнал аудита)
**Тип связи:** Один ко многим с Users
**Описание:** Журнал действий пользователей

## Типы связей в системе

1. **Один к одному (1:1):** Нет прямых связей 1:1 в данной схеме
2. **Один ко многим (1:M):** 
   - Users → Audit_Logs
   - Aircraft → Flights
   - Flights → Passengers, Tickets, Flight_Crew
   - Passengers → Tickets, Baggage
   - Terminals → Gates
   - Gates → Flights
   - Airports → Flights (отправление и прибытие)
   - Routes → Flights
   - Aircraft → Maintenance_Records

3. **Многие ко многим (M:M):**
   - Users ↔ Roles (через User_Roles)
   - Flights ↔ Users (через Flight_Crew)

4. **Многие к одному (M:1):**
   - Tickets → Flights, Passengers
   - Baggage → Passengers
   - Flight_Crew → Flights, Users
   - Flights → Aircraft, Gates, Airports, Routes
   - Maintenance_Records → Aircraft

## Детальное описание сущностей

### 1. Users (Пользователи)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| user_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| username | VARCHAR(50) | UNIQUE, NOT NULL | - |
| email | VARCHAR(100) | UNIQUE, NOT NULL | - |
| password_hash | VARCHAR(255) | NOT NULL | - |
| first_name | VARCHAR(50) | NOT NULL | - |
| last_name | VARCHAR(50) | NOT NULL | - |
| phone | VARCHAR(20) | - | - |
| date_of_birth | DATE | - | - |
| passport_number | VARCHAR(20) | UNIQUE | - |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - |
| is_active | BOOLEAN | DEFAULT TRUE | - |

**Связи:**
- Один ко многим с Audit_Logs
- Многие ко многим с Roles через User_Roles
- Один ко многим с Flight_Crew

### 2. Roles (Роли)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| role_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| role_name | VARCHAR(50) | UNIQUE, NOT NULL | - |
| description | TEXT | - | - |
| permissions | JSON | - | - |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Связи:**
- Многие ко многим с Users через User_Roles

### 3. User_Roles (Пользовательские роли)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| user_role_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | → Users(user_id) |
| role_id | INTEGER | NOT NULL, FOREIGN KEY | → Roles(role_id) |
| assigned_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| assigned_by | INTEGER | FOREIGN KEY | → Users(user_id) |

**Связи:**
- Многие к одному с Users (user_id)
- Многие к одному с Users (assigned_by)
- Многие к одному с Roles

### 4. Aircraft (Самолеты)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| aircraft_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| registration_number | VARCHAR(20) | UNIQUE, NOT NULL | - |
| model | VARCHAR(50) | NOT NULL | - |
| manufacturer | VARCHAR(50) | NOT NULL | - |
| capacity | INTEGER | NOT NULL, CHECK (capacity > 0) | - |
| max_range | INTEGER | NOT NULL, CHECK (max_range > 0) | - |
| status | ENUM('active', 'maintenance', 'retired') | DEFAULT 'active' | - |
| purchase_date | DATE | - | - |
| last_maintenance | DATE | - | - |
| next_maintenance | DATE | - | - |

**Связи:**
- Один ко многим с Flights
- Один ко многим с Maintenance_Records

### 5. Flights (Рейсы)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| flight_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| flight_number | VARCHAR(10) | UNIQUE, NOT NULL | - |
| aircraft_id | INTEGER | NOT NULL, FOREIGN KEY | → Aircraft(aircraft_id) |
| departure_airport_id | INTEGER | NOT NULL, FOREIGN KEY | → Airports(airport_id) |
| arrival_airport_id | INTEGER | NOT NULL, FOREIGN KEY | → Airports(airport_id) |
| route_id | INTEGER | NOT NULL, FOREIGN KEY | → Routes(route_id) |
| gate_id | INTEGER | FOREIGN KEY | → Gates(gate_id) |
| scheduled_departure | DATETIME | NOT NULL | - |
| scheduled_arrival | DATETIME | NOT NULL | - |
| actual_departure | DATETIME | - | - |
| actual_arrival | DATETIME | - | - |
| status | ENUM('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed') | DEFAULT 'scheduled' | - |
| price | DECIMAL(10,2) | NOT NULL, CHECK (price >= 0) | - |

**Связи:**
- Многие к одному с Aircraft
- Многие к одному с Airports (отправление и прибытие)
- Многие к одному с Routes
- Многие к одному с Gates
- Один ко многим с Passengers, Tickets, Flight_Crew

### 6. Passengers (Пассажиры)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| passenger_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| user_id | INTEGER | FOREIGN KEY | → Users(user_id) |
| first_name | VARCHAR(50) | NOT NULL | - |
| last_name | VARCHAR(50) | NOT NULL | - |
| passport_number | VARCHAR(20) | NOT NULL | - |
| nationality | VARCHAR(50) | NOT NULL | - |
| date_of_birth | DATE | NOT NULL | - |
| phone | VARCHAR(20) | - | - |
| email | VARCHAR(100) | - | - |
| special_requirements | TEXT | - | - |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Связи:**
- Многие к одному с Users (опционально)
- Один ко многим с Tickets, Baggage

### 7. Tickets (Билеты)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| ticket_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| ticket_number | VARCHAR(20) | UNIQUE, NOT NULL | - |
| flight_id | INTEGER | NOT NULL, FOREIGN KEY | → Flights(flight_id) |
| passenger_id | INTEGER | NOT NULL, FOREIGN KEY | → Passengers(passenger_id) |
| seat_number | VARCHAR(10) | - | - |
| class | ENUM('economy', 'business', 'first') | DEFAULT 'economy' | - |
| price | DECIMAL(10,2) | NOT NULL, CHECK (price >= 0) | - |
| status | ENUM('active', 'cancelled', 'used', 'refunded') | DEFAULT 'active' | - |
| purchase_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| check_in_time | TIMESTAMP | - | - |

**Связи:**
- Многие к одному с Flights
- Многие к одному с Passengers

### 8. Terminals (Терминалы)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| terminal_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| terminal_name | VARCHAR(50) | NOT NULL | - |
| terminal_code | VARCHAR(10) | UNIQUE, NOT NULL | - |
| capacity | INTEGER | NOT NULL, CHECK (capacity > 0) | - |
| status | ENUM('active', 'maintenance', 'closed') | DEFAULT 'active' | - |
| opening_hours | VARCHAR(100) | - | - |

**Связи:**
- Один ко многим с Gates

### 9. Gates (Гейты)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| gate_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| terminal_id | INTEGER | NOT NULL, FOREIGN KEY | → Terminals(terminal_id) |
| gate_number | VARCHAR(10) | NOT NULL | - |
| status | ENUM('available', 'occupied', 'maintenance') | DEFAULT 'available' | - |
| capacity | INTEGER | NOT NULL, CHECK (capacity > 0) | - |

**Связи:**
- Многие к одному с Terminals
- Один ко многим с Flights

### 10. Baggage (Багаж)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| baggage_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| passenger_id | INTEGER | NOT NULL, FOREIGN KEY | → Passengers(passenger_id) |
| flight_id | INTEGER | NOT NULL, FOREIGN KEY | → Flights(flight_id) |
| baggage_tag | VARCHAR(20) | UNIQUE, NOT NULL | - |
| weight | DECIMAL(5,2) | NOT NULL, CHECK (weight > 0) | - |
| status | ENUM('checked_in', 'loaded', 'unloaded', 'delivered', 'lost') | DEFAULT 'checked_in' | - |
| check_in_time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |
| delivery_time | TIMESTAMP | - | - |

**Связи:**
- Многие к одному с Passengers
- Многие к одному с Flights

### 11. Flight_Crew (Экипаж рейса)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| crew_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| flight_id | INTEGER | NOT NULL, FOREIGN KEY | → Flights(flight_id) |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | → Users(user_id) |
| position | ENUM('pilot', 'co_pilot', 'flight_engineer', 'flight_attendant', 'purser') | NOT NULL | - |
| assigned_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Связи:**
- Многие к одному с Flights
- Многие к одному с Users

### 12. Airports (Аэропорты)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| airport_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| iata_code | VARCHAR(3) | UNIQUE, NOT NULL | - |
| icao_code | VARCHAR(4) | UNIQUE, NOT NULL | - |
| airport_name | VARCHAR(100) | NOT NULL | - |
| city | VARCHAR(50) | NOT NULL | - |
| country | VARCHAR(50) | NOT NULL | - |
| timezone | VARCHAR(50) | NOT NULL | - |
| latitude | DECIMAL(10,8) | - | - |
| longitude | DECIMAL(11,8) | - | - |

**Связи:**
- Один ко многим с Flights (отправление и прибытие)

### 13. Routes (Маршруты)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| route_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| route_name | VARCHAR(100) | NOT NULL | - |
| departure_airport_id | INTEGER | NOT NULL, FOREIGN KEY | → Airports(airport_id) |
| arrival_airport_id | INTEGER | NOT NULL, FOREIGN KEY | → Airports(airport_id) |
| distance | INTEGER | NOT NULL, CHECK (distance > 0) | - |
| duration | TIME | NOT NULL | - |
| status | ENUM('active', 'inactive') | DEFAULT 'active' | - |

**Связи:**
- Многие к одному с Airports (отправление и прибытие)
- Один ко многим с Flights

### 14. Maintenance_Records (Записи технического обслуживания)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| maintenance_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| aircraft_id | INTEGER | NOT NULL, FOREIGN KEY | → Aircraft(aircraft_id) |
| maintenance_type | ENUM('routine', 'repair', 'inspection', 'overhaul') | NOT NULL | - |
| description | TEXT | NOT NULL | - |
| start_date | DATE | NOT NULL | - |
| end_date | DATE | - | - |
| cost | DECIMAL(10,2) | CHECK (cost >= 0) | - |
| technician_id | INTEGER | FOREIGN KEY | → Users(user_id) |
| status | ENUM('scheduled', 'in_progress', 'completed', 'cancelled') | DEFAULT 'scheduled' | - |

**Связи:**
- Многие к одному с Aircraft
- Многие к одному с Users (техник)

### 15. Audit_Logs (Журнал аудита)
| Поле | Тип | Ограничения | Связи |
|------|-----|-------------|-------|
| log_id | INTEGER | PRIMARY KEY, NOT NULL, AUTO_INCREMENT | - |
| user_id | INTEGER | FOREIGN KEY | → Users(user_id) |
| action | VARCHAR(100) | NOT NULL | - |
| table_name | VARCHAR(50) | NOT NULL | - |
| record_id | INTEGER | - | - |
| old_values | JSON | - | - |
| new_values | JSON | - | - |
| ip_address | VARCHAR(45) | - | - |
| user_agent | TEXT | - | - |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | - |

**Связи:**
- Многие к одному с Users
