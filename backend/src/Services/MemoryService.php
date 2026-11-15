<?php
declare(strict_types=1);

/** Customer memory: structured facts + conversation summaries. */
final class MemoryService
{
    private static array $knownCities = ['dhaka', 'chittagong', 'chattogram', 'khulna', 'rajshahi', 'sylhet', 'barisal', 'rangpur', 'mymensingh', 'cumilla', 'gazipur', 'narayanganj'];

    /** Cheap heuristic memory updates after each exchange (upgrade: LLM extraction). */
    public static function updateFromExchange(string $tenantId, string $customerId, string $question, string $answer): void
    {
        $customer = Database::fetchOne('SELECT memory_notes FROM customers WHERE id = :id', ['id' => $customerId]);
        if (!$customer) return;

        $notes = trim((string) ($customer['memory_notes'] ?? ''));
        $q = mb_strtolower($question);
        $additions = [];

        foreach (self::$knownCities as $city) {
            if (str_contains($q, $city)) {
                $additions[] = 'Mentioned location: ' . ucfirst($city);
                break;
            }
        }
        if (preg_match('/\bmy (phone|number) is ([+\d\- ]{6,20})/i', $question, $m)) {
            $additions[] = 'Contact number shared: ' . trim($m[2]);
        }
        if (preg_match('/\border\s*(id|#)?\s*[:#]?\s*([A-Za-z0-9\-]{4,})/i', $question, $m)) {
            $additions[] = 'Referenced order ' . $m[2];
        }
        if (preg_match('/\b(bangla|বাংলা)\b/u', $question)) {
            $additions[] = 'Prefers Bangla communication';
        }
        if (str_contains($q, 'wholesale') || str_contains($q, 'bulk')) {
            $additions[] = 'Interested in bulk/wholesale purchase';
        }

        if ($additions === []) return;

        foreach ($additions as $note) {
            if ($notes !== '' && str_contains($notes, $note)) continue;
            $notes = $notes === '' ? $note : ($notes . '. ' . $note);
        }
        Database::update('customers', ['memory_notes' => mb_substr($notes, 0, 2000)], 'id = :id', ['id' => $customerId]);
    }

    /** Build a rolling conversation summary (extractive MVP). */
    public static function summarize(string $conversationId): ?string
    {
        $rows = Database::fetchAll(
            "SELECT sender, text FROM messages WHERE conversation_id = :c AND is_internal_note = 0 ORDER BY created_at ASC LIMIT 40",
            ['c' => $conversationId]
        );
        if (count($rows) < 4) return null;
        $customerTopics = [];
        foreach ($rows as $r) {
            if ($r['sender'] !== 'customer') continue;
            $kws = Util::keywords($r['text']);
            foreach (array_slice($kws, 0, 3) as $kw) $customerTopics[$kw] = true;
        }
        $topics = implode(', ', array_slice(array_keys($customerTopics), 0, 5));
        return $topics ? 'Customer discussed: ' . $topics . '.' : null;
    }
}
