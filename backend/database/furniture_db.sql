CREATE DATABASE IF NOT EXISTS furniture_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE furniture_db;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  design_id      VARCHAR(50)  NOT NULL,
  user_id        INT          NOT NULL,
  design_name    VARCHAR(100) NOT NULL DEFAULT 'Untitled Design',
  room_data      JSON,
  furniture_data JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_design (design_id, user_id)
);

INSERT INTO users (full_name, username, email, password, role) VALUES
('Admin Designer', 'admin',    'admin@furnispace.com',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Demo Customer',  'user',     'user@furnispace.com',     '$2y$10$TKh8H1.PfuA2ikulepT6.eOIR0SPVP4hKPJ4kTvkgMOOefBRQyuW.', 'user'),
('Sarah Johnson',  'sarah',    'sarah@furnispace.com',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('John Smith',     'customer', 'customer@furnispace.com', '$2y$10$TKh8H1.PfuA2ikulepT6.eOIR0SPVP4hKPJ4kTvkgMOOefBRQyuW.', 'user');
```

