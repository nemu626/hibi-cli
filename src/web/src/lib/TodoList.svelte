<script lang="ts">
    interface Task {
        id: number;
        text: string;
        status: "todo" | "done";
        indent: number;
    }

    interface Props {
        tasks: Task[];
        onAddTask: (text: string) => void;
        onAddChildTask: (parentId: number, text: string) => void;
        onCompleteTask: (taskId: number) => void;
        onUncompleteTask: (taskId: number) => void;
        onUpdateTask: (taskId: number, text: string) => void;
    }

    let {
        tasks,
        onAddTask,
        onAddChildTask,
        onCompleteTask,
        onUncompleteTask,
        onUpdateTask,
    }: Props = $props();
    let newTaskText = $state("");
    let addingChildForId = $state<number | null>(null);
    let childTaskText = $state("");
    let editingTaskId = $state<number | null>(null);
    let editTaskText = $state("");

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask(newTaskText.trim());
            newTaskText = "";
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }

    function startAddChild(taskId: number) {
        addingChildForId = taskId;
        childTaskText = "";
        editingTaskId = null;
    }

    function cancelAddChild() {
        addingChildForId = null;
        childTaskText = "";
    }

    function submitChildTask(parentId: number) {
        if (childTaskText.trim()) {
            onAddChildTask(parentId, childTaskText.trim());
            addingChildForId = null;
            childTaskText = "";
        }
    }

    function handleChildKeydown(e: KeyboardEvent, parentId: number) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitChildTask(parentId);
        } else if (e.key === "Escape") {
            cancelAddChild();
        }
    }

    function startEditTask(task: Task) {
        editingTaskId = task.id;
        editTaskText = task.text;
        addingChildForId = null;
    }

    function cancelEditTask() {
        editingTaskId = null;
        editTaskText = "";
    }

    function submitEditTask(taskId: number) {
        if (editTaskText.trim()) {
            onUpdateTask(taskId, editTaskText.trim());
            editingTaskId = null;
            editTaskText = "";
        }
    }

    function handleEditKeydown(e: KeyboardEvent, taskId: number) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitEditTask(taskId);
        } else if (e.key === "Escape") {
            cancelEditTask();
        }
    }

    function handleCheckboxChange(task: Task) {
        if (task.status === "todo") {
            onCompleteTask(task.id);
        } else {
            onUncompleteTask(task.id);
        }
    }
</script>

<div class="todo-list">
    <form class="add-task-form" onsubmit={handleSubmit}>
        <input
            type="text"
            class="task-input"
            placeholder="新しいタスクを追加..."
            bind:value={newTaskText}
            onkeydown={handleKeydown}
        />
        <button type="submit" class="add-btn" disabled={!newTaskText.trim()}>
            追加
        </button>
    </form>

    <ul class="tasks">
        {#each tasks as task (task.id)}
            <li class="task-item" style:padding-left="{task.indent * 1.5}rem">
                {#if editingTaskId === task.id}
                    <!-- Edit Mode -->
                    <div class="edit-task-form">
                        <input
                            type="text"
                            class="edit-task-input"
                            bind:value={editTaskText}
                            onkeydown={(e) => handleEditKeydown(e, task.id)}
                        />
                        <button
                            class="action-btn action-btn-save"
                            onclick={() => submitEditTask(task.id)}
                            disabled={!editTaskText.trim()}
                        >
                            保存
                        </button>
                        <button
                            class="action-btn action-btn-cancel"
                            onclick={cancelEditTask}
                        >
                            ✕
                        </button>
                    </div>
                {:else}
                    <!-- View Mode -->
                    <div class="task-row">
                        <span class="task-id">#{task.id}</span>
                        <label
                            class="checkbox-label"
                            class:done={task.status === "done"}
                        >
                            <input
                                type="checkbox"
                                class="checkbox"
                                checked={task.status === "done"}
                                onchange={() => handleCheckboxChange(task)}
                            />
                            <span class="checkmark">
                                {#if task.status === "done"}✓{/if}
                            </span>
                            <span class="task-text">{task.text}</span>
                        </label>
                        <div class="task-actions">
                            <button
                                class="icon-btn"
                                title="編集"
                                onclick={() => startEditTask(task)}
                            >
                                ✏️
                            </button>
                            {#if task.status === "todo"}
                                <button
                                    class="icon-btn"
                                    title="子タスクを追加"
                                    onclick={() => startAddChild(task.id)}
                                >
                                    ➕
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}

                {#if addingChildForId === task.id}
                    <div
                        class="child-task-form"
                        style:margin-left="{(task.indent + 1) * 1.5}rem"
                    >
                        <input
                            type="text"
                            class="child-task-input"
                            placeholder="子タスクを入力..."
                            bind:value={childTaskText}
                            onkeydown={(e) => handleChildKeydown(e, task.id)}
                        />
                        <button
                            class="action-btn action-btn-save"
                            onclick={() => submitChildTask(task.id)}
                            disabled={!childTaskText.trim()}
                        >
                            追加
                        </button>
                        <button
                            class="action-btn action-btn-cancel"
                            onclick={cancelAddChild}
                        >
                            ✕
                        </button>
                    </div>
                {/if}
            </li>
        {/each}
    </ul>

    {#if tasks.length === 0}
        <p class="empty-state">
            タスクがありません。上のフォームから追加してください。
        </p>
    {/if}
</div>

<style>
    .todo-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
    }

    .add-task-form {
        display: flex;
        gap: 0.5rem;
    }

    .task-input {
        flex: 1;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.875rem;
        transition:
            border-color 0.2s,
            background 0.2s;
    }

    .task-input:focus {
        outline: none;
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.05);
    }

    .task-input::placeholder {
        color: var(--text-secondary);
    }

    .add-btn {
        padding: 0.75rem 1.25rem;
        background: var(--primary);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .add-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .add-btn:not(:disabled):hover {
        opacity: 0.9;
    }

    .tasks {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        overflow-y: auto;
    }

    .task-item {
        animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .task-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .checkbox-label {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .checkbox-label:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .checkbox-label.done {
        opacity: 0.6;
    }

    .checkbox {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .task-id {
        font-size: 0.7rem;
        color: var(--text-secondary);
        opacity: 0.5;
        min-width: 2rem;
        text-align: right;
        font-family: "SF Mono", "Monaco", "Menlo", monospace;
    }

    .checkmark {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--glass-border);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        color: var(--accent);
        transition: all 0.2s;
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.03);
    }

    .checkbox:checked + .checkmark {
        background: var(--accent);
        border-color: var(--accent);
        color: white;
    }

    .checkbox:not(:checked) + .checkmark:hover {
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.08);
    }

    .task-text {
        flex: 1;
        font-size: 0.9rem;
    }

    .done .task-text {
        text-decoration: line-through;
        color: var(--text-secondary);
    }

    .task-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
        min-width: 60px;
        justify-content: flex-end;
    }

    .task-row:hover .task-actions {
        opacity: 1;
    }

    .icon-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .icon-btn:hover {
        background: var(--primary);
        color: white;
    }

    .edit-task-form,
    .child-task-form {
        display: flex;
        gap: 0.375rem;
        animation: slideIn 0.15s ease;
    }

    .child-task-form {
        margin-top: 0.5rem;
    }

    .edit-task-input,
    .child-task-input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.8rem;
    }

    .edit-task-input:focus,
    .child-task-input:focus {
        outline: none;
        border-color: var(--primary);
    }

    .edit-task-input::placeholder,
    .child-task-input::placeholder {
        color: var(--text-secondary);
    }

    .action-btn {
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn-save {
        background: var(--accent);
        color: white;
    }

    .action-btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .action-btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
    }

    .action-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .empty-state {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.875rem;
        padding: 2rem 1rem;
    }
</style>
