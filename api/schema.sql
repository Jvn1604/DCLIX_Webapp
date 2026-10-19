-- D-Clix database schema (MySQL 5.7+ / MariaDB 10.3+)
-- Run through `php api/install.php`, which also saves the plan prices.

SET NAMES utf8mb4;

-- Website records (clubs, leads, subscriptions …) saved by signup, payment and the contact form.
-- One row per record, stored as JSON in `data`; club_id / centre_id are copied out for lookups.
CREATE TABLE IF NOT EXISTS records (
  coll        VARCHAR(40)  NOT NULL,
  id          VARCHAR(40)  NOT NULL,
  club_id     VARCHAR(40)  NOT NULL DEFAULT '',
  centre_id   VARCHAR(40)  NOT NULL DEFAULT '',
  data        LONGTEXT     NOT NULL,
  created_at  DATETIME     NOT NULL,
  updated_at  DATETIME     NOT NULL,
  updated_by  VARCHAR(40)  NOT NULL DEFAULT '',
  PRIMARY KEY (coll, id),
  KEY idx_club (coll, club_id),
  KEY idx_centre (coll, centre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Running numbers for IDs created on the server (CLB0007, USR0012 …)
CREATE TABLE IF NOT EXISTS seq (
  coll VARCHAR(40) NOT NULL PRIMARY KEY,
  n    INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- People who can log in to the admin portal
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(40)  NOT NULL PRIMARY KEY,
  email         VARCHAR(190) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(40)  NOT NULL DEFAULT '',
  role          VARCHAR(30)  NOT NULL,
  club_id       VARCHAR(40)  NOT NULL DEFAULT '',
  centre_id     VARCHAR(40)  NOT NULL DEFAULT '',
  status        VARCHAR(30)  NOT NULL DEFAULT 'Active',
  pw_hash       VARCHAR(255) NOT NULL,
  two_factor    TINYINT(1)   NOT NULL DEFAULT 0,
  must_change   TINYINT(1)   NOT NULL DEFAULT 0,
  failed        INT          NOT NULL DEFAULT 0,
  locked_until  DATETIME     NULL,
  last_login    DATETIME     NULL,
  photo         MEDIUMTEXT   NULL,
  created_at    DATETIME     NOT NULL,
  UNIQUE KEY uq_email (email),
  KEY idx_club (club_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login sessions (only a SHA-256 hash of the token is stored)
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  CHAR(64)     NOT NULL PRIMARY KEY,
  user_id     VARCHAR(40)  NOT NULL,
  remember    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL,
  last_seen   DATETIME     NOT NULL,
  ip          VARCHAR(64)  NOT NULL DEFAULT '',
  agent       VARCHAR(255) NOT NULL DEFAULT '',
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time codes: 2FA at login and password reset
CREATE TABLE IF NOT EXISTS auth_codes (
  id          CHAR(64)    NOT NULL PRIMARY KEY,
  user_id     VARCHAR(40) NOT NULL,
  purpose     VARCHAR(20) NOT NULL,
  code_hash   CHAR(64)    NOT NULL,
  attempts    INT         NOT NULL DEFAULT 0,
  remember    TINYINT(1)  NOT NULL DEFAULT 0,
  expires_at  DATETIME    NOT NULL,
  used        TINYINT(1)  NOT NULL DEFAULT 0,
  KEY idx_user (user_id, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_log (
  id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email   VARCHAR(190) NOT NULL,
  ok      TINYINT(1)   NOT NULL,
  reason  VARCHAR(120) NOT NULL DEFAULT '',
  ip      VARCHAR(64)  NOT NULL DEFAULT '',
  agent   VARCHAR(255) NOT NULL DEFAULT '',
  at      DATETIME     NOT NULL,
  KEY idx_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  at         DATETIME     NOT NULL,
  user_id    VARCHAR(40)  NOT NULL DEFAULT '',
  user_name  VARCHAR(120) NOT NULL DEFAULT '',
  action     VARCHAR(30)  NOT NULL,
  module     VARCHAR(40)  NOT NULL,
  record_id  VARCHAR(60)  NOT NULL DEFAULT '',
  summary    VARCHAR(500) NOT NULL DEFAULT '',
  changes    MEDIUMTEXT   NULL,
  ip         VARCHAR(64)  NOT NULL DEFAULT '',
  KEY idx_at (at),
  KEY idx_record (record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings and role permissions, stored as JSON
CREATE TABLE IF NOT EXISTS settings (
  k           VARCHAR(40) NOT NULL PRIMARY KEY,
  v           LONGTEXT    NOT NULL,
  updated_at  DATETIME    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Links the public signup form to the payment step (token stored as a hash)
CREATE TABLE IF NOT EXISTS signup_tokens (
  token_hash  CHAR(64)    NOT NULL PRIMARY KEY,
  lead_id     VARCHAR(40) NOT NULL,
  created_at  DATETIME    NOT NULL,
  expires_at  DATETIME    NOT NULL,
  KEY idx_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Billplz bills (one per payment attempt)
CREATE TABLE IF NOT EXISTS bills (
  bill_id          VARCHAR(60)  NOT NULL PRIMARY KEY,
  subscription_id  VARCHAR(40)  NOT NULL,
  lead_id          VARCHAR(40)  NOT NULL,
  club_id          VARCHAR(40)  NOT NULL,
  amount_cents     INT UNSIGNED NOT NULL,
  url              VARCHAR(255) NOT NULL,
  state            VARCHAR(20)  NOT NULL DEFAULT 'due',
  paid             TINYINT(1)   NOT NULL DEFAULT 0,
  gateway          VARCHAR(20)  NOT NULL,
  created_at       DATETIME     NOT NULL,
  paid_at          DATETIME     NULL,
  processed_at     DATETIME     NULL,
  raw              MEDIUMTEXT   NULL,
  KEY idx_sub (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every email the system sends (or logs, while SMTP is not set up)
CREATE TABLE IF NOT EXISTS email_outbox (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind        VARCHAR(40)  NOT NULL,
  to_email    VARCHAR(190) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  body_html   MEDIUMTEXT   NOT NULL,
  status      VARCHAR(20)  NOT NULL,
  error       VARCHAR(500) NOT NULL DEFAULT '',
  related_id  VARCHAR(40)  NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL,
  sent_at     DATETIME     NULL,
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Simple rate limiting for public endpoints
CREATE TABLE IF NOT EXISTS throttle (
  k             VARCHAR(120) NOT NULL PRIMARY KEY,
  hits          INT          NOT NULL,
  window_start  DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
