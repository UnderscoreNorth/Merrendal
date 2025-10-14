<script lang="ts">
  import { choiceMap } from "$lib/data/choices";
  import { type ItemRecord } from "$lib/data/items";
  import { generateLords, type Lord } from "$lib/data/lords";
  import { log } from "$lib/simulation/log";
  import { getNeedKey, type Need } from "$lib/simulation/needs";
  import { autoPlay, game } from "$lib/stores";
  import { pText } from "$lib/util/pText";
  import { recordLoop } from "$lib/util/recordLoop";
  import { pick } from "$lib/util/rolls";
  //import { event_AlchemicalObsession } from "$lib/data/events/alchemicalObsession";
  const lords = generateLords();
  const pickedLord = pick(lords);
  if ($autoPlay) {
    selectLord(pickedLord.lord, pickedLord.bonuses);
  } else {
    $game.pause = true;
  }
  function selectLord(lord: Lord, bonuses: ItemRecord) {
    lord.date = { day: $game.currentDay, year: $game.currentYear };
    $game.lord = lord;

    for (const [item, num] of recordLoop(bonuses)) {
      if (num !== undefined)
        $game.inventory[item] = ($game.inventory[item] || 0) + num;
    }
    for (const requirement of lord.goal.requirements) {
      if (requirement.type == "item") {
        const need: Need = {
          type: "item",
          primary: true,
          priority: 10,
          item: requirement.data,
          num: requirement.num,
          repeating: false,
        };
        const key = getNeedKey(need);
        $game.needs[key] = need;
      }
    }
    $game.pending = false;
    log(
      $game,
      `Lord ${lord.fName}, the ${lord.background} has become the new lord`,
      ["Event"],
    );
    $game.choiceEvents.push(choiceMap["First Impression"]);

    // Trigger Alchemical Obsession event if lord has "Discover Alchemy" goal
    /*if (lord.goal.name === "Discover Alchemy") {
      $game.activeEvents.push(
        new event_AlchemicalObsession.event("Alchemical Obsession"),
      );
    }*/
  }
</script>

<h2>Choose Your Lord</h2>
<p>Select a lord to lead your lands:</p>

<div class="lords-grid">
  {#each lords as { lord, bonuses }}
    <div
      class="lord-card"
      on:click={() => selectLord(lord, bonuses)}
      on:keydown={(e) => e.key === "Enter" && selectLord(lord, bonuses)}
      tabindex="0"
      role="button"
    >
      <h3>{lord.fName}</h3>
      <img
        class="background-icon"
        src={`icons/lordBackgrounds/${lord.background}.png`}
        alt="icon"
      />
      <p class="background">
        Background: {lord.background}
        <br />
        Goal: {pText(lord.goal.desc, lord)}
      </p>
      <div class="stats">
        <div class="stat">
          <span class="stat-name">Strength:</span>
          <span class="stat-value">{lord.stats.str}</span>
        </div>
        <div class="stat">
          <span class="stat-name">Dexterity:</span>
          <span class="stat-value">{lord.stats.dex}</span>
        </div>
        <div class="stat">
          <span class="stat-name">Age:</span>
          <span class="stat-value">{lord.age}</span>
        </div>
        <div>
          <span
            >Bonuses:
            <hr /></span
          >
        </div>
        <div class="stat">
          {#each Object.entries(bonuses) as [item, num]}
            <span class="stat-name">{item}</span>
            <span class="stat-value">{num}</span>
          {/each}
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .background-icon {
    height: 5rem;
  }
  h2 {
    text-align: center;
    margin-bottom: 1rem;
    color: #333;
  }

  p {
    text-align: center;
    margin-bottom: 2rem;
    color: #666;
  }

  .lords-grid {
    display: flex;
    gap: 1.5rem;
  }

  .lord-card {
    background-image: url("https://static.vecteezy.com/system/resources/thumbnails/000/122/367/small/vector-textured-grunge-background.jpg");
    background-size: 100% 100%;
    border: 2px solid #372d21;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 15rem;
  }

  .lord-card:hover {
    border-color: #4caf50;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .lord-card:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
  }

  .lord-card h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
  }

  .background {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: #555;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid #eee;
  }

  .stat-name {
    font-weight: bold;
    color: #555;
  }

  .stat-value {
    color: #333;
    font-weight: bold;
  }
</style>
