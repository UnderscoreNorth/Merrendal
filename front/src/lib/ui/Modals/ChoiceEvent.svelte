<script lang="ts">
  import {
    checkChoiceRequirements,
    type Choice,
    consumeChoiceRequirements,
  } from "$lib/data/choices";
  import { autoPlay, game } from "$lib/stores";
  import { pick } from "$lib/util/rolls";
  let cE = $game.choiceEvents[0];
  let choices: Choice[] = [];
  generateChoices();
  if (!$autoPlay) {
    $game.pending = true;
    $game.pause = true;
  } else if (cE !== undefined) {
    autoPick();
  }
  function pickChoice(choice: Choice) {
    consumeChoiceRequirements($game, choice);
    if (choice.effects !== undefined) choice.effects($game);
    $game.choiceEvents.splice(0, 1);
    cE = $game.choiceEvents[0];
    if (!$game.choiceEvents.length) {
      $game.pending = false;
    } else {
      generateChoices();
    }
    if ($autoPlay) {
      autoPick();
    }
  }
  function generateChoices() {
    choices = cE.choices($game);
    for (const choice of choices) {
      checkChoiceRequirements($game, choice);
    }
  }
  function autoPick() {
    pickChoice(pick(cE.choices($game).filter((c) => c.canPick)));
  }
</script>

{#if cE}
  <h1>{cE.title}</h1>
  <hr />
  <p>{cE.desc}</p>
  <div class="choices">
    {#each choices as choice}
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <button
        on:click={() => {
          pickChoice(choice);
        }}
        disabled={choice.canPick == false}
        >{choice.desc}{#if choice.requirements && choice.requirements.length}
          {" "}-
          <span class="requirements">
            {#each choice.requirements as r}
              {#if r.type == "pop"}
                {r.consume ? "Kill" : "Requires"} {r.num} Villagers
              {:else if r.type == "item"}
                {r.consume ? "Uses" : "Requires"} {r.num} {r.data}
              {:else if r.type == "trait"}
                {"Requires"} {r.trait}
              {/if}
            {/each}</span
          >
        {/if}</button
      >
    {/each}
  </div>
{/if}

<style>
  h1 {
    margin: 0;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .requirements {
    color: rgb(206, 46, 46);
  }
  button {
    font-family: inherit;
    width: 100%;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
    padding: 6px;
    transition: all 0.2s ease;
  }
  button:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  button:disabled {
    cursor: default;
    font-style: italic;
    background-color: rgb(130, 130, 131);
    color: rgb(39, 39, 39);
  }
  button:disabled .requirements {
    color: rgb(65, 6, 6);
  }
  button:hover:disabled {
    transform: none;
    box-shadow: none;
  }
</style>
