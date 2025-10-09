<script>
  import { game } from "$lib/stores";
</script>

{#if $game.activeEvents}
  <hr />
{/if}
{#each $game.activeEvents as event}
  <div class="eventContainer">
    <div style:font-size="1.3rem">{event.id}</div>
    <button>🔍</button>
    <div><i>{event.desc}</i></div>
  </div>
  <hr />
{/each}

<style>
  .eventContainer {
    display: grid;
    grid-template-columns: auto min-content;
    grid-template-rows: 1fr 1fr;
  }

  button {
    padding: 0;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
    grid-row: span 2;
  }
  button:hover {
    transform: translateY(-3px);
  }
</style>
