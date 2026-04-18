<script lang="ts">
	import NumberFlow from '@number-flow/svelte';

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
		if (tag === 'INPUT' || tag === 'TEXTAREA') return;

		if (e.code === 'ArrowLeft') {
			e.preventDefault();
			decrement();
		} else if (e.code === 'ArrowRight') {
			e.preventDefault();
			increment();
		} else if (e.ctrlKey && e.code === 'KeyZ') {
			e.preventDefault();
			undo();
		} else if (e.ctrlKey && e.code === 'KeyY') {
			e.preventDefault();
			redo();
		} else if (e.code === 'KeyR') {
			e.preventDefault();
			reset();
		}
	};

	const shortcuts = [
		{ keys: ['R'], label: 'Reset (recorded in history)' },
		{ keys: ['Ctrl', 'Z'], label: 'Undo' },
		{ keys: ['Ctrl', 'Y'], label: 'Redo' },
		{ keys: ['←'], label: 'Decrement' },
		{ keys: ['→'], label: 'Increment' }
	];
</script>

<svelte:head>
	<title>halp/tools / counter</title>
</svelte:head>

<svelte:window {onkeydown} />

<div class="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-16">
	<div class="flex flex-col items-center gap-2">
		<h1 class="font-heading text-4xl text-text">Counter</h1>
	</div>

	<div class="flex items-center gap-10">
		<button
			onclick={decrement}
			class="flex h-20 w-20 cursor-pointer items-center justify-center border border-border bg-surface text-4xl text-muted transition-[border-color,color] hover:border-accent hover:text-text"
			aria-label="Decrement"
		>
			-
		</button>

		<div class="font-heading w-64 text-center text-[6rem] leading-none text-text tabular-nums">
			<NumberFlow {value} />
		</div>

		<button
			onclick={increment}
			class="flex h-20 w-20 cursor-pointer items-center justify-center border border-border bg-surface text-4xl text-muted transition-[border-color,color] hover:border-accent hover:text-text"
			aria-label="Increment"
		>
			+
		</button>
	</div>

	<div class="flex items-center gap-3 text-xs text-muted">
		<!-- <span>step {index + 1} / {history.length}</span>
		<span class="h-3 w-px bg-border"></span> -->
		<button
			onclick={reset}
			class="cursor-pointer border-0 bg-transparent font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors hover:text-text"
		>
			Reset
		</button>
	</div>

	<div class="w-full max-w-sm border border-border bg-surface">
		<div class="flex h-9 items-center border-b border-border px-3">
			<span class="text-xs tracking-[0.16em] text-muted uppercase">Keyboard Shortcuts</span>
		</div>
		<div class="divide-y divide-border">
			{#each shortcuts as shortcut (shortcut.label)}
				<div class="flex items-center justify-between px-3 py-2">
					<span class="text-sm text-muted">{shortcut.label}</span>
					<div class="flex items-center gap-1">
						{#each shortcut.keys as key (key)}
							<kbd class="border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-text"
								>{key}</kbd
							>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
