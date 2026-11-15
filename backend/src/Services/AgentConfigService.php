<?php
declare(strict_types=1);

/**
 * Live agent config access: merges the published version (or draft fallback)
 * into a plain array {mode, identity, instructions, behavior, responseRules}.
 */
final class AgentConfigService
{
    public static function liveConfig(string $tenantId): array
    {
        $pub = Database::fetchOne(
            "SELECT * FROM agent_config_versions WHERE tenant_id = :t AND status = 'published' ORDER BY published_at DESC LIMIT 1",
            ['t' => $tenantId]
        );
        if (!$pub) {
            $pub = Database::fetchOne(
                "SELECT * FROM agent_config_versions WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 1",
                ['t' => $tenantId]
            );
        }
        if (!$pub) return self::defaults();

        return [
            'id' => $pub['id'],
            'version' => $pub['version'],
            'status' => $pub['status'],
            'mode' => $pub['mode'],
            'identity' => Database::decodeJson($pub['identity']) ?: self::defaultIdentity(),
            'instructions' => Database::decodeJson($pub['instructions']) ?: self::defaultInstructions(),
            'behavior' => Database::decodeJson($pub['behavior']) ?: self::defaultBehavior(),
            'responseRules' => Database::decodeJson($pub['response_rules']) ?: self::defaultResponseRules(),
        ];
    }

    public static function defaults(): array
    {
        return [
            'mode' => 'automatic',
            'identity' => self::defaultIdentity(),
            'instructions' => self::defaultInstructions(),
            'behavior' => self::defaultBehavior(),
            'responseRules' => self::defaultResponseRules(),
        ];
    }

    public static function defaultIdentity(): array
    {
        return [
            'agentName' => 'Support Agent',
            'supportedLanguages' => ['Bangla', 'English'],
            'primaryLanguage' => 'English',
            'tone' => 'friendly',
            'emojiUsage' => 'minimal',
            'messageLength' => 'balanced',
        ];
    }

    public static function defaultInstructions(): array
    {
        return [
            'primaryObjective' => 'Help customers with product information, orders, delivery and policies accurately and politely.',
            'businessDescription' => '',
            'communicationGuidelines' => '',
            'supportedTopics' => ['products', 'pricing', 'delivery', 'returns'],
            'prohibitedTopics' => [],
            'missingInfoStrategy' => 'honest_admission',
            'ambiguousQuestionsStrategy' => 'ask_options',
            'whenToSearchKnowledge' => 'on_query_intent',
            'enableLiveTools' => false,
            'liveTools' => ['orderStatusLookup' => false, 'inventoryCheck' => false, 'promoCodeValidator' => false, 'courierTrackingSync' => false],
            'askClarifyingQuestions' => true,
            'maxClarificationAttempts' => 2,
            'mandatoryDisclaimers' => '',
            'customSafetyRules' => '',
        ];
    }

    public static function defaultBehavior(): array
    {
        return [
            'immediateGreeting' => true,
            'greetingDelaySeconds' => 3,
            'welcomeMessage' => 'Hello! Welcome to our store. How can I help you today?',
            'proactivelySuggestProducts' => false,
            'productSuggestionTrigger' => 'browse_intent',
            'collectContactDetails' => true,
            'requiredContactFields' => ['phone'],
            'summarizeBeforeHandover' => true,
            'autoFollowUpAfterUnanswered' => false,
            'followUpDelayMinutes' => 30,
            'followUpMessage' => 'Are you still there? I can help whenever you are ready.',
            'detectComplaints' => true,
            'inactivityTimeoutMinutes' => 60,
            'inactivityAction' => 'send_nudge',
        ];
    }

    public static function defaultResponseRules(): array
    {
        return [
            'maxResponseCharacters' => 800,
            'maxSentencesPerMessage' => 5,
            'supportedLocales' => ['bn-BD', 'en-US'],
            'quickTemplates' => [],
            'restrictedClaims' => [],
            'sourceCitationBehavior' => 'for_policy_pricing',
            'conflictingSourcesBehavior' => 'state_ambiguity',
            'noAnswerBehavior' => 'admit_and_escalate',
            'combineMultipleQuestions' => true,
        ];
    }

    /** Create/refresh the working draft version copying published content. */
    public static function ensureDraft(string $tenantId): array
    {
        $draft = Database::fetchOne(
            "SELECT * FROM agent_config_versions WHERE tenant_id = :t AND status = 'draft' LIMIT 1",
            ['t' => $tenantId]
        );
        if ($draft) return $draft;

        $pub = Database::fetchOne(
            "SELECT * FROM agent_config_versions WHERE tenant_id = :t AND status = 'published' ORDER BY published_at DESC LIMIT 1",
            ['t' => $tenantId]
        );
        $source = $pub ?: null;
        $id = Util::id('acv');
        $nextVersion = self::nextVersion($tenantId);
        Database::insert('agent_config_versions', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'version' => $nextVersion,
            'status' => 'draft',
            'mode' => $source['mode'] ?? 'automatic',
            'summary' => 'Working draft',
            'identity' => $source['identity'] ?? Database::json(self::defaultIdentity()),
            'instructions' => $source['instructions'] ?? Database::json(self::defaultInstructions()),
            'behavior' => $source['behavior'] ?? Database::json(self::defaultBehavior()),
            'response_rules' => $source['response_rules'] ?? Database::json(self::defaultResponseRules()),
        ]);
        return Database::fetchOne('SELECT * FROM agent_config_versions WHERE id = :id', ['id' => $id]);
    }

    public static function nextVersion(string $tenantId): string
    {
        $count = (int) Database::scalar('SELECT COUNT(*) FROM agent_config_versions WHERE tenant_id = :t', ['t' => $tenantId]);
        return 'v' . ($count + 1) . '.0';
    }
}
