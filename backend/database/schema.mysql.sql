-- ============================================================================
-- Multitenant AI Customer Handling Platform — MySQL 8 schema (InnoDB, utf8mb4)
-- Every tenant-owned table carries tenant_id for row isolation (with FK).
-- ============================================================================
CREATE TABLE tenants (
  id                      VARCHAR(36) PRIMARY KEY,
  slug                    VARCHAR(64) NOT NULL UNIQUE,
  business_name           VARCHAR(160) NOT NULL,
  owner_name              VARCHAR(120) NOT NULL,
  owner_email             VARCHAR(160) NOT NULL,
  owner_phone             VARCHAR(32) NOT NULL,
  currency_code           VARCHAR(8) NOT NULL DEFAULT 'BDT',
  price_per_message       DECIMAL(18,4) NOT NULL DEFAULT 0,
  wallet_balance          DECIMAL(18,4) NOT NULL DEFAULT 0,
  status                  ENUM('active','suspended') NOT NULL DEFAULT 'active',
  primary_model           VARCHAR(64) NULL,
  health_score_percent    TINYINT UNSIGNED NOT NULL DEFAULT 100,
  support_notes           TEXT NULL,
  assigned_support_owner  VARCHAR(120) NULL,
  timezone                VARCHAR(64) NOT NULL DEFAULT 'Asia/Dhaka',
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at          DATETIME NULL,
  INDEX idx_tenants_status (status),
  INDEX idx_tenants_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_api_keys (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  key_hash      CHAR(64) NOT NULL UNIQUE,          -- sha256 of raw key
  key_preview   VARCHAR(24) NOT NULL,              -- masked display
  scopes        VARCHAR(255) NOT NULL DEFAULT 'ingest',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_used_at  DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tak_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id                 VARCHAR(36) PRIMARY KEY,
  tenant_id          VARCHAR(36) NULL,              -- NULL = platform-level (super_admin)
  name               VARCHAR(120) NOT NULL,
  phone              VARCHAR(32) NOT NULL UNIQUE,
  email              VARCHAR(160) NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               ENUM('super_admin','admin','agent','analyst') NOT NULL DEFAULT 'agent',
  status             ENUM('active','invited','suspended') NOT NULL DEFAULT 'active',
  avatar_url         VARCHAR(255) NULL,
  assigned_channels  JSON NULL,                     -- ('messenger','whatsapp')[]
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
    quiet_hours_enabled TINYINT(1) NOT NULL DEFAULT 1,
    quiet_hours_start TIME NOT NULL DEFAULT '23:00:00',
    quiet_hours_end TIME NOT NULL DEFAULT '07:00:00',
  custom_permissions JSON NULL,                     -- GranularPermission[]
  last_active_at     DATETIME NULL,
  joined_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_tenant (tenant_id),
  INDEX idx_users_status (status),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_permissions (
  user_id     VARCHAR(36) NOT NULL,
  permission  VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, permission),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  id             VARCHAR(36) PRIMARY KEY,
  user_id        VARCHAR(36) NOT NULL,
  token_hash     CHAR(64) NOT NULL UNIQUE,
  device         VARCHAR(120) NULL,
  browser        VARCHAR(120) NULL,
  ip_address     VARCHAR(64) NULL,
  location       VARCHAR(120) NULL,
  is_current     TINYINT(1) NOT NULL DEFAULT 0,
  last_active_at DATETIME NULL,
  expires_at     DATETIME NULL,
  revoked_at     DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_actions (
  id             VARCHAR(36) PRIMARY KEY,
  tenant_id      VARCHAR(36) NULL,
  actor_user_id  VARCHAR(36) NULL,
  actor_name     VARCHAR(120) NOT NULL,
  actor_phone    VARCHAR(32) NULL,
  action         VARCHAR(160) NOT NULL,
  target_user    VARCHAR(160) NULL,
  ip_address     VARCHAR(64) NULL,
  details        TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_actions_tenant (tenant_id),
  INDEX idx_admin_actions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Platform-wide registries
-- ---------------------------------------------------------------------------
CREATE TABLE currencies (
  id                     VARCHAR(36) PRIMARY KEY,
  code                   VARCHAR(8) NOT NULL UNIQUE,
  name                   VARCHAR(80) NOT NULL,
  symbol                 VARCHAR(12) NOT NULL,
  symbol_position        ENUM('before','after') NOT NULL DEFAULT 'before',
  symbol_spacing         TINYINT(1) NOT NULL DEFAULT 1,
  exchange_rate_from_usd DECIMAL(18,8) NOT NULL DEFAULT 1,
  decimal_places         TINYINT UNSIGNED NOT NULL DEFAULT 2,
  thousands_separator    VARCHAR(4) NOT NULL DEFAULT ',',
  decimal_separator      VARCHAR(4) NOT NULL DEFAULT '.',
  is_platform_default    TINYINT(1) NOT NULL DEFAULT 0,
  is_active              TINYINT(1) NOT NULL DEFAULT 1,
  description            VARCHAR(255) NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_provider_models (
  id                          VARCHAR(36) PRIMARY KEY,
  model_id                    VARCHAR(96) NOT NULL UNIQUE,
  display_name                VARCHAR(120) NOT NULL,
  provider                    ENUM('Google Gemini','OpenAI','Anthropic','Groq / Llama','Ollama Dedicated') NOT NULL,
  api_key                     TEXT NULL,           -- encrypted at rest in prod
  endpoint_url                VARCHAR(255) NULL,
  capabilities                JSON NOT NULL,
  cost_per_million_input_usd  DECIMAL(12,6) NOT NULL DEFAULT 0,
  cost_per_million_output_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
  context_window_tokens       INT UNSIGNED NOT NULL DEFAULT 0,
  max_output_tokens           INT UNSIGNED NOT NULL DEFAULT 0,
  latency_p95_ms              INT UNSIGNED NOT NULL DEFAULT 0,
  error_rate_24h_percent      DECIMAL(5,2) NOT NULL DEFAULT 0,
  status                      ENUM('active','degraded','disabled') NOT NULL DEFAULT 'active',
  is_default                  TINYINT(1) NOT NULL DEFAULT 0,
  is_fallback                 TINYINT(1) NOT NULL DEFAULT 0,
  created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE global_pipeline_layers (
  id                       VARCHAR(36) PRIMARY KEY,
  layer_type               ENUM('intent_classification','image_processing','voice_processing','knowledge_retrieval','final_generation') NOT NULL,
  layer_order              TINYINT UNSIGNED NOT NULL,
  title                    VARCHAR(120) NOT NULL,
  subtitle                 VARCHAR(160) NULL,
  description              TEXT NULL,
  default_model_id         VARCHAR(96) NOT NULL,
  default_fallback_model_id VARCHAR(96) NULL,
  default_temperature      DECIMAL(4,2) NOT NULL DEFAULT 0.30,
  default_max_tokens       INT UNSIGNED NOT NULL DEFAULT 1024,
  system_prompt            MEDIUMTEXT NULL,
  guidance_notes           TEXT NULL,
  input_description        TEXT NULL,
  output_description       TEXT NULL,
  is_mandatory             TINYINT(1) NOT NULL DEFAULT 0,
  is_active_globally       TINYINT(1) NOT NULL DEFAULT 1,
  updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gpl_type (layer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_components (
  id              VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(120) NOT NULL UNIQUE,
  type            ENUM('core','external','storage') NOT NULL,
  status          ENUM('operational','degraded','down') NOT NULL DEFAULT 'operational',
  uptime_90d_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  latency_ms      INT UNSIGNED NOT NULL DEFAULT 0,
  last_incident   VARCHAR(255) NULL,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE incidents (
  id                  VARCHAR(36) PRIMARY KEY,
  title               VARCHAR(200) NOT NULL,
  severity            ENUM('p1_critical','p2_major','p3_minor') NOT NULL DEFAULT 'p3_minor',
  status              ENUM('investigating','identified','monitoring','resolved') NOT NULL DEFAULT 'investigating',
  affected_components JSON NULL,
  started_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at         DATETIME NULL,
  summary             TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE compliance_settings (
  id                              VARCHAR(36) PRIMARY KEY,
  last_isolation_audit            DATETIME NULL,
  isolation_status                ENUM('passing','warning','failing') NOT NULL DEFAULT 'warning',
  kms_key_rotation_age_days       INT UNSIGNED NOT NULL DEFAULT 0,
  next_rotation_scheduled         DATETIME NULL,
  gdpr_pending_erasures_count     INT UNSIGNED NOT NULL DEFAULT 0,
  gdpr_completed_erasures_count   INT UNSIGNED NOT NULL DEFAULT 0,
  soc2_audit_export_ready         TINYINT(1) NOT NULL DEFAULT 0,
  backup_status                   ENUM('healthy','warning') NOT NULL DEFAULT 'warning',
  last_disaster_recovery_test     DATETIME NULL,
  disaster_recovery_test_outcome  ENUM('pass','fail') NULL,
  rpo_minutes                     INT UNSIGNED NOT NULL DEFAULT 15,
  rto_minutes                     INT UNSIGNED NOT NULL DEFAULT 60,
  updated_at                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plans (
  tier                     ENUM('starter','growth','pro','enterprise') PRIMARY KEY,
  display_name             VARCHAR(80) NOT NULL,
  price_monthly_usd        DECIMAL(12,2) NOT NULL,
  price_monthly_bdt        DECIMAL(18,2) NOT NULL,
  conversations_allowance  INT UNSIGNED NOT NULL,
  messages_allowance       INT UNSIGNED NOT NULL,
  team_seats_allowance     INT UNSIGNED NOT NULL,
  channels_allowance       INT UNSIGNED NOT NULL,
  retention_days           INT UNSIGNED NOT NULL,
  features                 JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_plans (
  tenant_id   VARCHAR(36) PRIMARY KEY,
  tier        ENUM('starter','growth','pro','enterprise') NOT NULL DEFAULT 'starter',
  started_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
  id             VARCHAR(36) PRIMARY KEY,
  tenant_id      VARCHAR(36) NOT NULL,
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  date           DATE NOT NULL,
  billing_period VARCHAR(32) NOT NULL,
  amount_usd     DECIMAL(12,2) NOT NULL,
  amount_bdt     DECIMAL(18,2) NOT NULL,
  status         ENUM('paid','pending','failed') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(80) NULL,
  download_url   VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoices_tenant (tenant_id, date),
  CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallet_transactions (
  id           VARCHAR(36) PRIMARY KEY,
  tenant_id    VARCHAR(36) NOT NULL,
  type         ENUM('topup','charge','refund','adjustment') NOT NULL,
  amount       DECIMAL(18,4) NOT NULL,
  currency     VARCHAR(8) NOT NULL DEFAULT 'BDT',
  amount_usd   DECIMAL(18,4) NOT NULL DEFAULT 0,
  gateway      VARCHAR(60) NULL,
  reference    VARCHAR(120) NULL,
  description  VARCHAR(255) NULL,
  status       ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_tenant (tenant_id, created_at),
  CONSTRAINT fk_wallet_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Channels
-- ---------------------------------------------------------------------------
CREATE TABLE messenger_connections (
  id                     VARCHAR(36) PRIMARY KEY,
  tenant_id              VARCHAR(36) NOT NULL UNIQUE,
  page_name              VARCHAR(160) NOT NULL,
  page_id                VARCHAR(64) NOT NULL,
  category               VARCHAR(120) NULL,
  avatar_url             VARCHAR(255) NULL,
  instagram_linked       TINYINT(1) NOT NULL DEFAULT 0,
  instagram_account_name VARCHAR(120) NULL,
  status                 ENUM('connected','degraded','disconnected','needs_reauth','pending') NOT NULL DEFAULT 'pending',
  granted_permissions    JSON NULL,
  missing_permissions    JSON NULL,
  subscribed_fields      JSON NULL,
  access_token           TEXT NULL,
  token_status           ENUM('healthy','expiring_soon','expired') NOT NULL DEFAULT 'healthy',
  token_days_remaining   INT NOT NULL DEFAULT 60,
  token_type             VARCHAR(80) NULL,
  token_last_refreshed   DATETIME NULL,
  token_expires_at       DATETIME NULL,
  last_webhook_at        DATETIME NULL,
  last_reply_at          DATETIME NULL,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msn_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messenger_webhook_errors (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  connection_id VARCHAR(36) NULL,
  code          INT NOT NULL DEFAULT 0,
  title         VARCHAR(200) NOT NULL,
  details       TEXT NULL,
  impact        VARCHAR(255) NULL,
  resolved      TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mwe_tenant (tenant_id, created_at),
  CONSTRAINT fk_mwe_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE whatsapp_connections (
  id                      VARCHAR(36) PRIMARY KEY,
  tenant_id               VARCHAR(36) NOT NULL UNIQUE,
  waba_name               VARCHAR(160) NOT NULL,
  waba_id                 VARCHAR(64) NOT NULL,
  business_manager_id     VARCHAR(64) NULL,
  phone_number            VARCHAR(32) NOT NULL,
  phone_number_id         VARCHAR(64) NOT NULL,
  display_name            VARCHAR(160) NULL,
  verification_status     ENUM('verified','unverified','in_review') NOT NULL DEFAULT 'unverified',
  has_green_tick          TINYINT(1) NOT NULL DEFAULT 0,
  status                  ENUM('connected','degraded','disconnected','needs_reauth','pending') NOT NULL DEFAULT 'pending',
  quality_rating          ENUM('GREEN','YELLOW','RED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  messaging_tier_limit    VARCHAR(40) NULL,
  current_24h_window_sent INT UNSIGNED NOT NULL DEFAULT 0,
  throughput_limit        VARCHAR(80) NULL,
  access_token            TEXT NULL,
  token_type              VARCHAR(80) NULL,
  token_last_refreshed    DATETIME NULL,
  last_inbound_at         DATETIME NULL,
  last_outbound_at        DATETIME NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE whatsapp_templates (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  connection_id VARCHAR(36) NULL,
  name          VARCHAR(160) NOT NULL,
  category      ENUM('UTILITY','MARKETING','AUTHENTICATION') NOT NULL DEFAULT 'UTILITY',
  language      VARCHAR(16) NOT NULL DEFAULT 'en',
  status        ENUM('APPROVED','IN_REVIEW','REJECTED') NOT NULL DEFAULT 'IN_REVIEW',
  body_sample   TEXT NOT NULL,
  last_updated  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wt_tenant (tenant_id),
  CONSTRAINT fk_wt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meta_oauth_sessions (
  state_hash CHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  channel ENUM('messenger','whatsapp') NOT NULL,
  access_token TEXT NULL,
  token_expires_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  callback_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meta_oauth_tenant (tenant_id, channel),
  CONSTRAINT fk_meta_oauth_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_support_sessions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  started_by VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_actor (started_by, ended_at, expires_at),
  CONSTRAINT fk_support_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_actor FOREIGN KEY (started_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE webhook_events (
  id                 VARCHAR(36) PRIMARY KEY,
  tenant_id          VARCHAR(36) NULL,
  correlation_id     VARCHAR(64) NOT NULL,
  channel            ENUM('messenger','whatsapp','woocommerce','steadfast') NOT NULL,
  event_type         VARCHAR(80) NOT NULL,
  sender_id_masked   VARCHAR(64) NULL,
  status             ENUM('processed','received','duplicate_ignored','failed') NOT NULL DEFAULT 'received',
  retry_count        INT UNSIGNED NOT NULL DEFAULT 0,
  latency_ms         INT UNSIGNED NOT NULL DEFAULT 0,
  error_message      TEXT NULL,
  sanitized_summary  TEXT NULL,
  raw_payload        JSON NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_we_tenant_created (tenant_id, created_at),
  INDEX idx_we_correlation (correlation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_integrations (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  integ_key         VARCHAR(60) NOT NULL,
  name              VARCHAR(120) NOT NULL,
  category          ENUM('ecommerce','courier','inventory','payment','crm','custom_api') NOT NULL,
  badge             VARCHAR(40) NULL,
  description       VARCHAR(255) NULL,
  status            ENUM('connected','degraded','disconnected','needs_reauth','pending') NOT NULL DEFAULT 'disconnected',
  endpoint_url      VARCHAR(255) NULL,
  auth_method       ENUM('OAuth 2.0','API Key & Secret','Webhook HMAC','Bearer Token') NOT NULL DEFAULT 'API Key & Secret',
  credentials       TEXT NULL,                  -- encrypted at rest in prod
  last_sync_at      DATETIME NULL,
  rate_limit_used   INT UNSIGNED NOT NULL DEFAULT 0,
  rate_limit_max    INT UNSIGNED NOT NULL DEFAULT 60,
  rate_limit_reset  VARCHAR(40) NULL,
  scopes            JSON NULL,
  fallback_policy   JSON NULL,
  calls_today       INT UNSIGNED NOT NULL DEFAULT 0,
  success_rate      DECIMAL(5,2) NOT NULL DEFAULT 100,
  avg_latency_ms    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bi_tenant_key (tenant_id, integ_key),
  CONSTRAINT fk_bi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE integration_health_logs (
  id         VARCHAR(36) PRIMARY KEY,
  tenant_id  VARCHAR(36) NOT NULL,
  service    VARCHAR(80) NOT NULL,
  type       ENUM('rate_limit_warning','credential_warning','fallback_triggered','uptime_check') NOT NULL,
  message    TEXT NOT NULL,
  status     ENUM('resolved','active','info') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ihl_tenant (tenant_id, created_at),
  CONSTRAINT fk_ihl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Core conversation domain
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id             VARCHAR(36) PRIMARY KEY,
  tenant_id      VARCHAR(36) NOT NULL,
  name           VARCHAR(160) NOT NULL,
  phone          VARCHAR(32) NULL,
  email          VARCHAR(160) NULL,
  city           VARCHAR(120) NULL,
  external_id    VARCHAR(96) NOT NULL,
  channel        ENUM('whatsapp','messenger') NOT NULL DEFAULT 'whatsapp',
  language       VARCHAR(24) NOT NULL DEFAULT 'Bangla',
  memory_notes   TEXT NULL,
  total_orders   INT UNSIGNED NOT NULL DEFAULT 0,
  total_spent    DECIMAL(18,2) NOT NULL DEFAULT 0,
  tags           JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME NULL,
  UNIQUE KEY uq_cust_tenant_ext (tenant_id, external_id),
  INDEX idx_cust_tenant_phone (tenant_id, phone),
  CONSTRAINT fk_cust_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_orders (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  customer_id       VARCHAR(36) NOT NULL,
  external_order_id VARCHAR(64) NOT NULL,
  items             VARCHAR(255) NOT NULL,
  amount            DECIMAL(18,2) NOT NULL,
  status            VARCHAR(40) NOT NULL,
  ordered_at        DATETIME NOT NULL,
  INDEX idx_co_customer (customer_id, ordered_at),
  CONSTRAINT fk_co_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_co_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teams (
  id        VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name      VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  UNIQUE KEY uq_team_tenant_name (tenant_id, name),
  CONSTRAINT fk_teams_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conversations (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  customer_id          VARCHAR(36) NOT NULL,
  channel              ENUM('whatsapp','messenger') NOT NULL,
  status               ENUM('needs_human','ai_handling','waiting','resolved') NOT NULL DEFAULT 'ai_handling',
  assigned_staff_id    VARCHAR(36) NULL,
  assigned_team_id     VARCHAR(36) NULL,
  priority             ENUM('urgent','high','medium','low') NOT NULL DEFAULT 'medium',
  ai_status            ENUM('active','paused','human_controlled') NOT NULL DEFAULT 'active',
  handover_reason      VARCHAR(255) NULL,
  unread_count         INT UNSIGNED NOT NULL DEFAULT 0,
  tags                 JSON NULL,
  last_message_preview VARCHAR(255) NULL,
  last_message_at      DATETIME NULL,
  first_response_at    DATETIME NULL,
  resolved_at          DATETIME NULL,
  summary              TEXT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conv_tenant_last (tenant_id, last_message_at),
  INDEX idx_conv_tenant_status (tenant_id, status),
  INDEX idx_conv_staff (assigned_staff_id),
  INDEX idx_conv_customer (customer_id),
  CONSTRAINT fk_conv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id                 VARCHAR(36) PRIMARY KEY,
  tenant_id          VARCHAR(36) NOT NULL,
  conversation_id    VARCHAR(36) NOT NULL,
  sender             ENUM('customer','ai','staff','system') NOT NULL,
  sender_name        VARCHAR(120) NOT NULL,
  sender_user_id     VARCHAR(36) NULL,
  text               MEDIUMTEXT NOT NULL,
  delivery_state     ENUM('sent','delivered','read','failed') NULL,
  is_internal_note   TINYINT(1) NOT NULL DEFAULT 0,
  system_event_type  ENUM('takeover','release','pause','assigned','priority_change','tag_added') NULL,
  ai_confidence      DECIMAL(5,2) NULL,
  ai_status_decision ENUM('send','clarify','handoff') NULL,
  ai_correction_note TEXT NULL,
  ai_prevented       TINYINT(1) NOT NULL DEFAULT 0,
  external_message_id VARCHAR(96) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_msg_external (external_message_id),
  INDEX idx_msg_conv_created (conversation_id, created_at),
  INDEX idx_msg_tenant_created (tenant_id, created_at),
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_attachments (
  id          VARCHAR(36) PRIMARY KEY,
  message_id  VARCHAR(36) NOT NULL,
  tenant_id   VARCHAR(36) NOT NULL,
  type        ENUM('image','audio','file') NOT NULL,
  url         VARCHAR(255) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  size        VARCHAR(32) NULL,
  duration    VARCHAR(32) NULL,
  thumbnail   VARCHAR(255) NULL,
  insights    JSON NULL,                       -- transcription / extracted text / matched product
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_att_message (message_id),
  CONSTRAINT fk_att_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_sources (
  id         VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  snippet    TEXT NULL,
  score      DECIMAL(6,4) NOT NULL DEFAULT 0,
  INDEX idx_src_message (message_id),
  CONSTRAINT fk_src_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE canned_replies (
  id          VARCHAR(36) PRIMARY KEY,
  tenant_id   VARCHAR(36) NOT NULL,
  title       VARCHAR(160) NOT NULL,
  text        TEXT NOT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  channel     VARCHAR(24) NOT NULL DEFAULT 'all',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cr_tenant (tenant_id),
  CONSTRAINT fk_cr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE failed_cases (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NULL,
  customer_name VARCHAR(160) NULL,
  channel       ENUM('messenger','whatsapp') NOT NULL DEFAULT 'whatsapp',
  snippet       VARCHAR(255) NULL,
  reason        VARCHAR(255) NULL,
  confidence    DECIMAL(5,2) NOT NULL DEFAULT 0,
  status        ENUM('needs_attention','unresolved','failed_audio') NOT NULL DEFAULT 'needs_attention',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fc_tenant_created (tenant_id, created_at),
  CONSTRAINT fk_fc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  id          VARCHAR(36) PRIMARY KEY,
  tenant_id   VARCHAR(36) NOT NULL,
  type        ENUM('staff_takeover','knowledge_update','connection_event','rule_triggered','system_notice') NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description VARCHAR(255) NULL,
  actor       VARCHAR(120) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_tenant_created (tenant_id, created_at),
  CONSTRAINT fk_al_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Knowledge / RAG
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_sources (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  name                VARCHAR(160) NOT NULL,
  type                ENUM('website','document','faq','catalogue','manual','sheets') NOT NULL,
  status              ENUM('ready','processing','queued','failed','outdated') NOT NULL DEFAULT 'queued',
  source_url          VARCHAR(255) NULL,
  origin_details      VARCHAR(255) NULL,
  source_content      LONGTEXT NULL,
  error_reason        VARCHAR(255) NULL,
  chunks_count        INT UNSIGNED NOT NULL DEFAULT 0,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  last_indexed        DATETIME NULL,
  last_content_update DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ks_tenant (tenant_id, status),
  CONSTRAINT fk_ks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE knowledge_chunks (
  id           VARCHAR(64) PRIMARY KEY,
  tenant_id    VARCHAR(36) NOT NULL,
  source_id    VARCHAR(36) NOT NULL,
  chunk_index  INT UNSIGNED NOT NULL DEFAULT 0,
  title        VARCHAR(200) NULL,
  chunk_text   MEDIUMTEXT NOT NULL,
  embedding    MEDIUMTEXT NULL,                  -- JSON float array
  tokens       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kc_tenant (tenant_id),
  INDEX idx_kc_source (source_id),
  CONSTRAINT fk_kc_source FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE faqs (
  id                    VARCHAR(36) PRIMARY KEY,
  tenant_id             VARCHAR(36) NOT NULL,
  question              VARCHAR(255) NOT NULL,
  alternative_questions JSON NULL,
  approved_answer       MEDIUMTEXT NOT NULL,
  category              VARCHAR(80) NULL,
  applicable_channel    ENUM('All','WhatsApp','Messenger','Website') NOT NULL DEFAULT 'All',
  language              ENUM('Bangla','English','Mixed') NOT NULL DEFAULT 'Bangla',
  status                ENUM('Published','Draft','Archived') NOT NULL DEFAULT 'Draft',
  priority              INT NOT NULL DEFAULT 5,
  review_date           DATE NULL,
  internal_notes        TEXT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_faq_tenant (tenant_id, status),
  CONSTRAINT fk_faq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_policies (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  name                VARCHAR(160) NOT NULL,
  category            VARCHAR(80) NOT NULL,
  full_text           MEDIUMTEXT NOT NULL,
  rules_and_exceptions JSON NULL,
  effective_date      DATE NULL,
  permanent           TINYINT(1) NOT NULL DEFAULT 0,
  review_date         DATE NULL,
  publication_status  ENUM('Published','Draft','Under Review') NOT NULL DEFAULT 'Draft',
  approval_status     ENUM('Approved','Pending Approval') NOT NULL DEFAULT 'Pending Approval',
  version             VARCHAR(16) NOT NULL DEFAULT '1.0',
  last_approved_by    VARCHAR(120) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bp_tenant (tenant_id, publication_status),
  CONSTRAINT fk_bp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id                   VARCHAR(36) PRIMARY KEY,
  tenant_id            VARCHAR(36) NOT NULL,
  sku                  VARCHAR(64) NOT NULL,
  name                 VARCHAR(200) NOT NULL,
  description          TEXT NULL,
  category             VARCHAR(80) NULL,
  variants             JSON NULL,
  price                DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency             VARCHAR(8) NOT NULL DEFAULT 'BDT',
  discounted_price     DECIMAL(18,2) NULL,
  inventory_status     ENUM('In Stock','Low Stock','Out of Stock','Live API Verified') NOT NULL DEFAULT 'In Stock',
  stock_count          INT NOT NULL DEFAULT 0,
  image_url            VARCHAR(255) NULL,
  image_urls           JSON NULL,
  shipping_restrictions VARCHAR(255) NULL,
  warranty_info        VARCHAR(255) NULL,
  product_url          VARCHAR(255) NULL,
  is_active            TINYINT(1) NOT NULL DEFAULT 1,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prod_tenant_sku (tenant_id, sku),
  INDEX idx_prod_tenant_active (tenant_id, is_active),
  CONSTRAINT fk_prod_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE training_jobs (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  source_id           VARCHAR(36) NULL,
  source_name         VARCHAR(160) NULL,
  job_type            ENUM('Initial Indexing','Re-index','Scheduled Sync','Chunk Embeddings') NOT NULL,
  status              ENUM('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  documents_processed INT UNSIGNED NOT NULL DEFAULT 0,
  total_documents     INT UNSIGNED NOT NULL DEFAULT 0,
  records_skipped     INT UNSIGNED NOT NULL DEFAULT 0,
  duration_ms         INT UNSIGNED NOT NULL DEFAULT 0,
  started_at          DATETIME NULL,
  finished_at         DATETIME NULL,
  error_message       VARCHAR(255) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tj_tenant_created (tenant_id, created_at),
  CONSTRAINT fk_tj_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_cases (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  question          TEXT NOT NULL,
  draft_answer      TEXT NULL,
  retrieved_sources JSON NULL,
  is_grounded       TINYINT(1) NOT NULL DEFAULT 0,
  expected_answer   TEXT NULL,
  verdict           ENUM('correct','incorrect','incomplete','untested') NOT NULL DEFAULT 'untested',
  tested_at         DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tc_tenant (tenant_id),
  CONSTRAINT fk_tc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_identity (
  tenant_id            VARCHAR(36) PRIMARY KEY,
  tagline              VARCHAR(255) NULL,
  brand_voice          TEXT NULL,
  tone_pillars         JSON NULL,
  preferred_terms      JSON NULL,
  forbidden_terms      JSON NULL,
  greeting_convention  VARCHAR(255) NULL,
  cultural_nuances     TEXT NULL,
  last_updated         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_brand_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Agent configuration
-- ---------------------------------------------------------------------------
CREATE TABLE agent_config_versions (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  version         VARCHAR(16) NOT NULL,
  status          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  mode            ENUM('disabled','suggestion','automatic','restricted_automatic') NOT NULL DEFAULT 'automatic',
  summary         VARCHAR(255) NULL,
  identity        JSON NULL,
  instructions    JSON NULL,
  behavior        JSON NULL,
  response_rules  JSON NULL,
  published_at    DATETIME NULL,
  published_by    VARCHAR(120) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_acv_tenant_version (tenant_id, version),
  INDEX idx_acv_tenant (tenant_id, status),
  CONSTRAINT fk_acv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE handover_rules (
  id                        VARCHAR(36) PRIMARY KEY,
  tenant_id                 VARCHAR(36) NOT NULL,
  name                      VARCHAR(160) NOT NULL,
  description               VARCHAR(255) NULL,
  trigger_type              ENUM('customer_request','sentiment_frustration','missing_knowledge','refund_exception','payment_conflict','legal_privacy','low_confidence') NOT NULL,
  priority                  ENUM('urgent','high','medium','low') NOT NULL DEFAULT 'medium',
  destination_team          VARCHAR(80) NOT NULL,
  handover_message          TEXT NULL,
  notification_channels     JSON NULL,
  pause_ai_immediately      TINYINT(1) NOT NULL DEFAULT 1,
  require_explicit_resume   TINYINT(1) NOT NULL DEFAULT 0,
  confidence_threshold_percent TINYINT UNSIGNED NULL,
  is_active                 TINYINT(1) NOT NULL DEFAULT 1,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hr_tenant (tenant_id, is_active),
  CONSTRAINT fk_hr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quick_templates (
  id               VARCHAR(36) PRIMARY KEY,
  tenant_id        VARCHAR(36) NOT NULL,
  trigger_keyword  VARCHAR(80) NOT NULL,
  template_text    TEXT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_qt_tenant (tenant_id),
  CONSTRAINT fk_qt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_pipeline_config (
  tenant_id          VARCHAR(36) PRIMARY KEY,
  routing_strategy   ENUM('sequential','conditional_branch','adaptive') NOT NULL DEFAULT 'sequential',
  cost_control_mode  TINYINT(1) NOT NULL DEFAULT 0,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tpc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant_pipeline_layers (
  id                 VARCHAR(36) PRIMARY KEY,
  tenant_id          VARCHAR(36) NOT NULL,
  layer_type         ENUM('intent_classification','image_processing','voice_processing','knowledge_retrieval','final_generation') NOT NULL,
  layer_order        TINYINT UNSIGNED NOT NULL,
  title              VARCHAR(120) NOT NULL,
  subtitle           VARCHAR(160) NULL,
  description        TEXT NULL,
  selected_model_id  VARCHAR(96) NOT NULL,
  fallback_model_id  VARCHAR(96) NULL,
  temperature        DECIMAL(4,2) NOT NULL DEFAULT 0.30,
  max_tokens         INT UNSIGNED NOT NULL DEFAULT 1024,
  system_prompt      MEDIUMTEXT NULL,
  is_enabled         TINYINT(1) NOT NULL DEFAULT 1,
  input_description  TEXT NULL,
  output_description TEXT NULL,
  UNIQUE KEY uq_tpl_tenant_type (tenant_id, layer_type),
  CONSTRAINT fk_tpl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agent_tools (
  id                         VARCHAR(36) PRIMARY KEY,
  tenant_id                  VARCHAR(36) NOT NULL,
  name                       VARCHAR(80) NOT NULL,
  label                      VARCHAR(120) NOT NULL,
  description                TEXT NULL,
  permission_level           ENUM('Read','Limited write','Write','Restricted write','High-impact action') NOT NULL DEFAULT 'Read',
  classification             ENUM('read','limited_write','write','restricted_write','high_impact') NOT NULL DEFAULT 'read',
  required_permissions       JSON NULL,
  timeout_ms                 INT UNSIGNED NOT NULL DEFAULT 5000,
  retry_policy               JSON NULL,
  rate_limit                 JSON NULL,
  approval_requirement       ENUM('autonomous','user_confirmation','human_staff_approval','dual_approval') NOT NULL DEFAULT 'autonomous',
  audit_logging              TINYINT(1) NOT NULL DEFAULT 1,
  input_schema               JSON NULL,
  hardcoded_code_guardrails  JSON NULL,
  success_response_format    JSON NULL,
  failure_response_format    JSON NULL,
  is_enabled                 TINYINT(1) NOT NULL DEFAULT 1,
  created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tool_tenant_name (tenant_id, name),
  CONSTRAINT fk_tool_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tool_audit_logs (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NOT NULL,
  correlation_id    VARCHAR(64) NOT NULL,
  tool_name         VARCHAR(80) NOT NULL,
  caller            ENUM('ai_model','human_staff','scheduled_job') NOT NULL,
  customer_masked_id VARCHAR(64) NULL,
  input_payload     JSON NULL,
  auth_decision     ENUM('authorized','blocked_by_guardrail','pending_approval','rejected_by_staff') NOT NULL DEFAULT 'authorized',
  guardrail_reason  VARCHAR(255) NULL,
  execution_status  ENUM('success','failed','pending','intercepted') NOT NULL DEFAULT 'success',
  execution_time_ms INT UNSIGNED NOT NULL DEFAULT 0,
  result_summary    VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tal_tenant_created (tenant_id, created_at),
  CONSTRAINT fk_tal_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Business settings, notifications, audit
-- ---------------------------------------------------------------------------
CREATE TABLE business_profiles (
  tenant_id            VARCHAR(36) PRIMARY KEY,
  business_name        VARCHAR(160) NOT NULL,
  industry             VARCHAR(120) NULL,
  business_description TEXT NULL,
  website              VARCHAR(255) NULL,
  contact_phone        VARCHAR(32) NULL,
  support_email        VARCHAR(160) NULL,
  business_hours_start VARCHAR(8) NULL,
  business_hours_end   VARCHAR(8) NULL,
  time_zone            VARCHAR(64) NULL,
  operating_locations  JSON NULL,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bprof_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE service_settings (
  tenant_id                     VARCHAR(36) PRIMARY KEY,
  customer_support_hours        VARCHAR(120) NULL,
  escalation_supervisor_name    VARCHAR(120) NULL,
  escalation_supervisor_email   VARCHAR(160) NULL,
  escalation_supervisor_phone   VARCHAR(32) NULL,
  support_phone                 VARCHAR(32) NULL,
  support_email                 VARCHAR(160) NULL,
  out_of_hours_behavior         ENUM('automated_faq_and_queue','polite_closed_notice','emergency_ai_only','silent_queue') NOT NULL DEFAULT 'automated_faq_and_queue',
  default_greeting_message      TEXT NULL,
  out_of_hours_message          TEXT NULL,
  updated_at                    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ssvc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_zones (
  id                        VARCHAR(36) PRIMARY KEY,
  tenant_id                 VARCHAR(36) NOT NULL,
  zone                      VARCHAR(120) NOT NULL,
  courier_partner           VARCHAR(120) NOT NULL,
  estimated_delivery        VARCHAR(80) NOT NULL,
  standard_fee              DECIMAL(18,2) NOT NULL DEFAULT 0,
  cash_on_delivery_available TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_dz_tenant (tenant_id),
  CONSTRAINT fk_dz_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE retention_settings (
  tenant_id                  VARCHAR(36) PRIMARY KEY,
  retention_window           ENUM('30_days','90_days','365_days','indefinite') NOT NULL DEFAULT '365_days',
  auto_purge_customer_pii    TINYINT(1) NOT NULL DEFAULT 0,
  auto_purge_voice_notes     TINYINT(1) NOT NULL DEFAULT 0,
  privacy_notice_url         VARCHAR(255) NULL,
  dpa_signed                 TINYINT(1) NOT NULL DEFAULT 0,
  dpa_signed_date            DATE NULL,
  erasure_requests_count     INT UNSIGNED NOT NULL DEFAULT 0,
  last_data_export_at        DATETIME NULL,
  updated_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ret_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE erasure_requests (
  id                  VARCHAR(36) PRIMARY KEY,
  tenant_id           VARCHAR(36) NOT NULL,
  customer_identifier VARCHAR(160) NOT NULL,
  channel             ENUM('messenger','whatsapp') NOT NULL DEFAULT 'whatsapp',
  status              ENUM('pending_verification','completed','rejected') NOT NULL DEFAULT 'pending_verification',
  records_purged_count INT UNSIGNED NOT NULL DEFAULT 0,
  requested_by        VARCHAR(160) NULL,
  verification_hash   VARCHAR(64) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_er_tenant (tenant_id, status),
  CONSTRAINT fk_er_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE escalation_rules (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  trigger_type    ENUM('human_attention_requested','customer_waiting_timeout','channel_disconnected','model_rate_limit_429','knowledge_index_failure','usage_threshold_reached','negative_sentiment_complaint') NOT NULL,
  name            VARCHAR(160) NOT NULL,
  description     VARCHAR(255) NULL,
  is_enabled      TINYINT(1) NOT NULL DEFAULT 1,
  threshold_value VARCHAR(80) NULL,
  action          ENUM('notify_staff','reassign_queue','escalate_supervisor','page_engineer') NOT NULL DEFAULT 'notify_staff',
  notify_channels JSON NULL,
  assigned_role   VARCHAR(80) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_esc_tenant (tenant_id),
  CONSTRAINT fk_esc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preferences (
  id           VARCHAR(36) PRIMARY KEY,
  tenant_id    VARCHAR(36) NOT NULL,
  user_id      VARCHAR(36) NOT NULL,
  category     VARCHAR(80) NOT NULL,
  description  VARCHAR(255) NULL,
  in_app       TINYINT(1) NOT NULL DEFAULT 1,
  email        TINYINT(1) NOT NULL DEFAULT 0,
  sms_whatsapp TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_np_user_cat (user_id, category),
  CONSTRAINT fk_np_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  user_id       VARCHAR(36) NULL,                 -- NULL = tenant-wide
  title         VARCHAR(200) NOT NULL,
  message       TEXT NULL,
  type          ENUM('urgent','warning','info','success') NOT NULL DEFAULT 'info',
  is_read       TINYINT(1) NOT NULL DEFAULT 0,
  source_module VARCHAR(80) NULL,
  action_url    VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_tenant (tenant_id, is_read, created_at),
  CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id                VARCHAR(36) PRIMARY KEY,
  tenant_id         VARCHAR(36) NULL,
  actor_name        VARCHAR(120) NULL,
  actor_email       VARCHAR(160) NULL,
  actor_role        VARCHAR(40) NULL,
  ip_address        VARCHAR(64) NULL,
  action_type       ENUM('agent_toggle','policy_published','knowledge_reindexed','agent_takeover','integration_changed','tool_call_executed','refund_issued','order_action','credentials_changed','permission_changed','customer_data_exported','customer_data_erased') NOT NULL,
  action_title      VARCHAR(200) NOT NULL,
  description       TEXT NULL,
  outcome           ENUM('success','denied','failed') NOT NULL DEFAULT 'success',
  correlation_id    VARCHAR(64) NULL,
  sanitized_metadata JSON NULL,
  target_resource   VARCHAR(200) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_tenant_created (tenant_id, created_at),
  INDEX idx_audit_action (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Usage metering, queue, jobs
-- ---------------------------------------------------------------------------
CREATE TABLE usage_logs (
  id              VARCHAR(64) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36) NULL,
  message_id      VARCHAR(36) NULL,
  model_id        VARCHAR(96) NULL,
  provider        VARCHAR(60) NULL,
  input_tokens    INT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens   INT UNSIGNED NOT NULL DEFAULT 0,
  cost_usd        DECIMAL(12,6) NOT NULL DEFAULT 0,
  cost_tenant     DECIMAL(18,4) NOT NULL DEFAULT 0,
  latency_ms      INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ul_tenant_created (tenant_id, created_at),
  INDEX idx_ul_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usage_counters (
  tenant_id     VARCHAR(36) NOT NULL,
  period_start  DATE NOT NULL,
  conversations INT UNSIGNED NOT NULL DEFAULT 0,
  messages      INT UNSIGNED NOT NULL DEFAULT 0,
  ai_messages   INT UNSIGNED NOT NULL DEFAULT 0,
  handoffs      INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start),
  CONSTRAINT fk_uc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chart_daily_stats (
  tenant_id         VARCHAR(36) NOT NULL,
  stat_date         DATE NOT NULL,
  total_conversations INT UNSIGNED NOT NULL DEFAULT 0,
  ai_handled        INT UNSIGNED NOT NULL DEFAULT 0,
  human_handled     INT UNSIGNED NOT NULL DEFAULT 0,
  messenger_msgs    INT UNSIGNED NOT NULL DEFAULT 0,
  whatsapp_msgs     INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, stat_date),
  CONSTRAINT fk_cds_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE jobs (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NULL,
  kind          VARCHAR(60) NOT NULL,
  status        ENUM('pending','running','completed','failed','dead','cancelled','dismissed') NOT NULL DEFAULT 'pending',
  priority      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  payload       JSON NULL,
  result        JSON NULL,
  attempts      INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts  INT UNSIGNED NOT NULL DEFAULT 3,
  available_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at     DATETIME NULL,
  locked_by     VARCHAR(64) NULL,
  finished_at   DATETIME NULL,
  error_message TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jobs_claim (status, available_at, priority),
  INDEX idx_jobs_tenant (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
