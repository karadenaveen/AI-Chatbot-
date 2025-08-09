-- Create database and user (may already be created by env vars)
CREATE DATABASE IF NOT EXISTS portal_db;
CREATE USER IF NOT EXISTS 'portal_user'@'%' IDENTIFIED BY 'portal_password';
GRANT ALL PRIVILEGES ON portal_db.* TO 'portal_user'@'%';
FLUSH PRIVILEGES;

USE portal_db;

-- Chat tables
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  role ENUM('system','user','assistant') NOT NULL,
  content MEDIUMTEXT NOT NULL,
  sql_executed MEDIUMTEXT NULL,
  results_json MEDIUMTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Sample business schema
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  segment ENUM('consumer','business') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('pending','shipped','delivered','cancelled') NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed data
INSERT INTO customers (name, email, segment) VALUES
  ('Alice Johnson', 'alice@example.com', 'consumer'),
  ('Bob Smith', 'bob@acme.com', 'business'),
  ('Carol Lee', 'carol@example.com', 'consumer')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO products (sku, name, category, price) VALUES
  ('SKU-100', 'Wireless Mouse', 'Accessories', 25.99),
  ('SKU-200', 'Mechanical Keyboard', 'Accessories', 89.50),
  ('SKU-300', '27" Monitor', 'Displays', 229.00)
ON DUPLICATE KEY UPDATE sku = VALUES(sku);

INSERT INTO orders (customer_id, order_date, status, total) VALUES
  (1, '2024-12-01', 'delivered', 255.99),
  (2, '2024-12-05', 'shipped', 89.50),
  (3, '2024-12-07', 'pending', 229.00)
ON DUPLICATE KEY UPDATE order_date = VALUES(order_date);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 25.99),
  (1, 3, 1, 229.00),
  (2, 2, 1, 89.50),
  (3, 3, 1, 229.00)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);