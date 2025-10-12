<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import { getNeedKey, type Need } from "$lib/simulation/needs";
  import { itemCategories, items, type ItemName } from "$lib/data/items";
  import { buildingTypes, type BuildingType } from "$lib/data/buildings";
  import { areaTypes, type AreaType } from "$lib/data/areas";

  let needType: "item" | "itemCategory" | "building" | "area" = "item";
  let selectedItem: ItemName = "Bread";
  let selectedCategory = itemCategories[0];
  let selectedBuilding: BuildingType = Object.keys(
    buildingTypes,
  )[0] as BuildingType;
  let selectedArea: AreaType = Object.keys(areaTypes)[0] as AreaType;
  let quantity = 1;
  let priority = 1;
  let repeating = false;

  function createNeed() {
    let need: Need;

    switch (needType) {
      case "item":
        need = {
          type: "item",
          item: selectedItem,
          num: quantity,
          priority,
          primary: true,
          repeating,
        };
        break;
      case "itemCategory":
        need = {
          type: "itemCategory",
          itemCategory: selectedCategory,
          num: quantity,
          priority,
          primary: true,
          repeating,
        };
        break;
      case "building":
        need = {
          type: "building",
          building: selectedBuilding,
          priority,
          primary: true,
          repeating,
        };
        break;
      case "area":
        need = {
          type: "area",
          area: selectedArea,
          priority,
          primary: true,
          repeating,
        };
        break;
    }

    const needKey = getNeedKey(need);
    $game.needs[needKey] = need;
    $openModals["addNeeds"] = false;
  }
</script>

<div class="modal-header">
  <h2>Add New Need</h2>
  <button
    class="close-btn"
    on:click={() => ($openModals["addNeeds"] = undefined)}>×</button
  >
</div>

<div class="modal-body">
  <div class="form-group">
    <label for="need-type">Need Type:</label>
    <select id="need-type" bind:value={needType}>
      <option value="item">Item</option>
      <option value="itemCategory">Item Category</option>
      <option value="building">Building</option>
      <option value="area">Area</option>
    </select>
  </div>

  {#if needType === "item"}
    <div class="form-group">
      <label for="item-select">Item:</label>
      <select id="item-select" bind:value={selectedItem}>
        {#each Object.keys(items) as itemName}
          <option value={itemName}>{itemName}</option>
        {/each}
      </select>
    </div>
    <div class="form-group">
      <label for="quantity">Quantity:</label>
      <input id="quantity" type="number" min="1" bind:value={quantity} />
    </div>
  {/if}

  {#if needType === "itemCategory"}
    <div class="form-group">
      <label for="category-select">Category:</label>
      <select id="category-select" bind:value={selectedCategory}>
        {#each itemCategories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
    </div>
    <div class="form-group">
      <label for="quantity">Quantity:</label>
      <input id="quantity" type="number" min="1" bind:value={quantity} />
    </div>
  {/if}

  {#if needType === "building"}
    <div class="form-group">
      <label for="building-select">Building:</label>
      <select id="building-select" bind:value={selectedBuilding}>
        {#each Object.keys(buildingTypes) as buildingType}
          <option value={buildingType}>{buildingType}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if needType === "area"}
    <div class="form-group">
      <label for="area-select">Area:</label>
      <select id="area-select" bind:value={selectedArea}>
        {#each Object.keys(areaTypes) as areaType}
          <option value={areaType}>{areaType}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="form-group">
    <label for="priority">Priority:</label>
    <input
      id="priority"
      type="number"
      min="0"
      step="0.1"
      bind:value={priority}
    />
  </div>

  <div class="form-group">
    <label>
      <input type="checkbox" bind:checked={repeating} />
      Repeating Need
    </label>
  </div>
</div>

<div class="modal-footer">
  <button class="btn-primary" on:click={createNeed}>Create Need</button>
</div>

<style>
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #444;
  }

  .modal-header h2 {
    margin: 0;
  }
  .close-btn:hover {
    color: #fff;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }

  .form-group select,
  .form-group input[type="number"] {
    width: 100%;
    padding: 0.5rem;
    background: #1a1a1a;
    border: 1px solid #555;
    border-radius: 4px;
    color: gold;
    font-size: 0.9rem;
    font-family: inherit;
  }

  .form-group select:focus,
  .form-group input[type="number"]:focus {
    outline: none;
    border-color: #777;
  }

  .form-group input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  .modal-footer {
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #444;
  }

  button {
    font-family: inherit;
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
</style>
