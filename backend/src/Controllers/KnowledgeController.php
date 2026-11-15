<?php
declare(strict_types=1);

/**
 * KnowledgePage: sources (+index), FAQs, policies (+approve), product
 * catalogue, brand identity, training jobs, knowledge testing.
 */
final class KnowledgeController
{
    // ------------------------------------------------------------- sources
    public static function sources(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT * FROM knowledge_sources WHERE tenant_id = :t ORDER BY created_at DESC', ['t' => $tenantId]);
        Response::json(['sources' => array_map([self::class, 'shapeSource'], $rows)]);
    }

    public static function createSource(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'type' => 'required|in:website,document,faq,catalogue,manual,sheets']);

        $sourceUrl = (string)($data['sourceUrl'] ?? ($data['url'] ?? ''));
        if (in_array($data['type'], ['website','sheets'], true) && $sourceUrl === '') Response::error('A source URL is required',422);
        $content = trim((string)($data['content'] ?? ''));
        if (strlen($content) > 2 * 1024 * 1024) Response::error('Knowledge text exceeds the 2MB indexing limit',422);
        if ($content === '' && in_array($data['type'], ['website','sheets'], true)) {
            if ($data['type']==='sheets') $sourceUrl=self::googleSheetCsvUrl($sourceUrl);
            $content=self::fetchPublicText($sourceUrl, $data['type']==='website');
        }
        if ($content === '' && in_array($data['type'], ['document','catalogue'], true) && $sourceUrl !== '') $content=self::readUploadedText($sourceUrl);
        if (in_array($data['type'], ['website','sheets','document','catalogue','manual'], true) && $content === '') Response::error('This source did not contain supported text to index',422);

        $id = Util::id('ks');
        Database::insert('knowledge_sources', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'type' => $data['type'],
            'status' => 'queued',
            'source_url' => $sourceUrl ?: null,
            'origin_details' => $data['originDetails'] ?? null,
            'source_content' => $data['type'] === 'manual' ? $content : null,
            'last_content_update' => Database::now(),
        ]);

        // Auto-create indexing job
        if ($content !== '') {
            $trainingJobId=Util::id('tj');
            Database::insert('training_jobs',['id'=>$trainingJobId,'tenant_id'=>$tenantId,'source_id'=>$id,'source_name'=>$data['name'],'job_type'=>'Initial Indexing','status'=>'queued','total_documents'=>1]);
            JobDispatcher::dispatch('training_job', [
                'sourceId' => $id,
                'content' => $content,
                'trainingJobId' => $trainingJobId,
                'jobType' => 'Initial Indexing',
            ], $tenantId, 3);
        }

        AuditService::log($tenantId, 'knowledge_reindexed', 'Knowledge source added', 'Added source ' . $data['name'], 'success', ['target' => $id], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'knowledge_update', 'Knowledge source added', $data['name'], $ctx->user['name']);
        $row = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => $id]);
        Response::json(['source' => self::shapeSource($row)], 201);
    }

    public static function updateSource(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findSource($tenantId, $req->params['id']);
        $data = Validator::sanitizePayload($req->all());
        $update = [];
        if (isset($data['name'])) $update['name'] = $data['name'];
        if (isset($data['sourceUrl']) || isset($data['url'])) $update['source_url'] = $data['sourceUrl'] ?? $data['url'];
        if (isset($data['originDetails'])) $update['origin_details'] = $data['originDetails'];
        if (isset($data['isActive'])) $update['is_active'] = Validator::bool($data, 'isActive') ? 1 : 0;
        if (isset($data['status']) && in_array($data['status'], ['ready', 'processing', 'queued', 'failed', 'outdated'], true)) {
            $update['status'] = $data['status'];
        }
        Database::update('knowledge_sources', $update, 'id = :id', ['id' => $row['id']]);
        $row = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => $row['id']]);
        Response::json(['source' => self::shapeSource($row)]);
    }

    public static function deleteSource(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findSource($tenantId, $req->params['id']);
        Database::delete('knowledge_sources', 'id = :id', ['id' => $row['id']]);
        AuditService::log($tenantId, 'knowledge_reindexed', 'Knowledge source deleted', 'Removed source ' . $row['name'], 'success', ['target' => $row['id']], $ctx->userId(), $req);
        Response::json(['ok' => true]);
    }

    public static function reindexSource(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findSource($tenantId, $req->params['id']);
        $content = (string) $req->input('content', '');
        if ($content === '') {
            // Re-derive content from linked knowledge (FAQs, products, policies)
            $content = self::deriveContent($tenantId, $row);
        }
        if ($content === '') Response::error('Provide content to index for this source', 422);

        Database::update('knowledge_sources', ['status' => 'processing'], 'id = :id', ['id' => $row['id']]);
        $trainingJobId=Util::id('tj');
        Database::insert('training_jobs',['id'=>$trainingJobId,'tenant_id'=>$tenantId,'source_id'=>$row['id'],'source_name'=>$row['name'],'job_type'=>'Re-index','status'=>'queued','total_documents'=>1]);
        $jobId = JobDispatcher::dispatch('reindex_document', ['sourceId' => $row['id'], 'content' => $content, 'trainingJobId'=>$trainingJobId,'jobType' => 'Re-index'], $tenantId, 3);
        Response::json(['ok' => true, 'jobId' => $jobId, 'status' => 'processing']);
    }

    // ---------------------------------------------------------------- faqs
    public static function faqs(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM faqs WHERE tenant_id = :t ORDER BY priority DESC, created_at DESC', ['t' => $tenantId]);
        Response::json(['faqs' => array_map([self::class, 'shapeFaq'], $rows)]);
    }

    public static function createFaq(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['question' => 'required', 'approvedAnswer' => 'required']);
        $id = Util::id('faq');
        $channel = $data['applicableChannel'] ?? 'All';
        $lang = $data['language'] ?? 'Bangla';
        $faqStatus = $data['status'] ?? 'Draft';
        Database::insert('faqs', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'question' => $data['question'],
            'alternative_questions' => Database::json($data['alternativeQuestions'] ?? []),
            'approved_answer' => $data['approvedAnswer'],
            'category' => $data['category'] ?? null,
            'applicable_channel' => in_array($channel, ['All', 'WhatsApp', 'Messenger', 'Website'], true) ? $channel : 'All',
            'language' => in_array($lang, ['Bangla', 'English', 'Mixed'], true) ? $lang : 'Bangla',
            'status' => in_array($faqStatus, ['Published', 'Draft', 'Archived'], true) ? $faqStatus : 'Draft',
            'priority' => Validator::int($data['priority'] ?? 5, 5),
            'review_date' => $data['reviewDate'] ?? null,
            'internal_notes' => $data['internalNotes'] ?? null,
        ]);
        Response::json(['faq' => self::shapeFaq(Database::fetchOne('SELECT * FROM faqs WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateFaq(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findRow('faqs', $tenantId, $req->params['id']);
        $data = Validator::sanitizePayload($req->all());
        $map = [
            'question' => 'question', 'approvedAnswer' => 'approved_answer', 'category' => 'category',
            'applicableChannel' => 'applicable_channel', 'language' => 'language', 'status' => 'status',
            'priority' => 'priority', 'reviewDate' => 'review_date', 'internalNotes' => 'internal_notes',
        ];
        $update = [];
        foreach ($map as $in => $col) if (isset($data[$in])) $update[$col] = $data[$in];
        if (isset($data['alternativeQuestions']) && is_array($data['alternativeQuestions'])) {
            $update['alternative_questions'] = Database::json($data['alternativeQuestions']);
        }
        Database::update('faqs', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['faq' => self::shapeFaq(Database::fetchOne('SELECT * FROM faqs WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteFaq(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        self::findRow('faqs', $tenantId, $req->params['id']);
        Database::delete('faqs', 'id = :id', ['id' => $req->params['id']]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------ policies
    public static function policies(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM business_policies WHERE tenant_id = :t ORDER BY updated_at DESC', ['t' => $tenantId]);
        Response::json(['policies' => array_map([self::class, 'shapePolicy'], $rows)]);
    }

    public static function createPolicy(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'category' => 'required', 'fullText' => 'required']);
        $id = Util::id('pol');
        Database::insert('business_policies', [
            'id' => $id, 'tenant_id' => $tenantId,
            'name' => $data['name'], 'category' => $data['category'], 'full_text' => $data['fullText'],
            'rules_and_exceptions' => Database::json($data['rulesAndExceptions'] ?? []),
            'effective_date' => $data['effectiveDate'] ?? date('Y-m-d'),
            'permanent' => Validator::bool($data, 'permanent'),
            'review_date' => $data['reviewDate'] ?? null,
            'publication_status' => in_array(($publicationStatusVal = $data['publicationStatus'] ?? 'Draft'), ['Published', 'Draft', 'Under Review'], true) ? $publicationStatusVal : 'Draft',
            'approval_status' => in_array(($approvalStatusVal = $data['approvalStatus'] ?? 'Pending Approval'), ['Approved', 'Pending Approval'], true) ? $approvalStatusVal : 'Pending Approval',
            'version' => (string) ($data['version'] ?? '1.0'),
            'last_approved_by' => $data['lastApprovedBy'] ?? null,
        ]);
        AuditService::log($tenantId, 'policy_published', 'Policy created', 'Created policy ' . $data['name'], 'success', ['target' => $id], $ctx->userId(), $req);
        Response::json(['policy' => self::shapePolicy(Database::fetchOne('SELECT * FROM business_policies WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updatePolicy(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findRow('business_policies', $tenantId, $req->params['id']);
        $data = Validator::sanitizePayload($req->all());
        $map = [
            'name' => 'name', 'category' => 'category', 'fullText' => 'full_text',
            'effectiveDate' => 'effective_date', 'reviewDate' => 'review_date',
            'publicationStatus' => 'publication_status', 'approvalStatus' => 'approval_status',
            'version' => 'version', 'lastApprovedBy' => 'last_approved_by',
        ];
        $update = [];
        foreach ($map as $in => $col) if (isset($data[$in])) $update[$col] = $data[$in];
        if (isset($data['permanent'])) $update['permanent'] = Validator::bool($data, 'permanent') ? 1 : 0;
        if (isset($data['rulesAndExceptions']) && is_array($data['rulesAndExceptions'])) {
            $update['rules_and_exceptions'] = Database::json($data['rulesAndExceptions']);
        }
        Database::update('business_policies', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['policy' => self::shapePolicy(Database::fetchOne('SELECT * FROM business_policies WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function approvePolicy(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('publish_policies');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findRow('business_policies', $tenantId, $req->params['id']);
        Database::update('business_policies', [
            'approval_status' => 'Approved',
            'publication_status' => 'Published',
            'last_approved_by' => $ctx->user['name'],
        ], 'id = :id', ['id' => $row['id']]);
        AuditService::log($tenantId, 'policy_published', 'Policy published', 'Published policy ' . $row['name'], 'success', ['target' => $row['id']], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'rule_triggered', 'Policy published', $row['name'], $ctx->user['name']);
        Response::json(['policy' => self::shapePolicy(Database::fetchOne('SELECT * FROM business_policies WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deletePolicy(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        self::findRow('business_policies', $tenantId, $req->params['id']);
        Database::delete('business_policies', 'id = :id', ['id' => $req->params['id']]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------ products
    public static function products(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT * FROM products WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 500', ['t' => $tenantId]);
        Response::json(['products' => array_map([self::class, 'shapeProduct'], $rows)]);
    }

    public static function createProduct(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'sku' => 'required']);
        if (Database::fetchOne('SELECT id FROM products WHERE tenant_id = :t AND sku = :s', ['t' => $tenantId, 's' => $data['sku']])) {
            Response::error('A product with this SKU already exists', 422);
        }
        $id = Util::id('prd');
        Database::insert('products', [
            'id' => $id, 'tenant_id' => $tenantId,
            'sku' => $data['sku'], 'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? null,
            'variants' => Database::json($data['variants'] ?? []),
            'price' => Validator::float($data['price'] ?? 0),
            'currency' => (string) ($data['currency'] ?? 'BDT'),
            'discounted_price' => isset($data['discountedPrice']) ? Validator::float($data['discountedPrice']) : null,
            'inventory_status' => in_array(($inventoryStatusVal = $data['inventoryStatus'] ?? 'In Stock'), ['In Stock', 'Low Stock', 'Out of Stock', 'Live API Verified'], true) ? $inventoryStatusVal : 'In Stock',
            'stock_count' => Validator::int($data['stockCount'] ?? 0),
            'image_url' => $data['imageUrl'] ?? null,
            'image_urls' => Database::json($data['imageUrls'] ?? []),
            'shipping_restrictions' => $data['shippingRestrictions'] ?? null,
            'warranty_info' => $data['warrantyInfo'] ?? null,
            'product_url' => $data['productUrl'] ?? null,
            'is_active' => Validator::bool($data, 'isActive', true) ? 1 : 0,
        ]);
        Response::json(['product' => self::shapeProduct(Database::fetchOne('SELECT * FROM products WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateProduct(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findRow('products', $tenantId, $req->params['id']);
        $data = Validator::sanitizePayload($req->all());
        $map = ['name', 'description', 'category', 'sku', 'currency', 'inventoryStatus', 'imageUrl', 'shippingRestrictions', 'warrantyInfo', 'productUrl'];
        $snakeMap = ['inventoryStatus' => 'inventory_status', 'imageUrl' => 'image_url', 'shippingRestrictions' => 'shipping_restrictions', 'warrantyInfo' => 'warranty_info', 'productUrl' => 'product_url'];
        $update = [];
        foreach ($map as $f) {
            if (isset($data[$f])) $update[$snakeMap[$f] ?? $f] = $data[$f];
        }
        if (isset($data['price'])) $update['price'] = Validator::float($data['price']);
        if (isset($data['discountedPrice'])) $update['discounted_price'] = Validator::float($data['discountedPrice']);
        if (isset($data['stockCount'])) $update['stock_count'] = Validator::int($data['stockCount']);
        if (isset($data['isActive'])) $update['is_active'] = Validator::bool($data, 'isActive') ? 1 : 0;
        if (isset($data['variants']) && is_array($data['variants'])) $update['variants'] = Database::json($data['variants']);
        if (isset($data['imageUrls']) && is_array($data['imageUrls'])) $update['image_urls'] = Database::json($data['imageUrls']);
        Database::update('products', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['product' => self::shapeProduct(Database::fetchOne('SELECT * FROM products WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteProduct(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        self::findRow('products', $tenantId, $req->params['id']);
        Database::delete('products', 'id = :id', ['id' => $req->params['id']]);
        Response::json(['ok' => true]);
    }

    public static function uploadProductImage(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $file = $req->file('image');
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) Response::error('No image uploaded', 422);
        $url = Uploads::store($file, 'products');
        Response::json(['url' => $url], 201);
    }

    // -------------------------------------------------------- brand identity
    public static function brand(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]);
        if (!$row) {
            $row = ['tenant_id' => $tenantId, 'tagline' => null, 'brand_voice' => null, 'tone_pillars' => null,
                    'preferred_terms' => null, 'forbidden_terms' => null, 'greeting_convention' => null,
                    'cultural_nuances' => null, 'last_updated' => null];
        }
        Response::json(['brand' => self::shapeBrand($row)]);
    }

    public static function updateBrand(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $exists = Database::fetchOne('SELECT tenant_id FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]);
        $update = [];
        foreach (['tagline', 'brandVoice' => 'brand_voice', 'greetingConvention' => 'greeting_convention', 'culturalNuances' => 'cultural_nuances'] as $in => $col) {
            $in = is_int($in) ? $col : $in;
            if (isset($data[$in])) $update[$col] = $data[$in];
        }
        if (isset($data['brandVoice'])) $update['brand_voice'] = $data['brandVoice'];
        if (isset($data['tonePillars']) && is_array($data['tonePillars'])) $update['tone_pillars'] = Database::json($data['tonePillars']);
        if (isset($data['vocabularyGuidelines'])) {
            $vg = $data['vocabularyGuidelines'];
            $update['preferred_terms'] = Database::json($vg['preferredTerms'] ?? []);
            $update['forbidden_terms'] = Database::json($vg['forbiddenTerms'] ?? []);
        }
        if ($exists) {
            Database::update('brand_identity', $update, 'tenant_id = :t', ['t' => $tenantId]);
        } else {
            Database::insert('brand_identity', array_merge(['tenant_id' => $tenantId], $update));
        }
        AuditService::activity($tenantId, 'knowledge_update', 'Brand identity updated', 'Brand identity saved', $ctx->user['name']);
        $row = Database::fetchOne('SELECT * FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]);
        Response::json(['brand' => self::shapeBrand($row)]);
    }

    // ---------------------------------------------------------------- jobs
    public static function jobs(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT * FROM training_jobs WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 100', ['t' => $tenantId]);
        Response::json(['jobs' => array_map([self::class, 'shapeTrainingJob'], $rows)]);
    }

    public static function triggerJob(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = $req->all();
        $sourceId = (string) ($data['sourceId'] ?? '');
        $src = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id AND tenant_id = :t', ['id' => $sourceId, 't' => $tenantId]);
        if (!$src) Response::notFound('Source not found');
        $jobType = in_array(($jobTypeVal = $data['jobType'] ?? ''), ['Initial Indexing', 'Re-index', 'Scheduled Sync', 'Chunk Embeddings'], true) ? $jobTypeVal : 'Re-index';

        $tjId = Util::id('tj');
        Database::insert('training_jobs', [
            'id' => $tjId, 'tenant_id' => $tenantId, 'source_id' => $src['id'], 'source_name' => $src['name'],
            'job_type' => $jobType, 'status' => 'queued', 'total_documents' => 1,
        ]);
        JobDispatcher::dispatch('training_job', ['sourceId' => $src['id'], 'content' => self::deriveContent($tenantId, $src) ?: $src['name'],'trainingJobId'=>$tjId,'jobType'=>$jobType], $tenantId, 3);
        AuditService::log($tenantId, 'knowledge_reindexed', 'Training triggered', "$jobType queued for " . $src['name'], 'success', ['target' => $tjId], $ctx->userId(), $req);
        Response::json(['job' => ['id' => $tjId, 'status' => 'queued']], 201);
    }

    public static function retryJob(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $job = Database::fetchOne('SELECT * FROM training_jobs WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$job) Response::notFound('Training job not found');
        if (!in_array($job['status'], ['failed', 'queued'], true)) Response::error('Only failed or queued training jobs can be retried', 409);
        $source = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id AND tenant_id = :t', ['id' => $job['source_id'], 't' => $tenantId]);
        if (!$source) Response::error('The source for this job no longer exists', 409);
        $content = self::deriveContent($tenantId, $source);
        if ($content === '') {
            $chunks = Database::fetchAll('SELECT chunk_text FROM knowledge_chunks WHERE source_id = :s ORDER BY chunk_index', ['s' => $source['id']]);
            $content = implode("\n\n", array_column($chunks, 'chunk_text'));
        }
        if ($content === '') Response::error('No indexable content is available for this source', 422);
        Database::update('training_jobs', ['status' => 'queued', 'error_message' => null, 'started_at' => null, 'finished_at' => null], 'id = :id', ['id' => $job['id']]);
        Database::update('knowledge_sources', ['status' => 'queued'], 'id = :id', ['id' => $source['id']]);
        JobDispatcher::dispatch('training_job', ['sourceId' => $source['id'], 'content' => $content, 'trainingJobId'=>$job['id'],'jobType'=>'Re-index'], $tenantId, 3);
        Response::json(['ok' => true, 'status' => 'queued']);
    }

    public static function cancelJob(Request $req): void
    {
        $ctx=$req->auth; $ctx->require('edit_knowledge'); $tenantId=$ctx->requireTenantId($req);
        $training=Database::fetchOne("SELECT * FROM training_jobs WHERE id=:id AND tenant_id=:t AND status='queued'",['id'=>$req->params['id'],'t'=>$tenantId]);
        if(!$training) Response::error('Only queued training jobs can be cancelled',409);
        $jobs=Database::fetchAll("SELECT id,payload FROM jobs WHERE tenant_id=:t AND status='pending' AND kind IN ('training_job','reindex_document')",['t'=>$tenantId]);
        $queueJob=null;
        foreach($jobs as $job) if((Database::decodeJson($job['payload'])['trainingJobId']??null)===$training['id']){$queueJob=$job;break;}
        if(!$queueJob) Response::error('This job has already started and can no longer be cancelled',409);
        $claim=Database::run("UPDATE jobs SET status='cancelled',finished_at=:now WHERE id=:id AND status='pending'",['now'=>Database::now(),'id'=>$queueJob['id']]);
        if($claim->rowCount()!==1) Response::error('This job has already started and can no longer be cancelled',409);
        Database::update('training_jobs',['status'=>'cancelled','finished_at'=>Database::now()],'id=:id AND tenant_id=:t',['id'=>$training['id'],'t'=>$tenantId]);
        Response::json(['ok'=>true]);
    }

    // ------------------------------------------------------------- testing
    public static function testCases(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM test_cases WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 100', ['t' => $tenantId]);
        Response::json(['cases' => array_map([self::class, 'shapeTestCase'], $rows)]);
    }

    public static function createTestCase(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['question' => 'required']);
        $id = Util::id('tc');
        Database::insert('test_cases', [
            'id' => $id, 'tenant_id' => $tenantId,
            'question' => $data['question'],
            'expected_answer' => $data['expectedAnswer'] ?? null,
        ]);
        Response::json(['case' => self::shapeTestCase(Database::fetchOne('SELECT * FROM test_cases WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function runTestCase(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findRow('test_cases', $tenantId, $req->params['id']);
        $dry = Orchestrator::dryRun($tenantId, $row['question']);

        $grounded = $dry['sources'] !== [];
        $verdict = 'untested';
        if ($row['expected_answer']) {
            $normExpected = mb_strtolower(trim($row['expected_answer']));
            $normActual = mb_strtolower(trim((string) $dry['reply']));
            similar_text($normExpected, $normActual, $pct);
            $verdict = $pct >= 60 ? 'correct' : ($pct >= 35 ? 'incomplete' : 'incorrect');
        } elseif ($grounded) {
            $verdict = 'correct';
        }

        Database::update('test_cases', [
            'draft_answer' => $dry['reply'],
            'retrieved_sources' => Database::json(array_map(fn($s) => [
                'title' => $s['title'], 'passage' => mb_substr($s['text'], 0, 300), 'relevanceScore' => $s['score'],
            ], $dry['sources'])),
            'is_grounded' => $grounded ? 1 : 0,
            'verdict' => $verdict,
            'tested_at' => Database::now(),
        ], 'id = :id', ['id' => $row['id']]);

        Response::json(['case' => self::shapeTestCase(Database::fetchOne('SELECT * FROM test_cases WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteTestCase(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('edit_knowledge');
        $tenantId = $ctx->requireTenantId($req);
        self::findRow('test_cases', $tenantId, $req->params['id']);
        Database::delete('test_cases', 'id = :id', ['id' => $req->params['id']]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------- helpers
    private static function findSource(string $tenantId, string $id): array
    {
        $row = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$row) Response::notFound('Knowledge source not found');
        return $row;
    }

    private static function findRow(string $table, string $tenantId, string $id): array
    {
        $row = Database::fetchOne("SELECT * FROM $table WHERE id = :id AND tenant_id = :t", ['id' => $id, 't' => $tenantId]);
        if (!$row) Response::notFound('Record not found');
        return $row;
    }

    /** Build corpus text from tenant knowledge for a generic source. */
    public static function deriveContent(string $tenantId, array $src): string
    {
        if (!empty($src['source_content'])) return (string)$src['source_content'];
        if (!empty($src['source_url']) && in_array($src['type'], ['website','sheets'], true)) return self::fetchPublicText((string)$src['source_url'], $src['type']==='website');
        if (!empty($src['source_url']) && in_array($src['type'], ['document','catalogue'], true)) return self::readUploadedText((string)$src['source_url']);
        $parts = [];
        $faqs = Database::fetchAll("SELECT question, approved_answer FROM faqs WHERE tenant_id = :t AND status = 'Published'", ['t' => $tenantId]);
        foreach ($faqs as $f) $parts[] = 'Q: ' . $f['question'] . "\nA: " . $f['approved_answer'];
        $pols = Database::fetchAll("SELECT name, full_text FROM business_policies WHERE tenant_id = :t AND publication_status = 'Published'", ['t' => $tenantId]);
        foreach ($pols as $p) $parts[] = $p['name'] . ': ' . $p['full_text'];
        $prods = Database::fetchAll('SELECT name, description, price, currency FROM products WHERE tenant_id = :t AND is_active = 1', ['t' => $tenantId]);
        foreach ($prods as $p) $parts[] = $p['name'] . ' — ' . ($p['description'] ?? '') . ' (' . $p['price'] . ' ' . $p['currency'] . ')';
        return implode("\n\n", $parts);
    }

    private static function googleSheetCsvUrl(string $url): string
    {
        $parts=parse_url($url); $host=strtolower((string)($parts['host']??''));
        if (!in_array($host,['docs.google.com','www.docs.google.com'],true) || !preg_match('#/spreadsheets/d/([A-Za-z0-9_-]+)#',(string)($parts['path']??''),$match)) Response::error('Use a Google Sheets URL shared for viewer access',422);
        parse_str((string)($parts['query']??''),$query);
        return 'https://docs.google.com/spreadsheets/d/'.$match[1].'/export?'.http_build_query(['format'=>'csv','gid'=>$query['gid']??'0']);
    }

    /** Fetch one public HTML/text page while blocking private IPs, redirects and oversized responses. */
    private static function fetchPublicText(string $url, bool $html): string
    {
        $u=parse_url($url); $scheme=strtolower((string)($u['scheme']??'')); $host=strtolower((string)($u['host']??''));
        if (!in_array($scheme,['http','https'],true) || $host==='' || str_ends_with($host,'.') || isset($u['user']) || isset($u['pass'])) Response::error('Source must be a public HTTP or HTTPS URL',422);
        $ips=filter_var($host,FILTER_VALIDATE_IP)?[$host]:gethostbynamel($host);
        if (!$ips) Response::error('Source host could not be resolved',422);
        foreach($ips as $ip) if(!filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_NO_PRIV_RANGE|FILTER_FLAG_NO_RES_RANGE)) Response::error('Private or reserved network addresses are not allowed',422);
        $ip4=null; foreach($ips as $ip) if(filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_IPV4)){$ip4=$ip;break;}
        if(!$ip4) Response::error('Source host has no public IPv4 address',422);
        $port=(int)($u['port']??($scheme==='https'?443:80)); if($port!==($scheme==='https'?443:80)) Response::error('Only standard HTTP and HTTPS ports are allowed',422);
        $bytes=0; $body=''; $ch=curl_init($url);
        $opts=[CURLOPT_RETURNTRANSFER=>false,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>12,CURLOPT_PROTOCOLS=>CURLPROTO_HTTP|CURLPROTO_HTTPS,CURLOPT_IPRESOLVE=>CURL_IPRESOLVE_V4,CURLOPT_RESOLVE=>[$host.':'.$port.':'.$ip4],CURLOPT_USERAGENT=>'AI-Support-KnowledgeImporter/1.0',CURLOPT_WRITEFUNCTION=>function($curl,$chunk)use(&$body,&$bytes){$bytes+=strlen($chunk);if($bytes>2*1024*1024)return 0;$body.=$chunk;return strlen($chunk);}];
        $opts[CURLOPT_HTTPHEADER]=[$html?'Accept: text/html,application/xhtml+xml,text/plain;q=0.9':'Accept: text/csv,text/plain,application/octet-stream;q=0.8'];
        curl_setopt_array($ch,$opts); $ok=curl_exec($ch); $err=curl_error($ch); $status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $ctype=strtolower((string)curl_getinfo($ch,CURLINFO_CONTENT_TYPE)); curl_close($ch);
        if($ok===false) Response::error($bytes>2*1024*1024?'Source exceeds 2MB':'Could not fetch source: '.$err,422);
        if($status<200||$status>=300) Response::error('Source returned HTTP '.$status.'; redirects are not followed',422);
        if($html ? !(str_contains($ctype,'text/html')||str_contains($ctype,'application/xhtml+xml')||str_contains($ctype,'text/plain')) : !(str_contains($ctype,'text/csv')||str_contains($ctype,'text/plain')||str_contains($ctype,'application/octet-stream'))) Response::error('Source must return HTML, plain text, or CSV content',422);
        if($html && !str_contains($ctype,'text/plain')) { $body=preg_replace('#<(script|style|noscript)\b[^>]*>.*?</(script|style|noscript)>#is',' ',$body)??$body; $body=html_entity_decode(strip_tags($body),ENT_QUOTES|ENT_HTML5,'UTF-8'); }
        $body=trim(preg_replace('/\s+/u',' ',$body)??$body);
        if($body==='') Response::error('Source contains no readable text',422);
        return mb_substr($body,0,2*1024*1024);
    }

    private static function readUploadedText(string $url): string
    {
        $path=parse_url($url,PHP_URL_PATH); if(!is_string($path)||!str_starts_with($path,'/storage/uploads/knowledge/')) Response::error('Upload must be stored in the knowledge library',422);
        $base=realpath((string)Config::get('APP_BASE_PATH').'/storage/uploads/knowledge'); $file=realpath((string)Config::get('APP_BASE_PATH').$path);
        if(!$base||!$file||!str_starts_with($file,$base.DIRECTORY_SEPARATOR)||!is_file($file)) Response::notFound('Uploaded knowledge file not found');
        $ext=strtolower(pathinfo($file,PATHINFO_EXTENSION)); if(!in_array($ext,['txt','csv'],true)) Response::error('Only TXT and CSV knowledge documents can be indexed',422);
        if(filesize($file)>2*1024*1024) Response::error('Knowledge document exceeds the 2MB indexing limit',422);
        $text=file_get_contents($file); if($text===false) Response::error('Could not read uploaded knowledge document',422);
        return trim(mb_substr($text,0,2*1024*1024));
    }

    public static function shapeSource(array $s): array
    {
        return [
            'id' => $s['id'],
            'name' => $s['name'],
            'type' => $s['type'],
            'status' => $s['status'],
            'sourceUrl' => $s['source_url'],
            'originDetails' => $s['origin_details'],
            'errorReason' => $s['error_reason'],
            'recordChunksCount' => (int) $s['chunks_count'],
            'lastIndexed' => Util::ts($s['last_indexed']),
            'lastContentUpdate' => Util::ts($s['last_content_update']),
            'isActive' => (bool) $s['is_active'],
        ];
    }

    public static function shapeFaq(array $f): array
    {
        return [
            'id' => $f['id'],
            'question' => $f['question'],
            'alternativeQuestions' => Database::decodeJson($f['alternative_questions']) ?: [],
            'approvedAnswer' => $f['approved_answer'],
            'category' => $f['category'],
            'applicableChannel' => $f['applicable_channel'],
            'language' => $f['language'],
            'status' => $f['status'],
            'priority' => (int) $f['priority'],
            'reviewDate' => $f['review_date'],
            'internalNotes' => $f['internal_notes'],
        ];
    }

    public static function shapePolicy(array $p): array
    {
        return [
            'id' => $p['id'],
            'name' => $p['name'],
            'category' => $p['category'],
            'fullText' => $p['full_text'],
            'rulesAndExceptions' => Database::decodeJson($p['rules_and_exceptions']) ?: [],
            'effectiveDate' => $p['effective_date'],
            'permanent' => (bool) $p['permanent'],
            'reviewDate' => $p['review_date'],
            'publicationStatus' => $p['publication_status'],
            'approvalStatus' => $p['approval_status'],
            'version' => $p['version'],
            'lastApprovedBy' => $p['last_approved_by'],
            'lastUpdated' => Util::ts($p['updated_at'] ?? $p['created_at']),
        ];
    }

    public static function shapeProduct(array $p): array
    {
        return [
            'id' => $p['id'],
            'sku' => $p['sku'],
            'name' => $p['name'],
            'description' => $p['description'],
            'category' => $p['category'],
            'variants' => Database::decodeJson($p['variants']) ?: [],
            'price' => (string) ($p['price'] + 0),
            'currency' => $p['currency'],
            'discountedPrice' => $p['discounted_price'] !== null ? (string) ($p['discounted_price'] + 0) : null,
            'inventoryStatus' => $p['inventory_status'],
            'stockCount' => (int) $p['stock_count'],
            'imageUrl' => $p['image_url'],
            'imageUrls' => Database::decodeJson($p['image_urls']) ?: [],
            'shippingRestrictions' => $p['shipping_restrictions'],
            'warrantyInfo' => $p['warranty_info'],
            'productUrl' => $p['product_url'],
            'isActive' => (bool) $p['is_active'],
        ];
    }

    public static function shapeTrainingJob(array $j): array
    {
        return [
            'id' => $j['id'],
            'sourceName' => $j['source_name'],
            'jobType' => $j['job_type'],
            'status' => $j['status'],
            'documentsProcessed' => (int) $j['documents_processed'],
            'totalDocuments' => (int) $j['total_documents'],
            'recordsSkipped' => (int) $j['records_skipped'],
            'durationMs' => (int) $j['duration_ms'],
            'startedAt' => Util::ts($j['started_at']),
            'finishedAt' => Util::ts($j['finished_at']),
            'errorMessage' => $j['error_message'],
        ];
    }

    public static function shapeTestCase(array $t): array
    {
        return [
            'id' => $t['id'],
            'question' => $t['question'],
            'draftAnswer' => $t['draft_answer'],
            'retrievedSources' => Database::decodeJson($t['retrieved_sources']) ?: [],
            'isGrounded' => (bool) $t['is_grounded'],
            'expectedAnswer' => $t['expected_answer'],
            'verdict' => $t['verdict'],
            'testedAt' => Util::ts($t['tested_at']),
        ];
    }

    public static function shapeBrand(array $b): array
    {
        return [
            'tagline' => $b['tagline'],
            'brandVoice' => $b['brand_voice'],
            'tonePillars' => Database::decodeJson($b['tone_pillars']) ?: [],
            'vocabularyGuidelines' => [
                'preferredTerms' => Database::decodeJson($b['preferred_terms'] ?? null) ?: [],
                'forbiddenTerms' => Database::decodeJson($b['forbidden_terms'] ?? null) ?: [],
            ],
            'greetingConvention' => $b['greeting_convention'],
            'culturalNuances' => $b['cultural_nuances'],
            'lastUpdated' => Util::ts($b['last_updated'] ?? null),
        ];
    }
}
