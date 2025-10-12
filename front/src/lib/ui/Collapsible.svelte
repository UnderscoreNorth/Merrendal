<script lang="ts">
  import { openModals } from "$lib/stores";

  export let headerName: string;
  export let headerType: 1 | 2 | 3;
  export let hidden: boolean;
  export let modal: string = "";
  export let modalData: any = "";
</script>

<div
  on:dblclick={() => {
    hidden = !hidden;
  }}
>
  <h2 style:font-size={headerType == 3 ? "1.17em" : ""}>
    <button class="btn-collapse" on:click={() => (hidden = !hidden)}
      >{hidden ? "+" : "-"}</button
    >
    <span>{headerName}</span>
    {#if modal}
      <button
        class="btn-modal"
        on:click={() => {
          $openModals[modal] = modalData == "" ? true : modalData;
        }}>🔍</button
      >
    {/if}
  </h2>
</div>
{#if !hidden}
  <div style:padding="0.5rem" class={headerType == 2 ? "container" : ""}>
    <slot />
  </div>
{/if}

<style>
  h2 {
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
  .btn-collapse {
    font-family: inherit;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
  }

  .btn-modal {
    padding: 0;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
  }
  .btn-modal:hover {
    transform: translateY(-3px);
  }
</style>
