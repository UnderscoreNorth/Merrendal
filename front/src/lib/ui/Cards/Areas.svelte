<script lang="ts">
  import { areaTypes } from "$lib/data/areas";
  import { game } from "$lib/stores";
  import Collapsible from "../Collapsible.svelte";
</script>

<div class="container">
  {#each Object.keys(areaTypes) as areaType}
    {#if $game.areas.filter((i) => i.type == areaType).length}
      <Collapsible headerName={areaType} headerType={3} hidden={true}>
        {#each $game.areas.filter((i) => i.type == areaType) as area}
          <table>
            <tr><th>Name</th><td>{area.areaID}</td></tr>
            <tr><th>Size</th><td>{area.acres} Acres</td></tr>
            {#if Object.values(area.yieldEff).length}
              <tr
                ><th>Yield Eff</th><td>
                  {#each Object.entries(area.yieldEff) as [itemName, eff]}
                    <div>{itemName} {(eff * 100).toFixed(1)}%</div>
                  {/each}
                </td></tr
              >
            {/if}
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
                      <th>Project</th><th>Phase</th><th>Progress</th><th
                        >Workers</th
                      >
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
        {/each}
      </Collapsible>
    {/if}
  {/each}
</div>

<style>
  .container {
    display: flex;
    gap: 3px;
    flex-direction: column;
    margin-top: 3px;
  }
</style>
