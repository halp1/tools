<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	const tools = [
		{
			slug: 'counter',
			name: 'Counter',
			description: 'Increment, decrement, and track a number with full undo/redo history.'
		},
		{
			slug: 'bulk-image-viewer',
			name: 'Bulk Image Viewer',
			description: 'Easily view and export large lists of images at once.'
		}
	];

	let query = $state('');

	const filtered = $derived(
		tools.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
	);
</script>

<svelte:head>
	<title>halp/tools</title>
</svelte:head>

<div class="p-8">
	<div class="mb-8">
		<input
			type="text"
			placeholder="Search tools..."
			bind:value={query}
			class="w-full max-w-sm rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none placeholder:text-[#333] focus:border-accent"
		/>
	</div>

	{#if filtered.length === 0}
		<div
			class="flex h-50 flex-col items-center justify-center gap-3 text-sm tracking-widest text-border uppercase"
		>
			No tools found
		</div>
	{:else}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
			{#each filtered as tool, i (i)}
				<a
					href="/{tool.slug}"
					class="card relative block animate-[fadeUp_0.5s_ease_both] border border-border bg-surface px-6 py-7 no-underline transition-[border-color] hover:border-accent"
					style="animation-delay: {i * 60}ms"
				>
					<p class="mb-2 text-xs tracking-[0.18em] text-accent uppercase">tool</p>
					<h2 class="font-heading mb-2 text-2xl text-text">{tool.name}</h2>
					<p class="text-sm text-muted">{tool.description}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
