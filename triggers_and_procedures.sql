

-- =====================================================
-- 1. ПУЛ ТРИГГЕРОВ ДЛЯ АВТОМАТИЗАЦИИ ЛОГИКИ ПРИЛОЖЕНИЯ
-- =====================================================


-- Триггер для автоматического расчета загрузки рейса
-- Пересчитывает загрузку самолета при изменении количества билетов

-- Триггер для автоматического расчета стоимости билета
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
            WHEN p.special_requirements IS NOT NULL THEN 5.0 
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


-- =====================================================
-- 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- =====================================================


-- =====================================================
-- КОНЕЦ ПУЛА ТРИГГЕРОВ И ПРОЦЕДУР
-- =====================================================

-- =====================================================
-- ДОПОЛНИТЕЛЬНЫЕ ТРИГГЕРЫ И ПРОЦЕДУРЫ
-- Добавлены для интеграции с backend системой
-- =====================================================

-- Дополнительный триггер для автоматического обновления статуса рейса
-- (исправленная версия для работы с таблицей flights)
CREATE OR REPLACE FUNCTION update_flight_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Если установлено фактическое время отправления, но нет прибытия - статус 'departed'
    IF NEW.actual_departure IS NOT NULL AND NEW.actual_arrival IS NULL THEN
        NEW.status := 'departed';
    -- Если установлено фактическое время прибытия - статус 'arrived'
    ELSIF NEW.actual_arrival IS NOT NULL THEN
        NEW.status := 'arrived';
    -- Если время отправления близко (в течение 2 часов) - статус 'boarding'
    ELSIF NEW.scheduled_departure <= CURRENT_TIMESTAMP + INTERVAL '2 hours' 
          AND NEW.scheduled_departure > CURRENT_TIMESTAMP THEN
        NEW.status := 'boarding';
    -- Если время отправления прошло, но нет фактического времени - статус 'delayed'
    ELSIF NEW.scheduled_departure < CURRENT_TIMESTAMP AND NEW.actual_departure IS NULL THEN
        NEW.status := 'delayed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flight_status
    BEFORE UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION update_flight_status();

-- Дополнительный триггер для автоматического назначения гейта
-- (исправленная версия для работы с таблицами gates и terminals)
CREATE OR REPLACE FUNCTION auto_assign_gate()
RETURNS TRIGGER AS $$
DECLARE
    available_gate_id INTEGER;
BEGIN
    -- Если гейт не назначен, ищем свободный
    IF NEW.gate_id IS NULL THEN
        SELECT g.gate_id INTO available_gate_id
        FROM gates g
        JOIN terminals t ON g.terminal_id = t.terminal_id
        WHERE g.status = 'available'
            AND t.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM flights f 
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
            UPDATE gates 
            SET status = 'occupied'
            WHERE gate_id = available_gate_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_gate
    BEFORE INSERT ON flights
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_gate();

-- Дополнительный триггер для автоматического освобождения гейта
-- (исправленная версия для работы с таблицей gates)
CREATE OR REPLACE FUNCTION auto_release_gate()
RETURNS TRIGGER AS $$
BEGIN
    -- Если рейс завершен или отменен, освобождаем гейт
    IF NEW.status IN ('arrived', 'cancelled') AND OLD.status NOT IN ('arrived', 'cancelled') THEN
        UPDATE gates 
        SET status = 'available'
        WHERE gate_id = NEW.gate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_release_gate
    AFTER UPDATE ON flights
    FOR EACH ROW
    EXECUTE FUNCTION auto_release_gate();

-- Дополнительная процедура для регистрации пассажира на рейс
-- (исправленная версия для работы с таблицами flights, aircraft, tickets)
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
    v_ticket_number VARCHAR(20);
BEGIN
    -- Проверяем статус рейса
    SELECT status INTO v_flight_status
    FROM flights
    WHERE flight_id = p_flight_id;
    
    IF v_flight_status NOT IN ('scheduled', 'boarding') THEN
        RAISE EXCEPTION 'Невозможно зарегистрировать пассажира на рейс со статусом %', v_flight_status;
    END IF;
    
    -- Проверяем доступность места
    IF EXISTS (
        SELECT 1 FROM tickets 
        WHERE flight_id = p_flight_id 
            AND seat_number = p_seat_number 
            AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Место % уже занято', p_seat_number;
    END IF;
    
    -- Проверяем загрузку рейса
    SELECT a.capacity INTO v_aircraft_capacity
    FROM aircraft a
    JOIN flights f ON a.aircraft_id = f.aircraft_id
    WHERE f.flight_id = p_flight_id;
    
    SELECT COUNT(*) INTO v_sold_tickets
    FROM tickets
    WHERE flight_id = p_flight_id AND status = 'active';
    
    IF v_sold_tickets >= v_aircraft_capacity THEN
        RAISE EXCEPTION 'Рейс полностью загружен';
    END IF;
    
    -- Генерируем номер билета
    v_ticket_number := generate_ticket_number();
    
    -- Создаем билет
    INSERT INTO tickets (ticket_number, flight_id, passenger_id, seat_number, class, status, purchase_date, check_in_time)
    VALUES (v_ticket_number, p_flight_id, p_passenger_id, p_seat_number, p_class, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING ticket_id INTO v_ticket_id;
    
    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;


-- Дополнительная функция для генерации номера билета
-- (исправленная версия для работы с существующими номерами)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_ticket_number VARCHAR(20);
    v_counter INTEGER;
BEGIN
    -- Получаем следующий номер, используя только числовые части
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+') AS INTEGER)), 0) + 1 INTO v_counter
    FROM tickets
    WHERE ticket_number ~ '^[A-Z]+[0-9]+';
    
    -- Формируем номер билета
    v_ticket_number := 'TK' || LPAD(v_counter::TEXT, 8, '0');
    
    RETURN v_ticket_number;
END;
$$ LANGUAGE plpgsql;
