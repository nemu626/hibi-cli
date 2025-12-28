import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ollama } from "ollama-ai-provider";
import type { LLMConfig, TokenUsage } from "../../types";

/** デフォルトモデル名 */
const DEFAULT_MODELS = {
    openai: "gpt-4o",
    gemini: "models/gemini-1.5-pro-latest",
    claude: "claude-3-5-sonnet-20241022",
    ollama: "llama3",
} as const;

export interface GenerateResult {
    text: string;
    usage?: TokenUsage;
}

/**
 * LLMでテキストを生成する
 */
export async function generateLLMText(prompt: string, config: LLMConfig): Promise<GenerateResult> {
    const model = getModel(config);

    const { text, usage } = await generateText({
        model,
        prompt,
        temperature: 0.7,
    });

    return {
        text,
        usage: usage ? toTokenUsage(usage) : undefined,
    };
}

/**
 * SDK の usage オブジェクトを TokenUsage に変換
 */
function toTokenUsage(usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
}): TokenUsage {
    return {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
    };
}

/**
 * トークン使用量を整形した文字列で返す
 */
export function formatTokenUsage(usage: TokenUsage): string {
    return `Input: ${usage.inputTokens}, Output: ${usage.outputTokens}, Total: ${usage.totalTokens}`;
}

/**
 * 環境変数からAPIキーを取得
 */
function getApiKey(config: LLMConfig, ...envKeys: string[]): string | undefined {
    if (config.apiKey) return config.apiKey;
    for (const key of envKeys) {
        const value = process.env[key];
        if (value) return value;
    }
    return undefined;
}

/**
 * プロバイダーに応じたモデルを取得
 */
function getModel(config: LLMConfig) {
    switch (config.provider) {
        case "openai": {
            const client = createOpenAI({
                apiKey: getApiKey(config, "HIBI_LLM_API_KEY", "OPENAI_API_KEY"),
            });
            return client(config.model || DEFAULT_MODELS.openai);
        }
        case "gemini": {
            const client = createGoogleGenerativeAI({
                apiKey: getApiKey(config, "HIBI_LLM_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"),
            });
            return client(config.model || DEFAULT_MODELS.gemini);
        }
        case "claude": {
            const client = createAnthropic({
                apiKey: getApiKey(config, "HIBI_LLM_API_KEY", "ANTHROPIC_API_KEY"),
            });
            return client(config.model || DEFAULT_MODELS.claude);
        }
        case "ollama": {
            return ollama(config.model || DEFAULT_MODELS.ollama);
        }
        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
}
