-- ============================================================================
-- Multitenant AI Customer Handling Platform — SQLite mirror (dev / smoke test)
-- Mirrors schema.mysql.sql. Enums stored as TEXT with CHECK-free portability.
-- ============================================================================
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'BDT',
  price_per_message REAL NOT NULL DEFAULT 0,
  wallet_balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  primary_model TEXT,
  health_score_percent INTEGER NOT NULL DEFAULT 100,
  support_notes TEXT,
  assigned_support_owner TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT
);
CREATE INDEX idx_tenants_status ON tenants(status);

CREATE TABLE tenant_api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT 'ingest',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  assigned_channels TEXT,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
    quiet_hours_enabled INTEGER NOT NULL DEFAULT 1,
    quiet_hours_start TEXT NOT NULL DEFAULT '23:00',
    quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  custom_permissions TEXT,
  last_active_at TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

CREATE TABLE user_permissions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (user_id, permission)
);

CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device TEXT, browser TEXT, ip_address TEXT, location TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT, expires_at TEXT, revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

CREATE TABLE admin_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  actor_user_id TEXT,
  actor_name TEXT NOT NULL,
  actor_phone TEXT,
  action TEXT NOT NULL,
  target_user TEXT,
  ip_address TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_admin_actions_tenant ON admin_actions(tenant_id);

CREATE TABLE currencies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  symbol_position TEXT NOT NULL DEFAULT 'before',
  symbol_spacing INTEGER NOT NULL DEFAULT 1,
  exchange_rate_from_usd REAL NOT NULL DEFAULT 1,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  thousands_separator TEXT NOT NULL DEFAULT ',',
  decimal_separator TEXT NOT NULL DEFAULT '.',
  is_platform_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE ai_provider_models (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT,
  endpoint_url TEXT,
  capabilities TEXT NOT NULL,
  cost_per_million_input_usd REAL NOT NULL DEFAULT 0,
  cost_per_million_output_usd REAL NOT NULL DEFAULT 0,
  context_window_tokens INTEGER NOT NULL DEFAULT 0,
  max_output_tokens INTEGER NOT NULL DEFAULT 0,
  latency_p95_ms INTEGER NOT NULL DEFAULT 0,
  error_rate_24h_percent REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  is_default INTEGER NOT NULL DEFAULT 0,
  is_fallback INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE global_pipeline_layers (
  id TEXT PRIMARY KEY,
  layer_type TEXT NOT NULL UNIQUE,
  layer_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  default_model_id TEXT NOT NULL,
  default_fallback_model_id TEXT,
  default_temperature REAL NOT NULL DEFAULT 0.3,
  default_max_tokens INTEGER NOT NULL DEFAULT 1024,
  system_prompt TEXT,
  guidance_notes TEXT,
  input_description TEXT,
  output_description TEXT,
  is_mandatory INTEGER NOT NULL DEFAULT 0,
  is_active_globally INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE system_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  uptime_90d_percent REAL NOT NULL DEFAULT 100,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  last_incident TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'p3_minor',
  status TEXT NOT NULL DEFAULT 'investigating',
  affected_components TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  summary TEXT
);

CREATE TABLE compliance_settings (
  id TEXT PRIMARY KEY,
  last_isolation_audit TEXT,
  isolation_status TEXT NOT NULL DEFAULT 'warning',
  kms_key_rotation_age_days INTEGER NOT NULL DEFAULT 0,
  next_rotation_scheduled TEXT,
  gdpr_pending_erasures_count INTEGER NOT NULL DEFAULT 0,
  gdpr_completed_erasures_count INTEGER NOT NULL DEFAULT 0,
  soc2_audit_export_ready INTEGER NOT NULL DEFAULT 0,
  backup_status TEXT NOT NULL DEFAULT 'warning',
  last_disaster_recovery_test TEXT,
  disaster_recovery_test_outcome TEXT,
  rpo_minutes INTEGER NOT NULL DEFAULT 15,
  rto_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE plans (
  tier TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_monthly_usd REAL NOT NULL,
  price_monthly_bdt REAL NOT NULL,
  conversations_allowance INTEGER NOT NULL,
  messages_allowance INTEGER NOT NULL,
  team_seats_allowance INTEGER NOT NULL,
  channels_allowance INTEGER NOT NULL,
  retention_days INTEGER NOT NULL,
  features TEXT NOT NULL
);

CREATE TABLE tenant_plans (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'starter',
  started_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  amount_bdt REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  download_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, date);

CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  amount_usd REAL NOT NULL DEFAULT 0,
  gateway TEXT, reference TEXT, description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_wallet_tenant ON wallet_transactions(tenant_id, created_at);

CREATE TABLE messenger_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  category TEXT, avatar_url TEXT,
  instagram_linked INTEGER NOT NULL DEFAULT 0,
  instagram_account_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  granted_permissions TEXT, missing_permissions TEXT, subscribed_fields TEXT,
  access_token TEXT,
  token_status TEXT NOT NULL DEFAULT 'healthy',
  token_days_remaining INTEGER NOT NULL DEFAULT 60,
  token_type TEXT, token_last_refreshed TEXT, token_expires_at TEXT,
  last_webhook_at TEXT, last_reply_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE messenger_webhook_errors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  connection_id TEXT,
  code INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  details TEXT, impact TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE whatsapp_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  waba_name TEXT NOT NULL, waba_id TEXT NOT NULL,
  business_manager_id TEXT,
  phone_number TEXT NOT NULL, phone_number_id TEXT NOT NULL,
  display_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  has_green_tick INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  quality_rating TEXT NOT NULL DEFAULT 'GREEN',
  messaging_tier_limit TEXT,
  current_24h_window_sent INTEGER NOT NULL DEFAULT 0,
  throughput_limit TEXT,
  access_token TEXT, token_type TEXT, token_last_refreshed TEXT,
  last_inbound_at TEXT, last_outbound_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE whatsapp_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  connection_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'UTILITY',
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'IN_REVIEW',
  body_sample TEXT NOT NULL,
  last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE meta_oauth_sessions (
  state_hash TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('messenger','whatsapp')),
  access_token TEXT,
  token_expires_at TEXT,
  expires_at TEXT NOT NULL,
  callback_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE platform_support_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  started_by TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  correlation_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sender_id_masked TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  retry_count INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  sanitized_summary TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_we_tenant_created ON webhook_events(tenant_id, created_at);
CREATE INDEX idx_we_correlation ON webhook_events(correlation_id);

CREATE TABLE business_integrations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integ_key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  badge TEXT, description TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  endpoint_url TEXT,
  auth_method TEXT NOT NULL DEFAULT 'API Key & Secret',
  credentials TEXT,
  last_sync_at TEXT,
  rate_limit_used INTEGER NOT NULL DEFAULT 0,
  rate_limit_max INTEGER NOT NULL DEFAULT 60,
  rate_limit_reset TEXT,
  scopes TEXT, fallback_policy TEXT,
  calls_today INTEGER NOT NULL DEFAULT 0,
  success_rate REAL NOT NULL DEFAULT 100,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, integ_key)
);

CREATE TABLE integration_health_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT, email TEXT, city TEXT,
  external_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  language TEXT NOT NULL DEFAULT 'Bangla',
  memory_notes TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT,
  UNIQUE (tenant_id, external_id)
);
CREATE INDEX idx_cust_tenant_phone ON customers(tenant_id, phone);

CREATE TABLE customer_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  external_order_id TEXT NOT NULL,
  items TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL,
  ordered_at TEXT NOT NULL
);
CREATE INDEX idx_co_customer ON customer_orders(customer_id, ordered_at);

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE (tenant_id, name)
);

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ai_handling',
  assigned_staff_id TEXT,
  assigned_team_id TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  ai_status TEXT NOT NULL DEFAULT 'active',
  handover_reason TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  last_message_preview TEXT,
  last_message_at TEXT,
  first_response_at TEXT,
  resolved_at TEXT,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_conv_tenant_last ON conversations(tenant_id, last_message_at);
CREATE INDEX idx_conv_tenant_status ON conversations(tenant_id, status);
CREATE INDEX idx_conv_staff ON conversations(assigned_staff_id);
CREATE INDEX idx_conv_customer ON conversations(customer_id);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_user_id TEXT,
  text TEXT NOT NULL,
  delivery_state TEXT,
  is_internal_note INTEGER NOT NULL DEFAULT 0,
  system_event_type TEXT,
  ai_confidence REAL,
  ai_status_decision TEXT,
  ai_correction_note TEXT,
  ai_prevented INTEGER NOT NULL DEFAULT 0,
  external_message_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_msg_conv_created ON messages(conversation_id, created_at);
CREATE INDEX idx_msg_tenant_created ON messages(tenant_id, created_at);

CREATE TABLE message_attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  size TEXT, duration TEXT, thumbnail TEXT,
  insights TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_att_message ON message_attachments(message_id);

CREATE TABLE message_sources (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  snippet TEXT,
  score REAL NOT NULL DEFAULT 0
);
CREATE INDEX idx_src_message ON message_sources(message_id);

CREATE TABLE canned_replies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 1,
  channel TEXT NOT NULL DEFAULT 'all',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE failed_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id TEXT,
  customer_name TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  snippet TEXT, reason TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'needs_attention',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE knowledge_sources (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  source_url TEXT, origin_details TEXT, source_content TEXT, error_reason TEXT,
  chunks_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_indexed TEXT, last_content_update TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE knowledge_chunks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  chunk_text TEXT NOT NULL,
  embedding TEXT,
  tokens INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_kc_source ON knowledge_chunks(source_id);

CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  alternative_questions TEXT,
  approved_answer TEXT NOT NULL,
  category TEXT,
  applicable_channel TEXT NOT NULL DEFAULT 'All',
  language TEXT NOT NULL DEFAULT 'Bangla',
  status TEXT NOT NULL DEFAULT 'Draft',
  priority INTEGER NOT NULL DEFAULT 5,
  review_date TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE business_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  full_text TEXT NOT NULL,
  rules_and_exceptions TEXT,
  effective_date TEXT,
  permanent INTEGER NOT NULL DEFAULT 0,
  review_date TEXT,
  publication_status TEXT NOT NULL DEFAULT 'Draft',
  approval_status TEXT NOT NULL DEFAULT 'Pending Approval',
  version TEXT NOT NULL DEFAULT '1.0',
  last_approved_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT, category TEXT,
  variants TEXT,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  discounted_price REAL,
  inventory_status TEXT NOT NULL DEFAULT 'In Stock',
  stock_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT, image_urls TEXT,
  shipping_restrictions TEXT, warranty_info TEXT, product_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, sku)
);

CREATE TABLE training_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id TEXT, source_name TEXT,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  documents_processed INTEGER NOT NULL DEFAULT 0,
  total_documents INTEGER NOT NULL DEFAULT 0,
  records_skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  started_at TEXT, finished_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  draft_answer TEXT,
  retrieved_sources TEXT,
  is_grounded INTEGER NOT NULL DEFAULT 0,
  expected_answer TEXT,
  verdict TEXT NOT NULL DEFAULT 'untested',
  tested_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE brand_identity (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  tagline TEXT, brand_voice TEXT,
  tone_pillars TEXT, preferred_terms TEXT, forbidden_terms TEXT,
  greeting_convention TEXT, cultural_nuances TEXT,
  last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE agent_config_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  mode TEXT NOT NULL DEFAULT 'automatic',
  summary TEXT,
  identity TEXT, instructions TEXT, behavior TEXT, response_rules TEXT,
  published_at TEXT, published_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, version)
);

CREATE TABLE handover_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  trigger_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  destination_team TEXT NOT NULL,
  handover_message TEXT,
  notification_channels TEXT,
  pause_ai_immediately INTEGER NOT NULL DEFAULT 1,
  require_explicit_resume INTEGER NOT NULL DEFAULT 0,
  confidence_threshold_percent INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quick_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trigger_keyword TEXT NOT NULL,
  template_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tenant_pipeline_config (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  routing_strategy TEXT NOT NULL DEFAULT 'sequential',
  cost_control_mode INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tenant_pipeline_layers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL,
  layer_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT, description TEXT,
  selected_model_id TEXT NOT NULL,
  fallback_model_id TEXT,
  temperature REAL NOT NULL DEFAULT 0.3,
  max_tokens INTEGER NOT NULL DEFAULT 1024,
  system_prompt TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  input_description TEXT, output_description TEXT,
  UNIQUE (tenant_id, layer_type)
);

CREATE TABLE agent_tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  permission_level TEXT NOT NULL DEFAULT 'Read',
  classification TEXT NOT NULL DEFAULT 'read',
  required_permissions TEXT,
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  retry_policy TEXT, rate_limit TEXT,
  approval_requirement TEXT NOT NULL DEFAULT 'autonomous',
  audit_logging INTEGER NOT NULL DEFAULT 1,
  input_schema TEXT,
  hardcoded_code_guardrails TEXT,
  success_response_format TEXT, failure_response_format TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, name)
);

CREATE TABLE tool_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  correlation_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  caller TEXT NOT NULL,
  customer_masked_id TEXT,
  input_payload TEXT,
  auth_decision TEXT NOT NULL DEFAULT 'authorized',
  guardrail_reason TEXT,
  execution_status TEXT NOT NULL DEFAULT 'success',
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  result_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE business_profiles (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  industry TEXT, business_description TEXT, website TEXT,
  contact_phone TEXT, support_email TEXT,
  business_hours_start TEXT, business_hours_end TEXT,
  time_zone TEXT, operating_locations TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE service_settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  customer_support_hours TEXT,
  escalation_supervisor_name TEXT,
  escalation_supervisor_email TEXT,
  escalation_supervisor_phone TEXT,
  support_phone TEXT, support_email TEXT,
  out_of_hours_behavior TEXT NOT NULL DEFAULT 'automated_faq_and_queue',
  default_greeting_message TEXT, out_of_hours_message TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE delivery_zones (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zone TEXT NOT NULL,
  courier_partner TEXT NOT NULL,
  estimated_delivery TEXT NOT NULL,
  standard_fee REAL NOT NULL DEFAULT 0,
  cash_on_delivery_available INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE retention_settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  retention_window TEXT NOT NULL DEFAULT '365_days',
  auto_purge_customer_pii INTEGER NOT NULL DEFAULT 0,
  auto_purge_voice_notes INTEGER NOT NULL DEFAULT 0,
  privacy_notice_url TEXT,
  dpa_signed INTEGER NOT NULL DEFAULT 0,
  dpa_signed_date TEXT,
  erasure_requests_count INTEGER NOT NULL DEFAULT 0,
  last_data_export_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE erasure_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_identifier TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending_verification',
  records_purged_count INTEGER NOT NULL DEFAULT 0,
  requested_by TEXT,
  verification_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE escalation_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  threshold_value TEXT,
  action TEXT NOT NULL DEFAULT 'notify_staff',
  notify_channels TEXT,
  assigned_role TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notification_preferences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  in_app INTEGER NOT NULL DEFAULT 1,
  email INTEGER NOT NULL DEFAULT 0,
  sms_whatsapp INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, category)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read INTEGER NOT NULL DEFAULT 0,
  source_module TEXT, action_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notif_tenant ON notifications(tenant_id, is_read, created_at);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  actor_name TEXT, actor_email TEXT, actor_role TEXT, ip_address TEXT,
  action_type TEXT NOT NULL,
  action_title TEXT NOT NULL,
  description TEXT,
  outcome TEXT NOT NULL DEFAULT 'success',
  correlation_id TEXT,
  sanitized_metadata TEXT,
  target_resource TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_tenant_created ON audit_logs(tenant_id, created_at);

CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT, message_id TEXT,
  model_id TEXT, provider TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  cost_tenant REAL NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ul_tenant_created ON usage_logs(tenant_id, created_at);

CREATE TABLE usage_counters (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,
  conversations INTEGER NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  ai_messages INTEGER NOT NULL DEFAULT 0,
  handoffs INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start)
);

CREATE TABLE chart_daily_stats (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stat_date TEXT NOT NULL,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  ai_handled INTEGER NOT NULL DEFAULT 0,
  human_handled INTEGER NOT NULL DEFAULT 0,
  messenger_msgs INTEGER NOT NULL DEFAULT 0,
  whatsapp_msgs INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, stat_date)
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 5,
  payload TEXT, result TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  available_at TEXT NOT NULL DEFAULT (datetime('now')),
  locked_at TEXT, locked_by TEXT, finished_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_jobs_claim ON jobs(status, available_at, priority);
