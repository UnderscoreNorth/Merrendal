<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import type { Event, SubEvent } from "$lib/data/events";

  let event: Event = $openModals["eventDetail"];

  function handleSubEventClick(subEventId: string) {
    const subEvent = event.subEvents.find((se) => se.id === subEventId);
    if (!subEvent || subEvent.completed || subEvent.inProgress) return;

    // Create the choice event for this subevent
    const choiceEvent = subEvent.createChoiceEvent(event);
    $game.choiceEvents.push(choiceEvent);
    $game = $game;
    // Close the event detail modal
    $openModals["eventDetail"] = undefined;
  }

  function closeModal() {
    $openModals["eventDetail"] = undefined;
  }

  function getProjectProgress(subEvent: SubEvent): number | null {
    if (!subEvent.inProgress || !subEvent.projectKey) return null;

    // Find the project in any area
    for (const area of $game.areas) {
      const project = area.currentProjects[subEvent.projectKey];
      if (project) {
        console.log(project);
        const currentPhase = project.phases[project.currentPhase - 1];
        return currentPhase?.progressPercent ?? 0;
      }
    }
    return null;
  }

  function getSubEventButtonText(subEvent: SubEvent): string {
    if (subEvent.completed) {
      return "✓ Completed";
    }

    const progress = getProjectProgress(subEvent);
    if (progress !== null) {
      return `In Progress: ${Math.floor(progress)}%`;
    }

    return subEvent.title;
  }
</script>

<h1>
  {event.id} <button class="close-button" on:click={closeModal}>×</button>
</h1>
<hr />

<div class="event-description">
  <p><i>{event.desc}</i></p>
  <p><strong>Current Phase:</strong> {event.phase.name}</p>
  <p>{event.phase.desc}</p>
</div>

{#if event.subEvents && event.subEvents.length > 0}
  {@const visibleSubEvents = event.subEvents.filter((se) => se.visible)}
  {#if visibleSubEvents.length > 0}
    <hr />
    <h2>Available Actions</h2>
    <div class="subevents">
      {#key $game}
        {#each visibleSubEvents as subEvent}
          <button
            class="subevent-button"
            class:completed={subEvent.completed}
            class:in-progress={subEvent.inProgress && !subEvent.completed}
            on:click={() => handleSubEventClick(subEvent.id)}
            disabled={subEvent.completed || subEvent.inProgress}
          >
            <div class="subevent-header">
              <span class="subevent-title"
                >{getSubEventButtonText(subEvent)}</span
              >
            </div>
            <div class="subevent-desc">{subEvent.desc}</div>
          </button>
        {/each}
      {/key}
    </div>
  {/if}
{/if}

<style>
  .close-button {
    float: right;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
  }

  .close-button:hover {
    color: white;
  }

  .event-description {
    margin: 15px 0;
  }

  .event-description p {
    margin: 8px 0;
  }

  .subevents {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .subevent-button {
    font-family: inherit;
    width: 100%;
    color: gold;
    background-color: rgb(58, 59, 60);
    cursor: pointer;
    padding: 12px;
    transition: all 0.2s ease;
    text-align: left;
  }

  .subevent-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    background-color: rgb(68, 69, 70);
  }

  .subevent-button:disabled {
    cursor: default;
    background-color: rgb(40, 41, 42);
    border-color: rgb(100, 100, 100);
    color: rgb(150, 150, 150);
  }

  .subevent-button.completed {
    background-color: rgb(30, 50, 30);
    border-color: rgb(100, 150, 100);
  }

  .subevent-button.in-progress {
    background-color: rgb(50, 50, 30);
    border-color: rgb(150, 150, 100);
    color: rgb(200, 200, 150);
  }

  .subevent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .subevent-title {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .subevent-desc {
    font-size: 0.95rem;
    color: rgb(200, 200, 200);
    line-height: 1.4;
  }
</style>
