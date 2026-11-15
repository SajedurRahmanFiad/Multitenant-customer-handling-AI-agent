<?php
declare(strict_types=1);

/**
 * Knowledge retrieval (RAG): chunking, indexing (embeddings), keyword-prefiltered
 * cosine-similarity search across knowledge_chunks + faqs + products + policies.
 */
final class KnowledgeService
{
    public const CHUNK_SIZE = 500;
    public const CHUNK_OVERLAP = 80;

    /** Index the given content for a source: chunk + embed + count. */
    public static function indexSource(string $tenantId, array $source, string $content, string $titlePrefix): int
    {
        Database::delete('knowledge_chunks', 'source_id = :sid', ['sid' => $source['id']]);
        $chunks = self::split($content);
        $i = 0;
        foreach ($chunks as $chunk) {
            $emb = LLMFactory::defaultProvider()->embed($chunk);
            Database::insert('knowledge_chunks', [
                'id' => Util::id('kc'),
                'tenant_id' => $tenantId,
                'source_id' => $source['id'],
                'chunk_index' => $i,
                'title' => $titlePrefix . ' · part ' . ($i + 1),
                'chunk_text' => $chunk,
                'embedding' => Database::json($emb),
                'tokens' => MockProvider::estimateTokens($chunk),
            ]);
            $i++;
        }
        Database::update('knowledge_sources', [
            'status' => 'ready',
            'chunks_count' => count($chunks),
            'last_indexed' => Database::now(),
            'last_content_update' => Database::now(),
            'error_reason' => null,
        ], 'id = :id', ['id' => $source['id']]);
        return count($chunks);
    }

    public static function split(string $text): array
    {
        $text = trim(preg_replace('/\r\n/', "\n", $text) ?? $text);
        if ($text === '') return [];
        $parts = [];
        $start = 0;
        $len = mb_strlen($text);
        while ($start < $len) {
            $parts[] = trim(mb_substr($text, $start, self::CHUNK_SIZE));
            $start += self::CHUNK_SIZE - self::CHUNK_OVERLAP;
        }
        return array_values(array_filter($parts));
    }

    /**
     * Retrieve top-K passages for a query within a tenant.
     * Strategy: keyword prefilter (LIKE) then cosine similarity on embeddings.
     */
    public static function retrieve(string $tenantId, string $query, int $k = 4): array
    {
        $keywords = Util::keywords($query);
        $candidates = [];

        // knowledge_chunks prefilter
        $params = ['tid' => $tenantId];
        $like = [];
        $i = 0;
        foreach (array_slice($keywords, 0, 8) as $kw) {
            $i++;
            $like[] = "LOWER(c.chunk_text) LIKE :kw$i";
            $params["kw$i"] = '%' . $kw . '%';
        }
        $where = $like ? ('AND (' . implode(' OR ', $like) . ')') : '';
        $rows = Database::fetchAll(
            "SELECT c.id, c.title, c.chunk_text, c.embedding, s.name AS source_name
             FROM knowledge_chunks c JOIN knowledge_sources s ON s.id = c.source_id
             WHERE c.tenant_id = :tid AND s.is_active = 1 AND s.status = 'ready' $where
             LIMIT 80", $params);
        foreach ($rows as $r) {
            $candidates[] = ['id' => $r['id'], 'title' => (string) $r['title'] ?: $r['source_name'], 'text' => $r['chunk_text'], 'embedding' => $r['embedding']];
        }

        // Published FAQs
        $faqs = Database::fetchAll(
            "SELECT id, question, approved_answer AS body, status FROM faqs
             WHERE tenant_id = :tid AND status = 'Published' LIMIT 100", ['tid' => $tenantId]);
        foreach ($faqs as $f) {
            $body = $f['question'] . "\n" . $f['body'];
            if ($keywords && !self::anyKeyword($body, $keywords)) continue;
            $candidates[] = ['id' => $f['id'], 'title' => 'FAQ: ' . $f['question'], 'text' => $body, 'embedding' => null];
        }

        // Active products
        $products = Database::fetchAll(
            "SELECT id, sku, name, description, price, currency, inventory_status FROM products
             WHERE tenant_id = :tid AND is_active = 1 LIMIT 200", ['tid' => $tenantId]);
        foreach ($products as $p) {
            $body = $p['name'] . ' ' . ($p['description'] ?? '') . ' price ' . $p['price'] . ' ' . $p['currency'];
            if ($keywords && !self::anyKeyword($body, $keywords)) continue;
            $candidates[] = [
                'id' => $p['id'], 'title' => 'Product: ' . $p['name'],
                'text' => $body . ' [' . $p['inventory_status'] . ', SKU ' . $p['sku'] . ']',
                'embedding' => null,
            ];
        }

        // Published policies
        $policies = Database::fetchAll(
            "SELECT id, name, category, full_text FROM business_policies
             WHERE tenant_id = :tid AND publication_status = 'Published' LIMIT 50", ['tid' => $tenantId]);
        foreach ($policies as $p) {
            $body = $p['name'] . "\n" . $p['full_text'];
            if ($keywords && !self::anyKeyword($body, $keywords)) continue;
            $candidates[] = ['id' => $p['id'], 'title' => 'Policy: ' . $p['name'] . ' (' . $p['category'] . ')', 'text' => $body, 'embedding' => null];
        }

        if ($candidates === []) return [];

        $qEmb = Util::pseudoEmbedding($query);
        $scored = [];
        foreach ($candidates as $c) {
            $emb = $c['embedding'] ? Database::decodeJson($c['embedding']) : Util::pseudoEmbedding($c['text']);
            $score = Util::cosineSimilarity($qEmb, is_array($emb) ? $emb : []);
            // keyword overlap bonus
            $kwOverlap = $keywords ? (self::countKeyword($c['text'], $keywords) / count($keywords)) : 0;
            $score = $score * 0.7 + $kwOverlap * 0.3;
            $scored[] = ['title' => $c['title'], 'text' => $c['text'], 'score' => round(min(1.0, $score), 4)];
        }
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($scored, 0, $k);
    }

    private static function anyKeyword(string $text, array $keywords): bool
    {
        $lower = mb_strtolower($text);
        foreach ($keywords as $kw) {
            if (str_contains($lower, $kw)) return true;
        }
        return false;
    }

    private static function countKeyword(string $text, array $keywords): int
    {
        $lower = mb_strtolower($text);
        $n = 0;
        foreach ($keywords as $kw) {
            if (str_contains($lower, $kw)) $n++;
        }
        return $n;
    }
}
