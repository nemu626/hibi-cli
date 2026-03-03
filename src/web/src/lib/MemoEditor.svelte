<script lang="ts">
    import { marked } from "marked";

    interface Props {
        content: string;
        onUpdate: (content: string) => void;
    }

    let { content, onUpdate }: Props = $props();

    let isEditing = $state(false);
    let editContent = $state("");
    let isSaving = $state(false);

    // Convert Markdown to HTML
    const renderedHtml = $derived(() => {
        if (!content || content.trim() === "") {
            return "<p class='empty-memo'>メモがありません</p>";
        }
        return marked(content, { breaks: true });
    });

    function startEditing() {
        editContent = content;
        isEditing = true;
    }

    function cancelEditing() {
        editContent = "";
        isEditing = false;
    }

    async function saveChanges() {
        isSaving = true;
        await onUpdate(editContent);
        isSaving = false;
        isEditing = false;
    }
</script>

<div class="memo-editor">
    {#if isEditing}
        <!-- Edit Mode -->
        <div class="editor-header">
            <span class="mode-label">✏️ 編集中</span>
            <div class="action-buttons">
                <button
                    class="btn btn-cancel"
                    onclick={cancelEditing}
                    disabled={isSaving}
                >
                    キャンセル
                </button>
                <button
                    class="btn btn-save"
                    onclick={saveChanges}
                    disabled={isSaving}
                >
                    {#if isSaving}
                        保存中...
                    {:else}
                        💾 保存
                    {/if}
                </button>
            </div>
        </div>

        <textarea
            class="editor-textarea"
            placeholder="Markdownでメモを入力..."
            bind:value={editContent}
        ></textarea>

        <div class="editor-footer">
            <span class="char-count">{editContent.length} 文字</span>
            <span class="hint">Markdown記法が使えます</span>
        </div>
    {:else}
        <!-- View Mode -->
        <div class="editor-header">
            <span class="mode-label">📖 閲覧モード</span>
            <button class="btn btn-edit" onclick={startEditing}>
                ✏️ 編集
            </button>
        </div>

        <div class="markdown-view">
            {@html renderedHtml()}
        </div>
    {/if}
</div>

<style>
    .memo-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        margin-bottom: 0.75rem;
        border-bottom: 1px solid var(--glass-border);
    }

    .mode-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .btn {
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-edit {
        background: var(--primary);
        color: white;
    }

    .btn-edit:hover:not(:disabled) {
        opacity: 0.9;
    }

    .btn-save {
        background: var(--accent);
        color: white;
    }

    .btn-save:hover:not(:disabled) {
        opacity: 0.9;
    }

    .btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    .btn-cancel:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
    }

    .editor-textarea {
        flex: 1;
        width: 100%;
        min-height: 280px;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-family: "SF Mono", "Monaco", "Menlo", monospace;
        line-height: 1.6;
        resize: vertical;
        transition:
            border-color 0.2s,
            background 0.2s;
    }

    .editor-textarea:focus {
        outline: none;
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.05);
    }

    .editor-textarea::placeholder {
        color: var(--text-secondary);
    }

    .editor-footer {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .hint {
        opacity: 0.7;
    }

    .markdown-view {
        flex: 1;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        overflow-y: auto;
        min-height: 280px;
    }

    /* Markdown rendered content styles */
    .markdown-view :global(h1),
    .markdown-view :global(h2),
    .markdown-view :global(h3),
    .markdown-view :global(h4) {
        margin: 0.5em 0;
        color: var(--text-primary);
    }

    .markdown-view :global(h1) {
        font-size: 1.5rem;
        border-bottom: 1px solid var(--glass-border);
        padding-bottom: 0.3em;
    }

    .markdown-view :global(h2) {
        font-size: 1.25rem;
    }

    .markdown-view :global(h3) {
        font-size: 1.1rem;
    }

    .markdown-view :global(p) {
        margin: 0.5em 0;
        line-height: 1.6;
        color: var(--text-primary);
    }

    .markdown-view :global(ul),
    .markdown-view :global(ol) {
        margin: 0.5em 0;
        padding-left: 1.5em;
        color: var(--text-primary);
    }

    .markdown-view :global(li) {
        margin: 0.25em 0;
    }

    .markdown-view :global(code) {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: "SF Mono", "Monaco", "Menlo", monospace;
        font-size: 0.9em;
    }

    .markdown-view :global(pre) {
        background: rgba(0, 0, 0, 0.3);
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 0.5em 0;
    }

    .markdown-view :global(pre code) {
        background: transparent;
        padding: 0;
    }

    .markdown-view :global(blockquote) {
        border-left: 3px solid var(--primary);
        margin: 0.5em 0;
        padding-left: 1rem;
        color: var(--text-secondary);
    }

    .markdown-view :global(a) {
        color: #60a5fa;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .markdown-view :global(a:hover) {
        color: #93c5fd;
        text-decoration: underline;
    }

    .markdown-view :global(.empty-memo) {
        color: var(--text-secondary);
        font-style: italic;
        text-align: center;
        padding: 2rem;
    }

    .markdown-view :global(hr) {
        border: none;
        border-top: 1px solid var(--glass-border);
        margin: 1em 0;
    }

    .markdown-view :global(strong) {
        font-weight: 600;
    }

    .markdown-view :global(em) {
        font-style: italic;
    }
</style>
