<?php
declare(strict_types=1);

/** Assembles the system prompt from tenant config, brand identity, memory & knowledge. */
final class PromptBuilder
{
    public static function build(
        array $tenant,
        array $customer,
        array $conversation,
        array $identity,
        array $instructions,
        array $behavior,
        array $responseRules,
        ?array $brand,
        array $sources,
        array $history,
        string $question,
        bool $outOfHours,
        ?array $svc,
    ): array {
        $lang = $identity['primaryLanguage'] ?? 'English';
        $tone = $identity['tone'] ?? 'friendly';
        $emoji = $identity['emojiUsage'] ?? 'minimal';
        $lenPref = $identity['messageLength'] ?? 'balanced';

        $sections = [];

        $sections[] = "# AGENT IDENTITY\n"
            . "Agent name: " . ($identity['agentName'] ?? 'Support Agent') . "\n"
            . "Language: $lang (supported: " . implode(', ', $identity['supportedLanguages'] ?? [$lang]) . ")\n"
            . "Tone: $tone. Emoji usage: $emoji. Reply length: $lenPref.";

        if ($brand) {
            $sections[] = "# BRAND\n"
                . "Business: " . ($tenant['business_name'] ?? '') . "\n"
                . "Tagline: " . ($brand['tagline'] ?? '-') . "\n"
                . "Brand voice: " . ($brand['brand_voice'] ?? '-') . "\n"
                . "Greeting convention: " . ($brand['greeting_convention'] ?? '-') . "\n"
                . "Cultural nuances: " . ($brand['cultural_nuances'] ?? '-');
        }

        if (!empty($instructions['primaryObjective'])) {
            $sections[] = "# OBJECTIVE\n" . $instructions['primaryObjective'];
        }
        if (!empty($instructions['businessDescription'])) {
            $sections[] = "# BUSINESS DESCRIPTION\n" . $instructions['businessDescription'];
        }
        if (!empty($instructions['communicationGuidelines'])) {
            $sections[] = "# COMMUNICATION GUIDELINES\n" . $instructions['communicationGuidelines'];
        }
        if (!empty($instructions['supportedTopics'])) {
            $sections[] = "# SUPPORTED TOPICS\n- " . implode("\n- ", (array) $instructions['supportedTopics']);
        }
        if (!empty($instructions['prohibitedTopics'])) {
            $sections[] = "# PROHIBITED TOPICS (never discuss, deflect politely)\n- " . implode("\n- ", (array) $instructions['prohibitedTopics']);
        }
        if (!empty($instructions['mandatoryDisclaimers'])) {
            $sections[] = "# MANDATORY DISCLAIMERS\n" . $instructions['mandatoryDisclaimers'];
        }
        if (!empty($instructions['customSafetyRules'])) {
            $sections[] = "# SAFETY RULES\n" . $instructions['customSafetyRules'];
        }

        if ($outOfHours) {
            $sections[] = "# OFF HOURS NOTICE\nIt is outside business hours ("
                . ($svc['business_hours_start'] ?? '09:00') . '–' . ($svc['business_hours_end'] ?? '18:00')
                . "). Acknowledge politely and queue for staff follow-up:\n"
                . (string) ($svc['out_of_hours_message'] ?? '');
        }

        $sections[] = "# CUSTOMER PROFILE\n"
            . "Name: " . ($customer['name'] ?? 'Unknown') . "\n"
            . "City: " . ($customer['city'] ?? 'unknown') . "\n"
            . "Language pref: " . ($customer['language'] ?? 'unknown') . "\n"
            . "Total orders: " . (int) ($customer['total_orders'] ?? 0) . "\n"
            . "Total spent: " . (string) ($customer['total_spent'] ?? 0) . "\n"
            . "Memory notes: " . ($customer['memory_notes'] ?? 'none');

        if ($history) {
            $lines = [];
            foreach ($history as $h) {
                $who = $h['sender'] === 'customer' ? 'Customer' : 'Agent';
                $lines[] = "$who: " . mb_substr($h['text'], 0, 300);
            }
            $sections[] = "# RECENT CONVERSATION\n" . implode("\n", $lines);
        }

        if ($sources) {
            $kLines = [];
            foreach ($sources as $s) {
                $kLines[] = "### " . $s['title'] . " (relevance " . $s['score'] . ")\n" . mb_substr($s['text'], 0, 600);
            }
            $sections[] = "# RETRIEVED KNOWLEDGE (ground your answer ONLY in these facts; if the answer isn't here, say so honestly)\n" . implode("\n\n", $kLines);
        }

        if (!empty($responseRules['restrictedClaims'])) {
            $sections[] = "# RESTRICTED CLAIMS (never claim these)\n- " . implode("\n- ", (array) $responseRules['restrictedClaims']);
        }
        if (!empty($responseRules['noAnswerBehavior'])) {
            $sections[] = "# IF YOU DON'T KNOW\nBehavior policy: " . $responseRules['noAnswerBehavior'];
        }

        $sections[] = "# INSTRUCTIONS\n"
            . "Answer the customer's latest message directly, using the retrieved knowledge."
            . " Stay within " . ($responseRules['maxResponseCharacters'] ?: 'any reasonable') . " characters."
            . " If information is missing: " . ($instructions['missingInfoStrategy'] ?? 'honest_admission') . "."

            . "\n\nCustomer's latest message:\n<<<\n$question\n>>>";

        $system = implode("\n\n", $sections);

        return [
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $question],
            ],
            'preview' => $system,
        ];
    }
}
