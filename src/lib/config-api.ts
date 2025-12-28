/**
 * Hibi CLI - Config API Handler
 * REST API for reading/writing configuration
 */

import type { GlobalConfig, ProjectConfig } from "../types";
import { loadGlobalConfig, loadProjectConfig, saveGlobalConfig, saveProjectConfig } from "./config";
import { findProjectRoot } from "./utils";

export interface ConfigResponse {
    global: GlobalConfig;
    project: ProjectConfig | null;
    projectRoot: string | null;
}

/**
 * GET /api/config - 設定を取得
 */
export function getConfigHandler(): Response {
    const global = loadGlobalConfig();
    const projectRoot = findProjectRoot();
    const project = projectRoot ? loadProjectConfig(projectRoot) : null;

    const response: ConfigResponse = {
        global,
        project,
        projectRoot,
    };

    return Response.json(response);
}

/**
 * POST /api/config/global - グローバル設定を保存
 */
export async function saveGlobalConfigHandler(request: Request): Promise<Response> {
    try {
        const config = (await request.json()) as GlobalConfig;
        saveGlobalConfig(config);
        return Response.json({ success: true });
    } catch {
        return Response.json({ error: "設定の保存に失敗しました" }, { status: 500 });
    }
}

/**
 * POST /api/config/project - プロジェクト設定を保存
 */
export async function saveProjectConfigHandler(request: Request): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 400 });
    }

    try {
        const config = (await request.json()) as ProjectConfig;
        saveProjectConfig(projectRoot, config);
        return Response.json({ success: true });
    } catch {
        return Response.json({ error: "設定の保存に失敗しました" }, { status: 500 });
    }
}

const FILE_DIALOG_ERROR_RESPONSE = {
    path: null,
    error: "ファイルダイアログを開けませんでした。パスを直接入力してください。",
} as const;

/**
 * POST /api/browse-file - ファイル選択ダイアログを開く
 * CLIからZenityまたはKDialogを呼び出してファイル選択
 */
export async function browseFileHandler(request: Request): Promise<Response> {
    try {
        const body = (await request.json()) as { title?: string; directory?: boolean };
        const isDirectory = body.directory === true;
        const title = body.title || (isDirectory ? "ディレクトリを選択" : "ファイルを選択");

        // zenityを試す、失敗したらkdialogを試す
        const path =
            (await tryFileDialog("zenity", title, isDirectory)) ||
            (await tryFileDialog("kdialog", title, isDirectory));

        return Response.json(path ? { path } : FILE_DIALOG_ERROR_RESPONSE);
    } catch {
        return Response.json(FILE_DIALOG_ERROR_RESPONSE);
    }
}

/**
 * 外部ダイアログツールでファイル選択を実行
 */
async function tryFileDialog(
    tool: "zenity" | "kdialog",
    title: string,
    isDirectory: boolean,
): Promise<string | null> {
    try {
        const args =
            tool === "zenity"
                ? isDirectory
                    ? ["zenity", "--file-selection", "--directory", `--title=${title}`]
                    : ["zenity", "--file-selection", `--title=${title}`]
                : isDirectory
                  ? ["kdialog", "--getexistingdirectory", ".", "--title", title]
                  : ["kdialog", "--getopenfilename", ".", "--title", title];

        const proc = Bun.spawn(args, {
            stdout: "pipe",
            stderr: "pipe",
        });

        const exitCode = await proc.exited;
        if (exitCode !== 0) {
            return null;
        }

        const output = await new Response(proc.stdout).text();
        return output.trim() || null;
    } catch {
        return null;
    }
}
