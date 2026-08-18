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
	<title>HALP/TOOLS / bulk image viewer</title>
</svelte:head>

<div class="relative flex flex-1 flex-col gap-6 p-4 sm:gap-8 sm:p-8">
	<PageHeader title="Bulk Image Viewer" />

	<div class="flex w-full flex-col items-stretch gap-3 sm:flex-row">
		<Input
			bind:value={input}
			placeholder="Paste comma-separated image URLs..."
			class="w-full sm:flex-1"
		/>
		<CopyButton text={jsonText} label="Copy as JSON" />
	</div>

	{#if images.length > 0}
		<!-- max-h (not fixed h) keeps wide panoramas from letterboxing once max-w-full clamps them. -->
		<div class="flex flex-wrap items-start gap-3">
			{#each images as url (url)}
				<img
					src={url}
					alt=""
					loading="lazy"
					class="max-h-48 w-auto max-w-full border border-border object-contain sm:max-h-70"
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
