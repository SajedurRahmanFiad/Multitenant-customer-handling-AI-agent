<?php
declare(strict_types=1);

/** OpenAI-compatible Chat Completions (also covers Groq/Ollama endpoints). */
final class OpenAICompatibleProvider implements LLMProvider
{
    public function __construct(private string $apiKey, private string $endpointUrl = 'https://api.openai.com/v1', private string $label = 'OpenAI') {}

    public function complete(array $messages, array $opts = []): array
    {
        $model = $opts['model'] ?? 'gpt-4o-mini';
        $body = [
            'model' => $model,
            'messages' => array_map(fn($m) => ['role' => $m['role'], 'content' => (string) $m['content']], $messages),
            'temperature' => (float) ($opts['temperature'] ?? 0.3),
            'max_tokens' => (int) ($opts['maxTokens'] ?? 1024),
        ];
        $res = Http::postJson(rtrim($this->endpointUrl, '/') . '/chat/completions', $body, [
            'Authorization: Bearer ' . $this->apiKey,
        ]);
        $text = $res['choices'][0]['message']['content'] ?? '';
        $usage = $res['usage'] ?? [];
        return [
            'text' => trim((string) $text),
            'inputTokens' => (int) ($usage['prompt_tokens'] ?? MockProvider::estimateTokens(json_encode($messages))),
            'outputTokens' => (int) ($usage['completion_tokens'] ?? MockProvider::estimateTokens((string) $text)),
            'provider' => $this->label,
            'model' => $model,
            'finish' => (string) ($res['choices'][0]['finish_reason'] ?? 'stop'),
        ];
    }

    public function embed(string $text): array
    {
        return Util::pseudoEmbedding($text);
    }

    public function name(): string
    {
        return $this->label;
    }
}
