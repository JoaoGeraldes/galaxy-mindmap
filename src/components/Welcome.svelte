<script lang="ts">
  import logo from '../assets/logo.svg';

  let {
    problem,
    onchoose,
  }: {
    problem: string;
    /** Absent where maps live in one fixed place, so there's nothing to choose. */
    onchoose?: () => void;
  } = $props();
</script>

<div class="welcome">
  <div class="card">
    <img class="logo" src={logo} alt="" />
    <h1>Galaxy Mind Map</h1>
    {#if onchoose}
      <p>
        Choose a folder to keep your mind maps in. Each map is saved there as
        its own <code>.json</code> file, and every change is saved automatically.
      </p>
      <p class="muted">
        Pick a folder that already has maps to open them, or an empty one to
        start fresh.
      </p>
    {/if}
    {#if problem}
      <p class="problem" role="alert">{problem}</p>
    {/if}
    {#if onchoose}
      <button class="primary" onclick={onchoose}>Choose folder…</button>
    {/if}
  </div>
</div>

<style>
  .welcome {
    display: grid;
    place-items: center;
    height: 100%;
    background-image: radial-gradient(
      rgb(255 255 255 / 0.07) 1px,
      transparent 1px
    );
    background-size: 24px 24px;
  }

  .card {
    max-width: 420px;
    padding: 32px;
    border-radius: 16px;
    background: var(--surface);
    box-shadow:
      0 0 0 1px var(--border),
      0 0 48px rgb(124 58 237 / 0.25);
  }

  .logo {
    display: block;
    width: 64px;
    height: 64px;
    margin-bottom: 12px;
    filter: drop-shadow(0 0 12px rgb(166 23 255 / 0.6));
  }

  h1 {
    margin: 0 0 12px;
    font-size: 24px;
  }

  p {
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .muted {
    color: var(--text-muted);
    font-size: 14px;
  }

  .problem {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--danger-bg);
    color: var(--danger);
    font-size: 14px;
  }

  button {
    margin-top: 8px;
    padding: 10px 18px;
  }
</style>
