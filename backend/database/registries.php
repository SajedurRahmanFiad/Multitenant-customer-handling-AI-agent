<?php
declare(strict_types=1);

/**
 * Canonical platform registry rows. Used by the seeder AND the SchemaHealer
 * so a wiped/empty registry table is always re-hydrated automatically.
 */
final class RegistryData
{
    /** @return array<int, array{0:string,1:string,2:string,3:string,4:string,5:bool,6:float,7:int,8:string,9:string,10:bool,11:string}> */
    public static function currencies(): array
    {
        return [
            ['curr_bdt', 'BDT', 'Bangladeshi Taka', '৳', 'before', true, 122.50, 0, ',', '.', false, 'National currency of Bangladesh (Default for local e-commerce tenants)'],
            ['curr_usd', 'USD', 'US Dollar', '$', 'before', false, 1.00, 2, ',', '.', true, 'Global benchmark currency for AI API tokens and infrastructure billing'],
            ['curr_eur', 'EUR', 'Euro', '€', 'after', true, 0.92, 2, '.', ',', false, 'European Union single market currency'],
            ['curr_gbp', 'GBP', 'British Pound', '£', 'before', false, 0.78, 2, ',', '.', false, 'United Kingdom pound sterling'],
            ['curr_aed', 'AED', 'UAE Dirham', 'د.إ', 'before', true, 3.67, 2, ',', '.', false, 'United Arab Emirates dirham for GCC regional stores'],
            ['curr_inr', 'INR', 'Indian Rupee', '₹', 'before', true, 84.10, 2, ',', '.', false, 'Indian Rupee cross-border trade'],
        ];
    }

    /** @return array<int, array> */
    public static function providers(): array
    {
        return [
            ['gemini-2.0-flash', 'Gemini 2.0 Flash', 'Google Gemini', 0.10, 0.40, 1000000, 8192, 420, 0.4, 'active', 1, 0, ['text', 'vision', 'json', 'tools']],
            ['gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google Gemini', 1.25, 10.00, 1048576, 65536, 1200, 1.2, 'active', 0, 0, ['text', 'vision', 'json', 'tools']],
            ['gpt-4o-mini', 'GPT-4o mini', 'OpenAI', 0.15, 0.60, 128000, 16384, 610, 0.9, 'active', 0, 0, ['text', 'vision', 'json', 'tools']],
            ['claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', 3.00, 15.00, 200000, 8192, 900, 0.6, 'active', 0, 0, ['text', 'vision', 'json']],
            ['llama-3.3-70b-versatile', 'Llama 3.3 70B (Groq)', 'Groq / Llama', 0.59, 0.79, 128000, 32768, 280, 2.1, 'active', 0, 1, ['text', 'json', 'tools']],
            ['llama3.1:8b-ollama', 'Llama 3.1 8B (Ollama)', 'Ollama Dedicated', 0.0, 0.0, 131072, 8192, 150, 3.5, 'degraded', 0, 0, ['text', 'json']],
        ];
    }

    /** @return array<int, array> */
    public static function globalLayers(): array
    {
        return [
            ['intent_classification', 1, 'Intent Classifier', 'Fast triage model', 'Classifies the customer message into intent buckets and urgency before deeper processing.', 'gemini-2.0-flash', null, 0.1, 512, 'You classify customer support messages. Output JSON: {intent, urgency, language, needs_knowledge}.', 'Keep this layer enabled globally; it is the cheapest way to route traffic.', 'Raw customer text', '{intent, urgency, language, needs_knowledge}', 1, 1],
            ['image_processing', 2, 'Image Understanding', 'Vision model pass', 'Describes product photos, detects order labels or damage evidence.', 'gemini-2.0-flash', null, 0.2, 768, 'You analyze customer-uploaded images for a commerce support agent.', 'Skipped automatically when the message has no image attachments.', 'Image + optional caption', 'Image description and flags', 0, 1],
            ['voice_processing', 3, 'Voice Transcription', 'Speech-to-text', 'Transcribes voice notes and infers language and clarity.', 'gemini-2.0-flash', null, 0.0, 512, 'You transcribe audio notes into text with language detection.', 'Voice notes without transcription are auto-flagged as failed audio.', 'Audio note', 'Transcript + clarity score', 0, 1],
            ['knowledge_retrieval', 4, 'Knowledge Retrieval', 'RAG over tenant knowledge', 'Retrieves relevant FAQ, policy and catalogue passages for grounding.', 'gemini-2.0-flash', null, 0.0, 1024, 'You retrieve the most relevant tenant knowledge passages for the question.', 'Grounding layer: answers must stay inside retrieved passages.', 'Customer question + context', 'Ranked knowledge passages', 1, 1],
            ['final_generation', 5, 'Final Reply Generation', 'Brand-tuned response', 'Generates the final customer-facing reply with tone, policy and safety rules.', 'gemini-2.0-flash', 'llama-3.3-70b-versatile', 0.3, 1024, 'You are the brand support agent. Reply in the customer language, ground in retrieved knowledge, follow policy.', 'Escalate on low confidence. Never invent prices.', 'Knowledge + conversation + customer memory', 'Customer-facing reply + confidence', 1, 1],
        ];
    }

    /** @return array<int, array> */
    public static function components(): array
    {
        return [];
    }

    /** @return array<int, array> */
    public static function plans(): array
    {
        return [
            ['starter', 'Starter', 29, 3552, 500, 2000, 3, 2, 90, [
                ['name' => 'AI conversation handling', 'included' => true, 'limitText' => '500 conversations/mo'],
                ['name' => 'Messenger + WhatsApp', 'included' => true],
                ['name' => 'Knowledge base', 'included' => true, 'limitText' => '100 documents'],
                ['name' => 'Team seats', 'included' => true, 'limitText' => '3 seats'],
                ['name' => 'Priority support', 'included' => false],
                ['name' => 'Custom integrations', 'included' => false],
            ]],
            ['growth', 'Growth', 79, 9676, 2000, 10000, 8, 4, 180, [
                ['name' => 'AI conversation handling', 'included' => true, 'limitText' => '2000 conversations/mo'],
                ['name' => 'Messenger + WhatsApp', 'included' => true],
                ['name' => 'Knowledge base', 'included' => true, 'limitText' => '1000 documents'],
                ['name' => 'Team seats', 'included' => true, 'limitText' => '8 seats'],
                ['name' => 'Priority support', 'included' => false],
                ['name' => 'Custom integrations', 'included' => true],
            ]],
            ['pro', 'Pro', 199, 24377, 10000, 50000, 25, 10, 365, [
                ['name' => 'AI conversation handling', 'included' => true, 'limitText' => '10k conversations/mo'],
                ['name' => 'All channels + webhooks', 'included' => true],
                ['name' => 'Knowledge base', 'included' => true, 'limitText' => 'Unlimited'],
                ['name' => 'Team seats', 'included' => true, 'limitText' => '25 seats'],
                ['name' => 'Priority support', 'included' => true],
                ['name' => 'Custom integrations', 'included' => true],
            ]],
            ['enterprise', 'Enterprise', 499, 61122, 100000, 500000, 100, 50, 730, [
                ['name' => 'Unlimited AI handling', 'included' => true],
                ['name' => 'Dedicated infrastructure', 'included' => true],
                ['name' => 'SLA 99.9%', 'included' => true],
                ['name' => 'Dedicated success manager', 'included' => true],
                ['name' => 'Custom model routing', 'included' => true],
            ]],
        ];
    }

    /** Insert canonical registry rows into any table that has no rows yet. */
    public static function healRegistries(): array
    {
        $report = [];

        if ((int) Database::scalar('SELECT COUNT(*) FROM currencies') === 0) {
            foreach (self::currencies() as $c) {
                Database::insert('currencies', [
                    'id' => $c[0], 'code' => $c[1], 'name' => $c[2], 'symbol' => $c[3],
                    'symbol_position' => $c[4], 'symbol_spacing' => $c[5] ? 1 : 0,
                    'exchange_rate_from_usd' => $c[6], 'decimal_places' => $c[7],
                    'thousands_separator' => $c[8], 'decimal_separator' => $c[9],
                    'is_platform_default' => $c[10] ? 1 : 0, 'is_active' => 1, 'description' => $c[11],
                    'created_at' => '2026-10-20 10:00:00',
                ]);
            }
            $report[] = 'currencies';
        }

        if ((int) Database::scalar('SELECT COUNT(*) FROM ai_provider_models') === 0) {
            foreach (self::providers() as $p) {
                Database::insert('ai_provider_models', [
                    'id' => Util::id('apm'),
                    'model_id' => $p[0], 'display_name' => $p[1], 'provider' => $p[2],
                    'api_key' => null, 'endpoint_url' => null,
                    'capabilities' => Database::json($p[12]),
                    'cost_per_million_input_usd' => $p[3], 'cost_per_million_output_usd' => $p[4],
                    'context_window_tokens' => $p[5], 'max_output_tokens' => $p[6],
                    'latency_p95_ms' => $p[7], 'error_rate_24h_percent' => $p[8],
                    'status' => $p[9], 'is_default' => $p[10], 'is_fallback' => $p[11],
                ]);
            }
            $report[] = 'ai_provider_models';
        }

        if ((int) Database::scalar('SELECT COUNT(*) FROM global_pipeline_layers') === 0) {
            foreach (self::globalLayers() as $l) {
                Database::insert('global_pipeline_layers', [
                    'id' => Util::id('gpl'), 'layer_type' => $l[0], 'layer_order' => $l[1],
                    'title' => $l[2], 'subtitle' => $l[3], 'description' => $l[4],
                    'default_model_id' => $l[5], 'default_fallback_model_id' => $l[6],
                    'default_temperature' => $l[7], 'default_max_tokens' => $l[8],
                    'system_prompt' => $l[9], 'guidance_notes' => $l[10],
                    'input_description' => $l[11], 'output_description' => $l[12],
                    'is_mandatory' => $l[13], 'is_active_globally' => $l[14],
                ]);
            }
            $report[] = 'global_pipeline_layers';
        }

        if ((int) Database::scalar('SELECT COUNT(*) FROM plans') === 0) {
            foreach (self::plans() as $p) {
                Database::insert('plans', [
                    'tier' => $p[0], 'display_name' => $p[1],
                    'price_monthly_usd' => $p[2], 'price_monthly_bdt' => $p[3],
                    'conversations_allowance' => $p[4], 'messages_allowance' => $p[5],
                    'team_seats_allowance' => $p[6], 'channels_allowance' => $p[7],
                    'retention_days' => $p[8], 'features' => Database::json($p[9]),
                ]);
            }
            $report[] = 'plans';
        }

        if ((int) Database::scalar('SELECT COUNT(*) FROM system_components') === 0) {
            foreach (self::components() as $c) {
                Database::insert('system_components', [
                    'id' => Util::id('cmp'), 'name' => $c[0], 'type' => $c[1], 'status' => $c[2],
                    'uptime_90d_percent' => $c[3], 'latency_ms' => $c[4], 'last_incident' => $c[5],
                ]);
            }
            $report[] = 'system_components';
        }

        if ((int) Database::scalar('SELECT COUNT(*) FROM compliance_settings') === 0) {
            Database::insert('compliance_settings', [
                'id' => Util::id('cmp'),
                'isolation_status' => 'warning',
                'backup_status' => 'warning',
                'rpo_minutes' => 15, 'rto_minutes' => 60,
            ]);
            $report[] = 'compliance_settings';
        }

        return $report;
    }
}
