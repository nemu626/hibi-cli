// Config types for the web UI
export type LLMProvider = "openai" | "ollama" | "gemini" | "claude" | "none";

export interface LLMConfig {
    provider: LLMProvider;
    model?: string;
    apiKey?: string;
    endpoint?: string;
}

export interface GlobalConfig {
    llm?: LLMConfig;
    editor?: string;
    defaultProject?: string;
    historyFile?: string;
}

export interface ProjectConfig {
    remote?: string;
    sync?: "manual" | "auto" | "daily";
    llm?: LLMConfig;
    gitRepositories?: string[];
}

export interface ConfigResponse {
    global: GlobalConfig;
    project: ProjectConfig | null;
    projectRoot: string | null;
}
