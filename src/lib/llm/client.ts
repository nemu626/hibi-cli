import { generateText, type LanguageModelUsage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import type { LLMConfig } from '../../types';

export interface GenerateResult {
    text: string;
    usage?: LanguageModelUsage;
}

export async function generateSummary(prompt: string, config: LLMConfig): Promise<GenerateResult> {
    const model = getModel(config);

    // システムプロンプトやパラメータはここに追加可能
    const { text, usage } = await generateText({
        model: model as any, // 互換性のため一旦anyキャスト、またはLanguageModelへのキャスト
        prompt,
        temperature: 0.7,
    });

    return { text, usage };
}

function getModel(config: LLMConfig) {
    switch (config.provider) {
        case 'openai': {
            const openaiClient = createOpenAI({
                apiKey: config.apiKey || process.env.HIBI_LLM_API_KEY || process.env.OPENAI_API_KEY,
            });
            return openaiClient(config.model || 'gpt-4o');
        }
        case 'gemini': {
            const googleClient = createGoogleGenerativeAI({
                apiKey: config.apiKey || process.env.HIBI_LLM_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            return googleClient(config.model || 'models/gemini-1.5-pro-latest');
        }
        case 'ollama': {
            // Ollama provider from ollama-ai-provider typically connects to localhost:11434 by default
            // If endpoint is customized, we might need a different setup or ensure the provider supports it.
            // based on docs, the default export is a provider instance.
            return ollama(config.model || 'llama3');
        }
        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
}
