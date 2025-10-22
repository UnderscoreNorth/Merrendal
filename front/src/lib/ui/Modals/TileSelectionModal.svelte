<script lang="ts">
  import { tileSelection } from "$lib/stores";

  function handleCancel() {
    if ($tileSelection) {
      $tileSelection.onCancel();
    }
  }
</script>

<div class="modal-content">
  <h3>Select a Tile</h3>
  <p>
    Click on a highlighted tile to place the upgrade, or click Cancel to abort.
  </p>
  <button on:click={handleCancel}>Cancel</button>
</div>

<style>
  .modal-content {
    min-width: 300px;
    max-width: 500px;
  }

  h3 {
    margin: 0 0 1em 0;
    font-size: 1.2em;
  }

  p {
    margin: 0 0 1.5em 0;
  }

  button {
    background: none;
    border: 1px solid currentColor;
    padding: 0.5em 1em;
    font-size: inherit;
    cursor: pointer;
    font-family: inherit;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
