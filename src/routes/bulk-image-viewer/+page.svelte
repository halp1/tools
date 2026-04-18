<script lang="ts">
	import { CopyButton, Input, PageHeader } from '$lib/components';

	let input = $state('');

	const images = $derived(
		input
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.filter((s) => s.startsWith('http://') || s.startsWith('https://'))
	);

	const jsonText = $derived(JSON.stringify(images));
</script>

<svelte:head>
	<title>halp/tools / bulk image viewer</title>
</svelte:head>

<div class="relative flex flex-1 flex-col gap-8 p-8">
	<PageHeader title="Bulk Image Viewer" />

	<div class="flex w-full items-stretch gap-3">
		<Input bind:value={input} placeholder="Paste comma-separated image URLs..." class="flex-1" />
		<CopyButton text={jsonText} label="Copy as JSON" />
	</div>

	{#if images.length > 0}
		<div class="flex flex-wrap gap-3">
			{#each images as url (url)}
				<img
					src={url}
					alt=""
					loading="lazy"
					class="h-70 w-auto border border-border object-contain"
				/>
			{/each}
		</div>
	{:else}
		<div
			class="flex h-40 items-center justify-center text-sm tracking-widest text-border uppercase"
		>
			No images
		</div>
	{/if}
</div>
