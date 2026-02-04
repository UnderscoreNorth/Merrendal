<script lang="ts">
  import { colorView, game, openModals } from "$lib/stores";
  import type { Area } from "$lib/data/areas";
  import { recordLoop } from "$lib/util/recordLoop";
  import {
    type Building,
    type BuildingType,
    buildingTypes,
  } from "$lib/data/buildings";
  import { startConstruction, startUpgrade } from "$lib/simulation/buildings";
  import { assignNPCs, unassignNPC } from "$lib/simulation/living";
  import { items, type ItemName } from "$lib/data/items";
  import { startLandConversion } from "$lib/simulation/farming";
  import type { FieldRotationType, UpgradeType } from "$lib/data/buildings";
  import {
    assignAnimalToPasture,
    unassignAnimal,
    slaughterAnimal,
  } from "$lib/simulation/animals";
  import { animalType } from "$lib/data/animals";
  import { tileSelection } from "$lib/stores";
  import { getNeighboringCubes, fromCube } from "$lib/util/terrainHelpers";
  import {
    getTotalBuildingSize,
    getBuildingSizeInArea,
  } from "$lib/simulation/buildings";
  import ProjectRows from "../Sub/ProjectRows.svelte";
  import { addSet, delSet } from "$lib/util/sets";
  import { getUsedSpace } from "$lib/simulation/areas";
  import BuildingSubmodal from "./BuildingSubmodal.svelte";
  import FarmingSubmodal from "./FarmingSubmodal.svelte";

  $: area = $openModals["areaDetail"] as Area;
  game.subscribe((a) => {
    area = area;
  });

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
    // Special handling for burgages
    if (building.buildingType === "Burgage") {
      if (num == 1) {
        // Add a resident to work at the burgage
        const residents = $game.npcs.filter(
          (npc) => npc.home === building.id && npc.age >= 16,
        );

        if (residents.length > 0) {
          // Find first resident not already "working" at burgage
          const resident = residents.find(
            (r) => !building.workers.includes(r.id),
          );
          if (resident) {
            // If they have a job elsewhere, unassign them
            if (
              resident.job?.attached &&
              resident.job.attached !== building.id
            ) {
              unassignNPC($game, resident);
            }

            // Add them to burgage workers
            building.workers = addSet(building.workers, resident.id);
            resident.job = {
              title: "None",
              stuck: false,
              attached: building.id,
              recipe: building.allowedRecipes[0],
            };
          }
        }
      } else {
        // Remove a worker from burgage
        const workerId = building.workers[0];
        if (workerId) {
          building.workers = delSet(building.workers, workerId);
          const npc = $game.npcs.find((i) => i.id === workerId);
          if (npc && npc.job) {
            npc.job = { title: "None", stuck: false };
          }
        }
      }
    } else {
      // Normal building behavior
      if (num == 1) {
        assignNPCs($game, building, 1);
        // Set default recipe to first available recipe
        const workers = $game.npcs.filter((npc) =>
          building.workers.includes(npc.id),
        );
        if (workers.length && building.allowedRecipes.length) {
          const newWorker = workers[workers.length - 1];
          if (newWorker.job) {
            newWorker.job.recipe = building.allowedRecipes[0];
          }
        }
      } else {
        const npc = $game.npcs.find((i) => i.id == building.workers[0]);
        if (npc !== undefined) unassignNPC($game, npc);
      }
    }
    area = area;
    $game = $game;
  }
  function setWorkerRecipe(workerId: string, recipe: ItemName) {
    const worker = $game.npcs.find((npc) => npc.id === workerId);
    if (worker && worker.job) {
      worker.job.recipe = recipe;
      $game = $game;
    }
  }
  function setAllRecipes(building: Building) {
    if (!building.allowedRecipes.length) return;
    const workers = $game.npcs.filter((npc) =>
      building.workers.includes(npc.id),
    );
    const defaultRecipe = building.allowedRecipes[0];
    for (const worker of workers) {
      if (worker.job) {
        worker.job.recipe = defaultRecipe;
      }
    }
    $game = $game;
  }
  function startUpgradeHandler(building: Building, upgradeType: UpgradeType) {
    const buildingTemplate = buildingTypes[building.buildingType];
    // @ts-ignore - UpgradeType is a union type, runtime check ensures it exists
    const upgradeData = buildingTemplate.upgrades[upgradeType];

    // Check if this upgrade can expand to neighboring tiles
    if (upgradeData?.canExpandToNeighbor) {
      // Calculate eligible tiles (source area + neighbors)
      const neighbors = getNeighboringCubes(area.loc);
      const eligibleTiles = new Set<string>();

      // Add the source area itself
      eligibleTiles.add(area.areaID);

      // Add neighboring areas that exist
      for (const neighborCube of neighbors) {
        const neighborId = fromCube(neighborCube);
        const neighborArea = Object.values($game.areas).find(
          (a) => fromCube(a.loc) === neighborId,
        );
        if (neighborArea) {
          eligibleTiles.add(neighborArea.areaID);
        }
      }

      // Hide the area detail modal
      $openModals["areaDetail"] = undefined;

      // Activate tile selection mode
      $tileSelection = {
        active: true,
        sourceAreaId: area.areaID,
        buildingId: building.id,
        upgradeName: upgradeType,
        eligibleTiles,
        onSelect: (targetAreaId: string) => {
          // Find the target area
          const targetArea = Object.values($game.areas).find(
            (a) => a.areaID === targetAreaId,
          );
          if (targetArea) {
            // Start the upgrade with the target area
            startUpgrade(targetArea, building, upgradeType, area.areaID);
            $game = $game;
          }
          // Clear tile selection and restore area detail modal
          $tileSelection = null;
          $openModals["areaDetail"] = area;
        },
        onCancel: () => {
          // Clear tile selection and restore area detail modal
          $tileSelection = null;
          $openModals["areaDetail"] = area;
        },
      };
    } else {
      // Normal upgrade without tile selection
      startUpgrade(area, building, upgradeType);
      area = area;
      $game = $game;
    }
  }
  function getAvailableUpgrades(building: Building) {
    const buildingTemplate = buildingTypes[building.buildingType];
    const upgradeEntries = Object.entries(buildingTemplate.upgrades);

    return upgradeEntries.filter(([upgradeName, upgradeData]) => {
      // Check if upgrade already built
      if (building.upgrades[upgradeName]?.status === "built") {
        // Only allow if explicitly marked as repeatable
        if (upgradeData.repeatable === true) {
          return true;
        }
        return false;
      }

      // Check if upgrade is in progress
      const inProgress = area.currentProjects.some(
        (p) =>
          p.type === "upgrade" &&
          p.building.id === building.id &&
          p.upgrade === upgradeName,
      );
      if (inProgress) return false;

      // Check group key exclusions - only one upgrade per group allowed
      if (upgradeData.groupKey) {
        const hasOtherInGroup = Object.entries(buildingTemplate.upgrades).some(
          ([otherName, otherData]) =>
            otherName !== upgradeName &&
            otherData.groupKey === upgradeData.groupKey &&
            building.upgrades[otherName]?.status === "built",
        );
        if (hasOtherInGroup) return false;
      }

      // Check if there's enough land for the upgrade size
      if (upgradeData.size && upgradeData.size > 0) {
        const availableLand = getUnusedLand();
        if (availableLand < upgradeData.size) {
          return false;
        }
      }

      return true;
    });
  }

  $: getUnusedLand = () => {
    const usedLand =
      area.buildingLand +
      area.currentProjects
        .filter((i) => i.type == "construction")
        .reduce((a, b) => {
          return a + buildingTypes[b.building.buildingType].size;
        }, 0) +
      getUsedSpace(area) +
      (area.terrain.forested * area.acres) / 100;
    return area.acres - usedLand;
  };
  /**
   * Calculate pasture capacity for a specific pasture building
   */
  function getPastureCapacity(building: Building): number {
    if (building.buildingType !== "Pasture") return 0;
    return getTotalBuildingSize(building);
  }

  /**
   * Calculate used pasture space in a specific pasture
   */
  function getUsedPastureSpace(building: Building): number {
    const animalsInPasture = $game.animals.filter(
      (a) => a.pasture === building.id,
    );
    let usedSpace = 0;
    for (const animal of animalsInPasture) {
      usedSpace += animalType[animal.animalType].acresPer;
    }
    return usedSpace;
  }

  /**
   * Assign an unassigned animal to a pasture
   */
  function assignAnimal(building: Building, animalId: string) {
    assignAnimalToPasture($game, animalId, building.id);
    $game = $game;
  }

  /**
   * Unassign an animal from a pasture
   */
  function removeAnimal(animalId: string) {
    unassignAnimal($game, animalId);
    $game = $game;
  }

  /**
   * Slaughter an animal
   */
  function handleSlaughter(animalId: string) {
    slaughterAnimal($game, animalId);
    $game = $game;
  }

  let selected: Building | undefined | "new" = undefined;
</script>

<h2>
  {area.areaID}
  <button
    on:click={() => {
      $openModals["areaDetail"] = undefined;
      $colorView = {
        type: "none",
        tile: "",
        tiles: [],
      };
    }}>X</button>
</h2>

<div class="content">
  <section>
    <h3>Area Information</h3>
    <table>
      <tr><th>Elevation</th><td>{area.terrain.elevation}</td></tr>
      <tr><th>Topography</th><td>{area.terrain.topography}</td></tr>
      <tr
        ><th>Forest Coverage</th><td
          >{((area.terrain.forested * area.acres) / 100).toFixed(2)} Acres</td
        ></tr>
      <tr><th>Village Land </th><td>{getUsedSpace(area)} Acres</td></tr>
      <tr><th>Arable Land </th><td>{area.arableLand} Acres</td></tr>
      <tr
        ><th>Unused Land </th><td
          >{(
            area.acres -
            getUsedSpace(area) -
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
  <section>
    <button
      on:click={() => {
        selected = "new";
      }}>New building</button>
    <table>
      <tr>
        <th>Project</th><th>Progress</th><th>Priority</th>
      </tr>
      <ProjectRows projects={area.currentProjects} />
    </table>
  </section>

  <section class="buildings">
    <table style:border-collapse="collapse">
      <tr><th>Building</th><th>Status</th><th>Workers</th><th>Recipe</th></tr>
      {#each area.buildings as building}
        <tr
          class={"buildingRow" +
            (typeof selected == "object" && selected.id == building.id
              ? " selected"
              : "")}
          on:click={() => {
            selected = building;
          }}>
          <td style={`display: flex;align-items: center;gap: 0.5rem;`}>
            <div
              class={"building"}
              style:background-position={`${buildingTypes[building.buildingType].icon.x * -32}px ${buildingTypes[building.buildingType].icon.y * -32}px`}>
            </div>
            {building.buildingType}
          </td>
          <td>
            {building.status}
            <br />
            {@html getMaintenance(building)}
          </td>
          <td>
            {#if "liveIn" in buildingTypes[building.buildingType]}
              {#each $game.npcs.filter((i) => i.home == building.id) as npc}
                <div>{npc.fName}</div>
              {/each}
            {:else}
              {#each $game.npcs.filter( (i) => building.workers.includes(i.id), ) as worker}
                <div>{worker.fName}</div>
              {/each}
            {/if}
          </td>
          <td>
            {#if building.allowedRecipes.length > 0}
              {#each $game.npcs.filter( (i) => building.workers.includes(i.id), ) as worker}
                <div class="recipe-select">
                  <select
                    value={worker.job?.recipe ?? building.allowedRecipes[0]}
                    on:change={(e) =>
                      setWorkerRecipe(worker.id, e.currentTarget.value)}>
                    {#each building.allowedRecipes as recipe}
                      <option value={recipe}>{recipe}</option>
                    {/each}
                  </select>
                </div>
              {/each}
              {#if building.workers.length > 1}
                <button
                  class="set-all-btn"
                  on:click={() => setAllRecipes(building)}>
                  Set All to {building.allowedRecipes[0]}
                </button>
              {/if}
            {:else}
              <div>-</div>
            {/if}
          </td>
          {#if building.maxPops}
            <td>
              {building.workers.length}/{building.maxPops}
              <br /><button
                disabled={building.workers.length >= building.maxPops}
                on:click={() => addWorker(building, 1)}>+</button
              ><button
                disabled={building.workers.length == 0}
                on:click={() => addWorker(building, -1)}>-</button>
            </td>
          {/if}
        </tr>
      {/each}
    </table>
  </section>
  <section>
    {#if selected == "new"}<BuildingSubmodal
        {area} />{:else if selected !== undefined}
      {#each getAvailableUpgrades(selected) as [upgradeName, upgradeData]}
        <button
          class="upgrade-btn"
          on:click={() => startUpgradeHandler(selected, upgradeName)}>
          {upgradeName}
        </button>
      {/each}

      {#if selected.buildingType === "Pasture"}
        <div class="animal-management">
          <h4>Animal Management</h4>
          <div class="pasture-info">
            <strong>Total Pasture Size:</strong>
            {getPastureCapacity(selected).toFixed(2)} acres<br />
            <strong>On this tile:</strong>
            {getBuildingSizeInArea(selected, area.areaID, $game).toFixed(2)} acres<br />
            <strong>Space Used:</strong>
            {getUsedPastureSpace(selected).toFixed(2)} acres
          </div>

          <h5>Animals in Pasture</h5>
          {#each $game.animals.filter((a) => a.pasture === selected.id) as animal}
            <div class="animal-row">
              <span>
                {animal.animalType} (Age: {animal.age},
                {animal.age >= animalType[animal.animalType].maturity
                  ? "Adult"
                  : "Young"})
              </span>
              <div class="animal-actions">
                <button on:click={() => removeAnimal(animal.id)}
                  >Unassign</button>
                <button on:click={() => handleSlaughter(animal.id)}
                  >Slaughter</button>
              </div>
            </div>
          {/each}

          <h5>Unassigned Animals</h5>
          {#each $game.animals.filter((a) => a.pasture === "") as animal}
            <div class="animal-row">
              <span>
                {animal.animalType} (Age: {animal.age},
                {animal.age >= animalType[animal.animalType].maturity
                  ? "Adult"
                  : "Young"})
              </span>
              <div class="animal-actions">
                <button
                  disabled={getUsedPastureSpace(selected) +
                    animalType[animal.animalType].acresPer >
                    getPastureCapacity(selected)}
                  on:click={() => assignAnimal(selected, animal.id)}>
                  Assign
                </button>
                <button on:click={() => handleSlaughter(animal.id)}
                  >Slaughter</button>
              </div>
            </div>
          {:else}
            <div class="no-animals">No unassigned animals</div>
          {/each}
        </div>
      {/if}

      {#if selected.buildingType === "Farm Field"}
        <FarmingSubmodal farm={selected} />
      {/if}
    {/if}
  </section>
</div>

<style>
  .buildingRow {
    cursor: pointer;
  }
  .buildingRow:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  .selected {
    background: rgba(255, 255, 255, 0.1);
  }
  .priorityInput {
    font-family: inherit;
    background: none;
    width: 3rem;
    font-size: 16px;
    margin-right: 1rem;
  }
  .building {
    width: 32px;
    height: 32px;
    text-align: center;
    border: solid 1px black;
    cursor: pointer;
    background: url("$img/icons/buildings/buildings.png");
    background-size: 800% 400%;
    font-size: smaller;
    color: gold;
    text-shadow: 0 0 3px black;
  }
  h2 {
    margin: 0 0 1em 0;
  }
  .buildings td {
    padding: 0.5rem 0;
  }
  .buildings {
    max-height: 50vh;
    overflow-y: auto;
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

  .recipe-select {
    margin-bottom: 0.25em;
  }

  .recipe-select select {
    font-family: inherit;
    font-size: inherit;
    background: none;
    border: 1px solid currentColor;
    padding: 0.2em 0.5em;
    cursor: pointer;
    color: inherit;
  }

  select {
    font-family: inherit;
    font-size: inherit;
    background: none;
    border: 1px solid currentColor;
    padding: 0.2em 0.5em;
    cursor: pointer;
    color: inherit;
  }

  option {
    background: #1a1a1a;
    color: inherit;
  }

  .set-all-btn {
    margin-top: 0.5em;
    font-size: 0.9em;
    padding: 0.3em 0.6em;
  }

  .upgrades-cell {
    text-align: left;
  }

  .upgrade-btn {
    display: block;
    margin-bottom: 0.25em;
    font-size: 0.9em;
    padding: 0.3em 0.6em;
  }

  .animal-management {
    margin-top: 1em;
    padding: 0.5em;
    border: 1px solid currentColor;
  }

  .animal-management h4 {
    margin: 0 0 0.5em 0;
    font-size: 1em;
  }

  .animal-management h5 {
    margin: 1em 0 0.5em 0;
    font-size: 0.9em;
  }

  .pasture-info {
    margin-bottom: 1em;
    padding: 0.5em;
    background: rgba(255, 255, 255, 0.05);
  }

  .animal-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em;
    margin-bottom: 0.5em;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .animal-actions {
    display: flex;
    gap: 0.5em;
  }

  .animal-actions button {
    font-size: 0.85em;
    padding: 0.3em 0.6em;
  }

  .no-animals {
    padding: 0.5em;
    font-style: italic;
    opacity: 0.7;
  }
</style>
