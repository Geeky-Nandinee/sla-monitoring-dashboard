-- Schema for SLA Monitoring Dashboard Database

CREATE DATABASE IF NOT EXISTS sla_monitoring;
USE sla_monitoring;

-- Uploads Metadata Table
CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  invalid_rows INT NOT NULL DEFAULT 0,
  duplicate_rows INT NOT NULL DEFAULT 0,
  status ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Health Check Monitoring Records Table
CREATE TABLE IF NOT EXISTS monitoring_checks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  upload_id INT NOT NULL,
  timestamp_utc DATETIME NOT NULL,
  service VARCHAR(100) NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT NULL,
  agent VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  is_valid TINYINT(1) NOT NULL DEFAULT 1,
  quality_issue VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upload FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
  INDEX idx_timestamp_utc (timestamp_utc),
  INDEX idx_service (service),
  INDEX idx_upload_id (upload_id),
  INDEX idx_service_timestamp (service, timestamp_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
