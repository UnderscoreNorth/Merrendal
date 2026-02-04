<script lang="ts">
  import { openModals } from "$lib/stores";

  export let to: string;
  export let newWindow: boolean = false;

  function handleClick() {
    if (newWindow) {
      // Open in a new encyclopedia window
      const windowId = `encyclopedia-${Date.now()}-${Math.random()}`;
      if (!$openModals.Encyclopedia) {
        $openModals.Encyclopedia = {};
      }
      $openModals.Encyclopedia[windowId] = { id: 0, page: to };
      $openModals = $openModals;
    } else {
      // Navigate in the current window - handled by parent Encyclopedia component
      // Dispatch custom event that Encyclopedia will listen to
      const event = new CustomEvent("navigate", {
        detail: { page: to },
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  }
</script>

<button class="wiki-link" on:click={handleClick}>
  <slot />
</button>

<style>
  .wiki-link {
    display: inline;
    background: none;
    border: none;
    color: #4a9eff;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    margin: 0;
    font-size: inherit;
    font-family: inherit;
    line-height: inherit;
  }

  .wiki-link:hover {
    color: #6bb3ff;
    text-decoration: none;
  }

  .wiki-link:active {
    color: #2980d9;
  }
</style>
