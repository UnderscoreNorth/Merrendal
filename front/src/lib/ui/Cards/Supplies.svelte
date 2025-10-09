<script lang="ts">
  import { game } from "$lib/stores";
  import { items } from "$lib/data/items";
  import { recordLoop } from "$lib/util/recordLoop";
  import { calculateDaysOfFoodRemaining } from "$lib/simulation/food";
  $: daysOfFood = calculateDaysOfFoodRemaining($game);
</script>

<table>
  <tr>
    <td colspan="4"
      >Days of food remaining: {daysOfFood.toFixed(1)}
      <hr /></td
    >
  </tr>
  {#each recordLoop($game.inventory || {}) as [item, quantity]}
    <tr>
      <th>{item}</th>
      <td class="quantity">{quantity?.toFixed(2)}</td>
      <td>{items[item].unitType}</td>
      {#if $game.priorInventory[item] !== undefined}
        <td class="quantity"
          >{((quantity ?? 0) - $game.priorInventory[item]).toFixed(2)}</td
        >
      {/if}
    </tr>
  {/each}
</table>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 20rem;
  }

  table th,
  table td {
    text-align: left;
  }
  .quantity {
    text-align: right;
    padding-left: 5px;
  }

  table th {
    font-style: italic;
    width: 6rem;
  }
</style>
