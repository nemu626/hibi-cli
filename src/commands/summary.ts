import { Command } from "commander";
import colors from "colors";
import { loadConfig } from "../lib/config";
import { generateSummary } from "../lib/llm/client";
import { getSectionContent, readDailyFile, updateSection } from "../lib/daily";
import { getTodayString } from "../lib/utils";

export function createSummaryCommand() {
    return new Command("summary")
        .alias("sum")
        .description("今日の日報をLLMで要約します")
        .option("-d, --date <date>", "対象の日付 (YYYYMMDD)", getTodayString())
        .option("-y, --yes", "確認なしで実行", false)
        .option("--dry-run", "LLMには送信せず、プロンプトを表示", false)
        .option("-v, --verbose", "詳細情報を表示 (プロンプト、出力、トークン数)", false)
        .action(async (options) => {
            const config = loadConfig();

            // LLM設定チェック
            if (!config.llm || !config.llm.provider || config.llm.provider === "none") {
                console.error(colors.red("❌ LLMプロバイダーが設定されていません。hibi.yamlで設定してください。"));
                process.exit(1);
            }

            const projectRoot = config.projectRoot;

            // projectRootがない場合は、おそらくhibiプロジェクト外で実行されている
            if (!projectRoot) {
                console.error(colors.red("❌ hibiプロジェクトが見つかりません。hibi initを実行したディレクトリで実行してください。"));
                process.exit(1);
            }

            const projectName = config.currentProject || "default";
            const dateStr = options.date;

            // 日報ファイル読み込み
            const content = readDailyFile(projectRoot, projectName, dateStr);
            if (!content) {
                console.error(colors.red(`❌ 日報ファイルが見つかりません: ${dateStr}`));
                process.exit(1);
            }

            const todoContent = getSectionContent(content, "Todo");
            const memoContent = getSectionContent(content, "Memo");

            if (!todoContent && !memoContent) {
                console.error(colors.yellow("⚠️ TodoもMemoも詳細がありません。要約する内容がありません。"));
                process.exit(0);
            }

            // プロンプト構築
            const prompt = `あなたは日報の要約を作成するアシスタントです。
以下の日報内容を簡潔に要約してください。

# 日報内容

## Todo
${todoContent}

## Memo
${memoContent}

# 出力形式
- 1-3文程度の要約を日本語で作成
- 重要な成果や進捗を強調
- 課題があれば簡潔に触れる
- 「本日は」などの主語は省略可
`;

            if (options.dryRun) {
                console.log(colors.cyan("🤖 プロンプトプレビュー:"));
                console.log(prompt);
                return;
            }

            if (!options.yes) {
                const prompts = (await import("prompts")).default;
                const response = await prompts({
                    type: 'confirm',
                    name: 'value',
                    message: 'LLMを使用してサマリを生成しますか？',
                    initial: true
                });

                if (!response.value) {
                    console.log("キャンセルしました。");
                    return;
                }
            }

            console.log(colors.cyan("🤖 サマリを生成中..."));

            try {
                const result = await generateSummary(prompt, config.llm);
                const summary = result.text;

                updateSection(projectRoot, "Summary by LLM", summary, projectName, dateStr);

                console.log(colors.green("\n📝 生成されたサマリ:"));
                console.log(summary);
                console.log(colors.green(`\n✅ 日報に追記しました: ${dateStr}`));

                if (options.verbose) {
                    console.log(colors.gray("\n🔍 Verbose Output:"));
                    console.log(colors.cyan("--- Prompt ---"));
                    console.log(prompt);
                    console.log(colors.cyan("--- Full Output ---"));
                    console.log(summary);
                    if (result.usage) {
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
