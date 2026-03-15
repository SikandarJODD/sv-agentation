<script>
	let online = $state(true);
</script>

<svelte:window bind:online />

{#if !online}
	<div class="offline-warning">You are currently offline</div>
{/if}
