-- =====================================================
-- ПУЛ ЗАПРОСОВ ДЛЯ СЛОЖНЫХ ОПЕРАЦИЙ С БАЗОЙ ДАННЫХ
-- Система управления аэропортом
-- =====================================================

-- =====================================================
-- 1. ПУЛ ЗАПРОСОВ ДЛЯ СЛОЖНОЙ ВЫБОРКИ ИЗ БД
-- =====================================================

-- 1.1 Запрос с несколькими условиями
-- Найти все рейсы в определенный период с высокой загрузкой и определенным статусом
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.status,
    f.price,
    da.iata_code AS departure_airport,
    aa.iata_code AS arrival_airport,
    COUNT(t.ticket_id) as sold_tickets,
    a.capacity,
    ROUND((COUNT(t.ticket_id)::DECIMAL / a.capacity) * 100, 2) as load_percentage
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airports da ON f.departure_airport_id = da.airport_id
JOIN Airports aa ON f.arrival_airport_id = aa.airport_id
LEFT JOIN Tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
WHERE f.scheduled_departure BETWEEN '2024-12-20' AND '2024-12-25'
    AND f.status IN ('scheduled', 'boarding', 'departed')
    AND f.price BETWEEN 5000 AND 15000
    AND a.capacity > 100
GROUP BY f.flight_id, f.flight_number, f.scheduled_departure, f.status, f.price, 
         da.iata_code, aa.iata_code, a.capacity
HAVING COUNT(t.ticket_id) > 50
ORDER BY load_percentage DESC;

-- 1.2 Запрос с вложенными конструкциями (подзапросы)
-- Найти пассажиров, которые летали на самых дорогих рейсах
SELECT 
    p.first_name,
    p.last_name,
    p.passport_number,
    t.ticket_number,
    t.price,
    f.flight_number,
    f.scheduled_departure
FROM Passengers p
JOIN Tickets t ON p.passenger_id = t.passenger_id
JOIN Flights f ON t.flight_id = f.flight_id
WHERE t.price = (
    SELECT MAX(price) 
    FROM Tickets 
    WHERE status = 'active'
)
ORDER BY t.price DESC;

-- 1.3 Запрос с EXISTS
-- Найти самолеты, которые никогда не использовались в рейсах
SELECT 
    a.aircraft_id,
    a.registration_number,
    a.model_name,
    a.status,
    a.purchase_date
FROM Aircraft a
WHERE NOT EXISTS (
    SELECT 1 
    FROM Flights f 
    WHERE f.aircraft_id = a.aircraft_id
)
ORDER BY a.purchase_date DESC;

-- 1.4 Запрос с множественными подзапросами
-- Найти маршруты с наибольшим количеством рейсов и средней ценой выше средней по всем рейсам
SELECT 
    r.route_name,
    da.iata_code AS departure_airport,
    aa.iata_code AS arrival_airport,
    COUNT(f.flight_id) as total_flights,
    AVG(f.price) as avg_price,
    MIN(f.price) as min_price,
    MAX(f.price) as max_price
FROM Routes r
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Flights f ON r.route_id = f.route_id
WHERE f.status != 'cancelled'
GROUP BY r.route_id, r.route_name, da.iata_code, aa.iata_code
HAVING AVG(f.price) > (
    SELECT AVG(price) 
    FROM Flights 
    WHERE status != 'cancelled'
)
ORDER BY total_flights DESC, avg_price DESC;

-- =====================================================
-- 2. ПУЛ ЗАПРОСОВ ДЛЯ ПОЛУЧЕНИЯ ПРЕДСТАВЛЕНИЙ (JOIN)
-- =====================================================

-- 2.1 INNER JOIN - Полная информация о рейсах с деталями
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.scheduled_arrival,
    f.status,
    f.price,
    a.registration_number,
    am.model_name,
    am.manufacturer,
    da.iata_code AS dep_airport_code,
    da.airport_name AS dep_airport_name,
    ca.city_name AS dep_city,
    ca.country AS dep_country,
    aa.iata_code AS arr_airport_code,
    aa.airport_name AS arr_airport_name,
    cb.city_name AS arr_city,
    cb.country AS arr_country,
    g.gate_number,
    t.terminal_name
FROM Flights f
INNER JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
INNER JOIN Aircraft_Models am ON a.model_id = am.model_id
INNER JOIN Airports da ON f.departure_airport_id = da.airport_id
INNER JOIN Cities ca ON da.city_id = ca.city_id
INNER JOIN Airports aa ON f.arrival_airport_id = aa.airport_id
INNER JOIN Cities cb ON aa.city_id = cb.city_id
INNER JOIN Gates g ON f.gate_id = g.gate_id
INNER JOIN Terminals t ON g.terminal_id = t.terminal_id
WHERE f.scheduled_departure >= CURRENT_DATE
ORDER BY f.scheduled_departure;

-- 2.2 LEFT OUTER JOIN - Все пассажиры с их билетами (включая без билетов)
SELECT 
    p.passenger_id,
    p.first_name,
    p.last_name,
    p.passport_number,
    p.nationality,
    t.ticket_number,
    t.flight_id,
    f.flight_number,
    t.price,
    t.status as ticket_status,
    CASE 
        WHEN t.ticket_id IS NULL THEN 'Нет билетов'
        ELSE 'Есть билеты'
    END as ticket_status_desc
FROM Passengers p
LEFT OUTER JOIN Tickets t ON p.passenger_id = t.passenger_id
LEFT OUTER JOIN Flights f ON t.flight_id = f.flight_id
ORDER BY p.last_name, p.first_name;

-- 2.3 RIGHT OUTER JOIN - Все рейсы с информацией о пассажирах
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.status as flight_status,
    f.price,
    COUNT(t.ticket_id) as total_tickets,
    COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_tickets,
    COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tickets
FROM Flights f
RIGHT OUTER JOIN Tickets t ON f.flight_id = t.flight_id
GROUP BY f.flight_id, f.flight_number, f.scheduled_departure, f.status, f.price
ORDER BY f.scheduled_departure;

-- 2.4 FULL OUTER JOIN - Полная информация о самолетах и их обслуживании
SELECT 
    COALESCE(a.registration_number, 'Неизвестный самолет') as aircraft_info,
    COALESCE(a.model_name, 'Неизвестная модель') as model_info,
    COALESCE(a.status, 'Неизвестный статус') as aircraft_status,
    COALESCE(mr.maintenance_type, 'Нет обслуживания') as maintenance_type,
    COALESCE(mr.description, 'Нет описания') as maintenance_description,
    mr.start_date,
    mr.end_date,
    mr.cost,
    u.first_name || ' ' || u.last_name as technician_name
FROM Aircraft a
FULL OUTER JOIN Maintenance_Records mr ON a.aircraft_id = mr.aircraft_id
FULL OUTER JOIN Users u ON mr.technician_id = u.user_id
ORDER BY a.registration_number, mr.start_date DESC;

-- 2.5 CROSS JOIN - Все возможные комбинации городов для новых маршрутов
SELECT 
    c1.city_name as departure_city,
    c1.country as departure_country,
    c2.city_name as arrival_city,
    c2.country as arrival_country,
    CASE 
        WHEN c1.country = c2.country THEN 'Внутренний'
        ELSE 'Международный'
    END as route_type
FROM Cities c1
CROSS JOIN Cities c2
WHERE c1.city_id != c2.city_id
    AND NOT EXISTS (
        SELECT 1 
        FROM Routes r 
        JOIN Airports a1 ON r.departure_airport_id = a1.airport_id
        JOIN Airports a2 ON r.arrival_airport_id = a2.airport_id
        WHERE a1.city_id = c1.city_id AND a2.city_id = c2.city_id
    )
ORDER BY c1.city_name, c2.city_name;

-- 2.6 SELF JOIN - Иерархия ролей пользователей
SELECT 
    u1.user_id,
    u1.first_name || ' ' || u1.last_name as user_name,
    r1.role_name as user_role,
    u2.first_name || ' ' || u2.last_name as assigned_by_name,
    r2.role_name as assigned_by_role,
    ur.assigned_at
FROM Users u1
JOIN User_Roles ur ON u1.user_id = ur.user_id
JOIN Roles r1 ON ur.role_id = r1.role_id
LEFT JOIN Users u2 ON ur.assigned_by = u2.user_id
LEFT JOIN User_Roles ur2 ON u2.user_id = ur2.user_id
LEFT JOIN Roles r2 ON ur2.role_id = r2.role_id
ORDER BY u1.last_name, u1.first_name;

-- =====================================================
-- 3. ПУЛ ЗАПРОСОВ ДЛЯ СГРУППИРОВАННЫХ ДАННЫХ
-- =====================================================

-- 3.1 GROUP BY с агрегирующими функциями
-- Статистика по рейсам по месяцам
SELECT 
    EXTRACT(YEAR FROM scheduled_departure) as year,
    EXTRACT(MONTH FROM scheduled_departure) as month,
    COUNT(*) as total_flights,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_flights,
    COUNT(CASE WHEN status = 'departed' THEN 1 END) as departed_flights,
    COUNT(CASE WHEN status = 'arrived' THEN 1 END) as arrived_flights,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_flights,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    SUM(price) as total_revenue
FROM Flights
GROUP BY EXTRACT(YEAR FROM scheduled_departure), EXTRACT(MONTH FROM scheduled_departure)
ORDER BY year DESC, month DESC;

-- 3.2 HAVING - Группировка с условиями
-- Маршруты с высокой загрузкой (более 10 рейсов в месяц)
SELECT 
    r.route_name,
    da.iata_code AS departure_airport,
    aa.iata_code AS arrival_airport,
    COUNT(f.flight_id) as total_flights,
    AVG(f.price) as avg_price,
    COUNT(DISTINCT EXTRACT(MONTH FROM f.scheduled_departure)) as months_active
FROM Routes r
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Flights f ON r.route_id = f.route_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY r.route_id, r.route_name, da.iata_code, aa.iata_code
HAVING COUNT(f.flight_id) > 10
ORDER BY total_flights DESC;

-- 3.3 Оконные функции - PARTITION OVER
-- Рейтинг рейсов по цене в рамках каждого маршрута
SELECT 
    f.flight_number,
    r.route_name,
    f.scheduled_departure,
    f.price,
    ROW_NUMBER() OVER (PARTITION BY f.route_id ORDER BY f.price DESC) as price_rank_in_route,
    RANK() OVER (PARTITION BY f.route_id ORDER BY f.price DESC) as price_rank_with_ties,
    DENSE_RANK() OVER (PARTITION BY f.route_id ORDER BY f.price DESC) as dense_price_rank,
    AVG(f.price) OVER (PARTITION BY f.route_id) as avg_price_in_route,
    f.price - AVG(f.price) OVER (PARTITION BY f.route_id) as price_difference_from_avg
FROM Flights f
JOIN Routes r ON f.route_id = r.route_id
WHERE f.status != 'cancelled'
ORDER BY r.route_name, f.price DESC;

-- 3.4 Оконные функции - Скользящие окна
-- Скользящее среднее цен за последние 7 дней
SELECT 
    flight_number,
    scheduled_departure,
    price,
    AVG(price) OVER (
        ORDER BY scheduled_departure 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7_days,
    COUNT(*) OVER (
        ORDER BY scheduled_departure 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as flights_in_window
FROM Flights
WHERE scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY scheduled_departure;

-- 3.5 UNION - Объединение данных из разных источников
-- Объединение информации о всех пользователях системы
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    'System User' as user_type,
    created_at
FROM Users
WHERE is_active = true

UNION ALL

SELECT 
    passenger_id as user_id,
    first_name,
    last_name,
    email,
    'Passenger' as user_type,
    created_at
FROM Passengers
WHERE email IS NOT NULL

ORDER BY user_type, last_name, first_name;

-- 3.6 Сложная группировка с подзапросами
-- Анализ эффективности самолетов
SELECT 
    a.registration_number,
    am.model_name,
    am.manufacturer,
    COUNT(f.flight_id) as total_flights,
    COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
    ROUND(
        COUNT(CASE WHEN f.status = 'arrived' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(f.flight_id), 0) * 100, 2
    ) as completion_rate,
    AVG(f.price) as avg_ticket_price,
    SUM(f.price) as total_revenue,
    AVG(EXTRACT(EPOCH FROM (f.actual_arrival - f.actual_departure))/3600) as avg_flight_hours
FROM Aircraft a
JOIN Aircraft_Models am ON a.model_id = am.model_id
LEFT JOIN Flights f ON a.aircraft_id = f.aircraft_id
GROUP BY a.aircraft_id, a.registration_number, am.model_name, am.manufacturer
ORDER BY completion_rate DESC, total_revenue DESC;

-- =====================================================
-- 4. ПУЛ ЗАПРОСОВ ДЛЯ СЛОЖНЫХ ОПЕРАЦИЙ С ДАННЫМИ
-- =====================================================

-- 4.1 EXISTS - Проверка существования связанных записей
-- Найти пассажиров, которые летали на международных рейсах
SELECT 
    p.first_name,
    p.last_name,
    p.passport_number,
    p.nationality,
    COUNT(t.ticket_id) as total_tickets
FROM Passengers p
JOIN Tickets t ON p.passenger_id = t.passenger_id
JOIN Flights f ON t.flight_id = f.flight_id
JOIN Routes r ON f.route_id = r.route_id
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Cities dc ON da.city_id = dc.city_id
JOIN Cities ac ON aa.city_id = ac.city_id
WHERE EXISTS (
    SELECT 1 
    FROM Routes r2
    JOIN Airports da2 ON r2.departure_airport_id = da2.airport_id
    JOIN Airports aa2 ON r2.arrival_airport_id = aa2.airport_id
    JOIN Cities dc2 ON da2.city_id = dc2.city_id
    JOIN Cities ac2 ON aa2.city_id = ac2.city_id
    WHERE r2.route_id = f.route_id 
        AND dc2.country != ac2.country
)
GROUP BY p.passenger_id, p.first_name, p.last_name, p.passport_number, p.nationality
ORDER BY total_tickets DESC;

-- 4.2 INSERT INTO SELECT - Массовая вставка данных
-- Создание архива завершенных рейсов
CREATE TABLE IF NOT EXISTS Flight_Archive (
    flight_id INTEGER,
    flight_number VARCHAR(20),
    aircraft_registration VARCHAR(20),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    price DECIMAL(10,2),
    status VARCHAR(20),
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Flight_Archive (
    flight_id, flight_number, aircraft_registration, 
    departure_airport, arrival_airport,
    scheduled_departure, actual_departure, 
    scheduled_arrival, actual_arrival, 
    price, status
)
SELECT 
    f.flight_id,
    f.flight_number,
    a.registration_number,
    da.iata_code,
    aa.iata_code,
    f.scheduled_departure,
    f.actual_departure,
    f.scheduled_arrival,
    f.actual_arrival,
    f.price,
    f.status
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Airports da ON f.departure_airport_id = da.airport_id
JOIN Airports aa ON f.arrival_airport_id = aa.airport_id
WHERE f.status = 'arrived' 
    AND f.actual_arrival < CURRENT_DATE - INTERVAL '30 days';

-- 4.3 CASE - Условная логика в запросах
-- Классификация рейсов по различным критериям
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.price,
    f.status,
    CASE 
        WHEN f.price < 5000 THEN 'Бюджетный'
        WHEN f.price BETWEEN 5000 AND 10000 THEN 'Стандартный'
        WHEN f.price BETWEEN 10001 AND 15000 THEN 'Премиум'
        ELSE 'Люкс'
    END as price_category,
    CASE 
        WHEN EXTRACT(HOUR FROM f.scheduled_departure) BETWEEN 6 AND 11 THEN 'Утренний'
        WHEN EXTRACT(HOUR FROM f.scheduled_departure) BETWEEN 12 AND 17 THEN 'Дневной'
        WHEN EXTRACT(HOUR FROM f.scheduled_departure) BETWEEN 18 AND 23 THEN 'Вечерний'
        ELSE 'Ночной'
    END as time_category,
    CASE 
        WHEN dc.country = ac.country THEN 'Внутренний'
        ELSE 'Международный'
    END as route_type,
    CASE 
        WHEN f.status = 'arrived' THEN 'Завершен'
        WHEN f.status IN ('scheduled', 'boarding') THEN 'Активный'
        WHEN f.status = 'cancelled' THEN 'Отменен'
        ELSE 'В процессе'
    END as status_category
FROM Flights f
JOIN Routes r ON f.route_id = r.route_id
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Cities dc ON da.city_id = dc.city_id
JOIN Cities ac ON aa.city_id = ac.city_id
ORDER BY f.scheduled_departure;

-- 4.4 EXPLAIN - Анализ производительности запросов
-- Анализ плана выполнения сложного запроса
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.price,
    COUNT(t.ticket_id) as sold_tickets,
    a.capacity,
    ROUND((COUNT(t.ticket_id)::DECIMAL / a.capacity) * 100, 2) as load_percentage
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
LEFT JOIN Tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
WHERE f.scheduled_departure BETWEEN '2024-12-20' AND '2024-12-25'
    AND f.status IN ('scheduled', 'boarding', 'departed')
GROUP BY f.flight_id, f.flight_number, f.scheduled_departure, f.price, a.capacity
HAVING COUNT(t.ticket_id) > 0
ORDER BY load_percentage DESC;

-- 4.5 Сложная операция с обновлением данных
-- Обновление статуса рейсов на основе текущего времени
UPDATE Flights 
SET status = CASE 
    WHEN scheduled_departure > CURRENT_TIMESTAMP + INTERVAL '2 hours' THEN 'scheduled'
    WHEN scheduled_departure BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '2 hours' THEN 'boarding'
    WHEN actual_departure IS NOT NULL AND actual_arrival IS NULL THEN 'departed'
    WHEN actual_arrival IS NOT NULL THEN 'arrived'
    ELSE status
END,
updated_at = CURRENT_TIMESTAMP
WHERE status IN ('scheduled', 'boarding', 'departed')
    AND (scheduled_departure != CURRENT_TIMESTAMP OR actual_departure IS NOT NULL OR actual_arrival IS NOT NULL);

-- 4.6 Рекурсивный запрос (CTE)
-- Поиск всех связанных маршрутов через промежуточные аэропорты
WITH RECURSIVE RouteConnections AS (
    -- Базовый случай: прямые маршруты
    SELECT 
        r.route_id,
        r.route_name,
        da.iata_code as departure_airport,
        aa.iata_code as arrival_airport,
        r.distance,
        1 as hop_count,
        ARRAY[da.iata_code, aa.iata_code] as path
    FROM Routes r
    JOIN Airports da ON r.departure_airport_id = da.airport_id
    JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
    WHERE r.status = 'active'
    
    UNION ALL
    
    -- Рекурсивный случай: соединение маршрутов
    SELECT 
        rc.route_id,
        rc.route_name,
        rc.departure_airport,
        r2.arrival_airport,
        rc.distance + r2.distance,
        rc.hop_count + 1,
        rc.path || r2.arrival_airport
    FROM RouteConnections rc
    JOIN Routes r2 ON rc.arrival_airport = r2.departure_airport
    WHERE rc.hop_count < 3  -- Ограничение на количество пересадок
        AND NOT (r2.arrival_airport = ANY(rc.path))  -- Избегаем циклов
)
SELECT 
    departure_airport,
    arrival_airport,
    hop_count,
    distance,
    path
FROM RouteConnections
WHERE hop_count > 1
ORDER BY hop_count, distance;

-- =====================================================
-- 5. ДОПОЛНИТЕЛЬНЫЕ СЛОЖНЫЕ ЗАПРОСЫ
-- =====================================================

-- 5.1 Анализ трендов цен
-- Анализ изменения цен по маршрутам во времени
SELECT 
    r.route_name,
    da.iata_code as departure_airport,
    aa.iata_code as arrival_airport,
    DATE_TRUNC('month', f.scheduled_departure) as month,
    COUNT(*) as flights_count,
    AVG(f.price) as avg_price,
    MIN(f.price) as min_price,
    MAX(f.price) as max_price,
    STDDEV(f.price) as price_volatility,
    LAG(AVG(f.price)) OVER (
        PARTITION BY r.route_id 
        ORDER BY DATE_TRUNC('month', f.scheduled_departure)
    ) as prev_month_avg_price,
    ROUND(
        (AVG(f.price) - LAG(AVG(f.price)) OVER (
            PARTITION BY r.route_id 
            ORDER BY DATE_TRUNC('month', f.scheduled_departure)
        )) / LAG(AVG(f.price)) OVER (
            PARTITION BY r.route_id 
            ORDER BY DATE_TRUNC('month', f.scheduled_departure)
        ) * 100, 2
    ) as price_change_percent
FROM Routes r
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Flights f ON r.route_id = f.route_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '1 year'
    AND f.status != 'cancelled'
GROUP BY r.route_id, r.route_name, da.iata_code, aa.iata_code, 
         DATE_TRUNC('month', f.scheduled_departure)
ORDER BY r.route_name, month;

-- 5.2 Анализ задержек рейсов
-- Детальный анализ задержек по различным критериям
SELECT 
    f.flight_number,
    f.scheduled_departure,
    f.actual_departure,
    f.scheduled_arrival,
    f.actual_arrival,
    CASE 
        WHEN f.actual_departure IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60
        ELSE NULL 
    END as departure_delay_minutes,
    CASE 
        WHEN f.actual_arrival IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (f.actual_arrival - f.scheduled_arrival))/60
        ELSE NULL 
    END as arrival_delay_minutes,
    CASE 
        WHEN f.actual_departure IS NOT NULL AND 
             EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 > 15 
        THEN 'Задержка отправления'
        WHEN f.actual_arrival IS NOT NULL AND 
             EXTRACT(EPOCH FROM (f.actual_arrival - f.scheduled_arrival))/60 > 15 
        THEN 'Задержка прибытия'
        ELSE 'По расписанию'
    END as delay_status,
    a.model_name,
    dc.city_name as departure_city,
    ac.city_name as arrival_city
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Routes r ON f.route_id = r.route_id
JOIN Airports da ON r.departure_airport_id = da.airport_id
JOIN Airports aa ON r.arrival_airport_id = aa.airport_id
JOIN Cities dc ON da.city_id = dc.city_id
JOIN Cities ac ON aa.city_id = ac.city_id
WHERE f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.scheduled_departure DESC;

-- 5.3 Анализ эффективности экипажа
-- Статистика работы экипажа по рейсам
SELECT 
    u.first_name || ' ' || u.last_name as crew_member,
    r.role_name as position,
    COUNT(fc.flight_id) as total_flights,
    COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
    COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancelled_flights,
    ROUND(
        COUNT(CASE WHEN f.status = 'arrived' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(fc.flight_id), 0) * 100, 2
    ) as completion_rate,
    AVG(EXTRACT(EPOCH FROM (f.actual_arrival - f.actual_departure))/3600) as avg_flight_hours,
    SUM(f.price) as total_revenue_generated
FROM Users u
JOIN User_Roles ur ON u.user_id = ur.user_id
JOIN Roles r ON ur.role_id = r.role_id
JOIN Flight_Crew fc ON u.user_id = fc.user_id
JOIN Flights f ON fc.flight_id = f.flight_id
WHERE r.role_name IN ('pilot', 'co_pilot', 'flight_attendant', 'purser')
GROUP BY u.user_id, u.first_name, u.last_name, r.role_name
HAVING COUNT(fc.flight_id) > 0
ORDER BY completion_rate DESC, total_flights DESC;

-- =====================================================
-- 6. ТЕСТОВЫЕ ЗАПРОСЫ ДЛЯ ПРОВЕРКИ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

-- 6.1 Тест производительности с EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    COUNT(*) as total_flights,
    AVG(price) as avg_price,
    COUNT(DISTINCT route_id) as unique_routes,
    COUNT(DISTINCT aircraft_id) as unique_aircraft
FROM Flights
WHERE scheduled_departure >= CURRENT_DATE - INTERVAL '1 year';

-- 6.2 Тест индексов
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT f.*, a.registration_number, r.route_name
FROM Flights f
JOIN Aircraft a ON f.aircraft_id = a.aircraft_id
JOIN Routes r ON f.route_id = r.route_id
WHERE f.scheduled_departure BETWEEN '2024-12-01' AND '2024-12-31'
    AND f.status = 'scheduled'
ORDER BY f.scheduled_departure;

-- =====================================================
-- КОНЕЦ ПУЛА ЗАПРОСОВ
-- =====================================================
