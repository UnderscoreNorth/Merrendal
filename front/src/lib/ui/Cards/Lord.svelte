<script lang="ts">
  import { game, openModals } from "$lib/stores";
  function getTrustType(trust: number) {
    if (trust < 200) return "Rebellious";
    if (trust < 400) return "Distrustful";
    if (trust < 600) return "Suspicious";
    if (trust < 800) return "Cautious";
    if (trust < 1000) return "Approving";
    if (trust < 1200) return "Trustful";
    return "Loyal";
  }
  function getAuthorityType(authority: number) {
    if (authority < 200) return "Anarchy";
    if (authority < 400) return "Defiant";
    if (authority < 600) return "Unruly";
    if (authority < 800) return "Orderly";
    if (authority < 1000) return "Dutiful";
    if (authority < 1200) return "Submissive";
    return "Sovereign";
  }
</script>

{#if $game.lord}
  <div class="lord-details">
    <img
      class="lord-icon"
      src={`icons/lordBackgrounds/${$game.lord.background}.png`}
      alt="lord icon"
    />
    <div class="lord-text">
      <h3>
        {$game.lord.fName}
        <button
          style:float="right"
          on:click={() => {
            $openModals["pastLords"] = true;
          }}>📔</button
        >
      </h3>
      <p class="background">{$game.lord.background}</p>
      <div class="lord-stats">
        <span class="stat">Age: {$game.lord.age}</span>
        <span class="stat"
          >Reign: {$game.lord.reign} year{$game.lord.reign == 1
            ? ""
            : "s"}</span
        >
      </div>
    </div>
  </div>
  <hr />
  Village Trust: {getTrustType($game.village.trust)}<br />
  Authority: {getAuthorityType($game.village.authority)}
{/if}

<style>
  .lord-details {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .lord-icon {
    height: 4rem;
    width: 4rem;
    object-fit: cover;
    border-radius: 4px;
  }

  .lord-text {
    flex: 1;
    text-align: left;
  }

  .lord-text h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.3rem;
  }

  .background {
    color: #666;
    font-style: italic;
    margin: 0 0 1rem 0;
  }

  .lord-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat {
    font-size: 0.9rem;
    color: #555;
    font-weight: bold;
  }
  button {
    padding: 0;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: none;
  }
  button:hover {
    transform: translateY(-3px);
  }
</style>
