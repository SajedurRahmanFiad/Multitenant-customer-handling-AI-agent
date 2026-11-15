<?php
declare(strict_types=1);

require_once __DIR__ . '/registries.php';

/**
 * Full demo dataset seeding (platform registries + tenants + users + content).
 * Used by `seed.php` CLI and by SchemaHealer when the users table is empty in a
 * non-production environment. Returns a list of human-readable progress lines.
 */
function seedDemoData(bool $verbose = true): array
{
    $report = [];
    $say = function (string $line) use (&$report, $verbose) {
        $report[] = $line;
        if ($verbose) echo $line . "\n";
    };

    $say('Seeding platform registries...');
    foreach (RegistryData::healRegistries() as $t) {
        $say("  registry $t");
    }

    // -------------------------------------------------------------------- tenants
    $tenants = [
        ['ten_loom_01', 'bengal-loom-crafts', 'Bengal Loom & Crafts', 'Sajedur Rahman', 'owner@bengalloom.com', '+880 1711-000001', 'BDT', 2.50, 24500.00, 'active', 'gemini-2.0-flash', 97, 'Primary demo tenant for AI automation rollout.', 'Arif Hasan'],
        ['ten_gadget_02', 'gadget-express-bd', 'Gadget Express BD', 'Mushfiqur Rahman', 'owner@gadgetexpress.com', '+880 1819-204918', 'BDT', 3.00, 18200.50, 'active', 'gemini-2.0-flash', 91, 'Fast-growing electronics store; volume spike on Fridays.', 'Sadia Karim'],
        ['ten_med_04', 'dhaka-pharma-care', 'Dhaka Pharma & Care', 'Dr. Kazi Mahfuz', 'owner@dhakapharma.com', '+880 1711-002941', 'BDT', 2.00, 9800.00, 'active', 'gemini-2.0-flash', 88, 'Pharmacy; strict compliance notes on medical claims.', 'Arif Hasan'],
    ];
    foreach ($tenants as $t) {
        Database::insert('tenants', [
            'id' => $t[0], 'slug' => $t[1], 'business_name' => $t[2], 'owner_name' => $t[3],
            'owner_email' => $t[4], 'owner_phone' => $t[5], 'currency_code' => $t[6],
            'price_per_message' => $t[7], 'wallet_balance' => $t[8], 'status' => $t[9],
            'primary_model' => $t[10], 'health_score_percent' => $t[11],
            'support_notes' => $t[12], 'assigned_support_owner' => $t[13],
            'created_at' => '2026-08-01 09:00:00', 'last_active_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
        ]);
        Database::insert('tenant_plans', ['tenant_id' => $t[0], 'tier' => 'growth']);
        Database::insert('tenant_api_keys', [
            'id' => Util::id('ak'), 'tenant_id' => $t[0], 'name' => 'Default ingest key',
            'key_hash' => hash('sha256', $rawKey = 'ak_demo_' . $t[0]),
            'key_preview' => Util::mask($rawKey, 6),
        ]);
        PlatformAdminController::provisionDefaults($t[0]);
        $say("  provisioned tenant {$t[2]}");
    }

    // ----------------------------------------------------------------------- users
    $password = password_hash('password123', PASSWORD_DEFAULT);
    $users = [
        ['usr_01', null, 'Sajedur Rahman', '+880 1711-000001', 'sajedur@bengalloom.com', 'super_admin', 'active'],
        ['usr_02', 'ten_loom_01', 'Rafiq Islam', '+880 1712-984210', 'rafiq@bengalloom.com', 'admin', 'active'],
        ['usr_03', 'ten_loom_01', 'Anika Tabassum', '+880 1713-445566', 'anika@bengalloom.com', 'agent', 'active'],
        ['usr_04', 'ten_loom_01', 'Nusrat Jahan', '+880 1714-778899', 'nusrat@bengalloom.com', 'agent', 'active'],
        ['usr_05', 'ten_loom_01', 'Farhan Kabir', '+880 1715-112233', 'farhan@bengalloom.com', 'analyst', 'invited'],
        ['usr_07', 'ten_gadget_02', 'Mushfiqur Rahman', '+880 1819-204918', 'mushfiq@gadgetexpress.com', 'admin', 'active'],
        ['usr_08', 'ten_gadget_02', 'Tanvir Ahmed', '+880 1820-334455', 'tanvir@gadgetexpress.com', 'agent', 'active'],
        ['usr_10', 'ten_med_04', 'Dr. Kazi Mahfuz', '+880 1711-002941', 'kazi@dhakapharma.com', 'admin', 'active'],
    ];
    foreach ($users as $u) {
        Database::insert('users', [
            'id' => $u[0], 'tenant_id' => $u[1], 'name' => $u[2], 'phone' => $u[3], 'email' => $u[4],
            'password_hash' => $password, 'role' => $u[5], 'status' => $u[6],
            'assigned_channels' => Database::json($u[5] === 'agent' ? ['whatsapp', 'messenger'] : []),
            'last_active_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
            'joined_at' => '2026-08-05 10:00:00',
        ]);
        if ($u[5] === 'agent') {
            foreach (['read_conversations', 'send_messages', 'takeover_ai', 'edit_knowledge'] as $perm) {
                Database::insert('user_permissions', ['user_id' => $u[0], 'permission' => $perm]);
            }
        }
    }

    // --------------------------------------------------------------------- teams
    foreach ($tenants as $t) {
        foreach ([['General Support', 'First-line AI handover queue'], ['Sales Escalation', 'Bulk and corporate orders'], ['Billing & Claims', 'Refunds and payment conflicts']] as $team) {
            Database::insert('teams', ['id' => Util::id('tm'), 'tenant_id' => $t[0], 'name' => $team[0], 'description' => $team[1]]);
        }
    }

    // ------------------------------------------------- channels (loom connected)
    foreach ($tenants as $t) {
        $connected = $t[0] === 'ten_loom_01';
        Database::insert('messenger_connections', [
            'id' => Util::id('msc'), 'tenant_id' => $t[0],
            'page_name' => $t[2] . ' Official', 'page_id' => '100' . random_int(10000000, 99999999),
            'category' => 'Shopping & retail',
            'instagram_linked' => $connected ? 1 : 0, 'instagram_account_name' => $connected ? strtolower(preg_replace('/[^a-z]/i', '', $t[1])) : null,
            'status' => $connected ? 'connected' : 'disconnected',
            'granted_permissions' => Database::json(['pages_messaging', 'pages_read_engagement', 'pages_manage_metadata', 'instagram_manage_messages']),
            'missing_permissions' => Database::json([]),
            'subscribed_fields' => Database::json(['messages', 'messaging_postbacks', 'message_reactions']),
            'token_status' => 'healthy', 'token_days_remaining' => 54,
            'token_type' => 'Page Access Token', 'token_last_refreshed' => date('Y-m-d H:i:s', strtotime('-6 days')),
            'token_expires_at' => date('Y-m-d H:i:s', strtotime('+54 days')),
            'access_token' => $connected ? ('EAAG' . bin2hex(random_bytes(18))) : null,
            'last_webhook_at' => date('Y-m-d H:i:s', strtotime('-8 minutes')),
            'last_reply_at' => date('Y-m-d H:i:s', strtotime('-7 minutes')),
        ]);
        Database::insert('whatsapp_connections', [
            'id' => Util::id('wac'), 'tenant_id' => $t[0],
            'waba_name' => $t[2] . ' WABA', 'waba_id' => '20' . random_int(100000000, 999999999),
            'business_manager_id' => '12' . random_int(100000000, 999999999),
            'phone_number' => '+880 17' . random_int(10000000, 99999999),
            'phone_number_id' => '43' . random_int(100000000, 999999999),
            'display_name' => $t[2],
            'verification_status' => $connected ? 'verified' : 'unverified',
            'has_green_tick' => $connected ? 1 : 0,
            'status' => $connected ? 'connected' : 'disconnected',
            'quality_rating' => 'GREEN', 'messaging_tier_limit' => '1K msgs/day',
            'current_24h_window_sent' => random_int(40, 400), 'throughput_limit' => '100 msg/sec',
            'token_type' => 'System User Permanent Token',
            'token_last_refreshed' => date('Y-m-d H:i:s', strtotime('-10 days')),
            'access_token' => $connected ? ('EAAT' . bin2hex(random_bytes(18))) : null,
            'last_inbound_at' => date('Y-m-d H:i:s', strtotime('-4 minutes')),
            'last_outbound_at' => date('Y-m-d H:i:s', strtotime('-3 minutes')),
        ]);
        if ($connected) {
            foreach ([
                ['order_confirmation', 'UTILITY', 'en', 'APPROVED', 'Your order {{1}} is confirmed and will be delivered by {{2}}.'],
                ['delivery_update', 'UTILITY', 'en', 'APPROVED', 'Good news! Your package has been handed to {{1}}. Track here: {{2}}'],
                ['promo_october', 'MARKETING', 'en', 'IN_REVIEW', 'Dipawali offer: flat {{1}}% off on all jamdani sarees this week!'],
            ] as $tpl) {
                Database::insert('whatsapp_templates', [
                    'id' => Util::id('wat'), 'tenant_id' => $t[0],
                    'name' => $tpl[0], 'category' => $tpl[1], 'language' => $tpl[2],
                    'status' => $tpl[3], 'body_sample' => $tpl[4],
                    'last_updated' => date('Y-m-d H:i:s', strtotime('-20 days')),
                ]);
            }
            Database::insert('messenger_webhook_errors', [
                'id' => Util::id('mwe'), 'tenant_id' => $t[0],
                'code' => 200, 'title' => 'Delayed webhook delivery',
                'details' => 'Meta reported temporary throttling of webhook delivery for 3 minutes.',
                'impact' => 'Messages queued and retried automatically; no data lost.',
                'resolved' => 1, 'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            ]);
            foreach ([
                ['Facebook Page', 'uptime_check', 'Facebook Graph API reachable; webhook latency 240ms.', 'resolved', '-2 hours'],
                ['WhatsApp Cloud API', 'rate_limit_warning', 'Approaching messaging tier limit (76% used).', 'active', '-40 minutes'],
                ['WooCommerce Sync', 'fallback_triggered', 'Product sync failed; served cached catalogue.', 'info', '-1 day'],
            ] as $hl) {
                Database::insert('integration_health_logs', [
                    'id' => Util::id('ihl'), 'tenant_id' => $t[0], 'service' => $hl[0],
                    'type' => $hl[1], 'message' => $hl[2], 'status' => $hl[3],
                    'created_at' => date('Y-m-d H:i:s', strtotime($hl[4])),
                ]);
            }
            foreach ([
                ['message', 'processed', '-8 minutes'], ['message', 'processed', '-26 minutes'],
                ['message', 'duplicate_ignored', '-42 minutes'], ['postback', 'received', '-1 hour'],
            ] as $we) {
                Database::insert('webhook_events', [
                    'id' => Util::id('we'), 'tenant_id' => $t[0],
                    'correlation_id' => Util::correlationId(), 'channel' => 'whatsapp',
                    'event_type' => $we[0], 'sender_id_masked' => 'wa_8801****210',
                    'status' => $we[1], 'latency_ms' => random_int(80, 700),
                    'sanitized_summary' => 'Event ' . $we[0] . ' processed normally.',
                    'created_at' => date('Y-m-d H:i:s', strtotime($we[2])),
                ]);
            }
        }
    }

    // ------------------------------------------------- knowledge (loom tenant)
    $loom = 'ten_loom_01';
    Database::update('brand_identity', [
        'tagline' => 'Handwoven heritage, delivered with care',
        'brand_voice' => 'Warm, culturally rooted and helpful. Like a trusted local shopkeeper who knows every product story.',
        'tone_pillars' => Database::json([
            ['name' => 'Warm hospitality', 'description' => 'Greet like family, never robotic.'],
            ['name' => 'Craft pride', 'description' => 'Celebrate the weavers and the heritage behind each item.'],
            ['name' => 'Honest clarity', 'description' => 'Plain answers about price, delivery and returns.'],
        ]),
        'preferred_terms' => Database::json(['jamdani', 'handwoven', 'artisan', 'weaver']),
        'forbidden_terms' => Database::json(['cheap', 'replica', 'guaranteed lowest price']),
        'greeting_convention' => 'Start with a warm greeting and ask how you can help today. Use the customer name when known.',
        'cultural_nuances' => 'Customers often mix Bangla and English (Banglish). Reply in the language of the last message. Respect religious greetings around Eid and Durga Puja.',
        'last_updated' => date('Y-m-d H:i:s', strtotime('-3 days')),
    ], 'tenant_id = :tid', ['tid' => $loom]);

    $sources = [
        ['ks_faq_01', 'Customer FAQ Master Sheet', 'faq', 'ready', 34, 'Internal Google Sheet — approved answers only', '-6 days'],
        ['ks_pol_01', 'Delivery & Returns Policy', 'document', 'ready', 12, 'Policy PDF v2.3 approved Oct 2026', '-9 days'],
        ['ks_cat_01', 'Product Catalogue Autumn 2026', 'catalogue', 'ready', 48, 'Synced from WooCommerce nightly', '-1 day'],
        ['ks_web_01', 'Website Help Center Pages', 'website', 'outdated', 8, 'https://bengalloom.com/help', '-30 days'],
        ['ks_doc_02', 'Saree Care Manual', 'manual', 'ready', 9, 'Care instructions booklet', '-12 days'],
    ];
    foreach ($sources as $s) {
        Database::insert('knowledge_sources', [
            'id' => $s[0], 'tenant_id' => $loom, 'name' => $s[1], 'type' => $s[2], 'status' => $s[3],
            'origin_details' => $s[4], 'chunks_count' => $s[5], 'is_active' => 1,
            'last_indexed' => date('Y-m-d H:i:s', strtotime($s[6])),
            'last_content_update' => date('Y-m-d H:i:s', strtotime($s[6])),
        ]);
    }
    Database::update('knowledge_sources', [
        'status' => 'outdated', 'error_reason' => 'Website redesign changed help page URLs; re-crawl required.',
    ], 'id = :id', ['id' => 'ks_web_01']);

    $faqs = [
        ['What is your delivery time inside Dhaka?', '["How long does delivery take in Dhaka?"]', 'Inside Dhaka we deliver within 24–48 hours via our courier partner. Orders placed before 4 PM are dispatched the same day.', 'Delivery', 'All', 'Bangla', 'Published', 9],
        ['Do you offer cash on delivery?', '["Can I pay when the parcel arrives?","COD available?"]', 'Yes! Cash on delivery is available nationwide with a ৳80 handling fee added to the delivery charge.', 'Payments', 'All', 'Mixed', 'Published', 8],
        ['What is your return policy?', '["How do I return a product?"]', 'Unused items can be returned within 7 days of delivery. Keep the original packaging and share your order ID with our team to start the return.', 'Returns', 'All', 'English', 'Published', 8],
        ['Are your sarees authentic jamdani?', '["Original jamdani ki na?"]', 'Every jamdani is handwoven by our partner artisans in Narayanganj and comes with an authenticity card signed by the weaving cooperative.', 'Products', 'All', 'Mixed', 'Published', 7],
        ['Do you ship outside Bangladesh?', '["International shipping?"]', 'Yes, we ship worldwide via DHL. International delivery takes 7–12 working days and shipping is calculated at checkout.', 'Delivery', 'Website', 'English', 'Draft', 5],
    ];
    foreach ($faqs as $i => $f) {
        Database::insert('faqs', [
            'id' => Util::id('faq'), 'tenant_id' => $loom,
            'question' => $f[0], 'alternative_questions' => Database::json($f[1]),
            'approved_answer' => $f[2], 'category' => $f[3], 'applicable_channel' => $f[4],
            'language' => $f[5], 'status' => $f[6], 'priority' => $f[7],
            'review_date' => date('Y-m-d', strtotime('+2 months')),
            'created_at' => date('Y-m-d H:i:s', strtotime('-' . (10 + $i) . ' days')),
        ]);
    }

    $policies = [
        ['Returns & Exchanges Policy', 'Returns and exchanges', 'Customers may return unused items within 7 days of delivery with original packaging. Damaged-on-arrival items are replaced free of charge once photos are verified.', ['Custom saree orders are non-returnable unless defective.', 'Refunds processed to bKash/Nagad within 3 working days after QC.'], 'Published', 'Approved', '2.1', 'Rafiq Islam'],
        ['Delivery & Shipping Policy', 'Delivery and shipping', 'Orders inside Dhaka are delivered within 48 hours; outside Dhaka within 72 hours via Sundarban/SA Paribahan. Fees: Dhaka ৳70, outside ৳130. COD available with ৳80 fee.', ['Remote hill districts may take +2 days.', 'Free delivery on prepaid orders above ৳5000.'], 'Published', 'Approved', '1.8', 'Sajedur Rahman'],
        ['Refund Policy', 'Refunds', 'Full refunds are issued when an item is out of stock after payment or cancelled before dispatch. Partial refunds apply to delayed deliveries by customer choice.', ['Refund window: within 7 days of cancellation.', 'Gateway fees are non-refundable for bank transfers.'], 'Under Review', 'Pending Approval', '1.2', null],
        ['Privacy & Customer Data', 'Privacy and customer data', 'We store customer contact details only to fulfil orders and support chats. Data is never sold. Customers may request erasure via support.', ['Voice notes are purged after 90 days.', 'PII exports require admin approval and are audit-logged.'], 'Published', 'Approved', '1.0', 'Sajedur Rahman'],
    ];
    foreach ($policies as $i => $p) {
        Database::insert('business_policies', [
            'id' => Util::id('pol'), 'tenant_id' => $loom,
            'name' => $p[0], 'category' => $p[1], 'full_text' => $p[2],
            'rules_and_exceptions' => Database::json($p[3]),
            'effective_date' => date('Y-m-d', strtotime('-60 days')),
            'permanent' => 1, 'review_date' => date('Y-m-d', strtotime('+1 month')),
            'publication_status' => $p[4], 'approval_status' => $p[5], 'version' => $p[6],
            'last_approved_by' => $p[7], 'created_at' => date('Y-m-d H:i:s', strtotime('-' . (20 + $i * 5) . ' days')),
            'updated_at' => date('Y-m-d H:i:s', strtotime('-' . (20 + $i * 5) . ' days')),
        ]);
    }

    $products = [
        ['SKU-JAM-001', 'Nakshi Jamdani Saree — Deep Green', 'Handwoven pure muslin jamdani with traditional nakshi motifs, woven over 3 weeks by master artisans.', 'Sarees', ['Deep Green', 'Maroon', 'Off-white'], 18500, 0, 'In Stock', 12],
        ['SKU-JAM-002', 'Half Silk Jamdani Saree — Rose', 'Lightweight half-silk jamdani perfect for daily and festive wear.', 'Sarees', ['Rose', 'Sky'], 7800, 6900, 'Low Stock', 4],
        ['SKU-STL-010', 'Block Print Cotton Stole', 'Hand block-printed cotton stole, azo-free dyes, 2m length.', 'Stoles', ['Indigo', 'Mustard'], 1450, 0, 'In Stock', 38],
        ['SKU-PRJ-005', 'Nakshi Kantha Throw — Queen', 'Reversible kantha-stitched throw blanket from Jessore artisans.', 'Home', ['Natural', 'Red'], 4200, 0, 'Out of Stock', 0],
        ['SKU-BGL-003', 'Leather Craft Handbag — Tan', 'Full-grain leather handbag handcrafted in Dhaka tannery co-op.', 'Bags', ['Tan', 'Black'], 3600, 0, 'In Stock', 17],
        ['SKU-SET-021', 'Festive Gift Set — Saree + Stole', 'Curated gift box with jamdani saree and matching block-print stole.', 'Gift Sets', ['Assorted'], 8500, 7650, 'In Stock', 9],
    ];
    foreach ($products as $i => $p) {
        Database::insert('products', [
            'id' => Util::id('prd'), 'tenant_id' => $loom,
            'sku' => $p[0], 'name' => $p[1], 'description' => $p[2], 'category' => $p[3],
            'variants' => Database::json($p[4]), 'price' => $p[5],
            'discounted_price' => $p[6] > 0 ? $p[6] : null,
            'inventory_status' => $p[7], 'stock_count' => $p[8],
            'currency' => 'BDT', 'is_active' => 1,
            'warranty_info' => 'Authenticity card included',
            'created_at' => date('Y-m-d H:i:s', strtotime('-' . (15 + $i * 3) . ' days')),
        ]);
    }

    // --------------------------------------------------- customers & conversations
    $customers = [
        ['cst_riya', 'Riya Akter', '+880 1712-984210', 'riya.akter@gmail.com', 'Dhaka', 'wa_8801712984210', 'whatsapp', 'Bangla', 'Prefers Sundarban Courier for outside Dhaka. Requested fast response on damaged shipment.', 3, 32400],
        ['cst_imran', 'Imran Hossain', null, 'imran.hossain99@gmail.com', 'Chattogram', 'fb_9281740124', 'messenger', 'English', 'Regular ecommerce customer. Usually pays via bKash Merchant.', 5, 52100],
        ['cst_shapla', 'Shapla Khatun', '+880 1911-332211', null, 'Sylhet', 'wa_8801911332211', 'whatsapp', 'Bangla', 'Inquiring about stock and express 24h delivery.', 1, 7800],
        ['cst_tanvir_c', 'Tanvir Chowdhury', null, 'tanvir.c@outlook.com', 'Dhaka', 'fb_1029384756', 'messenger', 'English', 'Asking about wholesale discount for 50 pieces.', 0, 0],
        ['cst_mitul', 'Mitul Das', '+880 1521-445566', null, 'Khulna', 'wa_8801521445566', 'whatsapp', 'Bangla', 'Customer sent a voice note with background noise.', 2, 15600],
        ['cst_sumi', 'Sumaiya Islam', '+880 1788-123456', null, 'Rajshahi', 'wa_8801788123456', 'whatsapp', 'Banglish', 'Inquired about Cash on Delivery policy.', 1, 18500],
    ];
    foreach ($customers as $c) {
        Database::insert('customers', [
            'id' => $c[0], 'tenant_id' => $loom, 'name' => $c[1], 'phone' => $c[2], 'email' => $c[3],
            'city' => $c[4], 'external_id' => $c[5], 'channel' => $c[6], 'language' => $c[7],
            'memory_notes' => $c[8], 'total_orders' => $c[9], 'total_spent' => $c[10],
            'created_at' => date('Y-m-d H:i:s', strtotime('-20 days')),
            'last_active_at' => date('Y-m-d H:i:s', strtotime('-3 hours')),
        ]);
        if ($c[9] > 0) {
            $orderItems = ['Nakshi Jamdani Saree', 'Block Print Cotton Stole', 'Leather Craft Handbag', 'Festive Gift Set'][array_rand([0, 1, 2, 3])];
            Database::insert('customer_orders', [
                'id' => Util::id('ord'), 'tenant_id' => $loom, 'customer_id' => $c[0],
                'external_order_id' => 'BL-' . random_int(10000, 99999),
                'items' => $orderItems,
                'amount' => round($c[10] / max(1, $c[9]), 2),
                'status' => ['Delivered', 'Shipped', 'Processing'][array_rand([0, 1, 2])],
                'ordered_at' => date('Y-m-d H:i:s', strtotime('-' . random_int(2, 15) . ' days')),
            ]);
        }
    }

    $convs = [
        ['cnv_riya_01', 'cst_riya', 'whatsapp', 'needs_human', 'urgent', 'paused', 'Damaged shipment complaint', 'Riya Akter', 'Sent a photo of the damaged saree corner', 'medium', ['damaged', 'priority']],
        ['cnv_imran_01', 'cst_imran', 'messenger', 'ai_handling', 'medium', 'active', null, 'Imran Hossain', 'Sounds great, how do I order the rose one?', 'low', []],
        ['cnv_shapla_01', 'cst_shapla', 'whatsapp', 'waiting', 'high', 'paused', 'Transferred to Sales Escalation', 'Shapla Khatun', 'Accha bulk order korle koto discount dibe?', 'medium', ['bulk']],
        ['cnv_tanvir_01', 'cst_tanvir_c', 'messenger', 'ai_handling', 'low', 'active', null, 'Tanvir Chowdhury', 'Do you offer wholesale pricing for 50 pieces?', 'low', ['wholesale']],
        ['cnv_mitul_01', 'cst_mitul', 'whatsapp', 'needs_human', 'medium', 'human_controlled', 'Voice note unclear — staff review', 'Mitul Das', 'Voice note (12s) — unclear audio', 'low', ['audio']],
        ['cnv_sumi_01', 'cst_sumi', 'whatsapp', 'resolved', 'low', 'active', null, 'Sumaiya Islam', 'Thank you! Understood the COD policy.', 'low', []],
    ];
    $convTimes = ['-2 hours', '-5 hours', '-1 day', '-1 day', '-3 hours', '-6 days'];
    foreach ($convs as $i => $cv) {
        Database::insert('conversations', [
            'id' => $cv[0], 'tenant_id' => $loom, 'customer_id' => $cv[1], 'channel' => $cv[2],
            'status' => $cv[3], 'priority' => $cv[4], 'ai_status' => $cv[5],
            'handover_reason' => $cv[6], 'unread_count' => $cv[3] === 'needs_human' ? 2 : 0,
            'assigned_staff_id' => $cv[3] === 'needs_human' ? 'usr_03' : null,
            'assigned_team_id' => $cv[0] === 'cnv_shapla_01' ? Database::scalar("SELECT id FROM teams WHERE tenant_id = :t AND name = 'Sales Escalation'", ['t' => $loom]) : null,
            'tags' => Database::json($cv[10]),
            'last_message_preview' => $cv[8],
            'last_message_at' => date('Y-m-d H:i:s', strtotime($convTimes[$i])),
            'created_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 2) . ' days')),
        ]);
    }

    $messages = [
        // riya (damaged parcel) — full thread
        ['cnv_riya_01', 'customer', 'Riya Akter', 'Assalamu alaikum, amar parcel er ek corner fata gese! Photo pathachhi.', '-3 hours'],
        ['cnv_riya_01', 'ai', 'AI Assistant', 'Walaikum assalam Riya! Apnar jonne khub dukkhito. Photo peyechi — courier er damage ta dekhte pachhi. Ektu apnar order ID ta dile ami shongonge replacement er byabostha kore dibo.', '-2.9 hours'],
        ['cnv_riya_01', 'customer', 'Riya Akter', 'Order ID: BL-45123. Joldi replacement chaite pari?', '-2.8 hours'],
        ['cnv_riya_01', 'ai', 'AI Assistant', 'Order BL-45123 peyechi. Apni chinta korben na — damaged item fully replace hobe, kono kharcha chara. Staff review sesh hole kalke prothom light e dispatch hoye jabe.', '-2.7 hours'],
        ['cnv_riya_01', 'system', 'System', 'Handover rule triggered: damaged item replacement needs human confirmation.', '-2.65 hours'],
        // imran (product question)
        ['cnv_imran_01', 'customer', 'Imran Hossain', 'Hi! Is the Half Silk Jamdani in Rose still available?', '-5.2 hours'],
        ['cnv_imran_01', 'ai', 'AI Assistant', "Hi Imran! Yes — the Half Silk Jamdani in Rose is in stock, currently on offer at ৳6,900 (was ৳7,800). It's a lightweight weave, great for daily and festive wear. Would you like to order one?", '-5.15 hours'],
        ['cnv_imran_01', 'customer', 'Imran Hossain', 'Sounds great, how do I order the rose one?', '-5 hours'],
        ['cnv_imran_01', 'ai', 'AI Assistant', 'Easy! Share your delivery address and phone number, and I will place the order with Cash on Delivery (৳80 COD fee) or bKash prepay. Which would you prefer?', '-4.95 hours'],
        // shapla (bulk) — waiting with team
        ['cnv_shapla_01', 'customer', 'Shapla Khatun', 'Accha bulk order korle koto discount dibe?', '-1.2 days'],
        ['cnv_shapla_01', 'ai', 'AI Assistant', 'Bulk quantity te special rate ache apnar jonno! Koto piece nite chan? 20+ piece hole 10% ar 50+ hole 15% Giovanni discount apply hoy. Details er jonno team ke connect kore dilam.', '-1.1 days'],
        ['cnv_shapla_01', 'system', 'System', 'Transferred to team Sales Escalation — bulk pricing request.', '-1.05 days'],
        // tanvir wholesale
        ['cnv_tanvir_01', 'customer', 'Tanvir Chowdhury', 'Do you offer wholesale pricing for 50 pieces?', '-1.1 days'],
        ['cnv_tanvir_01', 'ai', 'AI Assistant', "Yes we do! For 50+ pieces our wholesale rate is 15% off retail, with dedicated invoicing and shipped in one consignment. Could you share which designs you're interested in so I can check current stock?", '-1.05 days'],
        // mitul voice note
        ['cnv_mitul_01', 'customer', 'Mitul Das', '[Voice note: 12 seconds]', '-3.2 hours'],
        ['cnv_mitul_01', 'system', 'System', 'Voice note transcription failed: audio too noisy.', '-3.19 hours'],
        ['cnv_mitul_01', 'staff', 'Anika Tabassum', 'Mitul bhai, apnar voice ta poriskar lagchen na. Ektu likhe dile onek helpful hobe — apni ki jante chan?', '-3.1 hours'],
        // sumi resolved
        ['cnv_sumi_01', 'customer', 'Sumaiya Islam', 'Cash on delivery ache ki?', '-6.1 days'],
        ['cnv_sumi_01', 'ai', 'AI Assistant', 'Ji ache! Desh er shob jaygay cash on delivery available, matro ৳80 handling fee sathe. Apni order korle delivery er shomoy tika pay korte parben.', '-6.05 days'],
        ['cnv_sumi_01', 'customer', 'Sumaiya Islam', 'Thank you! Understood the COD policy.', '-6 days'],
    ];
    foreach ($messages as $m) {
        Database::insert('messages', [
            'id' => Util::id('msg'), 'tenant_id' => $loom, 'conversation_id' => $m[0],
            'sender' => $m[1], 'sender_name' => $m[2], 'text' => $m[3],
            'delivery_state' => $m[1] === 'customer' ? 'read' : 'sent',
            'created_at' => date('Y-m-d H:i:s', strtotime($m[4])),
        ]);
    }
    Database::insert('failed_cases', [
        'id' => Util::id('fc'), 'tenant_id' => $loom, 'conversation_id' => 'cnv_mitul_01',
        'customer_name' => 'Mitul Das', 'channel' => 'whatsapp',
        'snippet' => 'Voice note (12s) — unclear audio', 'reason' => 'Voice transcription failed (noisy audio)',
        'confidence' => 0.22, 'status' => 'failed_audio',
        'created_at' => date('Y-m-d H:i:s', strtotime('-3 hours')),
    ]);

    $canned = [
        ['Delivery time inside Dhaka', 'Inside Dhaka delivery completes within 24–48 hours via our courier partner.'],
        ['COD explanation', 'Cash on delivery is available nationwide with a ৳80 handling fee.'],
        ['Return instructions', 'Unused items can be returned within 7 days — please keep the original packaging.'],
        ['Thanks for reaching out', 'Thanks for reaching out! We will get back to you shortly.'],
    ];
    foreach ($canned as $c) {
        Database::insert('canned_replies', [
            'id' => Util::id('cnd'), 'tenant_id' => $loom, 'title' => $c[0], 'text' => $c[1], 'is_approved' => 1,
        ]);
    }

    // ------------------------------------------------------- billing (loom)
    foreach ([
        ['INV-2026-0031', '-35 days', 'Sep 2026', 'paid', 'bKash Merchant', 'bkash_trx_9812'],
        ['INV-2026-0044', '-5 days', 'Oct 2026', 'paid', 'Card (Visa)', 'card_trx_2231'],
    ] as $inv) {
        Database::insert('invoices', [
            'id' => Util::id('inv'), 'tenant_id' => $loom,
            'invoice_number' => $inv[0],
            'date' => date('Y-m-d', strtotime($inv[1])),
            'billing_period' => $inv[2],
            'amount_usd' => 79.00, 'amount_bdt' => 9676.00,
            'status' => $inv[3], 'payment_method' => $inv[4], 'download_url' => '/invoices/' . $inv[0] . '.pdf',
        ]);
    }
    Database::insert('wallet_transactions', [
        'id' => Util::id('wtx'), 'tenant_id' => $loom, 'type' => 'topup',
        'amount' => 25000, 'currency' => 'BDT', 'amount_usd' => 204.08,
        'gateway' => 'bKash Merchant', 'reference' => 'TRX8891', 'description' => 'Monthly wallet top-up',
        'created_at' => date('Y-m-d H:i:s', strtotime('-20 days')),
    ]);
    Database::insert('wallet_transactions', [
        'id' => Util::id('wtx'), 'tenant_id' => $loom, 'type' => 'charge',
        'amount' => -500, 'currency' => 'BDT', 'amount_usd' => 4.08,
        'description' => 'AI message charges (200 messages)',
        'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
    ]);

    // ---------------------------------------------------- notifications & activity
    foreach ([
        ['Handover: Riya Akter needs attention', 'Damaged shipment replacement needs staff confirmation.', 'urgent', 'Inbox', '-2.6 hours'],
        ['WhatsApp nearing tier limit', 'Messaging tier 76% used for today.', 'warning', 'Channels', '-40 minutes'],
        ['Knowledge source outdated', 'Website Help Center pages need re-crawl.', 'warning', 'Knowledge', '-1 day'],
    ] as $n) {
        Database::insert('notifications', [
            'id' => Util::id('ntf'), 'tenant_id' => $loom, 'title' => $n[0], 'message' => $n[1],
            'type' => $n[2], 'source_module' => $n[3],
            'created_at' => date('Y-m-d H:i:s', strtotime($n[4])),
        ]);
    }
    foreach ([
        ['staff_takeover', 'Staff took over AI', 'Anika Tabassum took over the Mitul Das conversation.', 'Anika Tabassum', '-3.1 hours'],
        ['connection_event', 'WhatsApp reconnected', 'WhatsApp Cloud API quality rating back to GREEN.', 'System', '-2 hours'],
        ['knowledge_update', 'Catalogue synced', 'Product Catalogue Autumn 2026 re-indexed (48 chunks).', 'System', '-1 day'],
        ['rule_triggered', 'Handover rule triggered', 'Damaged item replacement rule fired for Riya Akter.', 'AI Agent', '-2.65 hours'],
    ] as $a) {
        Database::insert('activity_logs', [
            'id' => Util::id('act'), 'tenant_id' => $loom, 'type' => $a[0], 'title' => $a[1],
            'description' => $a[2], 'actor' => $a[3],
            'created_at' => date('Y-m-d H:i:s', strtotime($a[4])),
        ]);
    }

    // ------------------------------------------------------- escalation rules
    foreach ([
        ['human_attention_requested', 'Staff attention requested', 'AI or customer requests human help', '5 minutes', 'notify_staff', ['in_app', 'whatsapp'], 'admin'],
        ['customer_waiting_timeout', 'Customer waiting timeout', 'No staff reply within SLA after handover', '5 minutes', 'escalate_supervisor', ['in_app', 'email'], 'admin'],
        ['channel_disconnected', 'Channel disconnected', 'Messenger or WhatsApp connection lost', 'Critical', 'page_engineer', ['in_app'], 'admin'],
        ['usage_threshold_reached', 'Usage threshold reached', 'Plan usage above 80%', '80%', 'notify_staff', ['in_app', 'email'], 'admin'],
    ] as $er) {
        Database::insert('escalation_rules', [
            'id' => Util::id('esc'), 'tenant_id' => $loom,
            'trigger_type' => $er[0], 'name' => $er[1], 'description' => $er[2],
            'threshold_value' => $er[3], 'action' => $er[4],
            'notify_channels' => Database::json($er[5]), 'assigned_role' => $er[6],
        ]);
    }

    // ------------------------------------------------------------- admin actions
    foreach ([
        ['Invited Member (agent)', 'Nusrat Jahan (+880 1714-778899)', 'Granted agent role', '-9 days'],
        ['Updated Team Member', 'Farhan Kabir (+880 1715-112233)', 'Changed role to analyst', '-5 days'],
        ['Revoked All Sessions', null, 'Signed out all other users/sessions', '-2 days'],
    ] as $aa) {
        Database::insert('admin_actions', [
            'id' => Util::id('act'), 'tenant_id' => $loom, 'actor_user_id' => 'usr_01',
            'actor_name' => 'Sajedur Rahman', 'actor_phone' => '+880 1711-000001',
            'action' => $aa[0], 'target_user' => $aa[1], 'details' => $aa[2],
            'ip_address' => '103.114.98.42',
            'created_at' => date('Y-m-d H:i:s', strtotime($aa[3])),
        ]);
    }

    // ----------------------------------------------------------- usage rollups
    foreach ($convs as $i => $cv) {
        $day = date('Y-m-d', strtotime('-' . ($i + 1) . ' days'));
        Database::insert('chart_daily_stats', [
            'tenant_id' => $loom, 'stat_date' => $day,
            'total_conversations' => random_int(3, 12), 'ai_handled' => random_int(2, 9),
            'human_handled' => random_int(0, 3), 'messenger_msgs' => random_int(5, 30), 'whatsapp_msgs' => random_int(10, 60),
        ]);
    }

    // index knowledge chunks for retrieval (uses the embedding pipeline)
    $srcRow = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => 'ks_faq_01']);
    $faqCorpus = '';
    foreach (Database::fetchAll('SELECT question, approved_answer FROM faqs WHERE tenant_id = :t', ['t' => $loom]) as $f) {
        $faqCorpus .= 'Q: ' . $f['question'] . "\nA: " . $f['approved_answer'] . "\n\n";
    }
    KnowledgeService::indexSource($loom, $srcRow, $faqCorpus, 'Customer FAQ Master Sheet');

    $srcRow = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => 'ks_pol_01']);
    $polCorpus = '';
    foreach (Database::fetchAll('SELECT name, full_text FROM business_policies WHERE tenant_id = :t', ['t' => $loom]) as $p) {
        $polCorpus .= $p['name'] . "\n" . $p['full_text'] . "\n\n";
    }
    KnowledgeService::indexSource($loom, $srcRow, $polCorpus, 'Delivery & Returns Policy');

    $srcRow = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => 'ks_cat_01']);
    $prodCorpus = '';
    foreach (Database::fetchAll('SELECT name, description, price, inventory_status FROM products WHERE tenant_id = :t', ['t' => $loom]) as $p) {
        $prodCorpus .= $p['name'] . ' — ' . $p['description'] . " Price: ৳{$p['price']} ({$p['inventory_status']})\n\n";
    }
    KnowledgeService::indexSource($loom, $srcRow, $prodCorpus, 'Product Catalogue Autumn 2026');

    Database::update('knowledge_sources', ['chunks_count' => 11], 'id = :id', ['id' => 'ks_faq_01']);

    $say('Demo dataset seeded (login +880 1711-000001 / password123, ingest key ak_demo_ten_loom_01)');
    return $report;
}
