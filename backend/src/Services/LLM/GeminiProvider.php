<?php
declare(strict_types=1);

/** Gemini (Google AI Studio REST). */
final class GeminiProvider implements LLMProvider
{
    public function __construct(private string $apiKey, private string $endpointUrl = 'https://generativelanguage.googleapis.com') {}

    public function complete(array $messages, array $opts = []): array
    {
        $model = $opts['model'] ?? 'gemini-2.0-flash';
        $system = '';
        $contents = [];
        foreach ($messages as $m) {
            if (($m['role'] ?? '') === 'system') {
                $system .= $m['content'] . "\n";
            } else {
                $contents[] = [
                    'role' => ($m['role'] ?? 'user') === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => (string) $m['content']]],
                ];
            }
        }
        $body = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float) ($opts['temperature'] ?? 0.3),
                'maxOutputTokens' => (int) ($opts['maxTokens'] ?? 1024),
            ],
        ];
        if ($system !== '') $body['systemInstruction'] = ['parts' => [['text' => $system]]];

        $res = Http::postJson(
            rtrim($this->endpointUrl, '/') . "/v1beta/models/{$model}:generateContent?key=" . urlencode($this->apiKey),
            $body
        );
        $text = $res['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $usage = $res['usageMetadata'] ?? [];
        return [
            'text' => trim((string) $text),
            'inputTokens' => (int) ($usage['promptTokenCount'] ?? MockProvider::estimateTokens(json_encode($messages))),
            'outputTokens' => (int) ($usage['candidatesTokenCount'] ?? MockProvider::estimateTokens((string) $text)),
            'provider' => 'Google Gemini',
            'model' => $model,
            'finish' => (string) ($res['candidates'][0]['finishReason'] ?? 'stop'),
        ];
    }

    public function embed(string $text): array
    {
        return Util::pseudoEmbedding($text); // upgrade: text-embedding-004 call
    }

    public function name(): string
    {
        return 'Google Gemini';
    }
}
