<script lang="ts">
    import Sidebar from "./Sidebar.svelte";
    import TodoList from "./TodoList.svelte";
    import MemoEditor from "./MemoEditor.svelte";

    interface Props {
        onNotify: (message: string, type: "success" | "error") => void;
    }

    let { onNotify }: Props = $props();

    interface Task {
        id: number;
        text: string;
        status: "todo" | "done";
        indent: number;
    }

    interface DailyData {
        date: string;
        tasks: Task[];
        memo: string;
        summaryByLLM: string;
        logByLLM: string;
    }

    let projects = $state<string[]>([]);
    let dates = $state<string[]>([]);
    let selectedProject = $state<string>("");
    let selectedDate = $state<string>("");
    let dailyData = $state<DailyData | null>(null);
    let loading = $state(true);
    let projectRoot = $state("");

    // Fetch projects on mount
    $effect(() => {
        fetchProjects();
    });

    // Fetch dates when project changes
    $effect(() => {
        if (selectedProject) {
            fetchDates(selectedProject);
        }
    });

    // Fetch daily data when project or date changes
    $effect(() => {
        if (selectedProject && selectedDate) {
            fetchDailyData(selectedProject, selectedDate);
        }
    });

    async function fetchProjects() {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            projects = data.projects || [];
            projectRoot = data.projectRoot || "";

            // Select first project if available
            if (projects.length > 0 && !selectedProject) {
                selectedProject = projects[0];
            }

            // Also get today's date
            const todayRes = await fetch("/api/today");
            const todayData = await todayRes.json();
            if (!selectedDate) {
                selectedDate = todayData.today;
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            onNotify("プロジェクトの取得に失敗しました", "error");
        } finally {
            loading = false;
        }
    }

    async function fetchDates(project: string) {
        try {
            const res = await fetch(
                `/api/projects/${encodeURIComponent(project)}/dates`,
            );
            const data = await res.json();
            dates = data.dates || [];
        } catch (error) {
            console.error("Failed to fetch dates:", error);
        }
    }

    async function fetchDailyData(project: string, date: string) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(project)}/${date}`,
            );
            dailyData = await res.json();
        } catch (error) {
            console.error("Failed to fetch daily data:", error);
            onNotify("日報データの取得に失敗しました", "error");
        }
    }

    function handleProjectChange(project: string) {
        selectedProject = project;
    }

    function handleDateChange(date: string) {
        selectedDate = date;
    }

    async function handleAddTask(text: string) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/task`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                await fetchDates(selectedProject);
                onNotify("タスクを追加しました", "success");
            }
        } catch (error) {
            onNotify("タスクの追加に失敗しました", "error");
        }
    }

    async function handleAddChildTask(parentId: number, text: string) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/task/${parentId}/child`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("子タスクを追加しました", "success");
            } else {
                onNotify("子タスクの追加に失敗しました", "error");
            }
        } catch (error) {
            onNotify("子タスクの追加に失敗しました", "error");
        }
    }

    async function handleCompleteTask(taskId: number) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/task/${taskId}`,
                {
                    method: "PUT",
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("タスクを完了しました", "success");
            }
        } catch (error) {
            onNotify("タスクの更新に失敗しました", "error");
        }
    }

    async function handleUncompleteTask(taskId: number) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/task/${taskId}`,
                {
                    method: "DELETE",
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("タスクを未完了に戻しました", "success");
            }
        } catch (error) {
            onNotify("タスクの更新に失敗しました", "error");
        }
    }

    async function handleUpdateTask(taskId: number, text: string) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/task/${taskId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("タスクを更新しました", "success");
            } else {
                onNotify("タスクの更新に失敗しました", "error");
            }
        } catch (error) {
            onNotify("タスクの更新に失敗しました", "error");
        }
    }

    async function handleMemoUpdate(content: string) {
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/memo`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("メモを保存しました", "success");
            } else {
                onNotify("メモの保存に失敗しました", "error");
            }
        } catch (error) {
            onNotify("メモの保存に失敗しました", "error");
        }
    }

    let generatingSummary = $state(false);
    let generatingLog = $state(false);
    let confirmRegenerate = $state<"summary" | "log" | null>(null);

    async function handleGenerateSummary() {
        if (dailyData?.summaryByLLM && confirmRegenerate !== "summary") {
            confirmRegenerate = "summary";
            return;
        }
        confirmRegenerate = null;
        generatingSummary = true;
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/summary`,
                { method: "POST" },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("サマリを生成しました", "success");
            } else {
                const data = await res.json();
                onNotify(data.error || "サマリの生成に失敗しました", "error");
            }
        } catch (error) {
            onNotify("サマリの生成に失敗しました", "error");
        } finally {
            generatingSummary = false;
        }
    }

    async function handleGenerateLog() {
        if (dailyData?.logByLLM && confirmRegenerate !== "log") {
            confirmRegenerate = "log";
            return;
        }
        confirmRegenerate = null;
        generatingLog = true;
        try {
            const res = await fetch(
                `/api/daily/${encodeURIComponent(selectedProject)}/${selectedDate}/log`,
                { method: "POST" },
            );
            if (res.ok) {
                await fetchDailyData(selectedProject, selectedDate);
                onNotify("ログを生成しました", "success");
            } else {
                const data = await res.json();
                onNotify(data.error || "ログの生成に失敗しました", "error");
            }
        } catch (error) {
            onNotify("ログの生成に失敗しました", "error");
        } finally {
            generatingLog = false;
        }
    }

    function cancelRegenerate() {
        confirmRegenerate = null;
    }

    function formatDateDisplay(dateStr: string): string {
        if (dateStr.length !== 8) return dateStr;
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
</script>

<div class="daily-app">
    <Sidebar
        {projects}
        {projectRoot}
        {dates}
        {selectedProject}
        {selectedDate}
        onProjectChange={handleProjectChange}
        onDateChange={handleDateChange}
    />

    <div class="main-content">
        <header class="header">
            <div class="header-left">
                <h1>🗓️ Hibi - 日報管理</h1>
                {#if selectedProject && selectedDate}
                    <span class="current-selection">
                        {selectedProject} / {formatDateDisplay(selectedDate)}
                    </span>
                {/if}
            </div>
            <a href="#/config" class="settings-link" title="設定">⚙️</a>
        </header>

        {#if loading}
            <div class="loading">読み込み中...</div>
        {:else if !projectRoot}
            <div class="no-project">
                <h2>😕 hibiプロジェクトが見つかりません</h2>
                <p>
                    ターミナルで <code>hibi init</code> を実行してプロジェクトを初期化してください。
                </p>
            </div>
        {:else if dailyData}
            <div class="content-grid">
                <section class="section todo-section glass-card">
                    <h2>📋 Todo</h2>
                    <TodoList
                        tasks={dailyData.tasks}
                        onAddTask={handleAddTask}
                        onAddChildTask={handleAddChildTask}
                        onCompleteTask={handleCompleteTask}
                        onUncompleteTask={handleUncompleteTask}
                        onUpdateTask={handleUpdateTask}
                    />
                </section>

                <section class="section memo-section glass-card">
                    <h2>📝 Memo</h2>
                    <MemoEditor
                        content={dailyData.memo}
                        onUpdate={handleMemoUpdate}
                    />
                </section>

                <section class="section llm-section glass-card">
                    <div class="llm-header">
                        <h2>🤖 Summary by LLM</h2>
                        {#if confirmRegenerate === "summary"}
                            <div class="confirm-dialog">
                                <span>上書きしますか？</span>
                                <button
                                    class="btn-confirm"
                                    onclick={handleGenerateSummary}>はい</button
                                >
                                <button
                                    class="btn-cancel"
                                    onclick={cancelRegenerate}>いいえ</button
                                >
                            </div>
                        {:else}
                            <button
                                class="btn-generate"
                                onclick={handleGenerateSummary}
                                disabled={generatingSummary}
                            >
                                {#if generatingSummary}
                                    生成中...
                                {:else if dailyData.summaryByLLM}
                                    🔄 再生成
                                {:else}
                                    ✨ 生成
                                {/if}
                            </button>
                        {/if}
                    </div>
                    <div class="llm-content">
                        {#if dailyData.summaryByLLM}
                            {@html dailyData.summaryByLLM.replace(
                                /\n/g,
                                "<br>",
                            )}
                        {:else}
                            <span class="empty-llm"
                                >サマリがまだ生成されていません</span
                            >
                        {/if}
                    </div>
                </section>

                <section class="section llm-section glass-card">
                    <div class="llm-header">
                        <h2>📜 Log by LLM</h2>
                        {#if confirmRegenerate === "log"}
                            <div class="confirm-dialog">
                                <span>上書きしますか？</span>
                                <button
                                    class="btn-confirm"
                                    onclick={handleGenerateLog}>はい</button
                                >
                                <button
                                    class="btn-cancel"
                                    onclick={cancelRegenerate}>いいえ</button
                                >
                            </div>
                        {:else}
                            <button
                                class="btn-generate"
                                onclick={handleGenerateLog}
                                disabled={generatingLog}
                            >
                                {#if generatingLog}
                                    生成中...
                                {:else if dailyData.logByLLM}
                                    🔄 再生成
                                {:else}
                                    ✨ 生成
                                {/if}
                            </button>
                        {/if}
                    </div>
                    <div class="llm-content">
                        {#if dailyData.logByLLM}
                            {@html dailyData.logByLLM.replace(/\n/g, "<br>")}
                        {:else}
                            <span class="empty-llm"
                                >ログがまだ生成されていません</span
                            >
                        {/if}
                    </div>
                </section>
            </div>
        {:else}
            <div class="no-data">データを読み込んでいます...</div>
        {/if}
    </div>
</div>

<style>
    .daily-app {
        display: flex;
        min-height: 100vh;
    }

    .main-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--glass-border);
    }

    .header-left h1 {
        font-size: 1.5rem;
        margin: 0;
    }

    .current-selection {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
        display: block;
    }

    .settings-link {
        font-size: 1.5rem;
        text-decoration: none;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .settings-link:hover {
        opacity: 1;
    }

    .content-grid {
        display: grid;
        gap: 1.5rem;
        align-items: stretch;
    }

    .section {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        min-height: 450px;
        height: 100%;
    }

    .section h2 {
        font-size: 1.125rem;
        margin: 0 0 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .section :global(.todo-list),
    .section :global(.memo-editor) {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .section :global(.editor-textarea) {
        flex: 1;
        min-height: 300px;
    }

    .loading,
    .no-project,
    .no-data {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }

    .no-project code {
        background: var(--glass-bg);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
    }

    @media (min-width: 1024px) {
        .content-grid {
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 1fr;
        }
    }

    .llm-section {
        min-height: auto;
    }

    .llm-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .llm-header h2 {
        margin: 0;
    }

    .btn-generate {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        border: none;
        border-radius: 6px;
        color: white;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-generate:hover:not(:disabled) {
        opacity: 0.9;
        transform: scale(1.02);
    }

    .btn-generate:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .confirm-dialog {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
    }

    .confirm-dialog span {
        color: var(--text-secondary);
    }

    .btn-confirm,
    .btn-cancel {
        padding: 0.25rem 0.75rem;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
    }

    .btn-confirm {
        background: var(--accent);
        color: white;
    }

    .btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
    }

    .llm-content {
        font-size: 0.9rem;
        line-height: 1.6;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 1rem;
        overflow-y: auto;
        max-height: 300px;
        flex: 1;
    }

    .empty-llm {
        color: var(--text-secondary);
        opacity: 0.6;
        font-style: italic;
    }
</style>
