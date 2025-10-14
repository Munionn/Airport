-- Airport Management System Database Schema
-- Based on the physical model for PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Users table (matching physical model)
CREATE TABLE IF NOT EXISTS Users (
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
    
    -- Constraints from physical model
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT chk_passport_format CHECK (passport_number IS NULL OR passport_number ~* '^[A-Z0-9]{6,20}$'),
    CONSTRAINT chk_age CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '16 years')
);

-- 2. Roles table
CREATE TABLE IF NOT EXISTS Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_role_name CHECK (role_name ~* '^[a-z_]+$')
);

-- 3. User_Roles table
CREATE TABLE IF NOT EXISTS User_Roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    
    CONSTRAINT uk_user_role UNIQUE(user_id, role_id),
    CONSTRAINT chk_not_self_assignment CHECK (assigned_by IS NULL OR assigned_by != user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON Users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON User_Roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON User_Roles(role_id);

-- Insert sample roles
INSERT INTO Roles (role_name, description, permissions) VALUES 
    ('admin', 'System Administrator', '{"users": ["create", "read", "update", "delete"], "flights": ["create", "read", "update", "delete"]}'),
    ('operator', 'Airport Operator', '{"flights": ["read", "update"], "passengers": ["read", "update"]}'),
    ('passenger', 'Regular Passenger', '{"flights": ["read"], "tickets": ["create", "read", "update"]}')
ON CONFLICT (role_name) DO NOTHING;

-- Insert sample users
INSERT INTO Users (username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number) VALUES 
    ('admin', 'admin@airport.com', '$2b$10$example_hash_admin', 'Admin', 'User', '+1234567890', '1990-01-01', 'A1234567'),
    ('operator1', 'operator@airport.com', '$2b$10$example_hash_operator', 'John', 'Operator', '+1234567891', '1985-05-15', 'B1234567'),
    ('passenger1', 'passenger@example.com', '$2b$10$example_hash_passenger', 'Jane', 'Passenger', '+1234567892', '1992-08-20', 'C1234567')
ON CONFLICT (email) DO NOTHING;

-- Assign roles to users
INSERT INTO User_Roles (user_id, role_id, assigned_by) VALUES 
    (1, 1, 1), -- admin role to admin user
    (2, 2, 1), -- operator role to operator user
    (3, 3, 1)  -- passenger role to passenger user
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Users table
DROP TRIGGER IF EXISTS update_users_updated_at ON Users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON Users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
