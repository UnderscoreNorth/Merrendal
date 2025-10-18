<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import type { Area, ProjectType } from "$lib/data/areas";
  import { recordLoop } from "$lib/util/recordLoop";
  import {
    type Building,
    type BuildingType,
    buildingTypes,
  } from "$lib/data/buildings";
  import { startConstruction } from "$lib/simulation/buildings";
  import { assignNPCs, unassignNPC } from "$lib/simulation/living";
  import { items } from "$lib/data/items";

  $: area = $openModals["areaDetail"] as Area;
  game.subscribe((a) => {
    area = area;
  });
  function startConstructionHandler(selectedBuilding: BuildingType) {
    if (checkDisabled(selectedBuilding) == "disabled") return;
    startConstruction($game, selectedBuilding, area);
    $game = $game;
  }
  $: getProgress = (project: ProjectType) => {
    if (project.type == "demolition") return project.progress;
    const buildingTemplate = buildingTypes[project.building.buildingType];
    if (project.type == "construction") {
      return `<table>${recordLoop(buildingTemplate.requirements)
        .map(([itemName, amount]) => {
          return `<tr>
          <td>${itemName}</td>
          <td>${project.progress[itemName] ?? 0}/</td>
          <td>${amount}</td>
          <td>${(((project.progress[itemName] ?? 0) / amount) * 100).toFixed(2)}%</td></tr>`;
        })
        .join("")}</table>`;
    } else {
      //@ts-ignore
      return recordLoop(buildingTemplate.upgrades[project.upgrade].requirements)
        .map(([itemName, amount]) => {
          //@ts-ignore
          return `${itemName} ${project.progress[itemName]}/${amount}`;
        })
        .join("<br>");
    }
  };
  $: getMaintenance = (building: Building) => {
    return `<table>${recordLoop(building.maintenanceCost)
      .filter((i) => i[1] > 0)
      .map(([itemName, amount]) => {
        return `<tr>
          <td>${itemName}</td>
          <td>${amount?.toFixed(2)} ${items[itemName].unit}</td>
          </tr>`;
      })
      .join("")}</table>`;
  };
  function addWorker(building: Building, num: number) {
    if (num == 1) {
      assignNPCs($game, building, 1);
    } else {
      const npc = $game.npcs.find(
        (i) => i.id == Array.from(building.workers)[0],
      );
      if (npc !== undefined) unassignNPC($game, npc);
    }
    area = area;
  }
  function cancelProject(project: ProjectType) {
    let index = area.currentProjects.findIndex((i) => i.id == project.id);
    if (index >= 0) {
      area.currentProjects.splice(index, 1);
      area = area;
    }
  }
  function checkDisabled(buildingType: BuildingType) {
    const riverBuildings: BuildingType[] = [
      "Stone Bridge",
      "Wooden Bridge",
      "Watermill",
    ];
    if (!area.terrain.river && riverBuildings.includes(buildingType))
      return "disabled";
    if (
      area.buildingLand +
        area.arableLand +
        area.currentProjects
          .filter((i) => i.type == "construction")
          .reduce((a, b) => {
            return a + buildingTypes[b.building.buildingType].size;
          }, 0) +
        buildingTypes[buildingType].size +
        (area.terrain.forested * area.acres) / 100 >
      area.acres
    )
      return "disabled";

    // Check if max allowed buildings of this type has been reached
    const buildingTemplate = buildingTypes[buildingType];
    if (buildingTemplate.maxAllowed !== undefined) {
      const existingCount = area.buildings.filter(
        (b) => b.buildingType === buildingType,
      ).length;
      const inProgressCount = area.currentProjects.filter(
        (p) =>
          p.type === "construction" && p.building.buildingType === buildingType,
      ).length;
      if (existingCount + inProgressCount >= buildingTemplate.maxAllowed) {
        return "disabled";
      }
    }

    return "";
  }
</script>

<h2>
  {area.areaID}
  <button
    on:click={() => {
      $openModals["areaDetail"] = undefined;
    }}>X</button>
</h2>

<div class="content">
  <section>
    <h3>Area Information</h3>
    <table>
      <tr><th>Topography</th><td>{area.terrain.topography}</td></tr>
      <tr
        ><th>Forest Coverage</th><td
          >{((area.terrain.forested * area.acres) / 100).toFixed(2)} Acres</td
        ></tr>
      <tr
        ><th>Village Land </th><td
          >{area.buildingLand +
            area.currentProjects
              .filter((i) => i.type == "construction")
              .reduce((a, b) => {
                return a + buildingTypes[b.building.buildingType].size;
              }, 0)} Acres</td
        ></tr>
      <tr><th>Arable Land </th><td>{area.arableLand} Acres</td></tr>
      <tr
        ><th>Unused Land </th><td
          >{(
            area.acres -
            area.arableLand -
            area.buildingLand -
            area.currentProjects
              .filter((i) => i.type == "construction")
              .reduce((a, b) => {
                return a + buildingTypes[b.building.buildingType].size;
              }, 0) -
            (area.terrain.forested * area.acres) / 100
          ).toFixed(2)} Acres</td
        ></tr>
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
  <section></section>
  <section>
    {#each Array.from(new Set(Object.values(buildingTypes).map((i) => i.category))) as category}
      {category}
      <hr />
      <div class="constructionContainer">
        {#key area}
          {#each recordLoop(buildingTypes).filter((i) => i[1].category == category) as [buildingType, buildingData]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class={checkDisabled(buildingType)}
              on:click={() => startConstructionHandler(buildingType)}
              style:background-position={`${buildingData.icon.x * -64}px ${buildingData.icon.y * -64}px`}>
              {buildingType}
            </div>
          {/each}
        {/key}
      </div>
    {/each}
  </section>
  <section class="buildings">
    <table>
      {#if area.buildings.length}
        <tr><th>Building</th><th>Status</th><th>Workers</th></tr>
        {#each area.buildings as building}
          <tr>
            <td>{building.buildingType} </td>
            <td>
              {building.status}
              <br />
              {@html getMaintenance(building)}
            </td>
            <td>
              {#each $game.npcs
                .filter((i) => building.workers.has(i.id))
                .map((i) => i.fName) as worker}
                <div>{worker}</div>
              {/each}
              {#if "liveIn" in buildingTypes[building.buildingType]}
                {#each $game.npcs.filter((i) => i.home == building.id) as npc}
                  <div>{npc.fName}</div>
                {/each}
              {/if}
            </td>
            {#if building.maxPops}
              <td>
                {building.workers.size}/{building.maxPops}
                <br /><button
                  disabled={building.workers.size >= building.maxPops}
                  on:click={() => addWorker(building, 1)}>+</button
                ><button
                  disabled={building.workers.size == 0}
                  on:click={() => addWorker(building, -1)}>-</button>
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
      {#if Object.values(area.currentProjects).length}
        <tr>
          <th>Project</th><th>Progress</th><th>Priority</th>
        </tr>
        {#each Object.values(area.currentProjects) as project}
          <tr>
            <td>{project.building.buildingType} {project.type}</td>
            <td>{@html getProgress(project)}</td>
            <td
              ><input
                class="priorityInput"
                bind:value={project.priority}
                type="number"
                step="1"
                min="1"
                max="10" /></td>
            <td
              ><button on:click={() => cancelProject(project)}>Cancel</button
              ></td>
          </tr>
        {/each}
      {/if}
    </table>
  </section>
</div>

<style>
  hr {
    margin: 0.5rem 0;
  }
  .priorityInput {
    font-family: inherit;
    background: none;
    width: 3rem;
    font-size: 16px;
    margin-right: 1rem;
  }
  .constructionContainer {
    display: flex;
    margin-bottom: 1rem;
    gap: 5px;
  }
  .constructionContainer div {
    width: 64px;
    height: 64px;
    text-align: center;
    border: solid 1px black;
    cursor: pointer;
    background: url("icons/buildings/buildings.png");
    background-size: 800% 400%;
    color: gold;
    text-shadow: 0 0 3px black;
  }
  .constructionContainer .disabled {
    cursor: default;
    opacity: 0.5;
  }
  h2 {
    margin: 0 0 1em 0;
  }
  .buildings td {
    padding: 0.5rem 0;
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
    display: grid;
    grid-template-columns: auto auto;
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
    text-align: right;
    padding-right: 1em;
  }

  td {
    text-align: right;
  }
</style>
