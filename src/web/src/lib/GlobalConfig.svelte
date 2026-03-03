<script lang="ts">
  import type { GlobalConfig, LLMConfig } from "../types";
  import FilePicker from "./FilePicker.svelte";
  import LLMSettings from "./LLMSettings.svelte";

  interface Props {
    onSave: (message: string, type: "success" | "error") => void;
  }

  const { onSave }: Props = $props();

  let config = $state<GlobalConfig>({
    llm: { provider: "none" },
    editor: "",
    defaultProject: "default",
    historyFile: "",
  });

  let loading = $state(true);
  let saving = $state(false);

  $effect(() => {
    loadConfig();
  });

  async function loadConfig() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      config = data.global || {
        llm: { provider: "none" },
        editor: "",
        defaultProject: "default",
        historyFile: "",
      };
    } catch (e) {
      console.error("Failed to load config:", e);
    } finally {
      loading = false;
    }
  }

  async function saveConfig() {
    saving = true;
    try {
      const res = await fetch("/api/config/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        onSave("グローバル設定を保存しました", "success");
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

  async function browseHistoryFile() {
    try {
      const res = await fetch("/api/browse-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "シェル履歴ファイルを選択" }),
      });
      const data = await res.json();
      if (data.path) {
        config = { ...config, historyFile: data.path };
      }
    } catch (e) {
      console.error("Failed to browse file:", e);
    }
  }
</script>

<div class="config-form">
  {#if loading}
    <div class="loading">読み込み中...</div>
  {:else}
    <div class="section">
      <h3 class="section-title">LLM 設定</h3>
      <LLMSettings
        config={config.llm || { provider: "none" }}
        onChange={handleLLMChange}
        idPrefix="global"
      />
    </div>

    <div class="section">
      <h3 class="section-title">エディタ設定</h3>
      <div class="form-group">
        <label class="form-label" for="global-editor">デフォルトエディタ</label>
        <input
          id="global-editor"
          type="text"
          class="form-input"
          bind:value={config.editor}
          placeholder="vi"
        />
        <p class="form-hint">環境変数 $EDITOR が優先されます</p>
      </div>

      <div class="form-group">
        <label class="form-label" for="global-default-project"
          >デフォルトプロジェクト</label
        >
        <input
          id="global-default-project"
          type="text"
          class="form-input"
          bind:value={config.defaultProject}
          placeholder="default"
        />
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">シェル履歴</h3>
      <FilePicker
        label="履歴ファイルパス"
        value={config.historyFile || ""}
        placeholder="~/.zsh_history"
        onBrowse={browseHistoryFile}
        onInput={(v) => (config = { ...config, historyFile: v })}
        id="history-file"
      />
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

  .form-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
  }
</style>
