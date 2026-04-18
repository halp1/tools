<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
	import Button from './Button.svelte';

	interface Props {
		text: string;
		label?: string;
	}

	let { text, label = 'Copy' }: Props = $props();

	let copied = $state(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// clipboard not available
		}
	};
</script>

<Button
	onclick={copy}
>
	{#if copied}
		<Check />
		Copied
	{:else}
		<Copy />
		{label}
	{/if}
</Button>
