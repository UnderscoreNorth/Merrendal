<script lang="ts">
  import { buildingTypes } from "$lib/data/buildings";
  import { recipes } from "$lib/data/recipes";
  import { game } from "$lib/stores";
  import { recordLoop } from "$lib/util/recordLoop";
  import Collapsible from "../Collapsible.svelte";
</script>

<Collapsible
  hidden={true}
  headerType={2}
  headerName="Recipes without buildings">
  {#each recordLoop(recipes).filter(([itemName, recipe]) => !Object.values(buildingTypes).some( (i) => i.allowedRecipes.includes(itemName), )) as [itemName, recipe]}
    <div>{itemName}</div>
  {/each}
</Collapsible>
