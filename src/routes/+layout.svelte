<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.ico" /></svelte:head>

<div class="relative flex min-h-screen flex-col">
	<header
		class="relative z-10 flex h-10 shrink-0 items-center border-b border-border bg-surface px-3"
	>
		<a
			href={resolve('/')}
			class="font-heading shrink-0 text-lg tracking-[0.08em] text-accent uppercase no-underline"
		>
			HALP/TOOLS
		</a>
	</header>
	<main class="relative z-1 flex flex-1 flex-col">
		{@render children()}
	</main>
</div>
