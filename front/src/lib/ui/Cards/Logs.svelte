<script lang="ts">
  import { game } from "$lib/stores";
  let filters: Set<string> = new Set();
  $: tags = Array.from(new Set($game.log.map((i) => i.tags).flat())).sort();
  function showTag({ tags }: { tags: string[] }) {
    if (filters.size == 0) return true;
    for (const tag of tags) {
      if (filters.has(tag)) return true;
    }
    return false;
  }
  function toggleTag(tag: string) {
    if (filters.size == 0) {
      filters.add(tag);
    } else {
      if (filters.has(tag)) {
        filters.delete(tag);
      } else {
        filters.add(tag);
      }
    }
    filters = new Set(Array.from(filters));
  }
</script>

<button on:click={() => (filters = new Set())}>All</button>
{#each tags as tag}
  <button
    class={filters.has(tag) ? "checked" : ""}
    on:click={() => toggleTag(tag)}>{tag}</button
  >
{/each}
<table>
  <tr><th>Year</th><th>Day</th><th>Msg</th></tr>
  {#key filters}
    {#each $game.log.slice(0, 100) as log}
      {#if showTag(log)}
        <tr><td>{log.year}</td><td>{log.day}</td><td>{@html log.msg}</td></tr>
      {/if}
    {/each}
  {/key}
</table>

<style>
  button {
    font-family: inherit;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
    padding: 6px;
    transition: all 0.2s ease;
    margin: 3px;
  }
  button:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  button.checked {
    background: rgb(0, 54, 0);
  }
</style>
