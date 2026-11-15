<?php
declare(strict_types=1);

/**
 * Chooses a provider for a model_id using the ai_provider_models registry.
 * Falls back to MockProvider when the model is unknown / disabled / keyless.
 */
final class LLMFactory
{
    private static array $cache = [];

    public static function forModel(?string $modelId): LLMProvider
    {
        if ($modelId) {
            $cacheKey = $modelId;
            if (isset(self::$cache[$cacheKey])) return self::$cache[$cacheKey];

            $row = Database::fetchOne(
                'SELECT * FROM ai_provider_models WHERE model_id = :m AND status != :s LIMIT 1',
                ['m' => $modelId, 's' => 'disabled']
            );
            if ($row) {
                $provider = self::build($row);
                if ($provider) {
                    return self::$cache[$cacheKey] = $provider;
                }
            }
        }
        return self::mock();
    }

    public static function defaultProvider(): LLMProvider
    {
        $row = Database::fetchOne(
            'SELECT * FROM ai_provider_models WHERE is_default = 1 AND status = :s LIMIT 1',
            ['s' => 'active']
        );
        if ($row && ($p = self::build($row))) return $p;
        return self::mock();
    }

    private static function build(array $row): ?LLMProvider
    {
        $key = trim((string) ($row['api_key'] ?? ''));
        $url = (string) ($row['endpoint_url'] ?? '');
        $modelId = (string) $row['model_id'];
        $name = (string) $row['provider'];

        return match ($name) {
            'Google Gemini' => ($key !== '') ? new GeminiProvider($key, $url ?: 'https://generativelanguage.googleapis.com') : null,
            'OpenAI', 'Groq / Llama', 'Ollama Dedicated' => self::openAiCompatible($name, $key, $url, $modelId),
            'Anthropic' => ($key !== '') ? new OpenAICompatibleProvider($key, $url ?: 'https://api.anthropic.com/v1', 'Anthropic') : null,
            default => null,
        };
    }

    private static function openAiCompatible(string $name, string $key, string $url, string $modelId): ?LLMProvider
    {
        $defaultUrls = [
            'OpenAI' => 'https://api.openai.com/v1',
            'Groq / Llama' => 'https://api.groq.com/openai/v1',
            'Ollama Dedicated' => 'http://127.0.0.1:11434/v1',
        ];
        if ($name === 'Ollama Dedicated') {
            return new OpenAICompatibleProvider($key ?: 'ollama', $url ?: $defaultUrls[$name], 'Ollama Dedicated');
        }
        if ($key === '' && $name === 'Groq / Llama') {
            return new OpenAICompatibleProvider('groq-dev', $url ?: $defaultUrls[$name], $name);
        }
        return ($key !== '') ? new OpenAICompatibleProvider($key, $url ?: $defaultUrls[$name], $name) : null;
    }

    public static function mock(): LLMProvider
    {
        return self::$cache['__mock'] ??= new MockProvider();
    }

    /** Cost estimate in USD from a provider model row. */
    public static function costUsd(?string $modelId, int $inputTokens, int $outputTokens): float
    {
        if (!$modelId) return 0.0;
        $row = Database::fetchOne(
            'SELECT cost_per_million_input_usd, cost_per_million_output_usd FROM ai_provider_models WHERE model_id = :m',
            ['m' => $modelId]
        );
        if (!$row) return 0.0;
        return ($inputTokens / 1e6) * (float) $row['cost_per_million_input_usd']
             + ($outputTokens / 1e6) * (float) $row['cost_per_million_output_usd'];
    }
}
