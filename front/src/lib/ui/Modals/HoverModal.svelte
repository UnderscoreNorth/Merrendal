<script lang="ts">
  import { mouseCood } from "$lib/stores";
</script>

<div
  style:position="fixed"
  style:left={$mouseCood.x + 10 + "px"}
  style:top={$mouseCood.y + 5 + "px"}
  class="hoverModal"
>
  <slot />
</div>

<style>
  div {
    background-image: url("https://img.freepik.com/free-photo/wooden-floor-background_53876-88628.jpg");
    background-size: cover;
    border: solid 1px black;
  }
</style>
