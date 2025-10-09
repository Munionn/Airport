-- Физическая модель базы данных системы управления аэропортом для PostgreSQL
-- Создание базы данных, пользователя и таблиц с ограничениями

-- =====================================================
-- СОЗДАНИЕ БАЗЫ ДАННЫХ И ПОЛЬЗОВАТЕЛЯ
-- =====================================================

-- Создание пользователя (выполнить от имени postgres)
-- CREATE USER airport_admin WITH PASSWORD 'airport123';
-- CREATE DATABASE airport_management_system OWNER airport_admin;
-- GRANT ALL PRIVILEGES ON DATABASE airport_management_system TO airport_admin;

-- Подключение к базе данных
\c airport_management_system;

-- Включение расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦ С ОГРАНИЧЕНИЯМИ
-- =====================================================

-- 1. Создание таблицы Users (Пользователи)
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    passport_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ограничения
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT chk_passport_format CHECK (passport_number IS NULL OR passport_number ~* '^[A-Z0-9]{6,20}$'),
    CONSTRAINT chk_age CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '16 years')
);

-- Создание индекса для поиска по email
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_username ON Users(username);

-- 2. Создание таблицы Roles (Роли)
CREATE TABLE Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT chk_role_name CHECK (role_name ~* '^[a-z_]+$')
);

-- 3. Создание таблицы User_Roles (Пользовательские роли)
CREATE TABLE User_Roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    
    -- Внешние ключи
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    
    -- Ограничения
    CONSTRAINT uk_user_role UNIQUE(user_id, role_id),
    CONSTRAINT chk_not_self_assignment CHECK (assigned_by IS NULL OR assigned_by != user_id)
);

-- 4. Создание таблицы Aircraft_Models (Модели самолетов)
CREATE TABLE Aircraft_Models (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    max_range INTEGER NOT NULL,
    
    -- Ограничения
    CONSTRAINT chk_capacity CHECK (capacity > 0 AND capacity <= 1000),
    CONSTRAINT chk_max_range CHECK (max_range > 0 AND max_range <= 20000),
    CONSTRAINT uk_model_manufacturer UNIQUE(model_name, manufacturer)
);

-- 5. Создание таблицы Aircraft (Самолеты)
CREATE TABLE Aircraft (
    aircraft_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    model_id INTEGER NOT NULL,
    model_name VARCHAR(50) NOT NULL,        -- Денормализация
    manufacturer VARCHAR(50) NOT NULL,       -- Денормализация
    capacity INTEGER NOT NULL,              -- Денормализация
    max_range INTEGER NOT NULL,             -- Денормализация
    status VARCHAR(20) DEFAULT 'active',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    
    -- Внешние ключи
    CONSTRAINT fk_aircraft_model FOREIGN KEY (model_id) REFERENCES Aircraft_Models(model_id) ON DELETE RESTRICT,
    
    -- Ограничения
    CONSTRAINT chk_registration_format CHECK (registration_number ~* '^[A-Z]{2}-[0-9]{4,5}$'),
    CONSTRAINT chk_status CHECK (status IN ('active', 'maintenance', 'retired')),
    CONSTRAINT chk_capacity_aircraft CHECK (capacity > 0 AND capacity <= 1000),
    CONSTRAINT chk_max_range_aircraft CHECK (max_range > 0 AND max_range <= 20000),
    CONSTRAINT chk_maintenance_dates CHECK (
        (last_maintenance IS NULL OR purchase_date IS NULL OR last_maintenance >= purchase_date) AND
        (next_maintenance IS NULL OR last_maintenance IS NULL OR next_maintenance >= last_maintenance)
    )
);

-- 6. Создание таблицы Cities (Города)
CREATE TABLE Cities (
    city_id SERIAL PRIMARY KEY,
    city_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    
    -- Ограничения
    CONSTRAINT uk_city_country UNIQUE(city_name, country),
    CONSTRAINT chk_timezone_format CHECK (timezone ~* '^[A-Za-z_/]+$')
);

-- 7. Создание таблицы Airports (Аэропорты)
CREATE TABLE Airports (
    airport_id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4) UNIQUE NOT NULL,
    airport_name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Внешние ключи
    CONSTRAINT fk_airports_city FOREIGN KEY (city_id) REFERENCES Cities(city_id) ON DELETE RESTRICT,
    
    -- Ограничения
    CONSTRAINT chk_iata_format CHECK (iata_code ~* '^[A-Z]{3}$'),
    CONSTRAINT chk_icao_format CHECK (icao_code ~* '^[A-Z]{4}$'),
    CONSTRAINT chk_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT chk_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

-- 8. Создание таблицы Routes (Маршруты)
CREATE TABLE Routes (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    departure_airport_id INTEGER NOT NULL,
    arrival_airport_id INTEGER NOT NULL,
    distance INTEGER NOT NULL,
    duration INTERVAL NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    
    -- Внешние ключи
    CONSTRAINT fk_routes_departure FOREIGN KEY (departure_airport_id) REFERENCES Airports(airport_id) ON DELETE RESTRICT,
    CONSTRAINT fk_routes_arrival FOREIGN KEY (arrival_airport_id) REFERENCES Airports(airport_id) ON DELETE RESTRICT,
    
    -- Ограничения
    CONSTRAINT chk_distance CHECK (distance > 0 AND distance <= 20000),
    CONSTRAINT chk_duration CHECK (duration > INTERVAL '0 minutes' AND duration <= INTERVAL '24 hours'),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT chk_different_airports CHECK (departure_airport_id != arrival_airport_id),
    CONSTRAINT uk_route_airports UNIQUE(departure_airport_id, arrival_airport_id)
);

-- 9. Создание таблицы Terminals (Терминалы)
CREATE TABLE Terminals (
    terminal_id SERIAL PRIMARY KEY,
    terminal_name VARCHAR(50) NOT NULL,
    terminal_code VARCHAR(10) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    opening_hours VARCHAR(100),
    
    -- Ограничения
    CONSTRAINT chk_terminal_capacity CHECK (capacity > 0 AND capacity <= 100000),
    CONSTRAINT chk_terminal_status CHECK (status IN ('active', 'maintenance', 'closed')),
    CONSTRAINT chk_terminal_code CHECK (terminal_code ~* '^[A-Z0-9]{1,10}$')
);

-- 10. Создание таблицы Gates (Гейты)
CREATE TABLE Gates (
    gate_id SERIAL PRIMARY KEY,
    terminal_id INTEGER NOT NULL,
    gate_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    capacity INTEGER NOT NULL,
    
    -- Внешние ключи
    CONSTRAINT fk_gates_terminal FOREIGN KEY (terminal_id) REFERENCES Terminals(terminal_id) ON DELETE CASCADE,
    
    -- Ограничения
    CONSTRAINT chk_gate_capacity CHECK (capacity > 0 AND capacity <= 1000),
    CONSTRAINT chk_gate_status CHECK (status IN ('available', 'occupied', 'maintenance')),
    CONSTRAINT chk_gate_number CHECK (gate_number ~* '^[A-Z0-9]{1,10}$'),
    CONSTRAINT uk_gate_terminal UNIQUE(terminal_id, gate_number)
);

-- 11. Создание таблицы Flights (Рейсы)
CREATE TABLE Flights (
    flight_id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    aircraft_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    departure_airport_id INTEGER NOT NULL,  -- Денормализация
    arrival_airport_id INTEGER NOT NULL,     -- Денормализация
    gate_id INTEGER,
    scheduled_departure TIMESTAMP NOT NULL,
    scheduled_arrival TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL,
    
    -- Внешние ключи
    CONSTRAINT fk_flights_aircraft FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id) ON DELETE RESTRICT,
    CONSTRAINT fk_flights_route FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE RESTRICT,
    CONSTRAINT fk_flights_departure FOREIGN KEY (departure_airport_id) REFERENCES Airports(airport_id) ON DELETE RESTRICT,
    CONSTRAINT fk_flights_arrival FOREIGN KEY (arrival_airport_id) REFERENCES Airports(airport_id) ON DELETE RESTRICT,
    CONSTRAINT fk_flights_gate FOREIGN KEY (gate_id) REFERENCES Gates(gate_id) ON DELETE SET NULL,
    
    -- Ограничения
    CONSTRAINT chk_flight_number CHECK (flight_number ~* '^[A-Z]{2,3}[0-9]{3,4}$'),
    CONSTRAINT chk_price CHECK (price >= 0 AND price <= 100000),
    CONSTRAINT chk_flight_status CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed')),
    CONSTRAINT chk_scheduled_times CHECK (scheduled_arrival > scheduled_departure),
    CONSTRAINT chk_actual_times CHECK (
        (actual_departure IS NULL OR actual_departure >= scheduled_departure - INTERVAL '2 hours') AND
        (actual_arrival IS NULL OR actual_arrival >= scheduled_arrival - INTERVAL '2 hours')
    ),
    CONSTRAINT chk_different_airports_flight CHECK (departure_airport_id != arrival_airport_id)
);

-- 12. Создание таблицы Passengers (Пассажиры)
CREATE TABLE Passengers (
    passenger_id SERIAL PRIMARY KEY,
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
    
    -- Внешние ключи
    CONSTRAINT fk_passengers_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    
    -- Ограничения
    CONSTRAINT chk_passenger_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_passenger_phone CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT chk_passenger_passport CHECK (passport_number ~* '^[A-Z0-9]{6,20}$'),
    CONSTRAINT chk_passenger_age CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '0 years')
);

-- 13. Создание таблицы Tickets (Билеты)
CREATE TABLE Tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    flight_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    seat_number VARCHAR(10),
    class VARCHAR(20) DEFAULT 'economy',
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_tickets_flight FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_passenger FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id) ON DELETE CASCADE,
    
    -- Ограничения
    CONSTRAINT chk_ticket_number CHECK (ticket_number ~* '^[A-Z0-9]{6,20}$'),
    CONSTRAINT chk_ticket_class CHECK (class IN ('economy', 'business', 'first')),
    CONSTRAINT chk_ticket_price CHECK (price >= 0 AND price <= 100000),
    CONSTRAINT chk_ticket_status CHECK (status IN ('active', 'cancelled', 'used', 'refunded')),
    CONSTRAINT chk_seat_number CHECK (seat_number IS NULL OR seat_number ~* '^[0-9]{1,3}[A-Z]?$'),
    CONSTRAINT chk_check_in_time CHECK (check_in_time IS NULL OR check_in_time >= purchase_date)
);

-- 14. Создание таблицы Baggage (Багаж)
CREATE TABLE Baggage (
    baggage_id SERIAL PRIMARY KEY,
    passenger_id INTEGER NOT NULL,
    flight_id INTEGER NOT NULL,
    baggage_tag VARCHAR(20) UNIQUE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'checked_in',
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_time TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_baggage_passenger FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id) ON DELETE CASCADE,
    CONSTRAINT fk_baggage_flight FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE,
    
    -- Ограничения
    CONSTRAINT chk_baggage_weight CHECK (weight > 0 AND weight <= 100),
    CONSTRAINT chk_baggage_status CHECK (status IN ('checked_in', 'loaded', 'unloaded', 'delivered', 'lost')),
    CONSTRAINT chk_baggage_tag CHECK (baggage_tag ~* '^[A-Z0-9]{6,20}$'),
    CONSTRAINT chk_delivery_time CHECK (delivery_time IS NULL OR delivery_time >= check_in_time)
);

-- 15. Создание таблицы Flight_Crew (Экипаж рейса)
CREATE TABLE Flight_Crew (
    crew_id SERIAL PRIMARY KEY,
    flight_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    position VARCHAR(30) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_crew_flight FOREIGN KEY (flight_id) REFERENCES Flights(flight_id) ON DELETE CASCADE,
    CONSTRAINT fk_crew_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- Ограничения
    CONSTRAINT chk_position CHECK (position IN ('pilot', 'co_pilot', 'flight_engineer', 'flight_attendant', 'purser')),
    CONSTRAINT uk_crew_flight_position UNIQUE(flight_id, user_id, position)
);

-- 16. Создание таблицы Maintenance_Records (Записи технического обслуживания)
CREATE TABLE Maintenance_Records (
    maintenance_id SERIAL PRIMARY KEY,
    aircraft_id INTEGER NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    cost DECIMAL(10,2),
    technician_id INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled',
    
    -- Внешние ключи
    CONSTRAINT fk_maintenance_aircraft FOREIGN KEY (aircraft_id) REFERENCES Aircraft(aircraft_id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_technician FOREIGN KEY (technician_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    
    -- Ограничения
    CONSTRAINT chk_maintenance_type CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'overhaul')),
    CONSTRAINT chk_maintenance_cost CHECK (cost IS NULL OR cost >= 0),
    CONSTRAINT chk_maintenance_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT chk_maintenance_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 17. Создание таблицы Audit_Logs (Журнал аудита)
CREATE TABLE Audit_Logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    
    -- Ограничения
    CONSTRAINT chk_action CHECK (action ~* '^[A-Z_]+$')
);

-- =====================================================
-- СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================

-- Индексы для поиска и фильтрации
CREATE INDEX idx_flights_departure ON Flights(departure_airport_id);
CREATE INDEX idx_flights_arrival ON Flights(arrival_airport_id);
CREATE INDEX idx_flights_scheduled_departure ON Flights(scheduled_departure);
CREATE INDEX idx_flights_status ON Flights(status);
CREATE INDEX idx_flights_aircraft ON Flights(aircraft_id);

CREATE INDEX idx_tickets_flight ON Tickets(flight_id);
CREATE INDEX idx_tickets_passenger ON Tickets(passenger_id);
CREATE INDEX idx_tickets_status ON Tickets(status);

CREATE INDEX idx_baggage_flight ON Baggage(flight_id);
CREATE INDEX idx_baggage_passenger ON Baggage(passenger_id);
CREATE INDEX idx_baggage_status ON Baggage(status);

CREATE INDEX idx_flight_crew_flight ON Flight_Crew(flight_id);
CREATE INDEX idx_flight_crew_user ON Flight_Crew(user_id);

CREATE INDEX idx_maintenance_aircraft ON Maintenance_Records(aircraft_id);
CREATE INDEX idx_maintenance_status ON Maintenance_Records(status);

CREATE INDEX idx_audit_logs_user ON Audit_Logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON Audit_Logs(timestamp);
CREATE INDEX idx_audit_logs_table ON Audit_Logs(table_name);

-- Составные индексы для сложных запросов
CREATE INDEX idx_flights_route_departure ON Flights(route_id, scheduled_departure);
CREATE INDEX idx_tickets_flight_status ON Tickets(flight_id, status);
CREATE INDEX idx_baggage_flight_status ON Baggage(flight_id, status);

-- =====================================================
-- СОЗДАНИЕ ТРИГГЕРОВ ДЛЯ ПОДДЕРЖАНИЯ ЦЕЛОСТНОСТИ
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at в Users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON Users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для синхронизации данных Aircraft при изменении Aircraft_Models
CREATE OR REPLACE FUNCTION sync_aircraft_model_data()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Aircraft 
    SET model_name = NEW.model_name,
        manufacturer = NEW.manufacturer,
        capacity = NEW.capacity,
        max_range = NEW.max_range
    WHERE model_id = NEW.model_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_aircraft_model_trigger
    AFTER UPDATE ON Aircraft_Models
    FOR EACH ROW EXECUTE FUNCTION sync_aircraft_model_data();

-- Функция для синхронизации данных Aircraft при вставке
CREATE OR REPLACE FUNCTION sync_aircraft_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    SELECT model_name, manufacturer, capacity, max_range
    INTO NEW.model_name, NEW.manufacturer, NEW.capacity, NEW.max_range
    FROM Aircraft_Models 
    WHERE model_id = NEW.model_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_aircraft_insert_trigger
    BEFORE INSERT ON Aircraft
    FOR EACH ROW EXECUTE FUNCTION sync_aircraft_on_insert();

-- Функция для синхронизации данных Flights при изменении Routes
CREATE OR REPLACE FUNCTION sync_flight_route_data()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Flights 
    SET departure_airport_id = NEW.departure_airport_id,
        arrival_airport_id = NEW.arrival_airport_id
    WHERE route_id = NEW.route_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_flight_route_trigger
    AFTER UPDATE ON Routes
    FOR EACH ROW EXECUTE FUNCTION sync_flight_route_data();

-- Функция для синхронизации данных Flights при вставке
CREATE OR REPLACE FUNCTION sync_flight_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    SELECT departure_airport_id, arrival_airport_id
    INTO NEW.departure_airport_id, NEW.arrival_airport_id
    FROM Routes 
    WHERE route_id = NEW.route_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_flight_insert_trigger
    BEFORE INSERT ON Flights
    FOR EACH ROW EXECUTE FUNCTION sync_flight_on_insert();

-- Функция для автоматического создания audit log
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, NULL),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Триггеры для аудита критических таблиц
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_flights_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Flights
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_tickets_trigger
    AFTER INSERT OR UPDATE OR DELETE ON Tickets
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ (VIEWS)
-- =====================================================

-- Представление для информации о рейсах с деталями
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

-- Представление для статистики рейсов
CREATE VIEW flight_statistics AS
SELECT 
    DATE(scheduled_departure) as flight_date,
    COUNT(*) as total_flights,
    COUNT(CASE WHEN status = 'arrived' THEN 1 END) as completed_flights,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_flights,
    COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_flights,
    AVG(price) as average_price
FROM Flights
GROUP BY DATE(scheduled_departure);

-- Представление для информации о пассажирах с билетами
CREATE VIEW passenger_ticket_info AS
SELECT 
    p.passenger_id,
    p.first_name,
    p.last_name,
    p.passport_number,
    p.nationality,
    t.ticket_number,
    t.class,
    t.price,
    t.status as ticket_status,
    f.flight_number,
    f.scheduled_departure,
    f.status as flight_status
FROM Passengers p
JOIN Tickets t ON p.passenger_id = t.passenger_id
JOIN Flights f ON t.flight_id = f.flight_id;

-- =====================================================
-- СОЗДАНИЕ ФУНКЦИЙ ДЛЯ БИЗНЕС-ЛОГИКИ
-- =====================================================

-- Функция для проверки доступности места
CREATE OR REPLACE FUNCTION check_seat_availability(
    p_flight_id INTEGER,
    p_seat_number VARCHAR(10)
) RETURNS BOOLEAN AS $$
DECLARE
    seat_count INTEGER;
    aircraft_capacity INTEGER;
BEGIN
    -- Проверяем количество занятых мест
    SELECT COUNT(*) INTO seat_count
    FROM Tickets 
    WHERE flight_id = p_flight_id 
    AND seat_number = p_seat_number 
    AND status = 'active';
    
    -- Получаем вместимость самолета
    SELECT capacity INTO aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    -- Проверяем, что место не занято и не превышает вместимость
    RETURN seat_count = 0 AND p_seat_number IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Функция для расчета загрузки рейса
CREATE OR REPLACE FUNCTION calculate_flight_load(p_flight_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    passenger_count INTEGER;
    aircraft_capacity INTEGER;
    load_percentage DECIMAL(5,2);
BEGIN
    -- Подсчитываем количество пассажиров
    SELECT COUNT(*) INTO passenger_count
    FROM Tickets 
    WHERE flight_id = p_flight_id 
    AND status = 'active';
    
    -- Получаем вместимость самолета
    SELECT capacity INTO aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    -- Рассчитываем процент загрузки
    IF aircraft_capacity > 0 THEN
        load_percentage := (passenger_count::DECIMAL / aircraft_capacity::DECIMAL) * 100;
    ELSE
        load_percentage := 0;
    END IF;
    
    RETURN load_percentage;
END;
$$ LANGUAGE plpgsql;

-- Функция для поиска рейсов по маршруту
CREATE OR REPLACE FUNCTION search_flights(
    p_departure_iata VARCHAR(3),
    p_arrival_iata VARCHAR(3),
    p_departure_date DATE
) RETURNS TABLE (
    flight_id INTEGER,
    flight_number VARCHAR(10),
    scheduled_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    price DECIMAL(10,2),
    status VARCHAR(20),
    load_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.flight_id,
        f.flight_number,
        f.scheduled_departure,
        f.scheduled_arrival,
        f.price,
        f.status,
        calculate_flight_load(f.flight_id) as load_percentage
    FROM Flights f
    JOIN Airports dep ON f.departure_airport_id = dep.airport_id
    JOIN Airports arr ON f.arrival_airport_id = arr.airport_id
    WHERE dep.iata_code = p_departure_iata
    AND arr.iata_code = p_arrival_iata
    AND DATE(f.scheduled_departure) = p_departure_date
    AND f.status IN ('scheduled', 'boarding')
    ORDER BY f.scheduled_departure;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- НАСТРОЙКА ПРАВ ДОСТУПА
-- =====================================================

-- Предоставление прав пользователю
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO airport_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO airport_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO airport_admin;

-- Создание роли для чтения (для отчетов)
CREATE ROLE airport_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airport_reader;
GRANT SELECT ON flight_details TO airport_reader;
GRANT SELECT ON flight_statistics TO airport_reader;
GRANT SELECT ON passenger_ticket_info TO airport_reader;

-- Создание роли для операций (для операторов)
CREATE ROLE airport_operator;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO airport_operator;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO airport_operator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO airport_operator;

COMMIT;
