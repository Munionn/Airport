-- =====================================================
-- ДЕМОНСТРАЦИОННЫЕ ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- Триггеры и хранимые процедуры системы управления аэропортом
-- =====================================================

-- =====================================================
-- 1. ДЕМОНСТРАЦИЯ РАБОТЫ ТРИГГЕРОВ
-- =====================================================

-- 1.1 Демонстрация триггера автоматического обновления статуса рейса
-- Создаем новый рейс
INSERT INTO Flights (flight_number, aircraft_id, route_id, departure_airport_id, arrival_airport_id, 
                     scheduled_departure, scheduled_arrival, status, price)
VALUES ('SU999', 1, 1, 1, 2, 
        CURRENT_TIMESTAMP + INTERVAL '3 hours', 
        CURRENT_TIMESTAMP + INTERVAL '5 hours', 
        'scheduled', 12000.00);

-- Проверяем статус рейса
SELECT flight_id, flight_number, status, scheduled_departure 
FROM Flights 
WHERE flight_number = 'SU999';

-- Обновляем время отправления (триггер должен изменить статус на "boarding")
UPDATE Flights 
SET scheduled_departure = CURRENT_TIMESTAMP + INTERVAL '1 hour'
WHERE flight_number = 'SU999';

-- Проверяем изменение статуса
SELECT flight_id, flight_number, status, scheduled_departure 
FROM Flights 
WHERE flight_number = 'SU999';

-- Устанавливаем фактическое время отправления (триггер должен изменить статус на "departed")
UPDATE Flights 
SET actual_departure = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
WHERE flight_number = 'SU999';

-- Проверяем изменение статуса
SELECT flight_id, flight_number, status, actual_departure 
FROM Flights 
WHERE flight_number = 'SU999';

-- Устанавливаем фактическое время прибытия (триггер должен изменить статус на "arrived")
UPDATE Flights 
SET actual_arrival = CURRENT_TIMESTAMP + INTERVAL '2 hours'
WHERE flight_number = 'SU999';

-- Проверяем финальный статус
SELECT flight_id, flight_number, status, actual_departure, actual_arrival 
FROM Flights 
WHERE flight_number = 'SU999';

-- =====================================================
-- 2. ДЕМОНСТРАЦИЯ РАБОТЫ ПРОЦЕДУР
-- =====================================================

-- 2.1 Демонстрация процедуры поиска рейсов
-- Ищем рейсы из Москвы в Санкт-Петербург на завтра
SELECT 'Поиск рейсов Москва -> Санкт-Петербург' as demo_description;

SELECT * FROM search_flights(
    'Москва'::VARCHAR(50),           -- departure_city
    'Санкт-Петербург'::VARCHAR(50),  -- arrival_city
    (CURRENT_DATE + INTERVAL '1 day')::DATE,  -- departure_date
    15000.00::DECIMAL(10,2),           -- max_price
    'economy'::VARCHAR(20)           -- class
);

-- Ищем рейсы в бизнес-классе
SELECT 'Поиск рейсов в бизнес-классе' as demo_description;

SELECT * FROM search_flights(
    'Москва'::VARCHAR(50),           -- departure_city
    'Санкт-Петербург'::VARCHAR(50),  -- arrival_city
    (CURRENT_DATE + INTERVAL '1 day')::DATE,  -- departure_date
    50000.00::DECIMAL(10,2),           -- max_price
    'business'::VARCHAR(20)          -- class
);

-- 2.2 Демонстрация процедуры регистрации пассажира
-- Регистрируем пассажира на демонстрационный рейс
SELECT 'Регистрация пассажира на рейс' as demo_description;

SELECT register_passenger_for_flight(
    1,          -- passenger_id (Дмитрий Пассажиров)
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999'),  -- flight_id
    '1A'::VARCHAR(10),       -- seat_number
    'business'::VARCHAR(20), -- class
    1           -- user_id
) as new_ticket_id;

-- Проверяем созданный билет
SELECT 'Информация о созданном билете' as demo_description;

SELECT t.ticket_number, t.seat_number, t.class, t.price, t.status,
       p.first_name, p.last_name, f.flight_number
FROM Tickets t
JOIN Passengers p ON t.passenger_id = p.passenger_id
JOIN Flights f ON t.flight_id = f.flight_id
WHERE t.ticket_id = (
    SELECT MAX(ticket_id) FROM Tickets WHERE passenger_id = 1
);

-- 2.3 Демонстрация процедуры расчета статистики
-- Рассчитываем статистику за последние 7 дней
SELECT 'Статистика рейсов за последние 7 дней' as demo_description;

SELECT * FROM calculate_flight_statistics(
    (CURRENT_DATE - INTERVAL '7 days')::DATE,  -- start_date
    CURRENT_DATE::DATE,                      -- end_date
    NULL::INTEGER                               -- route_id (все маршруты)
);

-- Рассчитываем статистику по конкретному маршруту
SELECT 'Статистика по маршруту Москва-Санкт-Петербург' as demo_description;

SELECT * FROM calculate_flight_statistics(
    (CURRENT_DATE - INTERVAL '30 days')::DATE,  -- start_date
    CURRENT_DATE::DATE,                       -- end_date
    1::INTEGER                                   -- route_id (Москва-СПб)
);

-- 2.4 Демонстрация процедуры получения информации о пассажире
-- Получаем полную информацию о пассажире
SELECT 'Информация о пассажире' as demo_description;

SELECT * FROM get_passenger_info(1);

-- Получаем информацию о другом пассажире
SELECT 'Информация о другом пассажире' as demo_description;

SELECT * FROM get_passenger_info(2);

-- 2.5 Демонстрация процедуры регистрации багажа
-- Регистрируем багаж для пассажира
SELECT 'Регистрация багажа' as demo_description;

SELECT register_baggage(
    1,          -- passenger_id
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999'),  -- flight_id
    25.5::DECIMAL(5,2),       -- weight (кг)
    1           -- user_id
) as baggage_id;

-- Проверяем зарегистрированный багаж
SELECT 'Информация о зарегистрированном багаже' as demo_description;

SELECT b.baggage_tag, b.weight, b.status, b.check_in_time,
       p.first_name, p.last_name, f.flight_number
FROM Baggage b
JOIN Passengers p ON b.passenger_id = p.passenger_id
JOIN Flights f ON b.flight_id = f.flight_id
WHERE b.baggage_id = (
    SELECT MAX(baggage_id) FROM Baggage WHERE passenger_id = 1
);

-- =====================================================
-- 3. ДЕМОНСТРАЦИЯ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ
-- =====================================================

-- 3.1 Проверка доступности места
SELECT 'Проверка доступности места' as demo_description;

SELECT is_seat_available(
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999'),
    '2A'::VARCHAR(10)
) as seat_2A_available;

SELECT is_seat_available(
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999'),
    '1A'::VARCHAR(10)  -- уже занято
) as seat_1A_available;

-- 3.2 Расчет загрузки рейса
SELECT 'Расчет загрузки рейса' as demo_description;

SELECT calculate_flight_load_percentage(
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999')
) as load_percentage;

-- 3.3 Генерация номера билета
SELECT 'Генерация номера билета' as demo_description;

SELECT generate_ticket_number() as new_ticket_number;

-- =====================================================
-- 4. ДЕМОНСТРАЦИЯ СИСТЕМЫ АУДИТА
-- =====================================================

-- 4.1 Просмотр журнала аудита
SELECT 'Последние записи в журнале аудита' as demo_description;

SELECT 
    log_id,
    action,
    table_name,
    record_id,
    new_values,
    timestamp
FROM Audit_Logs
ORDER BY timestamp DESC
LIMIT 10;

-- 4.2 Фильтрация по типу действия
SELECT 'Записи о регистрации пассажиров' as demo_description;

SELECT 
    log_id,
    action,
    table_name,
    record_id,
    new_values->>'passenger_id' as passenger_id,
    new_values->>'seat_number' as seat_number,
    new_values->>'class' as class,
    timestamp
FROM Audit_Logs
WHERE action = 'PASSENGER_REGISTERED'
ORDER BY timestamp DESC;

-- =====================================================
-- 5. ДЕМОНСТРАЦИЯ ОБРАБОТКИ ОШИБОК
-- =====================================================

-- 5.1 Попытка регистрации на недоступный рейс
SELECT 'Попытка регистрации на недоступный рейс' as demo_description;

-- Сначала отменим демонстрационный рейс
SELECT cancel_flight(
    (SELECT flight_id FROM Flights WHERE flight_number = 'SU999'),
    'Демонстрационная отмена',
    1
) as cancellation_result;

-- Теперь попробуем зарегистрировать пассажира на отмененный рейс
SELECT 'Попытка регистрации на отмененный рейс' as demo_description;

-- Это должно вызвать ошибку
-- SELECT register_passenger_for_flight(
--     1, (SELECT flight_id FROM Flights WHERE flight_number = 'DEMO001'), '3A', 'economy', 1
-- );

-- 5.2 Попытка регистрации на занятое место
SELECT 'Попытка регистрации на занятое место' as demo_description;

-- Создаем новый рейс для демонстрации
INSERT INTO Flights (flight_number, aircraft_id, route_id, departure_airport_id, arrival_airport_id, 
                     scheduled_departure, scheduled_arrival, status, price)
VALUES ('SU998', 2, 2, 1, 3, 
        CURRENT_TIMESTAMP + INTERVAL '2 hours', 
        CURRENT_TIMESTAMP + INTERVAL '4 hours', 
        'scheduled', 15000.00);

-- Регистрируем первого пассажира
SELECT register_passenger_for_flight(
    2, (SELECT flight_id FROM Flights WHERE flight_number = 'SU998'), '5B'::VARCHAR(10), 'economy'::VARCHAR(20), 1
) as first_passenger;

-- Попытка зарегистрировать второго пассажира на то же место
SELECT 'Попытка регистрации на занятое место' as demo_description;

-- Это должно вызвать ошибку
-- SELECT register_passenger_for_flight(
--     3, (SELECT flight_id FROM Flights WHERE flight_number = 'DEMO002'), '5B', 'economy', 1
-- );

-- =====================================================
-- 6. ДЕМОНСТРАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- 6.1 Анализ плана выполнения процедуры поиска рейсов
SELECT 'Анализ плана выполнения процедуры поиска' as demo_description;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM search_flights(
    'Москва'::VARCHAR(50), 'Санкт-Петербург'::VARCHAR(50), 
    (CURRENT_DATE + INTERVAL '1 day')::DATE, 20000.00::DECIMAL(10,2), 'economy'::VARCHAR(20)
);

-- 6.2 Измерение времени выполнения процедуры
SELECT 'Измерение времени выполнения' as demo_description;

\timing on

-- Выполняем процедуру несколько раз для измерения времени
SELECT * FROM search_flights('Москва'::VARCHAR(50), 'Санкт-Петербург'::VARCHAR(50), (CURRENT_DATE + INTERVAL '1 day')::DATE, 20000.00::DECIMAL(10,2), 'economy'::VARCHAR(20));
SELECT * FROM search_flights('Москва'::VARCHAR(50), 'Санкт-Петербург'::VARCHAR(50), (CURRENT_DATE + INTERVAL '1 day')::DATE, 20000.00::DECIMAL(10,2), 'economy'::VARCHAR(20));
SELECT * FROM search_flights('Москва'::VARCHAR(50), 'Санкт-Петербург'::VARCHAR(50), (CURRENT_DATE + INTERVAL '1 day')::DATE, 20000.00::DECIMAL(10,2), 'economy'::VARCHAR(20));

\timing off

-- =====================================================
-- 7. ДЕМОНСТРАЦИЯ ИНТЕГРАЦИИ КОМПОНЕНТОВ
-- =====================================================

-- 7.1 Полный цикл: создание рейса -> регистрация пассажира -> регистрация багажа
SELECT 'Полный цикл работы с рейсом' as demo_description;

-- Создаем новый рейс
INSERT INTO Flights (flight_number, aircraft_id, route_id, departure_airport_id, arrival_airport_id, 
                     scheduled_departure, scheduled_arrival, status, price)
VALUES ('SU997', 3, 3, 1, 4, 
        CURRENT_TIMESTAMP + INTERVAL '4 hours', 
        CURRENT_TIMESTAMP + INTERVAL '6 hours', 
        'scheduled', 18000.00);

-- Регистрируем пассажира
SELECT register_passenger_for_flight(
    4, (SELECT flight_id FROM Flights WHERE flight_number = 'SU997'), '8C'::VARCHAR(10), 'business'::VARCHAR(20), 1
) as passenger_registered;

-- Регистрируем багаж
SELECT register_baggage(
    4, (SELECT flight_id FROM Flights WHERE flight_number = 'SU997'), 28.0::DECIMAL(5,2), 1
) as baggage_registered;

-- Проверяем результат
SELECT 'Результат полного цикла' as demo_description;

SELECT 
    f.flight_number,
    f.status,
    p.first_name || ' ' || p.last_name as passenger_name,
    t.seat_number,
    t.class,
    t.price as ticket_price,
    b.baggage_tag,
    b.weight,
    b.status as baggage_status
FROM Flights f
JOIN Tickets t ON f.flight_id = t.flight_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
LEFT JOIN Baggage b ON p.passenger_id = b.passenger_id AND f.flight_id = b.flight_id
WHERE f.flight_number = 'SU997';

-- =====================================================
-- 8. ОЧИСТКА ДЕМОНСТРАЦИОННЫХ ДАННЫХ
-- =====================================================

-- Удаляем демонстрационные рейсы
SELECT 'Очистка демонстрационных данных' as demo_description;

DELETE FROM Tickets WHERE flight_id IN (
    SELECT flight_id FROM Flights WHERE flight_number IN ('SU999', 'SU998', 'SU997')
);

DELETE FROM Baggage WHERE flight_id IN (
    SELECT flight_id FROM Flights WHERE flight_number IN ('SU999', 'SU998', 'SU997')
);

DELETE FROM Flights WHERE flight_number IN ('SU999', 'SU998', 'SU997');

-- Проверяем очистку
SELECT 'Проверка очистки' as demo_description;

SELECT COUNT(*) as remaining_demo_flights
FROM Flights 
WHERE flight_number IN ('SU999', 'SU998', 'SU997');
