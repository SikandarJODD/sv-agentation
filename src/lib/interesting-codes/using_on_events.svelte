<script lang="ts">
	import { on } from 'svelte/events';

	type EventValues = {
		type: string;
		target: EventTarget | null;
		clientX: number;
		clientY: number;
		// Add more properties as needed
		pageX: number;
		pageY: number;
	};

	let event_values: EventValues | null = $state(null);
	function setup(element: HTMLElement) {
		on(element, 'mouseenter', (event) => {
			console.log('event', event);
			element.classList.add('box');
			console.log('mouseenter event detected');
		});

		on(element, 'mousemove', (event) => {
			console.log('event', event);
			event_values = {
				type: event.type,
				target: event.target,
				clientX: event.clientX,
				clientY: event.clientY,
				pageX: event.pageX,
				pageY: event.pageY
			};
			console.log('mousemove event detected');
			// event.preventDefault(); // This works
		});

		on(element, 'mouseleave', (event) => {
			console.log('event', event);
			event_values = null;
			element.classList.remove('box');
			console.log('mouseleave event detected');
		});
	}
</script>

<div {@attach setup} class='w-fit'>Touch area</div>

{#if event_values}
	<div>
		<p>Event Type: {event_values.type}</p>
		<p>Client X: {event_values.clientX}</p>
		<p>Client Y: {event_values.clientY}</p>
		<p>Page X: {event_values.pageX}</p>
		<p>Page Y: {event_values.pageY}</p>
	</div>
{/if}
