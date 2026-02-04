import type { LanguageModelUsage } from 'ai';
import type { LLMConfig } from '../../types';

export interface GenerateResult {
    text: string;
    usage?: LanguageModelUsage;
}

export async function generateSummary(prompt: string, config: LLMConfig): Promise<GenerateResult> {
    // Lazy load AI SDKs to improve CLI startup time
    const { generateText } = await import('ai');

    let model: any;

    switch (config.provider) {
        case 'openai': {
            const { createOpenAI } = await import('@ai-sdk/openai');
            const openaiClient = createOpenAI({
                apiKey: config.apiKey || process.env.HIBI_LLM_API_KEY || process.env.OPENAI_API_KEY,
            });
            model = openaiClient(config.model || 'gpt-4o');
            break;
        }
        case 'gemini': {
            const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
            const googleClient = createGoogleGenerativeAI({
                apiKey: config.apiKey || process.env.HIBI_LLM_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            });
            model = googleClient(config.model || 'models/gemini-1.5-pro-latest');
            break;
        }
        case 'ollama': {
            const { ollama } = await import('ollama-ai-provider');
            model = ollama(config.model || 'llama3');
            break;
        }
        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }

    // システムプロンプトやパラメータはここに追加可能
    const { text, usage } = await generateText({
        model: model,
        prompt,
        temperature: 0.7,
    });

    return { text, usage };
}
