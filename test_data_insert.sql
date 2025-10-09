-- Скрипт для заполнения базы данных тестовыми данными
-- Система управления аэропортом

-- =====================================================
-- ВСТАВКА БАЗОВЫХ ДАННЫХ
-- =====================================================

-- 1. Вставка ролей
INSERT INTO Roles (role_name, description, permissions) VALUES
('admin', 'Системный администратор', '{"all": true, "users": true, "aircraft": true, "flights": true, "reports": true}'),
('manager', 'Менеджер аэропорта', '{"flights": true, "aircraft": true, "passengers": true, "reports": true}'),
('pilot', 'Пилот', '{"flights": true, "aircraft": true, "schedule": true}'),
('co_pilot', 'Второй пилот', '{"flights": true, "aircraft": true, "schedule": true}'),
('flight_attendant', 'Бортпроводник', '{"flights": true, "passengers": true, "baggage": true}'),
('purser', 'Старший бортпроводник', '{"flights": true, "passengers": true, "baggage": true, "crew": true}'),
('technician', 'Техник', '{"aircraft": true, "maintenance": true}'),
('ground_staff', 'Наземный персонал', '{"baggage": true, "gates": true}'),
('passenger', 'Пассажир', '{"tickets": true, "baggage": true, "profile": true}');

-- 2. Вставка пользователей
INSERT INTO Users (username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, is_active) VALUES
('admin', 'admin@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Александр', 'Администраторов', '+48-22-123-45-67', '1980-05-15', 'AB1234567', true),
('manager1', 'manager1@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Мария', 'Менеджерова', '+49-30-234-56-78', '1985-08-22', 'CD2345678', true),
('pilot1', 'pilot1@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Иван', 'Пилотофф', '+420-2-345-67-89', '1982-03-10', 'EF3456789', true),
('pilot2', 'pilot2@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Петр', 'Летчиков', '+36-1-456-78-90', '1978-11-25', 'GH4567890', true),
('attendant1', 'attendant1@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Анна', 'Стюардессова', '+40-21-567-89-01', '1990-07-18', 'IJ5678901', true),
('attendant2', 'attendant2@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Елена', 'Бортпроводникова', '+359-2-678-90-12', '1988-12-05', 'KL6789012', true),
('technician1', 'tech1@airport.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Сергей', 'Техников', '+385-1-789-01-23', '1983-04-30', 'MN7890123', true),
('passenger1', 'passenger1@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Дмитрий', 'Пассажиров', '+48-22-890-12-34', '1992-09-14', 'OP8901234', true),
('passenger2', 'passenger2@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Ольга', 'Путешественникова', '+49-30-901-23-45', '1987-01-28', 'QR9012345', true),
('passenger3', 'passenger3@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Николай', 'Туристов', '+420-2-012-34-56', '1995-06-12', 'ST0123456', true);

-- 3. Назначение ролей пользователям
INSERT INTO User_Roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1), -- admin -> admin
(2, 2, 1), -- manager1 -> manager
(3, 3, 2), -- pilot1 -> pilot
(4, 4, 2), -- pilot2 -> co_pilot
(5, 5, 2), -- attendant1 -> flight_attendant
(6, 6, 2), -- attendant2 -> purser
(7, 7, 2), -- technician1 -> technician
(8, 9, 2), -- passenger1 -> passenger
(9, 9, 2), -- passenger2 -> passenger
(10, 9, 2); -- passenger3 -> passenger

-- 4. Вставка моделей самолетов
INSERT INTO Aircraft_Models (model_name, manufacturer, capacity, max_range) VALUES
('Boeing 737-800', 'Boeing', 189, 5765),
('Boeing 777-300ER', 'Boeing', 396, 13650),
('Airbus A320', 'Airbus', 180, 6150),
('Airbus A350-900', 'Airbus', 315, 15000),
('Boeing 787-9', 'Boeing', 296, 15750),
('Boeing 737 MAX 8', 'Boeing', 200, 6570),
('Airbus A321', 'Airbus', 220, 7400),
('Boeing 747-8', 'Boeing', 467, 14815);

-- 5. Вставка городов
INSERT INTO Cities (city_name, country, timezone) VALUES
('Москва', 'Россия', 'Europe/Moscow'),
('Санкт-Петербург', 'Россия', 'Europe/Moscow'),
('Мюнхен', 'Германия', 'Europe/Berlin'),
('Варшава', 'Польша', 'Europe/Warsaw'),
('Лондон', 'Великобритания', 'Europe/London'),
('Париж', 'Франция', 'Europe/Paris'),
('Берлин', 'Германия', 'Europe/Berlin'),
('Нью-Йорк', 'США', 'America/New_York'),
('Лос-Анджелес', 'США', 'America/Los_Angeles'),
('Токио', 'Япония', 'Asia/Tokyo'),
('Пекин', 'Китай', 'Asia/Shanghai'),
('Дубай', 'ОАЭ', 'Asia/Dubai'),
('Стамбул', 'Турция', 'Europe/Istanbul'),
('Рим', 'Италия', 'Europe/Rome'),
('Мадрид', 'Испания', 'Europe/Madrid');

-- 6. Вставка аэропортов
INSERT INTO Airports (iata_code, icao_code, airport_name, city_id, latitude, longitude) VALUES
('SVO', 'UUEE', 'Шереметьево', 1, 55.9736, 37.4145),
('LED', 'ULLI', 'Пулково', 2, 59.8003, 30.2625),
('MUC', 'EDDM', 'Мюнхен', 3, 48.3538, 11.7861),
('WAW', 'EPWA', 'Варшава', 4, 52.1657, 20.9671),
('LHR', 'EGLL', 'Хитроу', 5, 51.4700, -0.4543),
('CDG', 'LFPG', 'Шарль де Голль', 6, 49.0097, 2.5479),
('BER', 'EDDB', 'Берлин', 7, 52.3519, 13.4938),
('JFK', 'KJFK', 'Кеннеди', 8, 40.6413, -73.7781),
('LAX', 'KLAX', 'Лос-Анджелес', 9, 33.9425, -118.4081),
('NRT', 'RJAA', 'Нарита', 10, 35.7720, 140.3928),
('PEK', 'ZBAA', 'Пекин', 11, 40.0799, 116.6031),
('DXB', 'OMDB', 'Дубай', 12, 25.2532, 55.3657),
('IST', 'LTBA', 'Стамбул', 13, 41.2753, 28.7519),
('FCO', 'LIRF', 'Рим', 14, 41.8003, 12.2389),
('MAD', 'LEMD', 'Мадрид', 15, 40.4983, -3.5676);

-- 7. Вставка маршрутов
INSERT INTO Routes (route_name, departure_airport_id, arrival_airport_id, distance, duration, status) VALUES
('Москва-Санкт-Петербург', 1, 2, 635, '01:30:00', 'active'),
('Москва-Мюнхен', 1, 3, 1815, '03:15:00', 'active'),
('Москва-Варшава', 1, 4, 1200, '02:30:00', 'active'),
('Москва-Лондон', 1, 5, 2507, '03:45:00', 'active'),
('Москва-Париж', 1, 6, 2487, '03:30:00', 'active'),
('Москва-Берлин', 1, 7, 1612, '02:45:00', 'active'),
('Москва-Нью-Йорк', 1, 8, 7515, '10:30:00', 'active'),
('Москва-Лос-Анджелес', 1, 9, 9570, '13:15:00', 'active'),
('Москва-Токио', 1, 10, 7478, '09:15:00', 'active'),
('Москва-Пекин', 1, 11, 5790, '08:00:00', 'active'),
('Москва-Дубай', 1, 12, 3420, '05:30:00', 'active'),
('Москва-Стамбул', 1, 13, 1750, '03:00:00', 'active'),
('Москва-Рим', 1, 14, 2100, '03:30:00', 'active'),
('Москва-Мадрид', 1, 15, 3200, '04:45:00', 'active'),
('Санкт-Петербург-Москва', 2, 1, 635, '01:30:00', 'active'),
('Санкт-Петербург-Мюнхен', 2, 3, 1400, '02:30:00', 'active'),
('Мюнхен-Москва', 3, 1, 1815, '03:15:00', 'active'),
('Варшава-Москва', 4, 1, 1200, '02:30:00', 'active');

-- 8. Вставка терминалов
INSERT INTO Terminals (terminal_name, terminal_code, capacity, status, opening_hours) VALUES
('Терминал A', 'T1', 5000, 'active', '24/7'),
('Терминал B', 'T2', 8000, 'active', '24/7'),
('Терминал C', 'T3', 12000, 'active', '24/7'),
('Терминал D', 'T4', 6000, 'active', '24/7'),
('Терминал E', 'T5', 4000, 'active', '24/7'),
('Терминал F', 'T6', 3000, 'maintenance', '06:00-24:00');

-- 9. Вставка гейтов
INSERT INTO Gates (terminal_id, gate_number, status, capacity) VALUES
-- Терминал A
(1, 'A1', 'available', 200),
(1, 'A2', 'available', 200),
(1, 'A3', 'available', 200),
(1, 'A4', 'occupied', 200),
(1, 'A5', 'available', 200),
-- Терминал B
(2, 'B1', 'available', 300),
(2, 'B2', 'available', 300),
(2, 'B3', 'occupied', 300),
(2, 'B4', 'available', 300),
(2, 'B5', 'maintenance', 300),
-- Терминал C
(3, 'C1', 'available', 400),
(3, 'C2', 'available', 400),
(3, 'C3', 'occupied', 400),
(3, 'C4', 'available', 400),
-- Терминал D
(4, 'D1', 'available', 250),
(4, 'D2', 'available', 250),
(4, 'D3', 'occupied', 250),
-- Терминал E
(5, 'E1', 'available', 150),
(5, 'E2', 'available', 150),
-- Терминал F
(6, 'F1', 'maintenance', 100),
(6, 'F2', 'maintenance', 100);

-- 10. Вставка самолетов
INSERT INTO Aircraft (registration_number, model_id, model_name, manufacturer, capacity, max_range, status, purchase_date, last_maintenance, next_maintenance) VALUES
('RA-12345', 1, 'Boeing 737-800', 'Boeing', 189, 5765, 'active', '2020-01-15', '2024-01-10', '2024-07-10'),
('RA-23456', 2, 'Boeing 777-300ER', 'Boeing', 396, 13650, 'active', '2019-05-20', '2024-02-15', '2024-08-15'),
('RA-34567', 3, 'Airbus A320', 'Airbus', 180, 6150, 'active', '2021-03-10', '2024-01-20', '2024-07-20'),
('RA-45678', 4, 'Airbus A350-900', 'Airbus', 315, 15000, 'active', '2020-11-25', '2024-03-01', '2024-09-01'),
('RA-56789', 5, 'Boeing 787-9', 'Boeing', 296, 15750, 'maintenance', '2021-08-30', '2024-02-28', '2024-08-28'),
('RA-67890', 6, 'Boeing 737 MAX 8', 'Boeing', 200, 6570, 'active', '2022-04-12', '2024-01-05', '2024-07-05'),
('RA-78901', 7, 'Airbus A321', 'Airbus', 220, 7400, 'active', '2021-12-08', '2024-02-10', '2024-08-10'),
('RA-89012', 8, 'Boeing 747-8', 'Boeing', 467, 14815, 'active', '2020-06-18', '2024-01-15', '2024-07-15');

-- 11. Вставка рейсов
INSERT INTO Flights (flight_number, aircraft_id, route_id, departure_airport_id, arrival_airport_id, gate_id, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, status, price) VALUES
-- Рейсы на сегодня
('SU100', 1, 1, 1, 2, 1, '2024-12-20 08:00:00', '2024-12-20 09:30:00', '2024-12-20 08:05:00', '2024-12-20 09:35:00', 'arrived', 8500.00),
('SU101', 2, 2, 1, 3, 2, '2024-12-20 10:00:00', '2024-12-20 13:15:00', '2024-12-20 10:10:00', '2024-12-20 13:25:00', 'arrived', 25000.00),
('SU102', 3, 3, 1, 4, 3, '2024-12-20 12:00:00', '2024-12-20 14:30:00', '2024-12-20 12:15:00', '2024-12-20 14:45:00', 'arrived', 12000.00),
('SU103', 4, 4, 1, 5, 4, '2024-12-20 14:00:00', '2024-12-20 17:45:00', '2024-12-20 14:20:00', '2024-12-20 18:05:00', 'arrived', 45000.00),
('SU104', 5, 5, 1, 6, 5, '2024-12-20 16:00:00', '2024-12-20 19:30:00', NULL, NULL, 'delayed', 42000.00),
('SU105', 6, 6, 1, 7, 6, '2024-12-20 18:00:00', '2024-12-20 20:45:00', '2024-12-20 18:10:00', '2024-12-20 20:55:00', 'arrived', 15000.00),
-- Рейсы на завтра
('SU200', 1, 1, 1, 2, 1, '2024-12-21 08:00:00', '2024-12-21 09:30:00', NULL, NULL, 'scheduled', 8500.00),
('SU201', 2, 2, 1, 3, 2, '2024-12-21 10:00:00', '2024-12-21 13:15:00', NULL, NULL, 'scheduled', 25000.00),
('SU202', 3, 3, 1, 4, 3, '2024-12-21 12:00:00', '2024-12-21 14:30:00', NULL, NULL, 'scheduled', 12000.00),
('SU203', 4, 4, 1, 5, 4, '2024-12-21 14:00:00', '2024-12-21 17:45:00', NULL, NULL, 'scheduled', 45000.00),
('SU204', 6, 6, 1, 7, 5, '2024-12-21 16:00:00', '2024-12-21 20:45:00', NULL, NULL, 'scheduled', 15000.00),
('SU205', 7, 7, 1, 8, 6, '2024-12-21 18:00:00', '2024-12-21 20:45:00', NULL, NULL, 'scheduled', 38000.00),
-- Международные рейсы
('SU300', 8, 8, 1, 8, 7, '2024-12-21 20:00:00', '2024-12-22 06:30:00', NULL, NULL, 'scheduled', 85000.00),
('SU301', 4, 10, 1, 10, 8, '2024-12-21 22:00:00', '2024-12-22 07:15:00', NULL, NULL, 'scheduled', 95000.00);

-- 12. Вставка пассажиров
INSERT INTO Passengers (user_id, first_name, last_name, passport_number, nationality, date_of_birth, phone, email, special_requirements) VALUES
(8, 'Дмитрий', 'Пассажиров', 'OP8901234', 'Польша', '1992-09-14', '+48-22-890-12-34', 'passenger1@email.com', 'Вегетарианское питание'),
(9, 'Ольга', 'Путешественникова', 'QR9012345', 'Германия', '1987-01-28', '+49-30-901-23-45', 'passenger2@email.com', NULL),
(10, 'Николай', 'Туристов', 'ST0123456', 'Чехия', '1995-06-12', '+420-2-012-34-56', 'passenger3@email.com', 'Кресло-коляска'),
(NULL, 'Анна', 'Сидорова', 'UV1234567', 'Словакия', '1985-03-20', '+421-2-123-45-67', 'anna.sidorova@email.com', NULL),
(NULL, 'Михаил', 'Петров', 'WX2345678', 'Венгрия', '1990-11-08', '+36-1-234-56-78', 'mikhail.petrov@email.com', 'Дополнительное место для ног'),
(NULL, 'Екатерина', 'Козлова', 'YZ3456789', 'Румыния', '1988-07-15', '+40-21-345-67-89', 'ekaterina.kozlova@email.com', NULL),
(NULL, 'Алексей', 'Морозов', 'AB4567890', 'Болгария', '1993-04-25', '+359-2-456-78-90', 'alexey.morozov@email.com', 'Вегетарианское питание'),
(NULL, 'Татьяна', 'Волкова', 'CD5678901', 'Хорватия', '1986-12-03', '+385-1-567-89-01', 'tatyana.volkova@email.com', NULL),
(NULL, 'Сергей', 'Новиков', 'EF6789012', 'Словения', '1991-08-17', '+386-1-678-90-12', 'sergey.novikov@email.com', 'Дополнительное место для ног'),
(NULL, 'Мария', 'Федорова', 'GH7890123', 'Эстония', '1989-05-30', '+372-6-789-01-23', 'maria.fedorova@email.com', NULL);

-- 13. Вставка билетов
INSERT INTO Tickets (ticket_number, flight_id, passenger_id, seat_number, class, price, status, purchase_date, check_in_time) VALUES
-- Билеты на завершенные рейсы
('TK001001', 1, 1, '12A', 'economy', 8500.00, 'used', '2024-12-15 10:30:00', '2024-12-20 07:30:00'),
('TK001002', 1, 2, '12B', 'economy', 8500.00, 'used', '2024-12-15 10:35:00', '2024-12-20 07:35:00'),
('TK001003', 1, 3, '12C', 'economy', 8500.00, 'used', '2024-12-15 10:40:00', '2024-12-20 07:40:00'),
('TK002001', 2, 4, '25A', 'business', 35000.00, 'used', '2024-12-16 14:20:00', '2024-12-20 09:30:00'),
('TK002002', 2, 5, '25B', 'business', 35000.00, 'used', '2024-12-16 14:25:00', '2024-12-20 09:35:00'),
('TK003001', 3, 6, '15A', 'economy', 12000.00, 'used', '2024-12-17 11:15:00', '2024-12-20 11:30:00'),
('TK003002', 3, 7, '15B', 'economy', 12000.00, 'used', '2024-12-17 11:20:00', '2024-12-20 11:35:00'),
('TK004001', 4, 8, '1A', 'first', 65000.00, 'used', '2024-12-18 16:45:00', '2024-12-20 13:30:00'),
('TK005001', 5, 9, '8A', 'business', 55000.00, 'cancelled', '2024-12-19 12:00:00', NULL),
('TK006001', 6, 10, '20A', 'economy', 15000.00, 'used', '2024-12-19 15:30:00', '2024-12-20 17:30:00'),
-- Билеты на будущие рейсы
('TK007001', 7, 1, '12A', 'economy', 8500.00, 'active', '2024-12-20 16:00:00', NULL),
('TK007002', 7, 2, '12B', 'economy', 8500.00, 'active', '2024-12-20 16:05:00', NULL),
('TK008001', 8, 3, '25A', 'business', 35000.00, 'active', '2024-12-20 18:30:00', NULL),
('TK009001', 9, 4, '15A', 'economy', 12000.00, 'active', '2024-12-20 20:15:00', NULL),
('TK010001', 10, 5, '1A', 'first', 65000.00, 'active', '2024-12-20 22:00:00', NULL),
('TK011001', 11, 6, '8A', 'business', 20000.00, 'active', '2024-12-21 08:00:00', NULL),
('TK012001', 12, 7, '20A', 'economy', 45000.00, 'active', '2024-12-21 10:30:00', NULL),
('TK013001', 13, 8, '30A', 'economy', 95000.00, 'active', '2024-12-21 12:00:00', NULL),
('TK014001', 14, 9, '40A', 'economy', 110000.00, 'active', '2024-12-21 14:00:00', NULL);

-- 14. Вставка багажа
INSERT INTO Baggage (passenger_id, flight_id, baggage_tag, weight, status, check_in_time, delivery_time) VALUES
-- Багаж завершенных рейсов
(1, 1, 'BAG001001', 23.5, 'delivered', '2024-12-20 07:00:00', '2024-12-20 10:00:00'),
(2, 1, 'BAG001002', 18.2, 'delivered', '2024-12-20 07:05:00', '2024-12-20 10:05:00'),
(3, 1, 'BAG001003', 25.8, 'delivered', '2024-12-20 07:10:00', '2024-12-20 10:10:00'),
(4, 2, 'BAG002001', 32.1, 'delivered', '2024-12-20 09:00:00', '2024-12-20 15:00:00'),
(5, 2, 'BAG002002', 28.7, 'delivered', '2024-12-20 09:05:00', '2024-12-20 15:05:00'),
(6, 3, 'BAG003001', 21.3, 'delivered', '2024-12-20 11:00:00', '2024-12-20 15:30:00'),
(7, 3, 'BAG003002', 19.8, 'delivered', '2024-12-20 11:05:00', '2024-12-20 15:35:00'),
(8, 4, 'BAG004001', 35.2, 'delivered', '2024-12-20 13:00:00', '2024-12-20 19:00:00'),
(10, 6, 'BAG006001', 24.5, 'delivered', '2024-12-20 17:00:00', '2024-12-20 21:00:00'),
-- Багаж будущих рейсов
(1, 7, 'BAG007001', 22.1, 'checked_in', '2024-12-21 06:30:00', NULL),
(2, 7, 'BAG007002', 26.3, 'checked_in', '2024-12-21 06:35:00', NULL),
(3, 8, 'BAG008001', 29.8, 'checked_in', '2024-12-21 08:30:00', NULL),
(4, 9, 'BAG009001', 31.2, 'checked_in', '2024-12-21 10:30:00', NULL),
(5, 10, 'BAG010001', 27.5, 'checked_in', '2024-12-21 12:30:00', NULL);

-- 15. Вставка экипажа рейсов
INSERT INTO Flight_Crew (flight_id, user_id, position, assigned_at) VALUES
-- Экипаж завершенных рейсов
(1, 3, 'pilot', '2024-12-19 16:00:00'),
(1, 4, 'co_pilot', '2024-12-19 16:00:00'),
(1, 5, 'flight_attendant', '2024-12-19 16:00:00'),
(1, 6, 'purser', '2024-12-19 16:00:00'),
(2, 3, 'pilot', '2024-12-19 18:00:00'),
(2, 4, 'co_pilot', '2024-12-19 18:00:00'),
(2, 5, 'flight_attendant', '2024-12-19 18:00:00'),
(2, 6, 'purser', '2024-12-19 18:00:00'),
(3, 3, 'pilot', '2024-12-19 20:00:00'),
(3, 4, 'co_pilot', '2024-12-19 20:00:00'),
(3, 5, 'flight_attendant', '2024-12-19 20:00:00'),
(4, 3, 'pilot', '2024-12-19 22:00:00'),
(4, 4, 'co_pilot', '2024-12-19 22:00:00'),
(4, 5, 'flight_attendant', '2024-12-19 22:00:00'),
(4, 6, 'purser', '2024-12-19 22:00:00'),
(6, 3, 'pilot', '2024-12-20 14:00:00'),
(6, 4, 'co_pilot', '2024-12-20 14:00:00'),
(6, 5, 'flight_attendant', '2024-12-20 14:00:00'),
-- Экипаж будущих рейсов
(7, 3, 'pilot', '2024-12-20 16:00:00'),
(7, 4, 'co_pilot', '2024-12-20 16:00:00'),
(7, 5, 'flight_attendant', '2024-12-20 16:00:00'),
(8, 3, 'pilot', '2024-12-20 18:00:00'),
(8, 4, 'co_pilot', '2024-12-20 18:00:00'),
(8, 5, 'flight_attendant', '2024-12-20 18:00:00'),
(8, 6, 'purser', '2024-12-20 18:00:00'),
(9, 3, 'pilot', '2024-12-20 20:00:00'),
(9, 4, 'co_pilot', '2024-12-20 20:00:00'),
(9, 5, 'flight_attendant', '2024-12-20 20:00:00'),
(10, 3, 'pilot', '2024-12-20 22:00:00'),
(10, 4, 'co_pilot', '2024-12-20 22:00:00'),
(10, 5, 'flight_attendant', '2024-12-20 22:00:00'),
(10, 6, 'purser', '2024-12-20 22:00:00');

-- 16. Вставка записей технического обслуживания
INSERT INTO Maintenance_Records (aircraft_id, maintenance_type, description, start_date, end_date, cost, technician_id, status) VALUES
(1, 'routine', 'Плановое техническое обслуживание', '2024-01-10', '2024-01-12', 150000.00, 7, 'completed'),
(2, 'inspection', 'Годовой осмотр', '2024-02-15', '2024-02-18', 250000.00, 7, 'completed'),
(3, 'repair', 'Замена двигателя', '2024-03-01', '2024-03-15', 5000000.00, 7, 'completed'),
(4, 'routine', 'Плановое техническое обслуживание', '2024-03-01', '2024-03-03', 180000.00, 7, 'completed'),
(5, 'overhaul', 'Капитальный ремонт', '2024-02-28', NULL, 15000000.00, 7, 'in_progress'),
(6, 'inspection', 'Межполетный осмотр', '2024-01-05', '2024-01-05', 50000.00, 7, 'completed'),
(7, 'routine', 'Плановое техническое обслуживание', '2024-02-10', '2024-02-12', 160000.00, 7, 'completed'),
(8, 'inspection', 'Годовой осмотр', '2024-01-15', '2024-01-18', 300000.00, 7, 'completed');

-- 17. Вставка записей аудита
INSERT INTO Audit_Logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, timestamp) VALUES
(1, 'INSERT', 'Users', 1, NULL, '{"username": "admin", "email": "admin@airport.com"}', '192.168.1.100', 'Mozilla/5.0 (Linux; x86_64)', '2024-12-15 09:00:00'),
(1, 'INSERT', 'Roles', 1, NULL, '{"role_name": "admin"}', '192.168.1.100', 'Mozilla/5.0 (Linux; x86_64)', '2024-12-15 09:05:00'),
(2, 'INSERT', 'Flights', 1, NULL, '{"flight_number": "SU100"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', '2024-12-15 10:00:00'),
(2, 'UPDATE', 'Flights', 1, '{"status": "scheduled"}', '{"status": "boarding"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', '2024-12-20 07:30:00'),
(2, 'UPDATE', 'Flights', 1, '{"status": "boarding"}', '{"status": "departed"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', '2024-12-20 08:05:00'),
(2, 'UPDATE', 'Flights', 1, '{"status": "departed"}', '{"status": "arrived"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0)', '2024-12-20 09:35:00'),
(8, 'INSERT', 'Tickets', 1, NULL, '{"ticket_number": "TK001001"}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', '2024-12-15 10:30:00'),
(8, 'UPDATE', 'Tickets', 1, '{"status": "active"}', '{"status": "used"}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', '2024-12-20 09:35:00');

-- =====================================================
-- ПРОВЕРКА ДАННЫХ
-- =====================================================

-- Проверка количества записей в каждой таблице
SELECT 'Users' as table_name, COUNT(*) as record_count FROM Users
UNION ALL
SELECT 'Roles', COUNT(*) FROM Roles
UNION ALL
SELECT 'User_Roles', COUNT(*) FROM User_Roles
UNION ALL
SELECT 'Aircraft_Models', COUNT(*) FROM Aircraft_Models
UNION ALL
SELECT 'Aircraft', COUNT(*) FROM Aircraft
UNION ALL
SELECT 'Cities', COUNT(*) FROM Cities
UNION ALL
SELECT 'Airports', COUNT(*) FROM Airports
UNION ALL
SELECT 'Routes', COUNT(*) FROM Routes
UNION ALL
SELECT 'Terminals', COUNT(*) FROM Terminals
UNION ALL
SELECT 'Gates', COUNT(*) FROM Gates
UNION ALL
SELECT 'Flights', COUNT(*) FROM Flights
UNION ALL
SELECT 'Passengers', COUNT(*) FROM Passengers
UNION ALL
SELECT 'Tickets', COUNT(*) FROM Tickets
UNION ALL
SELECT 'Baggage', COUNT(*) FROM Baggage
UNION ALL
SELECT 'Flight_Crew', COUNT(*) FROM Flight_Crew
UNION ALL
SELECT 'Maintenance_Records', COUNT(*) FROM Maintenance_Records
UNION ALL
SELECT 'Audit_Logs', COUNT(*) FROM Audit_Logs
ORDER BY table_name;

COMMIT;
