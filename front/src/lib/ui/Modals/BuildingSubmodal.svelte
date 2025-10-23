<script lang="ts">
  import { type Area } from "$lib/data/areas";
  import { type BuildingType, buildingTypes } from "$lib/data/buildings";
  import { getUsedSpace } from "$lib/simulation/areas";
  import { startConstruction } from "$lib/simulation/buildings";
  import { recordLoop } from "$lib/util/recordLoop";
  import { game } from "$lib/stores";
  import { fromCube, getNeighboringCubes } from "$lib/util/terrainHelpers";
  function checkDisabled(buildingType: BuildingType) {
    const riverBuildings: BuildingType[] = [
      "Stone Bridge",
      "Wooden Bridge",
      "Watermill",
    ];
    const farmBuildings: BuildingType[] = ["Farm Field", "Pasture"];
    if (!area.terrain.river && riverBuildings.includes(buildingType))
      return "disabled";
    if (
      getUsedSpace(area) +
        buildingTypes[buildingType].size +
        (area.terrain.forested * area.acres) / 100 >
      area.acres
    )
      return "disabled";

    // Check if max allowed buildings of this type has been reached
    const buildingTemplate = buildingTypes[buildingType];
    if ("maxAllowed" in buildingTemplate) {
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
    let neighboringRoads = 0;
    let neighboringFarms = 0;
    for (let qsr of getNeighboringCubes(area.loc)) {
      let neighbor = $game.areas[fromCube(qsr)];
      if (
        neighbor !== undefined &&
        neighbor.buildings.some((i) => i.buildingType == "Dirt Road") &&
        Math.abs(neighbor.terrain.elevation - area.terrain.elevation) <= 3
      )
        neighboringRoads++;
      if (
        neighbor !== undefined &&
        neighbor.buildings.some(
          (i) => i.buildingType == "Farm Field" || i.buildingType == "Pasture",
        )
      )
        neighboringFarms++;
    }
    const hasRoad = area.buildings.some((i) => i.buildingType == "Dirt Road");
    if (neighboringRoads == 0 && buildingType == "Dirt Road") return "disabled";
    if (
      !hasRoad &&
      !farmBuildings.includes(buildingType) &&
      buildingType !== "Dirt Road"
    )
      return "disabled";
    if (
      neighboringFarms == 0 &&
      !hasRoad &&
      farmBuildings.includes(buildingType)
    )
      return "disabled";
    if (area.terrain.elevation >= 15) return "disabled";
    return "";
  }
  function startConstructionHandler(selectedBuilding: BuildingType) {
    if (checkDisabled(selectedBuilding) == "disabled") return;
    startConstruction($game, selectedBuilding, area);
    $game = $game;
  }
  export let area: Area;
</script>

{#each Array.from(new Set(Object.values(buildingTypes).map((i) => i.category))) as category}
  {category}
  <div class="constructionContainer">
    {#key area}
      {#each recordLoop(buildingTypes).filter((i) => i[1].category == category) as [buildingType, buildingData]}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class={checkDisabled(buildingType) + " building"}
          on:click={() => startConstructionHandler(buildingType)}
          style:background-position={`${buildingData.icon.x * -32}px ${buildingData.icon.y * -32}px`}>
          {buildingType}
        </div>
      {/each}
    {/key}
  </div>
{/each}

<style>
  .constructionContainer {
    display: flex;
    margin-bottom: 1rem;
    gap: 5px;
  }
  .constructionContainer .disabled {
    cursor: default;
    opacity: 0.5;
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
</style>
