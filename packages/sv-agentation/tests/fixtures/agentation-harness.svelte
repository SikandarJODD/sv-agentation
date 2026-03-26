<script lang="ts">
	// @ts-nocheck
	import { Agentation } from '../../src/lib';

	let { initialProps = {} } = $props();
	let props = $state({});
	let didSeedProps = false;

	$effect.pre(() => {
		if (didSeedProps) return;

		props = { ...initialProps };
		didSeedProps = true;
	});

	export function setInspectorProps(next) {
		props = {
			...props,
			...next
		};
	}
</script>

<Agentation {...props} />
