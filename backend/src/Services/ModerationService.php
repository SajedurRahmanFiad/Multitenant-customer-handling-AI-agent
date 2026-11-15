<?php
declare(strict_types=1);

/**
 * Moderation + business rules + handover decisioning.
 * Returns {confidence, decision, rewriteTo?, handoffReason?, failedCase?...}
 */
final class ModerationService
{
    public static function evaluate(string $tenantId, string $question, string $reply, array $sources, array $agentCfg): array
    {
        $rules = Database::fetchAll(
            "SELECT * FROM handover_rules WHERE tenant_id = :t AND is_active = 1
             ORDER BY CASE priority
                WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
            ['t' => $tenantId]
        );

        $q = mb_strtolower($question);
        $confBase = 0.55 + min(0.35, count($sources) * 0.09);   // more grounded => more confident
        if (mb_strlen($question) > 12) $confBase += 0.03;
        $confidence = round(min(0.97, $confBase), 2);

        $decision = 'send';
        $handoffReason = null;
        $rewriteTo = null;
        $failedCase = null;
        $failedReason = null;
        $failedCaseStatus = null;

        foreach ($rules as $rule) {
            $matched = false;
            switch ($rule['trigger_type']) {
                case 'customer_request':
                    $matched = (bool) preg_match('/\b(human|agent|manager|representative|talk to (a )?(person|someone)|call me)\b/i', $question);
                    break;
                case 'sentiment_frustration':
                    $matched = (bool) preg_match('/\b(angry|worst|terrible|useless|complain|complaint|scam|fraud|furious|unacceptable)\b/i', $question);
                    break;
                case 'refund_exception':
                    $matched = (bool) preg_match('/\b(refund|return my money|money back)\b/i', $question);
                    break;
                case 'payment_conflict':
                    $matched = (bool) preg_match('/\b(payment (failed|problem|issue)|charged twice|double charged|bkash|nagad issue)\b/i', $question);
                    break;
                case 'legal_privacy':
                    $matched = (bool) preg_match('/\b(lawyer|legal action|sue|gdpr|delete my data|privacy)\b/i', $question);
                    break;
                case 'missing_knowledge':
                    $matched = $sources === [];
                    break;
                case 'low_confidence':
                    $threshold = (int) ($rule['confidence_threshold_percent'] ?? 60);
                    $matched = $confidence * 100 < $threshold;
                    break;
            }
            if (!$matched) continue;

            $decision = 'handoff';
            $handoffReason = $rule['handover_message'] ?: ($rule['name'] . ' triggered');
            $failedCase = true;
            $failedReason = $rule['name'];
            $failedCaseStatus = 'needs_attention';
            break;
        }

        if ($decision !== 'handoff' && $sources === [] && mb_strlen($question) > 6) {
            // Missing knowledge but no explicit rule — clarify rather than hallucinate.
            $strategy = $agentCfg['instructions']['missingInfoStrategy'] ?? 'honest_admission';
            if ($strategy === 'clarify') {
                $decision = 'clarify';
                $confidence = min($confidence, 0.55);
            } elseif ($strategy === 'escalate_immediately') {
                $decision = 'handoff';
                $handoffReason = 'No matching knowledge found';
                $failedCase = true;
                $failedReason = 'Missing knowledge';
                $failedCaseStatus = 'unresolved';
                $confidence = 0.42;
            } else {
                $rewriteTo = "I want to give you an accurate answer, but I don't have that detail confirmed right now. Could you share a bit more (product name or order ID)? I'll check with our team and get right back to you.";
                $confidence = 0.45;
                $failedCase = true;
                $failedReason = 'Missing knowledge';
                $failedCaseStatus = 'unresolved';
            }
        }

        // Prohibited-topic guard
        $prohibited = (array) ($agentCfg['instructions']['prohibitedTopics'] ?? []);
        foreach ($prohibited as $topic) {
            if (is_string($topic) && $topic !== '' && str_contains($q, mb_strtolower($topic))) {
                $decision = 'handoff';
                $handoffReason = "Prohibited topic requested: $topic";
                $rewriteTo = "I'm not able to help with that topic here, but our team will be happy to follow up with you directly.";
                $failedCase = true;
                $failedReason = 'Prohibited topic';
                $failedCaseStatus = 'needs_attention';
                break;
            }
        }

        return [
            'confidence' => $confidence,
            'decision' => $decision,
            'rewriteTo' => $rewriteTo,
            'handoffReason' => $handoffReason,
            'failedCase' => $failedCase,
            'failedReason' => $failedReason,
            'failedCaseStatus' => $failedCaseStatus ?? 'needs_attention',
        ];
    }
}
