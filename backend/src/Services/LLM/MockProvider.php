<?php
declare(strict_types=1);

/**
 * Deterministic offline provider used when no API keys are configured
 * (and for tests). Produces a plausible rule-driven reply so the whole
 * pipeline works end-to-end without external calls.
 */
final class MockProvider implements LLMProvider
{
    public function complete(array $messages, array $opts = []): array
    {
        $userText = '';
        foreach (array_reverse($messages) as $m) {
            if (($m['role'] ?? '') === 'user') { $userText = (string) $m['content']; break; }
        }
        $text = $this->draftReply($userText, $messages);
        $in = self::estimateTokens(implode("\n", array_column($messages, 'content')));
        $out = self::estimateTokens($text);
        return [
            'text' => $text,
            'inputTokens' => $in,
            'outputTokens' => $out,
            'provider' => 'Mock LLM',
            'model' => $opts['model'] ?? 'mock-replier-1',
            'finish' => 'stop',
        ];
    }

    public function embed(string $text): array
    {
        return Util::pseudoEmbedding($text);
    }

    public function name(): string
    {
        return 'Mock LLM';
    }

    private function draftReply(string $question, array $messages): string
    {
        $q = mb_strtolower($question);
        $kb = '';
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'system') $kb .= "\n" . (string) $m['content'];
        }

        if (str_contains($q, 'refund') || str_contains($q, 'return')) {
            return "I understand you'd like help with a refund. Our policy allows refunds within 7 days of delivery for unused items. Could you share your order ID so I can check eligibility right away?";
        }
        if (str_contains($q, 'delivery') || str_contains($q, 'shipping') || str_contains($q, 'courier')) {
            return "We deliver nationwide via Sundarban Courier. Inside Dhaka it usually takes 24–48 hours, outside Dhaka 2–3 days. Share your area and I'll confirm the exact fee and ETA.";
        }
        if (str_contains($q, 'price') || str_contains($q, 'cost') || str_contains($q, 'how much')) {
            return "Happy to help with pricing! The listed price depends on the variant — could you tell me which product or model you're interested in, and I'll confirm the current price and any running offer.";
        }
        if (str_contains($q, 'stock') || str_contains($q, 'available')) {
            return "Let me check that for you — which exact item do you need? Once you confirm the product name or SKU, I'll verify current stock and reserve it if available.";
        }
        if (str_contains($q, 'order') && str_contains($q, 'status')) {
            return "I can check your order status. Please share your order ID or the phone number used for the order, and I'll look it up right away.";
        }
        if (str_contains($q, 'hello') || str_contains($q, 'hi') || $question === '') {
            return "Hello! Thanks for reaching out. How can I help you today — product info, delivery, or order support?";
        }

        // If knowledge was supplied, ground the reply on the first snippet.
        if ($kb !== '') {
            $snippet = trim(mb_substr($kb, 0, 240));
            return "Here's what I found for you: $snippet" . (mb_strlen($kb) > 240 ? '…' : '') . "\n\nLet me know if you'd like more details on this.";
        }
        return "Thanks for your message! I've noted your question and I'm checking the details. Could you share a little more information (e.g., product name or order ID) so I can give you an exact answer?";
    }

    public static function estimateTokens(string $text): int
    {
        return (int) max(1, ceil(str_word_count($text) * 1.35));
    }
}
