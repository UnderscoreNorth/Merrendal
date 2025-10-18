<script lang="ts">
  import { autoPlay, game } from "$lib/stores";

  import { simulateDay } from "$lib/simulation";
  let debounce = false;
  async function runDays(number: number, fast = false) {
    if (debounce) return;
    debounce = true;
    $game.render = false;
    for (let i = 0; i < number; i++) {
      simulateDay();
      if ($game.pause) break;
      if (!fast || (fast && i % 90 == 0)) {
        await new Promise((r) => setTimeout(r, 1));
      }
    }
    $game.render = true;
    debounce = false;
  }

  const seasonEmoji = {
    Spring: "🌿",
    Summer: "☀️",
    Autumn: "🍂",
    Winter: "❄️",
  } as const;
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.code == "Space") runDays(1);
  }} />

<div class="time-display">
  <div class="season">
    {seasonEmoji[$game.season]}
  </div>
  <h2>
    Year {$game.currentYear || 0}, Day {$game.currentDay || 1}
  </h2>
  <div class="control-buttons">
    <button
      disabled={$game.pending}
      class="primary-btn"
      on:click={() => runDays(1)}>▶️</button>
    <button
      disabled={$game.pending}
      class="primary-btn"
      on:click={() => runDays(90 * 3)}>⏩</button>
    <button
      disabled={$game.pending}
      class="primary-btn"
      on:click={() => runDays(365 * 3)}>⏭️</button>
    <button
      disabled={$game.pending}
      class="primary-btn"
      on:click={() => runDays(365 * 10 * 3, true)}>🔁️</button>
  </div>
  <div style:grid-area="3 / 2 / 4 / 3">
    {$game.currentPeriod} <input type="checkbox" bind:checked={$autoPlay} />
    Autoplay
  </div>
  {#if $game.pending}
    <div class="pendingWarning">Active choice pending</div>
  {/if}
</div>

<style>
  .pendingWarning {
    grid-area: 4 / 1 / 5 / 3;
  }
  .time-display {
    display: grid;
    grid-template-columns: min-content;
    grid-template-rows: auto min-content min-content;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    width: 15rem;
  }
  .time-display h2 {
    margin: 0;
    grid-area: 1 / 2 / 2 / 3;
  }
  .season {
    grid-area: 1 / 1 / 4 / 2;
    font-size: 2.5rem;
    text-shadow: 1px 1px 2px black;
  }
  .control-buttons {
    grid-area: 2 / 2 / 3 / 3;
  }

  .primary-btn {
    padding: 0;
    font-size: 1.3em;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
  }
  .primary-btn:hover {
    transform: translateY(-3px);
  }
</style>
