CREATE DATABASE routesyncdb;
\c routesyncdb
\i 'e:/Final Year Project/routesync_backend/db_schema';

-- Create Users Table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(10) CHECK (user_type IN ('student', 'admin', 'driver')),
    roll_no VARCHAR(15) UNIQUE, -- For students
    email_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create Buses Table
CREATE TABLE Buses (
    bus_id SERIAL PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    route_id INT REFERENCES Routes(route_id),
    driver_id INT REFERENCES Drivers(driver_id),
    status VARCHAR(20) CHECK (status IN ('available', 'in_use', 'maintenance')) DEFAULT 'available',
    operational_start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Routes Table
CREATE TABLE Routes (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(50),
    starting_point VARCHAR(100),
    destination VARCHAR(100),
    stops JSONB, -- A JSON array of stops
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GPS_Location Table
CREATE TABLE GPS_Location (
    location_id SERIAL PRIMARY KEY,
    bus_id INT REFERENCES Buses(bus_id),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create Drivers Table
CREATE TABLE Drivers (
    driver_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Bus_Trips Table
CREATE TABLE Bus_Trips (
    trip_id SERIAL PRIMARY KEY,
    bus_id INT REFERENCES Buses(bus_id),
    driver_id INT REFERENCES Drivers(driver_id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Student_Bus_Enrollment Table
CREATE TABLE Student_Bus_Enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Users(user_id),
    bus_id INT REFERENCES Buses(bus_id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')) DEFAULT 'active'
);

-- Create Drivers_Buses Table
CREATE TABLE Drivers_Buses (
    assignment_id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES Drivers(driver_id),
    bus_id INT REFERENCES Buses(bus_id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(10) CHECK (status IN ('active', 'inactive')) DEFAULT 'active'
);