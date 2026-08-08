<script lang="ts">
	import { onMount } from 'svelte';
	import NumberFlow from '@number-flow/svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Kbd from '$lib/components/Kbd.svelte';
	import { detectPlatform, platform } from '$lib/platform.svelte';

	onMount(detectPlatform);

	let history = $state<number[]>([0]);
	let index = $state(0);

	const value = $derived(history[index]);

	const push = (n: number) => {
		history = [...history.slice(0, index + 1), n];
		index = history.length - 1;
	};

	const increment = () => push(value + 1);
	const decrement = () => push(value - 1);
	const reset = () => push(0);

	const undo = () => {
		if (index > 0) index--;
	};

	const redo = () => {
		if (index < history.length - 1) index++;
	};

	const onkeydown = (e: KeyboardEvent) => {
		const tag = (e.target as HTMLElement).tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || e.altKey) return;

		/* Command on Mac, Control everywhere else. Accepting both costs nothing: neither
		   platform binds the other's combination to anything the page would shadow. */
		const mod = e.metaKey || e.ctrlKey;

		if (mod && e.code === 'KeyZ' && !e.shiftKey) {
			e.preventDefault();
			undo();
		} else if ((mod && e.code === 'KeyY') || (mod && e.code === 'KeyZ' && e.shiftKey)) {
			e.preventDefault();
			redo();
		} else if (mod) {
			/* Leave the browser's own Cmd/Ctrl shortcuts alone — notably Cmd+R to reload,
			   which used to fall through to the unmodified reset below. */
			return;
		} else if (e.code === 'ArrowLeft') {
			e.preventDefault();
			decrement();
		} else if (e.code === 'ArrowRight') {
			e.preventDefault();
			increment();
		} else if (e.code === 'KeyR') {
			e.preventDefault();
			reset();
		}
	};

	const shortcuts = $derived([
		{ keys: ['R'], label: 'Reset (recorded in history)' },
		{ keys: [platform.isMac ? '⌘' : 'Ctrl', 'Z'], label: 'Undo' },
		{ keys: platform.isMac ? ['⇧', '⌘', 'Z'] : ['Ctrl', 'Y'], label: 'Redo' },
		{ keys: ['←'], label: 'Decrement' },
		{ keys: ['→'], label: 'Increment' }
	]);
</script>

<svelte:head>
	<title>halp/tools / counter</title>
</svelte:head>

<svelte:window {onkeydown} />

<div
	class="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16"
>
	<PageHeader title="Counter" />

	<div class="flex w-full max-w-lg items-center justify-center gap-3 sm:gap-10">
		<button
			onclick={decrement}
			class="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center border border-border bg-surface text-3xl text-muted transition-[border-color,color] select-none hover:border-accent hover:text-text sm:h-20 sm:w-20 sm:text-4xl"
			aria-label="Decrement"
		>
			-
		</button>

		<div
			class="min-w-0 flex-1 text-center font-heading text-[clamp(3.25rem,16vw,6rem)] leading-none text-text tabular-nums"
		>
			<NumberFlow {value} />
		</div>

		<button
			onclick={increment}
			class="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center border border-border bg-surface text-3xl text-muted transition-[border-color,color] select-none hover:border-accent hover:text-text sm:h-20 sm:w-20 sm:text-4xl"
			aria-label="Increment"
		>
			+
		</button>
	</div>

	<!-- Undo/redo are keyboard-only otherwise, which strands the tool's core feature on touch devices. -->
	<div class="flex items-center gap-1 text-xs text-muted">
		<button
			onclick={undo}
			disabled={index === 0}
			class="min-h-11 cursor-pointer border-0 bg-transparent px-3 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors select-none hover:text-text disabled:cursor-default disabled:opacity-30 disabled:hover:text-muted sm:min-h-0"
		>
			Undo
		</button>
		<span class="h-3 w-px bg-border"></span>
		<button
			onclick={reset}
			class="min-h-11 cursor-pointer border-0 bg-transparent px-3 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors select-none hover:text-text sm:min-h-0"
		>
			Reset
		</button>
		<span class="h-3 w-px bg-border"></span>
		<button
			onclick={redo}
			disabled={index === history.length - 1}
			class="min-h-11 cursor-pointer border-0 bg-transparent px-3 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors select-none hover:text-text disabled:cursor-default disabled:opacity-30 disabled:hover:text-muted sm:min-h-0"
		>
			Redo
		</button>
	</div>

	<!-- Physical-keyboard hints are noise on touch devices. -->
	<div class="hidden w-full max-w-sm border border-border bg-surface sm:block">
		<div class="flex h-9 items-center border-b border-border px-3">
			<span class="text-xs tracking-[0.16em] text-muted uppercase">Keyboard Shortcuts</span>
		</div>
		<div class="divide-y divide-border">
			{#each shortcuts as shortcut (shortcut.label)}
				<div class="flex items-center justify-between px-3 py-2">
					<span class="text-sm text-muted">{shortcut.label}</span>
					<div class="flex items-center gap-1">
						{#each shortcut.keys as key (key)}
							<Kbd>{key}</Kbd>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
