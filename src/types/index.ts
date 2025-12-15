/**
 * Hibi CLI - 型定義
 */

// LLMプロバイダーの種類
export type LLMProvider = "openai" | "ollama" | "gemini" | "none";

// 同期モード
export type SyncMode = "manual" | "auto" | "daily";

// LLM設定
export interface LLMConfig {
    provider: LLMProvider;
    model?: string;
    apiKey?: string;
    endpoint?: string;
}

// グローバル設定 (~/.config/hibi/hibi.yaml)
export interface GlobalConfig {
    llm?: LLMConfig;
    editor?: string;
    defaultProject?: string;
}

// プロジェクト設定 (<projectRoot>/hibi.yaml)
export interface ProjectConfig {
    remote?: string;
    sync?: SyncMode;
    llm?: LLMConfig;
}

// マージされた設定
export interface HibiConfig extends GlobalConfig, ProjectConfig {
    // プロジェクトルートのパス（実行時に設定）
    projectRoot?: string;
    // 現在のプロジェクト名
    currentProject?: string;
}

// タスクの状態
export type TaskStatus = "todo" | "done";

// タスク
export interface Task {
    id?: number; // 実行時に動的に割り当てられる連番ID（1始まり）
    text: string;
    status: TaskStatus;
    indent: number;
    children?: Task[];
}

// メモエントリ
export interface MemoEntry {
    content: string;
    timestamp?: Date;
}

// 日報ファイルの構造
export interface DailyFile {
    date: string; // YYYYMMDD形式
    tasks: Task[];
    memos: MemoEntry[];
    summaryByLLM?: string;
    logByLLM?: {
        shellLog?: string;
        gitCommitLog?: string;
        summary?: string;
    };
}
