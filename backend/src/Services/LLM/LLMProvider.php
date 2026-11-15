<?php
declare(strict_types=1);

/** Provider-agnostic LLM contract. */
interface LLMProvider
{
    /**
     * @param array $messages [['role'=>'system|user|assistant','content'=>'...'], ...]
     * @param array $opts {model, temperature, maxTokens}
     * @return array{text:string,inputTokens:int,outputTokens:int,provider:string,model:string,finish:string}
     */
    public function complete(array $messages, array $opts = []): array;

    public function embed(string $text): array;

    public function name(): string;
}
