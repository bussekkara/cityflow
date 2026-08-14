-- ============================================
-- CityFlow Database Schema
-- Municipal Service Request Management System
-- ============================================

-- 1. Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 2. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 3. Request Categories
CREATE TABLE request_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    department_id INTEGER NOT NULL
        REFERENCES departments(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 4. Service Requests
CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL
        REFERENCES request_categories(id),
    citizen_name VARCHAR(150) NOT NULL,
    citizen_email VARCHAR(150),
    address TEXT NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 5. Work Orders
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL
        REFERENCES service_requests(id),
    assigned_to INTEGER REFERENCES users(id),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'assigned',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 6. Request Status History
CREATE TABLE request_status_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL
        REFERENCES service_requests(id),
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);