<script lang="ts">
  import type { LLMConfig } from "../types";

  interface Props {
    config: LLMConfig;
    onChange: (config: LLMConfig) => void;
    idPrefix?: string;
  }

  const { config, onChange, idPrefix = "llm" }: Props = $props();

  const providers = [
    { value: "none", label: "使用しない" },
    { value: "openai", label: "OpenAI" },
    { value: "gemini", label: "Google Gemini" },
    { value: "ollama", label: "Ollama (ローカル)" },
    { value: "claude", label: "Claude" },
  ];

  const modelOptions: Record<string, string[]> = {
    openai: [
      "gpt-5.2",
      "gpt-5.2-codex",
      "gpt-5.1",
      "gpt-5",
      "o3",
      "o3-mini",
      "o3-pro",
      "o1",
      "o1-mini",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    gemini: [
      "gemini-3-flash",
      "gemini-3-pro",
      "gemini-3-deep-think",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    ollama: [
      "llama3.3",
      "llama3.2",
      "llama3.1",
      "deepseek-r1",
      "deepseek-coder-v2",
      "qwen3",
      "qwen2.5-coder",
      "qwen2.5",
      "mistral",
      "codellama",
    ],
    claude: [
      "claude-opus-4.5",
      "claude-sonnet-4.5",
      "claude-haiku-4.5",
      "claude-opus-4",
      "claude-sonnet-4",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
  };

  function handleProviderChange(provider: string) {
    const newConfig: LLMConfig = {
      ...config,
      provider: provider as LLMConfig["provider"],
      model: modelOptions[provider]?.[0] || undefined,
      apiKey: undefined,
      endpoint: undefined,
    };
    onChange(newConfig);
  }

  function handleModelChange(model: string) {
    onChange({ ...config, model });
  }

  function handleApiKeyChange(apiKey: string) {
    onChange({ ...config, apiKey: apiKey || undefined });
  }

  function handleEndpointChange(endpoint: string) {
    onChange({ ...config, endpoint: endpoint || undefined });
  }

  $effect(() => {
    // 初期値がない場合のデフォルト設定
    if (!config.provider) {
      onChange({ provider: "none" });
    }
  });
</script>

<div class="llm-settings">
  <div class="form-group">
    <label class="form-label" for="{idPrefix}-provider">LLM プロバイダー</label>
    <select
      id="{idPrefix}-provider"
      class="form-select"
      value={config.provider || "none"}
      onchange={(e) =>
        handleProviderChange((e.target as HTMLSelectElement).value)}
    >
      {#each providers as provider}
        <option value={provider.value}>{provider.label}</option>
      {/each}
    </select>
  </div>

  {#if config.provider && config.provider !== "none"}
    <div class="form-group fade-in">
      <label class="form-label" for="{idPrefix}-model">モデル</label>
      <select
        id="{idPrefix}-model"
        class="form-select"
        value={config.model || ""}
        onchange={(e) =>
          handleModelChange((e.target as HTMLSelectElement).value)}
      >
        {#each modelOptions[config.provider] || [] as model}
          <option value={model}>{model}</option>
        {/each}
      </select>
    </div>

    {#if config.provider === "ollama"}
      <div class="form-group fade-in">
        <label class="form-label" for="{idPrefix}-endpoint">Endpoint URL</label>
        <input
          id="{idPrefix}-endpoint"
          type="text"
          class="form-input"
          value={config.endpoint || ""}
          placeholder="http://localhost:11434"
          oninput={(e) =>
            handleEndpointChange((e.target as HTMLInputElement).value)}
        />
        <p class="form-hint">Ollamaサーバーのアドレス</p>
      </div>
    {:else}
      <div class="form-group fade-in">
        <label class="form-label" for="{idPrefix}-apikey">API Key</label>
        <input
          id="{idPrefix}-apikey"
          type="password"
          class="form-input"
          value={config.apiKey || ""}
          placeholder={config.provider === "openai"
            ? "sk-..."
            : "API Key を入力"}
          oninput={(e) =>
            handleApiKeyChange((e.target as HTMLInputElement).value)}
        />
        <p class="form-hint">環境変数 HIBI_LLM_API_KEY でも設定可能</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .form-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .llm-settings :global(.fade-in) {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
