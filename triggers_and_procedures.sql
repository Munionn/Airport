-- =====================================================
-- ПУЛ ТРИГГЕРОВ И ХРАНИМЫХ ПРОЦЕДУР
-- Система управления аэропортом
-- =====================================================

-- =====================================================
-- 1. ПУЛ ТРИГГЕРОВ ДЛЯ АВТОМАТИЗАЦИИ ЛОГИКИ ПРИЛОЖЕНИЯ
-- =====================================================

-- 1.1 Триггер для автоматического обновления статуса рейса
-- Автоматически обновляет статус рейса на основе времени отправления и прибытия
CREATE OR REPLACE FUNCTION update_flight_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Если установлено фактическое время отправления, но нет прибытия - статус "departed"
    IF NEW.actual_departure IS NOT NULL AND NEW.actual_arrival IS NULL THEN
        NEW.status := 'departed';
    -- Если установлено фактическое время прибытия - статус "arrived"
    ELSIF NEW.actual_arrival IS NOT NULL THEN
        NEW.status := 'arrived';
    -- Если время отправления близко (в течение 2 часов) - статус "boarding"
    ELSIF NEW.scheduled_departure <= CURRENT_TIMESTAMP + INTERVAL '2 hours' 
          AND NEW.scheduled_departure > CURRENT_TIMESTAMP THEN
        NEW.status := 'boarding';
    -- Если время отправления прошло, но нет фактического времени - статус "delayed"
    ELSIF NEW.scheduled_departure < CURRENT_TIMESTAMP AND NEW.actual_departure IS NULL THEN
        NEW.status := 'delayed';
    END IF;
    
    -- Обновляем время последнего изменения
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flight_status
    BEFORE UPDATE ON Flights
    FOR EACH ROW
    EXECUTE FUNCTION update_flight_status();

-- 1.2 Триггер для автоматического расчета загрузки рейса
-- Пересчитывает загрузку самолета при изменении количества билетов
CREATE OR REPLACE FUNCTION calculate_flight_load()
RETURNS TRIGGER AS $$
DECLARE
    aircraft_capacity INTEGER;
    sold_tickets INTEGER;
    load_percentage DECIMAL(5,2);
BEGIN
    -- Получаем вместимость самолета
    SELECT a.capacity INTO aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = COALESCE(NEW.flight_id, OLD.flight_id);
    
    -- Подсчитываем проданные билеты
    SELECT COUNT(*) INTO sold_tickets
    FROM Tickets t
    WHERE t.flight_id = COALESCE(NEW.flight_id, OLD.flight_id)
        AND t.status = 'active';
    
    -- Рассчитываем процент загрузки
    IF aircraft_capacity > 0 THEN
        load_percentage := (sold_tickets::DECIMAL / aircraft_capacity) * 100;
        
        -- Если загрузка превышает 95%, отправляем уведомление
        IF load_percentage > 95 THEN
            INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
            VALUES (NULL, 'HIGH_LOAD_WARNING', 'Flights', COALESCE(NEW.flight_id, OLD.flight_id), 
                   json_build_object('load_percentage', load_percentage, 'sold_tickets', sold_tickets, 'capacity', aircraft_capacity),
                   CURRENT_TIMESTAMP);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_flight_load
    AFTER INSERT OR UPDATE OR DELETE ON Tickets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_flight_load();

-- 1.3 Триггер для автоматического обновления времени обслуживания самолета
-- Обновляет даты следующего обслуживания при завершении текущего
CREATE OR REPLACE FUNCTION update_aircraft_maintenance_schedule()
RETURNS TRIGGER AS $$
DECLARE
    maintenance_interval INTERVAL;
BEGIN
    -- Если обслуживание завершено
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Определяем интервал следующего обслуживания на основе типа
        CASE NEW.maintenance_type
            WHEN 'routine' THEN maintenance_interval := INTERVAL '30 days';
            WHEN 'inspection' THEN maintenance_interval := INTERVAL '90 days';
            WHEN 'repair' THEN maintenance_interval := INTERVAL '180 days';
            WHEN 'overhaul' THEN maintenance_interval := INTERVAL '365 days';
            ELSE maintenance_interval := INTERVAL '90 days';
        END CASE;
        
        -- Обновляем даты обслуживания самолета
        UPDATE Aircraft 
        SET last_maintenance = NEW.end_date,
            next_maintenance = NEW.end_date + maintenance_interval,
            updated_at = CURRENT_TIMESTAMP
        WHERE aircraft_id = NEW.aircraft_id;
        
        -- Логируем обновление
        INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
        VALUES (NEW.technician_id, 'MAINTENANCE_COMPLETED', 'Aircraft', NEW.aircraft_id,
               json_build_object('maintenance_type', NEW.maintenance_type, 'next_maintenance', NEW.end_date + maintenance_interval),
               CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aircraft_maintenance_schedule
    AFTER UPDATE ON Maintenance_Records
    FOR EACH ROW
    EXECUTE FUNCTION update_aircraft_maintenance_schedule();

-- 1.4 Триггер для автоматического назначения гейта
-- Автоматически назначает свободный гейт при создании рейса
CREATE OR REPLACE FUNCTION auto_assign_gate()
RETURNS TRIGGER AS $$
DECLARE
    available_gate_id INTEGER;
BEGIN
    -- Если гейт не назначен, ищем свободный
    IF NEW.gate_id IS NULL THEN
        SELECT g.gate_id INTO available_gate_id
        FROM Gates g
        JOIN Terminals t ON g.terminal_id = t.terminal_id
        WHERE g.status = 'available'
            AND t.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM Flights f 
                WHERE f.gate_id = g.gate_id 
                    AND f.scheduled_departure BETWEEN NEW.scheduled_departure - INTERVAL '1 hour' 
                    AND NEW.scheduled_departure + INTERVAL '1 hour'
                    AND f.status NOT IN ('cancelled', 'arrived')
            )
        ORDER BY g.gate_number
        LIMIT 1;
        
        IF available_gate_id IS NOT NULL THEN
            NEW.gate_id := available_gate_id;
            
            -- Обновляем статус гейта
            UPDATE Gates 
            SET status = 'occupied'
            WHERE gate_id = available_gate_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_gate
    BEFORE INSERT ON Flights
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_gate();

-- 1.5 Триггер для автоматического освобождения гейта
-- Освобождает гейт после завершения рейса
CREATE OR REPLACE FUNCTION auto_release_gate()
RETURNS TRIGGER AS $$
BEGIN
    -- Если рейс завершен или отменен, освобождаем гейт
    IF NEW.status IN ('arrived', 'cancelled') AND OLD.status NOT IN ('arrived', 'cancelled') THEN
        UPDATE Gates 
        SET status = 'available'
        WHERE gate_id = NEW.gate_id;
        
        -- Логируем освобождение гейта
        INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
        VALUES (NULL, 'GATE_RELEASED', 'Gates', NEW.gate_id,
               json_build_object('flight_number', NEW.flight_number, 'gate_status', 'available'),
               CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_release_gate
    AFTER UPDATE ON Flights
    FOR EACH ROW
    EXECUTE FUNCTION auto_release_gate();

-- 1.6 Триггер для автоматического расчета стоимости билета
-- Рассчитывает стоимость билета на основе класса обслуживания и скидок
CREATE OR REPLACE FUNCTION calculate_ticket_price()
RETURNS TRIGGER AS $$
DECLARE
    base_price DECIMAL(10,2);
    class_multiplier DECIMAL(3,2);
    discount_percent DECIMAL(5,2) := 0;
BEGIN
    -- Получаем базовую цену рейса
    SELECT f.price INTO base_price
    FROM Flights f
    WHERE f.flight_id = NEW.flight_id;
    
    -- Определяем множитель для класса обслуживания
    CASE NEW.class
        WHEN 'economy' THEN class_multiplier := 1.0;
        WHEN 'business' THEN class_multiplier := 2.5;
        WHEN 'first' THEN class_multiplier := 4.0;
        ELSE class_multiplier := 1.0;
    END CASE;
    
    -- Применяем скидки (например, для пассажиров с особыми требованиями)
    IF NEW.passenger_id IS NOT NULL THEN
        SELECT CASE 
            WHEN p.special_requirements IS NOT NULL THEN 5.0  -- 5% скидка
            ELSE 0.0
        END INTO discount_percent
        FROM Passengers p
        WHERE p.passenger_id = NEW.passenger_id;
    END IF;
    
    -- Рассчитываем итоговую цену
    NEW.price := base_price * class_multiplier * (1 - discount_percent / 100);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_ticket_price
    BEFORE INSERT ON Tickets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ticket_price();

-- 1.7 Триггер для автоматического обновления статуса багажа
-- Обновляет статус багажа в зависимости от статуса рейса
CREATE OR REPLACE FUNCTION update_baggage_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Если рейс отменен, отменяем регистрацию багажа
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE Baggage 
        SET status = 'cancelled'
        WHERE flight_id = NEW.flight_id AND status IN ('checked_in', 'loaded');
        
        -- Логируем отмену багажа
        INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
        VALUES (NULL, 'BAGGAGE_CANCELLED', 'Baggage', NEW.flight_id,
               json_build_object('flight_number', NEW.flight_number, 'reason', 'flight_cancelled'),
               CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_baggage_status
    AFTER UPDATE ON Flights
    FOR EACH ROW
    EXECUTE FUNCTION update_baggage_status();

-- 1.8 Триггер для автоматического создания уведомлений о задержках
-- Создает уведомления для пассажиров при задержке рейса
CREATE OR REPLACE FUNCTION create_delay_notifications()
RETURNS TRIGGER AS $$
DECLARE
    passenger_record RECORD;
    delay_minutes INTEGER;
BEGIN
    -- Если рейс задержан
    IF NEW.status = 'delayed' AND OLD.status != 'delayed' THEN
        -- Рассчитываем время задержки
        delay_minutes := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.scheduled_departure)) / 60;
        
        -- Создаем уведомления для всех пассажиров с активными билетами
        FOR passenger_record IN 
            SELECT DISTINCT p.passenger_id, p.first_name, p.last_name, p.email, t.ticket_number
            FROM Passengers p
            JOIN Tickets t ON p.passenger_id = t.passenger_id
            WHERE t.flight_id = NEW.flight_id 
                AND t.status = 'active'
                AND p.email IS NOT NULL
        LOOP
            -- Здесь можно добавить отправку email или SMS
            -- Пока просто логируем уведомление
            INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
            VALUES (NULL, 'DELAY_NOTIFICATION', 'Passengers', passenger_record.passenger_id,
                   json_build_object(
                       'passenger_name', passenger_record.first_name || ' ' || passenger_record.last_name,
                       'ticket_number', passenger_record.ticket_number,
                       'flight_number', NEW.flight_number,
                       'delay_minutes', delay_minutes,
                       'notification_type', 'email'
                   ),
                   CURRENT_TIMESTAMP);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_delay_notifications
    AFTER UPDATE ON Flights
    FOR EACH ROW
    EXECUTE FUNCTION create_delay_notifications();

-- =====================================================
-- 2. ПУЛ ХРАНИМЫХ ПРОЦЕДУР ДЛЯ ЧАСТЫХ ОПЕРАЦИЙ
-- =====================================================

-- 2.1 Процедура для регистрации пассажира на рейс
CREATE OR REPLACE FUNCTION register_passenger_for_flight(
    p_passenger_id INTEGER,
    p_flight_id INTEGER,
    p_seat_number VARCHAR(10),
    p_class VARCHAR(20),
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_ticket_id INTEGER;
    v_flight_status VARCHAR(20);
    v_aircraft_capacity INTEGER;
    v_sold_tickets INTEGER;
BEGIN
    -- Проверяем статус рейса
    SELECT status INTO v_flight_status
    FROM Flights
    WHERE flight_id = p_flight_id;
    
    IF v_flight_status NOT IN ('scheduled', 'boarding') THEN
        RAISE EXCEPTION 'Невозможно зарегистрировать пассажира на рейс со статусом %', v_flight_status;
    END IF;
    
    -- Проверяем доступность места
    IF EXISTS (
        SELECT 1 FROM Tickets 
        WHERE flight_id = p_flight_id 
            AND seat_number = p_seat_number 
            AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Место % уже занято', p_seat_number;
    END IF;
    
    -- Проверяем загрузку рейса
    SELECT a.capacity INTO v_aircraft_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    SELECT COUNT(*) INTO v_sold_tickets
    FROM Tickets
    WHERE flight_id = p_flight_id AND status = 'active';
    
    IF v_sold_tickets >= v_aircraft_capacity THEN
        RAISE EXCEPTION 'Рейс полностью загружен';
    END IF;
    
    -- Создаем билет
    INSERT INTO Tickets (flight_id, passenger_id, seat_number, class, status, purchase_date, check_in_time)
    VALUES (p_flight_id, p_passenger_id, p_seat_number, p_class, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING ticket_id INTO v_ticket_id;
    
    -- Логируем регистрацию
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
    VALUES (p_user_id, 'PASSENGER_REGISTERED', 'Tickets', v_ticket_id,
           json_build_object(
               'passenger_id', p_passenger_id,
               'flight_id', p_flight_id,
               'seat_number', p_seat_number,
               'class', p_class
           ),
           CURRENT_TIMESTAMP);
    
    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- 2.2 Процедура для отмены рейса
CREATE OR REPLACE FUNCTION cancel_flight(
    p_flight_id INTEGER,
    p_reason TEXT,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_flight_number VARCHAR(20);
    v_passenger_count INTEGER;
BEGIN
    -- Получаем номер рейса
    SELECT flight_number INTO v_flight_number
    FROM Flights
    WHERE flight_id = p_flight_id;
    
    -- Проверяем, можно ли отменить рейс
    IF NOT EXISTS (SELECT 1 FROM Flights WHERE flight_id = p_flight_id AND status IN ('scheduled', 'boarding')) THEN
        RAISE EXCEPTION 'Невозможно отменить рейс со статусом %', (SELECT status FROM Flights WHERE flight_id = p_flight_id);
    END IF;
    
    -- Отменяем рейс
    UPDATE Flights 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE flight_id = p_flight_id;
    
    -- Отменяем все активные билеты
    UPDATE Tickets 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE flight_id = p_flight_id AND status = 'active';
    
    -- Подсчитываем количество затронутых пассажиров
    SELECT COUNT(*) INTO v_passenger_count
    FROM Tickets
    WHERE flight_id = p_flight_id AND status = 'cancelled';
    
    -- Логируем отмену
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
    VALUES (p_user_id, 'FLIGHT_CANCELLED', 'Flights', p_flight_id,
           json_build_object(
               'flight_number', v_flight_number,
               'reason', p_reason,
               'affected_passengers', v_passenger_count
           ),
           CURRENT_TIMESTAMP);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2.3 Процедура для поиска рейсов
CREATE OR REPLACE FUNCTION search_flights(
    p_departure_city VARCHAR(50),
    p_arrival_city VARCHAR(50),
    p_departure_date DATE,
    p_max_price DECIMAL(10,2) DEFAULT NULL,
    p_class VARCHAR(20) DEFAULT 'economy'
)
RETURNS TABLE (
    flight_id INTEGER,
    flight_number VARCHAR(20),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    departure_city VARCHAR(50),
    arrival_city VARCHAR(50),
    scheduled_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    price DECIMAL(10,2),
    available_seats INTEGER,
    aircraft_model VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.flight_id,
        f.flight_number,
        da.iata_code,
        aa.iata_code,
        dc.city_name,
        ac.city_name,
        f.scheduled_departure,
        f.scheduled_arrival,
        CASE p_class
            WHEN 'economy' THEN f.price
            WHEN 'business' THEN f.price * 2.5
            WHEN 'first' THEN f.price * 4.0
            ELSE f.price
        END as calculated_price,
        (a.capacity - COALESCE(ticket_count.sold_tickets, 0)) as available_seats,
        am.model_name
    FROM Flights f
    JOIN Routes r ON f.route_id = r.route_id
    JOIN Airports da ON r.departure_airport_id = da.airport_id
    JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
    JOIN Cities dc ON da.city_id = dc.city_id
    JOIN Cities ac ON aa.city_id = ac.city_id
    JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
    JOIN Aircraft_Models am ON a.model_id = am.model_id
    LEFT JOIN (
        SELECT t.flight_id, COUNT(*) as sold_tickets
        FROM Tickets t
        WHERE t.status = 'active'
        GROUP BY t.flight_id
    ) ticket_count ON f.flight_id = ticket_count.flight_id
    WHERE dc.city_name = p_departure_city
        AND ac.city_name = p_arrival_city
        AND f.scheduled_departure::DATE = p_departure_date
        AND f.status IN ('scheduled', 'boarding')
        AND (p_max_price IS NULL OR f.price <= p_max_price)
        AND (a.capacity - COALESCE(ticket_count.sold_tickets, 0)) > 0
    ORDER BY f.scheduled_departure;
END;
$$ LANGUAGE plpgsql;

-- 2.4 Процедура для расчета статистики рейсов
CREATE OR REPLACE FUNCTION calculate_flight_statistics(
    p_start_date DATE,
    p_end_date DATE,
    p_route_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_flights INTEGER,
    completed_flights INTEGER,
    cancelled_flights INTEGER,
    delayed_flights INTEGER,
    total_passengers INTEGER,
    total_revenue DECIMAL(15,2),
    average_load_percentage DECIMAL(5,2),
    on_time_performance DECIMAL(5,2)
) AS $$
DECLARE
    v_total_flights INTEGER;
    v_completed_flights INTEGER;
    v_cancelled_flights INTEGER;
    v_delayed_flights INTEGER;
    v_total_passengers INTEGER;
    v_total_revenue DECIMAL(15,2);
    v_avg_load DECIMAL(5,2);
    v_on_time_perf DECIMAL(5,2);
BEGIN
    -- Подсчитываем общее количество рейсов
    SELECT COUNT(*) INTO v_total_flights
    FROM Flights f
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Подсчитываем завершенные рейсы
    SELECT COUNT(*) INTO v_completed_flights
    FROM Flights f
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND f.status = 'arrived'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Подсчитываем отмененные рейсы
    SELECT COUNT(*) INTO v_cancelled_flights
    FROM Flights f
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND f.status = 'cancelled'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Подсчитываем задержанные рейсы
    SELECT COUNT(*) INTO v_delayed_flights
    FROM Flights f
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND f.status = 'delayed'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Подсчитываем общее количество пассажиров
    SELECT COUNT(*) INTO v_total_passengers
    FROM Tickets t
    JOIN Flights f ON t.flight_id = f.flight_id
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND t.status = 'active'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Подсчитываем общую выручку
    SELECT COALESCE(SUM(t.price), 0) INTO v_total_revenue
    FROM Tickets t
    JOIN Flights f ON t.flight_id = f.flight_id
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND t.status = 'active'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Рассчитываем среднюю загрузку
    SELECT COALESCE(AVG(
        (SELECT COUNT(*) FROM Tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')::DECIMAL / 
        (SELECT a.capacity FROM Aircraft a WHERE a.aircraft_id = f.aircraft_id) * 100
    ), 0) INTO v_avg_load
    FROM Flights f
    WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
        AND f.status = 'arrived'
        AND (p_route_id IS NULL OR f.route_id = p_route_id);
    
    -- Рассчитываем пунктуальность
    IF v_completed_flights > 0 THEN
        SELECT COALESCE(AVG(
            CASE 
                WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 100
                ELSE 0
            END
        ), 0) INTO v_on_time_perf
        FROM Flights f
        WHERE f.scheduled_departure::DATE BETWEEN p_start_date AND p_end_date
            AND f.status = 'arrived'
            AND (p_route_id IS NULL OR f.route_id = p_route_id);
    ELSE
        v_on_time_perf := 0;
    END IF;
    
    RETURN QUERY SELECT 
        v_total_flights,
        v_completed_flights,
        v_cancelled_flights,
        v_delayed_flights,
        v_total_passengers,
        v_total_revenue,
        v_avg_load,
        v_on_time_perf;
END;
$$ LANGUAGE plpgsql;

-- 2.5 Процедура для назначения экипажа на рейс
CREATE OR REPLACE FUNCTION assign_crew_to_flight(
    p_flight_id INTEGER,
    p_user_id INTEGER,
    p_position VARCHAR(30),
    p_assigned_by INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_crew_id INTEGER;
    v_user_role VARCHAR(50);
    v_flight_status VARCHAR(20);
BEGIN
    -- Проверяем статус рейса
    SELECT status INTO v_flight_status
    FROM Flights
    WHERE flight_id = p_flight_id;
    
    IF v_flight_status NOT IN ('scheduled', 'boarding') THEN
        RAISE EXCEPTION 'Невозможно назначить экипаж на рейс со статусом %', v_flight_status;
    END IF;
    
    -- Проверяем роль пользователя
    SELECT r.role_name INTO v_user_role
    FROM Users u
    JOIN User_Roles ur ON u.user_id = ur.user_id
    JOIN Roles r ON ur.role_id = r.role_id
    WHERE u.user_id = p_user_id
        AND r.role_name IN ('pilot', 'co_pilot', 'flight_attendant', 'purser', 'flight_engineer');
    
    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Пользователь не имеет права быть назначенным в экипаж';
    END IF;
    
    -- Проверяем, не назначен ли уже пользователь на этот рейс
    IF EXISTS (
        SELECT 1 FROM Flight_Crew 
        WHERE flight_id = p_flight_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Пользователь уже назначен на этот рейс';
    END IF;
    
    -- Назначаем экипаж
    INSERT INTO Flight_Crew (flight_id, user_id, position, assigned_at)
    VALUES (p_flight_id, p_user_id, p_position, CURRENT_TIMESTAMP)
    RETURNING crew_id INTO v_crew_id;
    
    -- Логируем назначение
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
    VALUES (p_assigned_by, 'CREW_ASSIGNED', 'Flight_Crew', v_crew_id,
           json_build_object(
               'flight_id', p_flight_id,
               'user_id', p_user_id,
               'position', p_position,
               'user_role', v_user_role
           ),
           CURRENT_TIMESTAMP);
    
    RETURN v_crew_id;
END;
$$ LANGUAGE plpgsql;

-- 2.6 Процедура для регистрации багажа
CREATE OR REPLACE FUNCTION register_baggage(
    p_passenger_id INTEGER,
    p_flight_id INTEGER,
    p_weight DECIMAL(5,2),
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_baggage_id INTEGER;
    v_baggage_tag VARCHAR(20);
    v_flight_status VARCHAR(20);
    v_passenger_ticket_count INTEGER;
BEGIN
    -- Проверяем статус рейса
    SELECT status INTO v_flight_status
    FROM Flights
    WHERE flight_id = p_flight_id;
    
    IF v_flight_status NOT IN ('scheduled', 'boarding') THEN
        RAISE EXCEPTION 'Невозможно зарегистрировать багаж на рейс со статусом %', v_flight_status;
    END IF;
    
    -- Проверяем, есть ли у пассажира билет на этот рейс
    SELECT COUNT(*) INTO v_passenger_ticket_count
    FROM Tickets
    WHERE passenger_id = p_passenger_id 
        AND flight_id = p_flight_id 
        AND status = 'active';
    
    IF v_passenger_ticket_count = 0 THEN
        RAISE EXCEPTION 'У пассажира нет активного билета на этот рейс';
    END IF;
    
    -- Проверяем вес багажа
    IF p_weight > 32 THEN
        RAISE EXCEPTION 'Вес багажа превышает максимально допустимый (32 кг)';
    END IF;
    
    -- Генерируем уникальный тег багажа
    v_baggage_tag := 'BG' || LPAD(p_flight_id::TEXT, 4, '0') || LPAD(p_passenger_id::TEXT, 4, '0');
    
    -- Регистрируем багаж
    INSERT INTO Baggage (passenger_id, flight_id, baggage_tag, weight, status, check_in_time)
    VALUES (p_passenger_id, p_flight_id, v_baggage_tag, p_weight, 'checked_in', CURRENT_TIMESTAMP)
    RETURNING baggage_id INTO v_baggage_id;
    
    -- Логируем регистрацию багажа
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, new_values, timestamp)
    VALUES (p_user_id, 'BAGGAGE_REGISTERED', 'Baggage', v_baggage_id,
           json_build_object(
               'passenger_id', p_passenger_id,
               'flight_id', p_flight_id,
               'baggage_tag', v_baggage_tag,
               'weight', p_weight
           ),
           CURRENT_TIMESTAMP);
    
    RETURN v_baggage_id;
END;
$$ LANGUAGE plpgsql;

-- 2.7 Процедура для обновления статуса рейса
CREATE OR REPLACE FUNCTION update_flight_status_manual(
    p_flight_id INTEGER,
    p_new_status VARCHAR(20),
    p_user_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status VARCHAR(20);
    v_flight_number VARCHAR(20);
BEGIN
    -- Получаем текущий статус и номер рейса
    SELECT status, flight_number INTO v_old_status, v_flight_number
    FROM Flights
    WHERE flight_id = p_flight_id;
    
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Рейс с ID % не найден', p_flight_id;
    END IF;
    
    -- Обновляем статус
    UPDATE Flights 
    SET status = p_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE flight_id = p_flight_id;
    
    -- Логируем изменение статуса
    INSERT INTO Audit_Logs (user_id, action, table_name, record_id, old_values, new_values, timestamp)
    VALUES (p_user_id, 'FLIGHT_STATUS_UPDATED', 'Flights', p_flight_id,
           json_build_object('old_status', v_old_status),
           json_build_object('new_status', p_new_status, 'flight_number', v_flight_number),
           CURRENT_TIMESTAMP);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2.8 Процедура для получения информации о пассажире
CREATE OR REPLACE FUNCTION get_passenger_info(p_passenger_id INTEGER)
RETURNS TABLE (
    passenger_id INTEGER,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    passport_number VARCHAR(20),
    nationality VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    total_flights INTEGER,
    total_tickets INTEGER,
    last_flight_date DATE,
    preferred_class VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.passenger_id,
        p.first_name,
        p.last_name,
        p.passport_number,
        p.nationality,
        p.email,
        p.phone,
        COUNT(DISTINCT f.flight_id) as total_flights,
        COUNT(t.ticket_id) as total_tickets,
        MAX(f.scheduled_departure::DATE) as last_flight_date,
        MODE() WITHIN GROUP (ORDER BY t.class) as preferred_class
    FROM Passengers p
    LEFT JOIN Tickets t ON p.passenger_id = t.passenger_id
    LEFT JOIN Flights f ON t.flight_id = f.flight_id
    WHERE p.passenger_id = p_passenger_id
    GROUP BY p.passenger_id, p.first_name, p.last_name, p.passport_number, 
             p.nationality, p.email, p.phone;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- =====================================================

-- 3.1 Функция для проверки доступности места
CREATE OR REPLACE FUNCTION is_seat_available(
    p_flight_id INTEGER,
    p_seat_number VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM Tickets
    WHERE flight_id = p_flight_id 
        AND seat_number = p_seat_number 
        AND status = 'active';
    
    RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Функция для расчета загрузки рейса
CREATE OR REPLACE FUNCTION calculate_flight_load_percentage(p_flight_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_capacity INTEGER;
    v_sold_tickets INTEGER;
    v_load_percentage DECIMAL(5,2);
BEGIN
    -- Получаем вместимость самолета
    SELECT a.capacity INTO v_capacity
    FROM Aircraft a
    JOIN Flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    -- Подсчитываем проданные билеты
    SELECT COUNT(*) INTO v_sold_tickets
    FROM Tickets
    WHERE flight_id = p_flight_id AND status = 'active';
    
    -- Рассчитываем процент загрузки
    IF v_capacity > 0 THEN
        v_load_percentage := (v_sold_tickets::DECIMAL / v_capacity) * 100;
    ELSE
        v_load_percentage := 0;
    END IF;
    
    RETURN v_load_percentage;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Функция для генерации номера билета
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_ticket_number VARCHAR(20);
    v_counter INTEGER;
BEGIN
    -- Получаем следующий номер
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS INTEGER)), 0) + 1 INTO v_counter
    FROM Tickets
    WHERE ticket_number LIKE 'TK%';
    
    -- Формируем номер билета
    v_ticket_number := 'TK' || LPAD(v_counter::TEXT, 8, '0');
    
    RETURN v_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- КОНЕЦ ПУЛА ТРИГГЕРОВ И ПРОЦЕДУР
-- =====================================================
