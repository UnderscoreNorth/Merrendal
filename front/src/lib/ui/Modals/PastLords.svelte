<script lang="ts">
  import { game, openModals } from "$lib/stores";
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<h1>
  Past Lords <span
    class="close"
    style:float="right"
    on:click={() => {
      $openModals["pastLords"] = false;
    }}>❌</span
  >
</h1>
<div style:overflow-y={"auto"} style:max-height={"50vh"}>
  {#each [...$game.pastLords].reverse() as lord}
    <hr />
    <div>
      <div class="lord-details">
        <img
          class="lord-icon"
          src={`icons/lordBackgrounds/${lord.background}.png`}
          alt="lord icon"
        />
        <div class="lord-text">
          <h3>
            {lord.fName}
          </h3>
          <div class="background">{lord.background}, {lord.goal.desc}</div>
          <div class="lord-stats">
            <span>Age: {lord.age}</span>
            <span
              >{lord.causeOfDeath ? "Died of " + lord.causeOfDeath : ""}</span
            >
          </div>
          <br />
          Reign
          <hr />
          <div class="lord-stats">
            <span>Start: Year {lord.date.year}, Day {lord.date.day}</span>
            <span>Length: {lord.reign} year{lord.reign == 1 ? "" : "s"}</span>
            <span>Born: {lord.reignStats.born}</span>
            <span>Died: {lord.reignStats.died}</span>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .close:hover {
    cursor: pointer;
  }
  .lord-details {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .lord-icon {
    height: 4rem;
    width: 4rem;
    object-fit: cover;
    border-radius: 4px;
  }

  .lord-text {
    flex: 1;
    text-align: left;
  }

  .lord-text h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
  }

  .background {
    font-style: italic;
    margin: 0 0 1rem 0;
  }

  .lord-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>
