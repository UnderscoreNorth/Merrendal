<script lang="ts">
  export let headerName: string;
  export let headerType: 1 | 2 | 3;
  export let hidden: boolean;
</script>

<div
  on:dblclick={() => {
    hidden = !hidden;
  }}
>
  {#if headerType == 1}
    <h1>
      <button on:click={() => (hidden = !hidden)}>{hidden ? "+" : "-"}</button>
      <span>{headerName}</span>
    </h1>
  {:else if headerType == 2}
    <h2>
      <button on:click={() => (hidden = !hidden)}>{hidden ? "+" : "-"}</button>
      <span>{headerName}</span>
    </h2>
  {:else}
    <h3>
      <button on:click={() => (hidden = !hidden)}>{hidden ? "+" : "-"}</button>
      <span>{headerName}</span>
    </h3>
  {/if}
</div>
{#if !hidden}
  <div style:padding="0.5rem" class={headerType == 2 ? "container" : ""}>
    <slot />
  </div>
{/if}

<style>
  h1,
  h2,
  h3 {
    margin: 0;
    display: flex;
    gap: 0.5rem;
  }
  .container {
    max-height: 80vh;
    overflow-y: auto;
  }
  span {
    flex-grow: 1;
  }
  button {
    font-family: inherit;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
  }
</style>
