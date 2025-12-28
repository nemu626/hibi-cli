<script lang="ts">
  interface Props {
    label: string;
    value: string;
    placeholder?: string;
    onBrowse: () => void;
    onInput: (value: string) => void;
    id?: string;
  }

  const {
    label,
    value,
    placeholder = "",
    onBrowse,
    onInput,
    id = "file-picker",
  }: Props = $props();
</script>

<div class="form-group">
  <label class="form-label" for={id}>{label}</label>
  <div class="input-group">
    <input
      type="text"
      {id}
      class="form-input"
      {value}
      {placeholder}
      oninput={(e) => onInput((e.target as HTMLInputElement).value)}
    />
    <button
      type="button"
      class="btn btn-secondary btn-icon"
      onclick={onBrowse}
      title="参照（ファイルダイアログを開きます。動作しない場合は直接パスを入力してください）"
    >
      📂
    </button>
  </div>
  <p class="file-hint">
    💡 ボタンが動作しない場合は、パスを直接入力してください
  </p>
</div>

<style>
  .file-hint {
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    opacity: 0.7;
  }
</style>
