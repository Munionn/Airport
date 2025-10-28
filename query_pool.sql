
-- =====================================================
-- ЗАПРОСЫ ДЛЯ ПОИСКА И ПРОСМОТРА ДАННЫХ
-- =====================================================

--  Поиск рейсов по маршруту и дате
-- Параметры: departure_iata, arrival_iata, departure_date
SELECT 
    f.flight_id,
    f.flight_number,
    f.scheduled_departure,
    f.scheduled_arrival,
    f.status,
    f.price,
    a.registration_number,
    a.model_name,
    dep_airport.iata_code as departure_iata,
    dep_airport.airport_name as departure_airport,
    arr_airport.iata_code as arrival_iata,
    arr_airport.airport_name as arrival_airport,
    calculate_flight_load(f.flight_id) as load_percentage
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
WHERE dep_airport.iata_code = 'SVO' 
AND arr_airport.iata_code = 'LED'     
AND DATE(f.scheduled_departure) = '2024-12-21'
AND f.status IN ('scheduled', 'boarding')
ORDER BY f.scheduled_departure;

-- Информация о пассажире и его билетах
-- Параметры: passenger_id или passport_number
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
    f.status as flight_status,
    dep_airport.iata_code as departure_iata,
    arr_airport.iata_code as arrival_iata
FROM Passengers p
JOIN Tickets t ON p.passenger_id = t.passenger_id
JOIN Flights f ON t.flight_id = f.flight_id
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
WHERE p.passport_number = 'OP8901234'
ORDER BY f.scheduled_departure;

--  Статистика рейсов по дням
SELECT 
    DATE(scheduled_departure) as flight_date,
    COUNT(*) as total_flights,
    COUNT(CASE WHEN status = 'arrived' THEN 1 END) as completed_flights,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_flights,
    COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_flights,
    ROUND(AVG(price), 2) as average_price,
    ROUND(AVG(calculate_flight_load(flight_id)), 2) as average_load_percentage
FROM Flights
WHERE scheduled_departure >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(scheduled_departure)
ORDER BY flight_date;

-- Информация об экипаже рейса
-- Параметры: flight_id
SELECT 
    f.flight_number,
    f.scheduled_departure,
    u.first_name,
    u.last_name,
    fc.position,
    fc.assigned_at
FROM Flight_Crew fc
JOIN Users u ON fc.user_id = u.user_id
JOIN Flights f ON fc.flight_id = f.flight_id
WHERE f.flight_id = 1
ORDER BY 
    CASE fc.position 
        WHEN 'pilot' THEN 1
        WHEN 'co_pilot' THEN 2
        WHEN 'flight_engineer' THEN 3
        WHEN 'purser' THEN 4
        WHEN 'flight_attendant' THEN 5
        ELSE 6
    END;



-- Поиск европейских пассажиров
SELECT 
    p.first_name,
    p.last_name,
    p.nationality,
    p.phone,
    p.email,
    COUNT(t.ticket_id) as tickets_count
FROM Passengers p
LEFT JOIN Tickets t ON p.passenger_id = t.passenger_id
WHERE p.nationality IN ('Польша', 'Германия', 'Чехия', 'Словакия', 'Венгрия', 'Румыния', 'Болгария', 'Хорватия', 'Словения', 'Эстония')
GROUP BY p.passenger_id, p.first_name, p.last_name, p.nationality, p.phone, p.email
ORDER BY p.nationality, p.last_name;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ ДОБАВЛЕНИЯ ДАННЫХ
-- =====================================================

-- Добавление нового пассажира
INSERT INTO Passengers (first_name, last_name, passport_number, nationality, date_of_birth, phone, email, special_requirements)
VALUES ('Ян', 'Новак', 'CZ1234567', 'Чехия', '1990-05-15', '+420-2-111-22-33', 'jan.novak@email.com', NULL)
RETURNING passenger_id;

-- Покупка билета
INSERT INTO Tickets (ticket_number, flight_id, passenger_id, seat_number, class, price, status)
VALUES (
    'TK' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0'),
    7,  -- flight_id
    1,  -- passenger_id
    '15A',  -- seat_number
    'economy',  -- class
    8500.00,  -- price
    'active'
)
RETURNING ticket_id, ticket_number;

-- Регистрация багажа
INSERT INTO Baggage (passenger_id, flight_id, baggage_tag, weight, status)
VALUES (
    1,  -- passenger_id
    7,  -- flight_id
    'BAG' || LPAD(nextval('baggage_baggage_id_seq')::TEXT, 6, '0'),
    23.5,  -- weight
    'checked_in'
)
RETURNING baggage_id, baggage_tag;

-- Назначение экипажа на рейс
INSERT INTO Flight_Crew (flight_id, user_id, position)
VALUES (7, 3, 'pilot')
RETURNING crew_id;

-- Добавление записи технического обслуживания
INSERT INTO Maintenance_Records (aircraft_id, maintenance_type, description, start_date, cost, technician_id, status)
VALUES (
    1,  -- aircraft_id
    'routine',  -- maintenance_type
    'Плановое техническое обслуживание',  -- description
    CURRENT_DATE,  -- start_date
    150000.00,  -- cost
    7,  -- technician_id
    'scheduled'
)
RETURNING maintenance_id;

-- Добавление нового пользователя
INSERT INTO Users (username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, is_active)
VALUES ('newuser', 'newuser@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Петр', 'Новичков', '+48-22-555-66-77', '1985-03-20', 'PL1234567', true)
RETURNING user_id;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ ОБНОВЛЕНИЯ ДАННЫХ
-- =====================================================

-- Обновление статуса рейса
UPDATE Flights 
SET status = 'boarding',
    actual_departure = CASE 
        WHEN 'boarding' = 'departed' THEN CURRENT_TIMESTAMP 
        ELSE actual_departure 
    END,
    actual_arrival = CASE 
        WHEN 'boarding' = 'arrived' THEN CURRENT_TIMESTAMP 
        ELSE actual_arrival 
    END
WHERE flight_id = 7
RETURNING flight_id, flight_number, status, actual_departure, actual_arrival;

-- Регистрация на рейс (check-in)
UPDATE Tickets 
SET check_in_time = CURRENT_TIMESTAMP,
    seat_number = COALESCE('15B', seat_number)
WHERE ticket_id = 11
RETURNING ticket_id, ticket_number, check_in_time, seat_number;

-- Обновление статуса багажа
UPDATE Baggage 
SET status = 'loaded',
    delivery_time = CASE 
        WHEN 'loaded' = 'delivered' THEN CURRENT_TIMESTAMP 
        ELSE delivery_time 
    END
WHERE baggage_id = 11
RETURNING baggage_id, baggage_tag, status, delivery_time;

-- Завершение технического обслуживания
UPDATE Maintenance_Records 
SET end_date = CURRENT_DATE,
    cost = COALESCE(160000.00, cost),
    status = 'completed'
WHERE maintenance_id = 1
RETURNING maintenance_id, maintenance_type, start_date, end_date, cost, status;

--  Обновление информации о пользователе
UPDATE Users 
SET phone = '+48-22-999-88-77',
    email = 'new.email@airport.com'
WHERE user_id = 1
RETURNING user_id, username, email, phone, updated_at;

--  Обновление информации о пассажире       
UPDATE Passengers 
SET phone = '+49-30-111-22-33',
    email = 'new.email@passenger.com'
WHERE passenger_id = 1
RETURNING passenger_id, first_name, last_name, phone, email;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ УДАЛЕНИЯ ДАННЫХ
-- =====================================================

-- Отмена билета
-- Параметры: ticket_id
UPDATE Tickets 
SET status = 'cancelled'
WHERE ticket_id = 12
RETURNING ticket_id, ticket_number, status;

-- Удаление записи технического обслуживания (только если не завершено)
-- Параметры: maintenance_id
DELETE FROM Maintenance_Records 
WHERE maintenance_id = 2 
AND status = 'scheduled'
RETURNING maintenance_id, maintenance_type, description;

-- Удаление пассажира (только если нет активных билетов)
-- Параметры: passenger_id
DELETE FROM Passengers 
WHERE passenger_id = 11 
AND NOT EXISTS (
    SELECT 1 FROM Tickets 
    WHERE passenger_id = 11 
    AND status = 'active'
)
RETURNING passenger_id, first_name, last_name;

-- Деактивация пользователя
UPDATE Users 
SET is_active = false
WHERE user_id = 10
RETURNING user_id, username, is_active;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ АНАЛИТИКИ И ОТЧЕТОВ
-- =====================================================

-- Топ-5 самых загруженных рейсов
SELECT 
    f.flight_number,
    dep_airport.iata_code as departure,
    arr_airport.iata_code as arrival,
    f.scheduled_departure,
    calculate_flight_load(f.flight_id) as load_percentage,
    COUNT(t.ticket_id) as passengers_count,
    SUM(t.price) as total_revenue
FROM Flights f
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
LEFT JOIN Tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY f.flight_id, f.flight_number, dep_airport.iata_code, arr_airport.iata_code, f.scheduled_departure
ORDER BY load_percentage DESC, passengers_count DESC
LIMIT 5;

-- Статистика по аэропортам
SELECT 
    a.iata_code,
    a.airport_name,
    c.city_name,
    c.country,
    COUNT(CASE WHEN f.departure_airport_id = a.airport_id THEN 1 END) as departures,
    COUNT(CASE WHEN f.arrival_airport_id = a.airport_id THEN 1 END) as arrivals,
    COUNT(DISTINCT CASE WHEN f.departure_airport_id = a.airport_id THEN f.route_id END) as unique_routes
FROM Airports a
JOIN Cities c ON a.city_id = c.city_id
LEFT JOIN Flights f ON (f.departure_airport_id = a.airport_id OR f.arrival_airport_id = a.airport_id)
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY a.airport_id, a.iata_code, a.airport_name, c.city_name, c.country
ORDER BY departures + arrivals DESC;

-- Статистика по самолетам
SELECT 
    a.registration_number,
    a.model_name,
    a.manufacturer,
    a.status,
    COUNT(f.flight_id) as flights_count,
    SUM(CASE WHEN f.status = 'arrived' THEN 1 ELSE 0 END) as completed_flights,
    SUM(CASE WHEN f.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_flights,
    ROUND(AVG(calculate_flight_load(f.flight_id)), 2) as avg_load_percentage,
    SUM(mr.cost) as total_maintenance_cost
FROM Aircraft a
LEFT JOIN Flights f ON a.aircraft_id = f.aircraft_id
LEFT JOIN Maintenance_Records mr ON a.aircraft_id = mr.aircraft_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days' OR f.scheduled_departure IS NULL
GROUP BY a.aircraft_id, a.registration_number, a.model_name, a.manufacturer, a.status
ORDER BY flights_count DESC;

-- Доходы по классам обслуживания
SELECT 
    t.class,
    COUNT(*) as tickets_count,
    SUM(t.price) as total_revenue,
    ROUND(AVG(t.price), 2) as average_price,
    ROUND(SUM(t.price) * 100.0 / SUM(SUM(t.price)) OVER(), 2) as revenue_percentage
FROM Tickets t
JOIN Flights f ON t.flight_id = f.flight_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
AND t.status = 'active'
GROUP BY t.class
ORDER BY total_revenue DESC;

-- Статистика по экипажу
SELECT 
    u.first_name,
    u.last_name,
    fc.position,
    COUNT(fc.flight_id) as flights_assigned,
    COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
    COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancelled_flights,
    MIN(f.scheduled_departure) as first_flight,
    MAX(f.scheduled_departure) as last_flight
FROM Flight_Crew fc
JOIN Users u ON fc.user_id = u.user_id
JOIN Flights f ON fc.flight_id = f.flight_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.user_id, u.first_name, u.last_name, fc.position
ORDER BY flights_assigned DESC;

-- Статистика по европейским пассажирам
SELECT 
    p.nationality,
    COUNT(*) as passengers_count,
    COUNT(t.ticket_id) as tickets_count,
    SUM(t.price) as total_spent,
    ROUND(AVG(t.price), 2) as average_ticket_price
FROM Passengers p
LEFT JOIN Tickets t ON p.passenger_id = t.passenger_id AND t.status = 'active'
WHERE p.nationality IN ('Польша', 'Германия', 'Чехия', 'Словакия', 'Венгрия', 'Румыния', 'Болгария', 'Хорватия', 'Словения', 'Эстония')
GROUP BY p.nationality
ORDER BY passengers_count DESC;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ ПРОВЕРКИ ОГРАНИЧЕНИЙ И ВАЛИДАЦИИ
-- =====================================================

-- Проверка доступности места
-- Параметры: flight_id, seat_number
SELECT 
    check_seat_availability(7, '15A') as is_available,
    CASE 
        WHEN check_seat_availability(7, '15A') THEN 'Место доступно'
        ELSE 'Место занято'
    END as status_message;

-- Проверка загрузки рейса
-- Параметры: flight_id
SELECT 
    f.flight_number,
    calculate_flight_load(f.flight_id) as load_percentage,
    CASE 
        WHEN calculate_flight_load(f.flight_id) >= 90 THEN 'Высокая загрузка'
        WHEN calculate_flight_load(f.flight_id) >= 70 THEN 'Средняя загрузка'
        ELSE 'Низкая загрузка'
    END as load_status
FROM Flights f
WHERE f.flight_id = 7;

--  Поиск рейсов с задержками
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.actual_departure,
    f.status,
    EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 as delay_minutes,
    dep_airport.iata_code as departure,
    arr_airport.iata_code as arrival
FROM Flights f
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
WHERE f.actual_departure > f.scheduled_departure
AND f.scheduled_departure >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY delay_minutes DESC;

-- Проверка целостности данных
SELECT 
    'Пользователи без ролей' as check_name,
    COUNT(*) as issue_count
FROM Users u
LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
WHERE ur.user_id IS NULL

UNION ALL

SELECT 
    'Рейсы без экипажа',
    COUNT(*)
FROM Flights f
LEFT JOIN Flight_Crew fc ON f.flight_id = fc.flight_id
WHERE fc.flight_id IS NULL
AND f.status IN ('scheduled', 'boarding')

UNION ALL

SELECT 
    'Билеты без пассажиров',
    COUNT(*)
FROM Tickets t
LEFT JOIN Passengers p ON t.passenger_id = p.passenger_id
WHERE p.passenger_id IS NULL;

-- =====================================================
-- ЗАПРОСЫ ДЛЯ СИСТЕМНОГО АДМИНИСТРИРОВАНИЯ
-- =====================================================

-- Активность пользователей
SELECT 
    u.username,
    u.first_name,
    u.last_name,
    u.is_active,
    COUNT(al.log_id) as actions_count,
    MAX(al.timestamp) as last_action
FROM Users u
LEFT JOIN Audit_Logs al ON u.user_id = al.user_id
WHERE al.timestamp >= CURRENT_DATE - INTERVAL '7 days' OR al.timestamp IS NULL
GROUP BY u.user_id, u.username, u.first_name, u.last_name, u.is_active
ORDER BY actions_count DESC;

-- Статистика по таблицам
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Размеры таблиц
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_indexes_size(tablename::regclass)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- =====================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ФУНКЦИЙ
-- =====================================================

-- Использование функции поиска рейсов
SELECT * FROM search_flights('SVO', 'LED', '2024-12-21');

-- Проверка доступности места с помощью функции
SELECT 
    f.flight_number,
    '15A' as seat_number,
    check_seat_availability(f.flight_id, '15A') as is_available
FROM Flights f
WHERE f.flight_id = 7;

-- Расчет загрузки рейса с помощью функции
SELECT 
    f.flight_number,
    calculate_flight_load(f.flight_id) as load_percentage,
    CASE 
        WHEN calculate_flight_load(f.flight_id) >= 90 THEN 'Рекомендуется увеличить частоту рейсов'
        WHEN calculate_flight_load(f.flight_id) <= 30 THEN 'Рекомендуется уменьшить частоту рейсов'
        ELSE 'Загрузка в норме'
    END as recommendation
FROM Flights f
WHERE f.flight_id = 7;

-- Поиск рейсов в европейские города
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.price,
    dep_airport.iata_code as departure,
    arr_airport.iata_code as arrival,
    arr_city.city_name as arrival_city,
    arr_city.country as arrival_country
FROM Flights f
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
JOIN Cities arr_city ON arr_airport.city_id = arr_city.city_id
WHERE arr_city.country IN ('Германия', 'Польша', 'Чехия', 'Франция', 'Великобритания')
AND f.status IN ('scheduled', 'boarding')
ORDER BY f.scheduled_departure;

-- Статистика по европейским маршрутам
SELECT 
    dep_city.country as departure_country,
    arr_city.country as arrival_country,
    COUNT(*) as flights_count,
    ROUND(AVG(f.price), 2) as average_price,
    SUM(CASE WHEN f.status = 'arrived' THEN 1 ELSE 0 END) as completed_flights
FROM Flights f
JOIN Airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
JOIN Airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
JOIN Cities dep_city ON dep_airport.city_id = dep_city.city_id
JOIN Cities arr_city ON arr_airport.city_id = arr_city.city_id
WHERE dep_city.country IN ('Россия', 'Германия', 'Польша', 'Чехия', 'Франция', 'Великобритания')
AND arr_city.country IN ('Россия', 'Германия', 'Польша', 'Чехия', 'Франция', 'Великобритания')
GROUP BY dep_city.country, arr_city.country
ORDER BY flights_count DESC;

COMMIT;
