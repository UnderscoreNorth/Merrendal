<script lang="ts">
  import type { ProjectType } from "$lib/data/areas";
  import { buildingTypes } from "$lib/data/buildings";
  import { game } from "$lib/stores";
  import { recordLoop } from "$lib/util/recordLoop";

  export let projects: ProjectType[];

  $: getProgress = (project: ProjectType) => {
    if (project.type == "demolition") return project.progress;
    if (project.type == "landConversion") {
      const percentage = (project.progress / project.targetAcres) * 100;
      return `${project.progress.toFixed(2)} / ${project.targetAcres.toFixed(2)} Acres (${percentage.toFixed(1)}%)`;
    }
    const buildingTemplate = buildingTypes[project.building.buildingType];
    if (project.type == "construction") {
      // Special handling for Dirt Road construction
      if (project.building.buildingType === "Dirt Road") {
        //@ts-ignore
        const workDays = project.progress["Work Days"] ?? 0;
        const requiredDays = 10;
        const percentage = (workDays / requiredDays) * 100;
        return `${workDays.toFixed(1)} / ${requiredDays} days (${percentage.toFixed(1)}%)`;
      }
      return `<table>${recordLoop(buildingTemplate.requirements)
        .map(([itemName, amount]) => {
          return `<tr>
          <td>${itemName}</td>
          <td>${project.progress[itemName] ?? 0}/</td>
          <td>${amount}</td>
          <td>${(((project.progress[itemName] ?? 0) / amount) * 100).toFixed(2)}%</td></tr>`;
        })
        .join("")}</table>`;
    } else if (project.type == "upgrade") {
      //@ts-ignore
      return recordLoop(buildingTemplate.upgrades[project.upgrade].requirements)
        .map(([itemName, amount]) => {
          //@ts-ignore
          return `${itemName} ${project.progress[itemName]}/${amount}`;
        })
        .join("<br>");
    }
  };
  function cancelProject(project: ProjectType) {
    let area = $game.areas[project.areaID];
    let index = area.currentProjects.findIndex((i) => i.id == project.id);
    if (index >= 0) {
      area.currentProjects.splice(index, 1);
      $game = $game;
    }
  }
</script>

{#each projects as project}
  <tr>
    <td>
      {#if project.type === "landConversion"}
        Land Conversion
      {:else}
        {project.building.buildingType} {project.type}
      {/if}
    </td>
    <td>{@html getProgress(project)}</td>
    <td
      ><input
        class="priorityInput"
        bind:value={project.priority}
        type="number"
        step="1"
        min="1"
        max="10" /></td>
    <td><button on:click={() => cancelProject(project)}>Cancel</button></td>
  </tr>
{/each}
