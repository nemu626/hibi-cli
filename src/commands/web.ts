/**
 * Hibi CLI - web コマンド
 * 日報管理のWeb UIを提供
 */

import { Command } from "commander";
import { startConfigServer } from "../lib/web-server";

/**
 * webコマンドを作成
 */
export function createWebCommand(): Command {
    const command = new Command("web")
        .description("Webブラウザで日報を管理する")
        .option("-p, --port <port>", "サーバーポート番号", "8080")
        .option("--no-open", "ブラウザを自動で開かない")
        .action(async (options: { port: string; open: boolean }) => {
            const port = parseInt(options.port, 10);

            if (Number.isNaN(port) || port < 1 || port > 65535) {
                console.error("エラー: 無効なポート番号です");
                process.exit(1);
            }

            console.log("🌐 Webサーバーを起動中...");

            try {
                const { url } = startConfigServer(port);

                console.log(`\n✓ サーバー起動完了`);
                console.log(`  ${url}\n`);

                // ブラウザを開く
                if (options.open) {
                    try {
                        const openCommand =
                            process.platform === "darwin"
                                ? ["open", url]
                                : process.platform === "win32"
                                  ? ["cmd", "/c", "start", url]
                                  : ["xdg-open", url];

                        Bun.spawn(openCommand, {
                            stdout: "ignore",
                            stderr: "ignore",
                        });
                        console.log("📖 ブラウザで日報管理画面を開きました\n");
                    } catch {
                        console.log(`📖 ブラウザで ${url} を開いてください\n`);
                    }
                }

                console.log("Ctrl+C で終了\n");

                // シグナルハンドリング
                process.on("SIGINT", () => {
                    console.log("\n👋 サーバーを停止しました");
                    process.exit(0);
                });

                // サーバーを維持
                await new Promise(() => {});
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
                    console.error(`エラー: ポート ${port} は既に使用されています`);
                    console.error(`別のポートを指定してください: hibi web --port 8081`);
                } else {
                    console.error("エラー: サーバーの起動に失敗しました", error);
                }
                process.exit(1);
            }
        });

    return command;
}
