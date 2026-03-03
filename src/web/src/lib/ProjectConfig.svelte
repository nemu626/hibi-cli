<script lang="ts">
  import type { LLMConfig, ProjectConfig } from "../types";
  import FilePicker from "./FilePicker.svelte";
  import LLMSettings from "./LLMSettings.svelte";

  interface Props {
    onSave: (message: string, type: "success" | "error") => void;
  }

  const { onSave }: Props = $props();

  let config = $state<ProjectConfig>({
    remote: "origin",
    sync: "manual",
    gitRepositories: [],
  });

  let projectRoot = $state<string | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let newGitRepo = $state("");

  $effect(() => {
    loadConfig();
  });

  async function loadConfig() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      projectRoot = data.projectRoot;
      if (data.project) {
        config = data.project;
      }
    } catch (e) {
      console.error("Failed to load config:", e);
    } finally {
      loading = false;
    }
  }

  async function saveConfig() {
    saving = true;
    try {
      const res = await fetch("/api/config/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        onSave("プロジェクト設定を保存しました", "success");
      } else {
        const data = await res.json();
        onSave(data.error || "保存に失敗しました", "error");
      }
    } catch (e) {
      onSave("保存に失敗しました", "error");
    } finally {
      saving = false;
    }
  }

  function handleLLMChange(llmConfig: LLMConfig) {
    config = { ...config, llm: llmConfig };
  }

  async function browseGitRepo() {
    try {
      const res = await fetch("/api/browse-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Gitリポジトリを選択", directory: true }),
      });
      const data = await res.json();
      if (data.path) {
        addGitRepo(data.path);
      }
    } catch (e) {
      console.error("Failed to browse:", e);
    }
  }

  function addGitRepo(path?: string) {
    const repoPath = path || newGitRepo.trim();
    if (repoPath && !config.gitRepositories?.includes(repoPath)) {
      config = {
        ...config,
        gitRepositories: [...(config.gitRepositories || []), repoPath],
      };
      newGitRepo = "";
    }
  }

  function removeGitRepo(index: number) {
    const repos = [...(config.gitRepositories || [])];
    repos.splice(index, 1);
    config = { ...config, gitRepositories: repos };
  }
</script>

<div class="config-form">
  {#if loading}
    <div class="loading">読み込み中...</div>
  {:else if !projectRoot}
    <div class="no-project">
      <div class="no-project-icon">📁</div>
      <h3>プロジェクトが見つかりません</h3>
      <p>hibiプロジェクト内でこのコマンドを実行してください。</p>
      <code>hibi init</code>
    </div>
  {:else}
    <div class="project-info">
      <span class="project-label">プロジェクトルート:</span>
      <code>{projectRoot}</code>
    </div>

    <div class="section">
      <h3 class="section-title">同期設定</h3>
      <div class="form-group">
        <label class="form-label" for="project-remote">リモート名</label>
        <input
          id="project-remote"
          type="text"
          class="form-input"
          bind:value={config.remote}
          placeholder="origin"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="project-sync">同期モード</label>
        <select id="project-sync" class="form-select" bind:value={config.sync}>
          <option value="manual">手動 (manual)</option>
          <option value="auto">自動 (auto)</option>
          <option value="daily">日次 (daily)</option>
        </select>
        <p class="form-hint">
          {#if config.sync === "manual"}
            hibi sync コマンドで手動同期
          {:else if config.sync === "auto"}
            各コマンド実行時に自動同期
          {:else}
            日付変更時に自動同期
          {/if}
        </p>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">LLM 設定（プロジェクト固有）</h3>
      <p class="hint">設定するとグローバル設定を上書きします</p>
      <LLMSettings
        config={config.llm || { provider: "none" }}
        onChange={handleLLMChange}
        idPrefix="project"
      />
    </div>

    <div class="section">
      <h3 class="section-title">Git リポジトリ（ログ取得用）</h3>
      <div class="git-repos">
        {#each config.gitRepositories || [] as repo, i}
          <div class="git-repo-item">
            <code>{repo}</code>
            <button class="btn-remove" onclick={() => removeGitRepo(i)}
              >✕</button
            >
          </div>
        {/each}
      </div>
      <div class="add-repo">
        <div class="input-group">
          <input
            aria-label="新しいリポジトリパス"
            type="text"
            class="form-input"
            bind:value={newGitRepo}
            placeholder="リポジトリパスを入力"
            onkeydown={(e) => e.key === "Enter" && addGitRepo()}
          />
          <button
            class="btn btn-secondary btn-icon"
            onclick={browseGitRepo}
            title="参照"
          >
            📂
          </button>
          <button class="btn btn-secondary" onclick={() => addGitRepo()}
            >追加</button
          >
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick={saveConfig} disabled={saving}>
        {#if saving}
          保存中...
        {:else}
          💾 設定を保存
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .no-project {
    text-align: center;
    padding: 3rem 2rem;
  }

  .no-project-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .no-project h3 {
    margin-bottom: 0.5rem;
  }

  .no-project p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .no-project code {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--bg-tertiary);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .project-info {
    padding: 0.75rem 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .project-label {
    color: var(--text-secondary);
    margin-right: 0.5rem;
  }

  .form-hint,
  .hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .hint {
    margin-bottom: 1rem;
  }

  .git-repos {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .git-repo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--bg-tertiary);
    border-radius: 6px;
  }

  .git-repo-item code {
    font-size: 0.875rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-remove {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin-left: 0.5rem;
    transition: color 0.2s;
  }

  .btn-remove:hover {
    color: var(--error);
  }

  .add-repo {
    margin-top: 0.5rem;
  }

  .actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
  }
</style>
