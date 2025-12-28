<script lang="ts">
  import GlobalConfig from "./lib/GlobalConfig.svelte";
  import ProjectConfig from "./lib/ProjectConfig.svelte";
  import Toast from "./lib/Toast.svelte";

  let activeTab = $state<"global" | "project">("global");
  let toastMessage = $state("");
  let toastType = $state<"success" | "error">("success");
  let showToast = $state(false);

  function showNotification(message: string, type: "success" | "error") {
    toastMessage = message;
    toastType = type;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 3000);
  }
</script>

<main>
  <div class="container">
    <header class="header">
      <h1>⚙️ hibi 設定</h1>
      <p class="subtitle">日報管理ツールの設定を編集</p>
    </header>

    <div class="tabs">
      <button
        class="tab"
        class:active={activeTab === "global"}
        onclick={() => (activeTab = "global")}
      >
        🌐 グローバル設定
      </button>
      <button
        class="tab"
        class:active={activeTab === "project"}
        onclick={() => (activeTab = "project")}
      >
        📁 プロジェクト設定
      </button>
    </div>

    <div class="content glass-card">
      {#if activeTab === "global"}
        <GlobalConfig onSave={(msg, type) => showNotification(msg, type)} />
      {:else}
        <ProjectConfig onSave={(msg, type) => showNotification(msg, type)} />
      {/if}
    </div>
  </div>

  {#if showToast}
    <Toast message={toastMessage} type={toastType} />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%);
    padding: 2rem;
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
    animation: fadeIn 0.5s ease;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .content {
    padding: 2rem;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
