<script lang="ts">
  import {
    type Building,
    buildingTypes,
    type FieldRotationType,
  } from "$lib/data/buildings";
  import { game } from "$lib/stores";
  export let farm: Building;
  function setFieldRotation(building: Building, type: FieldRotationType) {
    if (!building.fieldRotation) {
      building.fieldRotation = { type, currentYear: 0 };
    } else {
      building.fieldRotation.type = type;
    }
    $game = $game;
  }

  function getRotationCycle(
    rotation: { type: FieldRotationType; currentYear: number } | undefined,
  ): string {
    if (!rotation) return "No rotation set";

    if (rotation.type === "2-field") {
      const cycle = ["Grain", "Fallow", "Legumes", "Grain"];
      return cycle[rotation.currentYear % 4];
    } else {
      const cycle = ["Grain", "Legumes", "Fallow"];
      return cycle[rotation.currentYear % 3];
    }
  }
</script>

<div class="farm-management">
  <h4>Farm Field Management</h4>
  <h5>Field Rotation</h5>
  <select
    value={farm.fieldRotation?.type ?? ""}
    on:change={(e) => {
      const value = e.currentTarget.value;
      if (value === "2-field" || value === "3-field") {
        setFieldRotation(farm, value);
      }
    }}>
    <option value="">None</option>
    <option value="2-field">2-field (Grain→Fallow→Legumes→Grain)</option>
    <option value="3-field">3-field (Grain→Legumes→Fallow)</option>
  </select>

  {#if farm.fieldRotation}
    <div class="farm-info" style="margin-top: 0.5em;">
      <strong>Current Crop:</strong>
      {getRotationCycle(farm.fieldRotation)}<br />
      <strong>Rotation Year:</strong>
      {(farm.fieldRotation.currentYear %
        (farm.fieldRotation.type === "2-field" ? 4 : 3)) +
        1}
      of {farm.fieldRotation.type === "2-field" ? 4 : 3}
    </div>
  {/if}

  <h5>Planted Crops</h5>
  <div class="farm-info">
    <strong>Planted Grain:</strong>
    {(farm.yields?.["Planted Grain"] ?? 0).toFixed(2)} Acres<br />
    <strong>Planted Legumes:</strong>
    {(farm.yields?.["Planted Legumes"] ?? 0).toFixed(2)} Acres<br />
    <strong>Unsowed Land:</strong>
    {(
      buildingTypes[farm.buildingType].size -
      (farm.yields?.["Planted Grain"] ?? 0) -
      (farm.yields?.["Planted Legumes"] ?? 0)
    ).toFixed(2)} Acres
  </div>

  <h5>Current Season</h5>
  <div class="farm-info">
    {$game.season}
    {#if $game.season === "Spring"}
      (Sowing)
    {:else if $game.season === "Summer"}
      (Growing)
    {:else if $game.season === "Autumn"}
      (Harvesting)
    {:else}
      (Winter)
    {/if}
  </div>
</div>

<style>
  .farm-management {
    margin-top: 1em;
    padding: 0.5em;
    border: 1px solid currentColor;
  }
  .farm-management h4 {
    margin: 0 0 0.5em 0;
    font-size: 1em;
  }

  .farm-management h5 {
    margin: 1em 0 0.5em 0;
    font-size: 0.9em;
  }
</style>
