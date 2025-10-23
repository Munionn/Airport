-- Airport Management System - Add Users Script
-- This script adds a normal user and an admin user to the database

-- Insert new users with properly hashed passwords
-- Password for both users is "password123" (hashed with bcrypt)

INSERT INTO Users (username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number) VALUES 
    -- Normal User (John Doe)
    ('john_doe', 'john.doe@example.com', '$2b$10$BHw.e/n7fXGjqCVc3yMvUOYIoBGeqJYP8GWoajEyYbD41m6hil23u', 'John', 'Doe', '+1-555-0123', '1985-03-15', 'D1234567'),
    
    -- Admin User (Admin Manager)
    ('admin_manager', 'admin.manager@airport.com', '$2b$10$BHw.e/n7fXGjqCVc3yMvUOYIoBGeqJYP8GWoajEyYbD41m6hil23u', 'Admin', 'Manager', '+1-555-0124', '1980-07-22', 'E1234567')
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth,
    passport_number = EXCLUDED.passport_number,
    updated_at = CURRENT_TIMESTAMP;

-- Assign passenger role to normal user
INSERT INTO User_Roles (user_id, role_id, assigned_by) 
SELECT u.user_id, r.role_id, 1
FROM Users u, Roles r
WHERE u.email = 'john.doe@example.com' 
  AND r.role_name = 'passenger'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO User_Roles (user_id, role_id, assigned_by) 
SELECT u.user_id, r.role_id, 1
FROM Users u, Roles r
WHERE u.email = 'admin.manager@airport.com' 
  AND r.role_name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Display the created users with their roles
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.is_active,
    STRING_AGG(r.role_name, ', ') as roles,
    u.created_at
FROM Users u
LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
LEFT JOIN Roles r ON ur.role_id = r.role_id
WHERE u.email IN ('john.doe@example.com', 'admin.manager@airport.com')
GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at
ORDER BY u.user_id;