<script lang="ts">
  import { autoPlay, changedAreas, game } from "$lib/stores";
  import { saveGame } from "$lib/storage";
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

    $changedAreas.render = true;
    // Auto-save after simulation completes
    saveGame();
  }

  const seasonEmoji = {
    Spring: "🌿",
    Summer: "☀️",
    Autumn: "🍂",
    Winter: "❄️",
  } as const;
</script>

<div class="container" style:padding={"0 1rem"} style:height="6rem">
  <div class="lWing" />
  <div class="lExt" />
  <div class="mid" />
  <div class="rExt" />
  <div class="rWing" />
</div>
<div class="container" style:padding={"2.7rem"} style:align-items={"baseline"}>
  <div class="season">
    {seasonEmoji[$game.season]}
  </div>
  <div>
    Year {$game.currentYear || 0}, Day {$game.currentDay || 1}
    {$game.currentPeriod}
  </div>
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
    <input type="checkbox" bind:checked={$autoPlay} />
    Autoplay
  </div>
</div>

<style>
  .container {
    position: absolute;
    width: calc(100vw - 2rem);
    display: flex;
    flex-wrap: wrap;
    z-index: 1;
  }
  .lWing,
  .rWing {
    width: 2.5rem;
    background-size: 100% 100%;
  }
  .lWing {
    background-image: url("sprites/Extras/Title Banner 1 (flex) left.png");
  }
  .rWing {
    background-image: url("sprites/Extras/Title Banner 1 (flex) right.png");
  }

  .lExt {
    flex-grow: 1;
    background-size: 100% 100%;
    background-image: url("sprites/Extras/Title Banner 1 (flex) left extension.png");
  }
  .mid {
    background-image: url("sprites/Extras/Title Banner 1 (flex) mid.png");
    width: 6.1rem;
    background-size: 100% 100%;
  }
  .rExt {
    flex-grow: 1;
    background-size: 100% 100%;
    background-image: url("sprites/Extras/Title Banner 1 (flex) right extension.png");
  }
  button {
    padding: 0;
    font-size: 1.3em;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
  }
  button:hover {
    transform: translateY(-3px);
  }
</style>
