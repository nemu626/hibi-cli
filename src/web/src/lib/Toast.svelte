<script lang="ts">
interface Props {
    message: string;
    type: "success" | "error";
}

const { message, type }: Props = $props();
</script>

<div class="toast-container">
  <div class="toast toast-{type}">
    {#if type === 'success'}
      ✓
    {:else}
      ✕
    {/if}
    {message}
  </div>
</div>
