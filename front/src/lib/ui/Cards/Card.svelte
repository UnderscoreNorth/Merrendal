<script lang="ts">
  import { openModals } from "$lib/stores";

  export let draggable = false;
  export let padding = 0.5;
  export let modal = "";
  let card: HTMLDivElement;
  let x = 0;
  let y = 0;
  function drag(
    e: DragEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    let newX = e.clientX - x;
    let newY = e.clientY - y;
    if (newX < 0) newX = 0;
    if (newX + card.clientWidth > window.innerWidth)
      newX = window.innerWidth - card.clientWidth;
    if (newY < 0) newY = 0;
    if (newY + card.clientHeight > window.innerHeight)
      newY = window.innerHeight - card.clientHeight;
    card.style.left = newX + "px";
    card.style.top = newY + "px";
  }
</script>

{#if modal == "" || $openModals[modal] !== undefined}
  <div bind:this={card} class="card" style:position="relative">
    {#if draggable}
      <div
        class="dragHandle"
        {draggable}
        on:dblclick={() => {
          card.style.position = "relative";
        }}
        on:dragstart={(e) => {
          x = e.clientX - card.getBoundingClientRect().x;
          y = e.clientY - card.getBoundingClientRect().y;
          card.style.left = e.clientX - x + "px";
          card.style.top = e.clientY - y + "px";
          card.style.position = "absolute";
          //@ts-ignore
          e.dataTransfer?.setDragImage(card.cloneNode(true), 0, 0);
        }}
        on:drag={drag}
        on:dragend={drag}>
      </div>
    {/if}
    <div style:padding={padding + "rem"}>
      <slot />
    </div>
  </div>
{/if}

<style>
  .dragHandle {
    height: 3rem;
    cursor: grab;
    background: rgba(0, 0, 0, 0.1);
    width: 90%;
    position: absolute;
  }
  .card {
    width: auto;
    pointer-events: all;
    z-index: 2;
    background-image: url("https://img.freepik.com/free-photo/wooden-floor-background_53876-88628.jpg");
    background-size: cover;
    border: solid 2px black;
    max-height: 90vh;
    overflow-y: auto;
  }
  .card:hover {
    opacity: 1;
  }
</style>
