<script lang="ts">
  import { mouseCood } from "$lib/stores";
  import Card from "../Cards/Card.svelte";

  let windowWidth: number;
  let windowHeight: number;
  let rect: { width: number; height: number };
  $: x = $mouseCood.x + 10;
  $: y = $mouseCood.y;
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />
<div
  class="toolTip"
  bind:contentRect={rect}
  style:left={x + "px"}
  style:top={y + "px"}>
  <Card>
    <slot />
  </Card>
</div>

<style>
  .toolTip {
    position: fixed;
    z-index: 999;
  }
</style>
