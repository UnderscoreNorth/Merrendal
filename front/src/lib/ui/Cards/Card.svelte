<script lang="ts">
  export let draggable = false;
  export let padding = 0.5;
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

<div
  bind:this={card}
  class="card"
  {draggable}
  style:padding={padding + "rem"}
  on:dblclick={() => {
    card.style.position = "";
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
  on:dragend={drag}
>
  <slot />
</div>

<style>
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
