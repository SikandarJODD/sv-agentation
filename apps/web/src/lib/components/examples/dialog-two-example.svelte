<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Share</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Share link</Dialog.Title>
			<Dialog.Description>Anyone who has this link will be able to view this.</Dialog.Description>
		</Dialog.Header>
		<div class="flex items-center gap-2">
			<div class="grid flex-1 gap-2">
				<label for="link" class="sr-only">Link</label>
				<input id="link" defaultValue="https://shadcn-svelte.com/docs/installation" />
			</div>
		</div>
		<Dialog.Footer class="sm:justify-start">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Close</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
