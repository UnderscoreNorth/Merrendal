<script lang="ts">
  import { init } from "$lib/init";
  import { clearSave, saveGame } from "$lib/storage";
  import { view } from "$lib/stores";

  export let updateMap: () => void = () => {};

  const treeOpacityOptions = [0, 50, 100];
  const reliefOptions = [0, 1, 2, 3, 4];

  function cycleTreeOpacity() {
    view.update((v) => {
      const currentIndex = treeOpacityOptions.indexOf(v.treeOpacity);
      const nextIndex = (currentIndex + 1) % treeOpacityOptions.length;
      return { ...v, treeOpacity: treeOpacityOptions[nextIndex] };
    });
    updateMap();
  }

  function cycleRelief() {
    view.update((v) => {
      const currentIndex = reliefOptions.indexOf(v.relief);
      const nextIndex = (currentIndex + 1) % reliefOptions.length;
      return { ...v, relief: reliefOptions[nextIndex] };
    });
    updateMap();
  }

  function onRotate() {
    view.update((v) => ({
      ...v,
      rotation: (v.rotation + 60) % 360,
    }));
    updateMap();
  }
</script>

<div class="map-controls">
  <button
    class="control-button"
    on:click={() => {
      clearSave();
      location.reload();
    }}
    title="New Game">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      class="svelte-c8tyih"
      ><path
        d="M208.242 24.629l-52.058 95.205 95.207 52.059 17.271-31.586-42.424-23.198A143.26 143.26 0 0 1 256 114c78.638 0 142 63.362 142 142s-63.362 142-142 142-142-63.362-142-142c0-16.46 2.785-32.247 7.896-46.928l-32.32-16.16C82.106 212.535 78 233.798 78 256c0 98.093 79.907 178 178 178s178-79.907 178-178S354.093 78 256 78c-13.103 0-25.875 1.44-38.18 4.148l22.008-40.25-31.586-17.27zm104.27 130.379L247 253.275V368h18V258.725l62.488-93.733-14.976-9.984z"
      ></path
      ></svg>
  </button>
  <button class="control-button" on:click={onRotate} title="Rotate Map">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      class="svelte-c8tyih"
      ><path
        d="M263.09 50c-11.882-.007-23.875 1.018-35.857 3.13C142.026 68.156 75.156 135.026 60.13 220.233 45.108 305.44 85.075 391.15 160.005 434.41c32.782 18.927 69.254 27.996 105.463 27.553 46.555-.57 92.675-16.865 129.957-48.15l-30.855-36.768c-50.95 42.75-122.968 49.05-180.566 15.797-57.597-33.254-88.152-98.777-76.603-164.274 11.55-65.497 62.672-116.62 128.17-128.168 51.656-9.108 103.323 7.98 139.17 43.862L327 192h128V64l-46.34 46.342C370.242 71.962 317.83 50.03 263.09 50z"
      ></path
      ></svg>
  </button>

  <button
    class="control-button opacity-button"
    on:click={cycleTreeOpacity}
    title="Toggle Tree Opacity">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      class="svelte-c8tyih"
      ><path
        d="M249.28 19.188v.25c-18.114 38.634-45.065 72.36-77.686 102.937l37.72-3.938-51.345 65.032 24.81-7.907-33.624 54.875 16.53 9.843-65.25 92.157 36.095.188-51.686 83.594 63.562-8.126 12 32.094 66.438-25.282L215.5 493.28h52.938l-6.532-68.217 38.188 16.406 10.187-24.783 44.283 20.97 56.406-20.75-37.064-64.094-12.437-2.282 6.78 17.19 7.844 19.905-19.938-7.78-50.906-19.908V395.688l-14.156-8.594-69.375-42-21.595 21.25-18.03 17.75 2.155-25.22 2.125-24.655 18.188 1.56 9.218-9.092 5.19-5.094 6.218 3.75 61.375 37.156v-29.906l12.75 4.97 43.718 17.092-5.092-12.906-6.157-15.656 16.533 3.03 45.468 8.345-34.53-38.94-23.625 14.033-6.688 3.968-5.125-5.874-14.28-16.437.218 1.217-18.406 3.22-5.97-34.313-5.75-33.063 22 25.345 31.188 35.875 43.907-26.03c-24.67-19.543-39.507-33.87-49.658-48.814l.813 12.656 1.97 31-18.75-24.75-34.47-45.437-22.25 46.813-13.844 29.125-3.843-32.032-3.5-28.843 16.532-1.968 16.624-34.97 6.594-13.875 9.28 12.22 25 32.936-.75-11.53-.906-14.28 13.47 4.936L341.81 188l-26.125-35.156-55.843-28.875-8.938 20.218-9.656 21.937-7.72-22.688-7.468-21.875 16.97-5.78 3.718-8.438 4-9.125 8.844 4.593 49.375 25.53 16.467-5.562c-43.42-34.31-64.63-68.886-76.156-103.593z"
      ></path
      ></svg>
    <span class="value">{$view.treeOpacity}%</span>
  </button>
  <button
    class="control-button opacity-button"
    on:click={cycleRelief}
    title="Toggle Relief">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      class="svelte-c8tyih"
      ><path
        d="M256 47L139.4 202.467l93.6-40.115V359h46V162.352l93.6 40.115L256 47zM144 256L32 480h448L368 256h-71v121h-82V256h-71z"
      ></path
      ></svg>
    <span class="value">{$view.relief}</span>
  </button>
</div>

<style>
  .map-controls {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
  }

  .control-button {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: rgba(58, 59, 60, 0.9);
    border: 2px solid gold;
    color: gold;
    fill: gold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
  }

  .control-button:hover:not(:disabled) {
    background-color: rgba(78, 79, 80, 0.95);
  }

  .control-button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .control-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .control-button svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .opacity-button {
    position: relative;
  }

  .opacity-button .value {
    position: absolute;
    bottom: -0.25rem;
    right: -0.25rem;
    background: rgba(58, 59, 60, 0.95);
    border: 1px solid gold;
    border-radius: 0.5rem;
    padding: 0.1rem 0.3rem;
    font-size: 0.65rem;
    font-weight: bold;
    color: gold;
  }
</style>
