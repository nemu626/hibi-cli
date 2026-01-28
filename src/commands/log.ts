import { Command } from "commander";
import path from "node:path";
import os from "node:os";
import { loadConfig } from "../lib/config";
import { generateSummary } from "../lib/llm/client";
import { updateSection } from "../lib/daily";
import { getTodayString } from "../lib/utils";
import { getZshHistory } from "../lib/history";
import { getGitCommits, getCurrentUserEmail } from "../lib/git";

export function createLogCommand() {
    return new Command("log")
        .description("シェル履歴とGit履歴から作業ログを生成します")
        .option("-d, --date <date>", "対象の日付 (YYYYMMDD)", getTodayString())
        .option("-y, --yes", "確認なしで実行", false)
        .option("--dry-run", "LLMには送信せず、プロンプトを表示", false)
        .option("--hours <hours>", "過去何時間分を取得するか", "24")
        .option("--shell-only", "シェル履歴のみ使用", false)
        .option("--git-only", "Git履歴のみ使用", false)
        .option("-v, --verbose", "詳細情報を表示 (プロンプト、出力、トークン数)", false)
        .action(async (options) => {
            const { default: colors } = await import("colors");
            const config = loadConfig();

            // LLM設定チェック
            if (!config.llm || !config.llm.provider || config.llm.provider === "none") {
                console.error(colors.red("❌ LLMプロバイダーが設定されていません。hibi.yamlで設定してください。"));
                process.exit(1);
            }

            const projectRoot = config.projectRoot;
            if (!projectRoot) {
                console.error(colors.red("❌ hibiプロジェクトが見つかりません。hibi initを実行したディレクトリで実行してください。"));
                process.exit(1);
            }

            const projectName = config.currentProject || "default";
            const dateStr = options.date;

            // 時間範囲の計算
            // 指定日の0時0分からにするか、現在時刻から遡るか。
            // 日報の文脈では、その日の作業ログが欲しいので、指定日の00:00:00から23:59:59までが適切かもしれないが、
            // 昨日の深夜作業も含める場合がある。
            // ここでは簡易的に、現在時刻から --hours で指定された時間遡る、またはオプション指定がなければ
            // コマンド実行時の日付の0時から現在までとするのが自然。
            // しかし --hours "24" がデフォルトなので、単純に現在時刻 - N時間 とする。

            // もし日付指定(dateStr)が今日以外の場合、その日の00:00 - 23:59 を対象にすべき。
            // 実装簡略化のため、今回は「現在時刻から遡る」アプローチを採用しつつ、
            // dateStrが今日でない場合は警告を出すか、その日の始点終点を計算するか。
            // ユーザーは「logコマンド」をその日の終わりに叩くことを想定している。

            const hours = parseInt(options.hours, 10);
            const sinceDate = new Date();
            sinceDate.setHours(sinceDate.getHours() - hours);

            // TODO: -d オプションが指定された場合、その日の全範囲を取得するようにロジックを変えるべきだが
            // 今回は直近N時間の履歴という仕様で進める。

            let shellHistoryStr = "";
            let gitHistoryStr = "";

            // シェル履歴取得
            if (!options.gitOnly) {
                const historyFile = config.historyFile || "~/.zsh_history";
                console.log(colors.gray(`シェル履歴を読み込み中... (${historyFile})`));
                try {
                    const shellEntries = await getZshHistory(historyFile, sinceDate);
                    if (shellEntries.length > 0) {
                        shellHistoryStr = shellEntries.map(e => {
                            // タイムスタンプは省略、コマンドのみ
                            return e.command;
                        }).join("\n");
                    } else {
                        console.log(colors.yellow("⚠️  対象期間のシェル履歴が見つかりませんでした。"));
                    }
                } catch (e) {
                    console.error(colors.red(`❌ シェル履歴の読み込みに失敗しました: ${(e as Error).message}`));
                }
            }

            // Git履歴取得
            if (!options.shellOnly) {
                console.log(colors.gray("Git履歴を読み込み中..."));

                const commits: string[] = [];
                let repoPaths: string[] = [];

                if (config.gitRepositories && config.gitRepositories.length > 0) {
                    repoPaths = config.gitRepositories;
                } else {
                    repoPaths = [config.projectRoot || process.cwd()];
                }

                for (const repoPathRaw of repoPaths) {
                    let repoPath = repoPathRaw;
                    if (repoPath.startsWith("~")) {
                        repoPath = path.join(os.homedir(), repoPath.slice(1));
                    } else if (!path.isAbsolute(repoPath)) {
                        repoPath = path.resolve(config.projectRoot || process.cwd(), repoPath);
                    }

                    try {
                        const email = await getCurrentUserEmail(repoPath);
                        const repoCommits = await getGitCommits(repoPath, sinceDate, email || undefined);

                        if (repoCommits.length > 0) {
                            const repoName = path.basename(repoPath);
                            commits.push(...repoCommits.map(c => `[${repoName}] ${c}`));
                        }
                    } catch (e) {
                        if (options.verbose) {
                            console.warn(colors.yellow(`⚠️  Git履歴取得失敗 (${repoPath}): ${(e as Error).message}`));
                        }
                    }
                }

                if (commits.length > 0) {
                    gitHistoryStr = commits.join("\n");
                } else {
                    console.log(colors.yellow("⚠️  対象期間のGitコミットが見つかりませんでした。"));
                }
            }

            if (!shellHistoryStr && !gitHistoryStr) {
                console.error(colors.red("❌ ログ生成に必要な履歴データがありません。"));
                process.exit(0);
            }

            // プロンプト構築
            const prompt = `あなたは開発者の作業ログを分析するアシスタントです。
以下のシェル履歴とGitコミット履歴から、今日やったことを要約してください。

# シェル履歴
\`\`\`
${shellHistoryStr || "(履歴なし)"}
\`\`\`

# Gitコミット履歴
${gitHistoryStr || "(履歴なし)"}

# 出力形式
1. 重要: 以下のフォーマットを厳守してください。

###### Shell Log
(重要なシェルコマンドを抜粋してコードブロックで表示。雑多なコマンドは省く)

###### Git Commit Log
(Gitコミットログを箇条書きで表示)

###### Summary by LLM
(全体の作業内容、どのプロジェクトで何をしたかを1-2文で要約)
`;

            if (options.dryRun) {
                console.log(colors.cyan("🤖 プロンプトプレビュー:"));
                console.log(prompt);
                return;
            }

            if (!options.yes) {
                const { default: prompts } = await import("prompts");
                const response = await prompts({
                    type: 'confirm',
                    name: 'value',
                    message: 'LLMを使用してログを生成しますか？',
                    initial: true
                });

                if (!response.value) {
                    console.log("キャンセルしました。");
                    return;
                }
            }

            console.log(colors.cyan("🤖 ログを生成中..."));

            try {
                const result = await generateSummary(prompt, config.llm);
                const logContent = result.text;

                updateSection(projectRoot, "Log By LLM", logContent, projectName, dateStr);

                console.log(colors.green("\n📝 生成されたログ:"));
                console.log(logContent);
                console.log(colors.green(`\n✅ 日報に追記しました: ${dateStr}`));

                if (options.verbose) {
                    console.log(colors.gray("\n🔍 Verbose Output:"));
                    console.log(colors.cyan("--- Prompt ---"));
                    console.log(prompt);
                    console.log(colors.cyan("--- Full Output ---"));
                    console.log(logContent);
                    if (result.usage) {
                        // biome-ignore lint/suspicious/noExplicitAny: <reason>
                        const usage = result.usage as any;
                        console.log(colors.cyan("--- Token Usage ---"));
                        console.log(`Prompt: ${usage.promptTokens}, Completion: ${usage.completionTokens}, Total: ${usage.totalTokens}`);
                    }
                }

            } catch (error) {
                console.error(colors.red("❌ エラーが発生しました:"));
                console.error(error);
                process.exit(1);
            }
        });
}
