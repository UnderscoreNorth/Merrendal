<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import type { Area } from "$lib/data/areas";
  import { createMeetVillagersEvent } from "$lib/data/choices/meetVillagers";

  export let area: Area;

  $: villagersInArea = $game.npcs.filter(
    (npc) => npc.homeAreaId === area.areaID,
  );
  $: unmetVillagers = villagersInArea.filter((npc) => !npc.metByLord);
  $: metVillagers = villagersInArea.filter((npc) => npc.metByLord);

  function meetVillagers() {
    const event = createMeetVillagersEvent(area.areaID);
    $game.choiceEvents.push(event);
    $openModals["areaDetail"] = undefined;
  }
</script>

<h2>
  {area.areaID}
  <button
    on:click={() => {
      $openModals["areaDetail"] = undefined;
    }}>X</button
  >
</h2>

<div class="content">
  <section>
    <h3>Area Information</h3>
    <table>
      <tr><th>Type</th><td>{area.type}</td></tr>
      <tr><th>Size</th><td>{area.acres} Acres</td></tr>
      {#if Object.values(area.yieldEff).length}
        <tr>
          <th>Yield Efficiency</th>
          <td>
            {#each Object.entries(area.yieldEff) as [itemName, eff]}
              <div>{itemName}: {(eff * 100).toFixed(1)}%</div>
            {/each}
          </td>
        </tr>
      {/if}
    </table>
  </section>

  <section>
    <h3>Residents</h3>
    <p>Total villagers: {villagersInArea.length}</p>
    {#if metVillagers.length > 0}
      <p>Met: {metVillagers.map((v) => v.fName).join(", ")}</p>
    {/if}
    {#if unmetVillagers.length > 0}
      <p>Unmet: {unmetVillagers.length}</p>
    {/if}
  </section>

  <section>
    <table>
      {#if area.buildings.length}<tr
          ><th>Buildings</th><td>
            <table>
              <tr><th>Building</th><th>Status</th><th>Workers</th></tr>
              {#each area.buildings as building}
                <tr>
                  <td>{building.type}</td>
                  <td>
                    {#if building.status == "Built"}
                      Built
                    {:else}
                      {building.daysToComplete} days left to build
                    {/if}
                  </td>
                  <td>
                    {#each $game.npcs
                      .filter((i) => building.workers.has(Number(i.id)))
                      .map((i) => i.fName) as worker}
                      <div>{worker}</div>
                    {/each}
                  </td>
                </tr>
              {/each}
            </table>
          </td></tr
        >{/if}
      {#if Object.values(area.currentProjects).length}
        <tr>
          <th>Projects</th>
          <td>
            <table>
              <tr>
                <th>Project</th><th>Phase</th><th>Progress</th><th>Workers</th>
              </tr>
              {#each Object.values(area.currentProjects) as project}
                <tr
                  ><td>{project.type}</td><td
                    >{project.phases[project.currentPhase - 1].name}</td
                  ><td
                    >{project.phases[
                      project.currentPhase - 1
                    ].progressPercent.toFixed(1)}%</td
                  >
                  <td>
                    {#each $game.npcs
                      .filter((i) => project.workers.has(Number(i.id)))
                      .map((i) => i.fName) as worker}
                      <div>{worker}</div>
                    {/each}
                  </td>
                </tr>
              {/each}
            </table>
          </td>
        </tr>
      {/if}
    </table>
  </section>

  {#if area.type === "Manor"}
    <section>
      <h3>Archive Records</h3>
      {#if $game.pastLords.length === 0}
        <p>No records exist yet. You are the first lord of this land.</p>
      {:else}
        <p>Records of past lords who employed an archivist:</p>
        {#each $game.pastLords.filter((lord) => lord.logs.length > 0) as pastLord}
          <details>
            <summary>
              <strong>{pastLord.fName}</strong> - {pastLord.background} (Reign: {pastLord.reign} years, {pastLord.logs.length} entries)
            </summary>
            <div class="archive-logs">
              {#if pastLord.logs.length > 0}
                <table>
                  <tr><th>Year</th><th>Day</th><th>Event</th></tr>
                  {#each pastLord.logs as logEntry}
                    <tr>
                      <td>{logEntry.year}</td>
                      <td>{logEntry.day}</td>
                      <td>{logEntry.msg}</td>
                    </tr>
                  {/each}
                </table>
              {:else}
                <p><i>No records were kept during this reign.</i></p>
              {/if}
            </div>
          </details>
        {/each}
        {#if $game.pastLords.filter((lord) => lord.logs.length > 0).length === 0}
          <p><i>No past lords employed an archivist. Their deeds are lost to history.</i></p>
        {/if}
      {/if}
    </section>
  {/if}

  <section>
    <h3>Actions</h3>
    {#if $game.areaActionTaken}
      <p class="disabled-text">
        Area action already taken this period. Wait for the next period.
      </p>
    {:else if unmetVillagers.length > 0}
      <button on:click={meetVillagers}>
        Meet Villagers ({unmetVillagers.length} unmet)
      </button>
    {:else if villagersInArea.length > 0}
      <p>You've met everyone here</p>
    {:else}
      <p>No villagers live in this area</p>
    {/if}
  </section>
</div>

<style>
  h2 {
    margin: 0 0 1em 0;
  }

  h3 {
    margin: 0.5em 0;
    font-size: 1.1em;
  }

  button {
    background: none;
    border: 1px solid currentColor;
    padding: 0.5em 1em;
    font-size: inherit;
    cursor: pointer;
    font-family: inherit;
  }

  h2 button {
    float: right;
    border: none;
    padding: 0;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  section {
    border: 1px solid currentColor;
    padding: 0.5em;
  }

  table {
    width: 100%;
  }

  th {
    text-align: left;
    padding-right: 1em;
  }

  td {
    text-align: right;
  }

  p {
    margin: 0.5em 0;
  }

  .disabled-text {
    color: #888;
    font-style: italic;
  }

  details {
    margin: 0.5em 0;
    border: 1px solid #444;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.2);
  }

  summary {
    cursor: pointer;
    font-weight: bold;
    padding: 0.25em;
  }

  summary:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .archive-logs {
    margin-top: 0.5em;
    padding: 0.5em;
    max-height: 400px;
    overflow-y: auto;
  }

  .archive-logs table {
    width: 100%;
    font-size: 0.9em;
  }

  .archive-logs tr {
    border-bottom: 1px solid #333;
  }

  .archive-logs th {
    text-align: left;
    padding: 0.25em;
    background: rgba(0, 0, 0, 0.3);
  }

  .archive-logs td {
    padding: 0.25em;
    vertical-align: top;
  }

  .archive-logs td:first-child,
  .archive-logs td:nth-child(2) {
    text-align: center;
    width: 60px;
  }
</style>
