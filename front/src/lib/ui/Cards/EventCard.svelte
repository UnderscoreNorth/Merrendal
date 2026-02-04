<script lang="ts">
  import type { GameEvent, EventChoice } from "$lib/data/events";
  import {
    handleEventChoice,
    updateChoiceStates,
  } from "$lib/systems/eventSystem";
  import { game } from "$lib/stores";

  export let event: GameEvent;

  // Update choice states based on current requirements
  $: updatedEvent = updateChoiceStates(event);

  function handleChoice(choice: EventChoice) {
    if (choice.enabled === false) {
      return;
    }
    handleEventChoice($game, event, choice);
  }

  function getRequirementText(choice: EventChoice): string {
    if (!choice.requirements || choice.requirements.length === 0) {
      return "";
    }
    let suffix = "";
    const reqTexts = choice.requirements.map((req) => {
      switch (req.type) {
        case "item":
          const currentAmount = $game.inventory[req.item] || 0;
          suffix = req.consumed ? " (consumed)" : "";
          return `Requires: ${req.amount} ${req.item} (have ${currentAmount})${suffix}`;
        case "villager_count":
          const currentVillagers = $game.npcs.length;
          suffix = req.consumed ? " (will be lost)" : "";
          return `Requires: ${req.amount} villagers (have ${currentVillagers})${suffix}`;
        case "village_stat":
          const statValue = $game.village[req.stat];
          let text = `Requires: ${req.stat}`;
          if (req.minValue !== undefined) text += ` ≥ ${req.minValue}`;
          if (req.maxValue !== undefined) text += ` ≤ ${req.maxValue}`;
          text += ` (current: ${statValue})`;
          return text;
        default:
          return "";
      }
    });

    return reqTexts.join(", ");
  }
</script>

<div class="event-content">
  <h2 class="event-title">{updatedEvent.title}</h2>

  {#if updatedEvent.imageUrl}
    <div class="event-image">
      <img src={updatedEvent.imageUrl} alt={updatedEvent.title} />
    </div>
  {/if}

  <div class="event-description">
    {#each updatedEvent.description.split("\n\n") as paragraph}
      <p>{paragraph}</p>
    {/each}
  </div>

  <div class="event-choices">
    {#each updatedEvent.choices as choice}
      {@const requirementText = getRequirementText(choice)}
      <button
        class="choice-button"
        class:disabled={choice.enabled === false}
        disabled={choice.enabled === false}
        on:click={() => handleChoice(choice)}>
        <div class="choice-text">{choice.text}</div>
        {#if choice.description}
          <div class="choice-description">{choice.description}</div>
        {/if}
        {#if requirementText}
          <div class="choice-requirements">{requirementText}</div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .event-content {
    max-height: 70vh;
    overflow-y: auto;
  }

  .event-title {
    font-size: 2rem;
    margin: 0 0 1rem 0;
    color: #2c1810;
    font-weight: bold;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  }

  .event-image {
    margin: 1rem 0;
    text-align: center;
  }

  .event-image img {
    max-width: 100%;
    max-height: 200px;
    border: 2px solid #2c1810;
    border-radius: 4px;
  }

  .event-description {
    margin: 1.5rem 0;
    line-height: 1.6;
    color: #2c1810;
    padding: 1rem;
  }

  .event-description p {
    margin: 0 0 1rem 0;
  }

  .event-description p:last-child {
    margin-bottom: 0;
  }

  .event-choices {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }

  .choice-button {
    background: linear-gradient(to bottom, #8b6f47, #6b5435);
    border: 2px solid #2c1810;
    border-radius: 6px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
  }

  .choice-button:hover:not(.disabled) {
    background: linear-gradient(to bottom, #9d7f51, #7b6445);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .choice-button:active:not(.disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .choice-button.disabled {
    background: linear-gradient(to bottom, #5a5a5a, #4a4a4a);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .choice-text {
    font-weight: bold;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .choice-description {
    font-style: italic;
    margin-bottom: 0.5rem;
    opacity: 0.9;
  }

  .choice-requirements {
    font-size: 0.85rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    opacity: 0.8;
  }
</style>
