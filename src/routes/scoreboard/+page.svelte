<script lang="ts">
	import { onMount } from 'svelte';
	import NumberFlow from '@number-flow/svelte';
	import { Minus, Plus, X } from '@lucide/svelte';
	import { Button, Input, PageHeader } from '$lib/components';
	import {
		addPlayer,
		addStep,
		adjust,
		canStart,
		editSetup,
		game,
		lastChange,
		loadGame,
		newGame,
		removePlayer,
		removeStep,
		resetScores,
		saveGame,
		start,
		undo
	} from '$lib/scoreboard.svelte';

	/* The saved game only exists in the browser, so rendering waits for it rather than
	   painting a fresh setup screen the loaded state would immediately contradict. */
	let ready = $state(false);

	onMount(() => {
		loadGame();
		ready = true;
	});

	$effect(() => {
		if (ready) saveGame();
	});

	let newStep = $state('');
	let customFor = $state<number | null>(null);
	let customValue = $state('');
	let confirming = $state<'reset' | 'new' | null>(null);
	let confirmTimer: ReturnType<typeof setTimeout>;

	/* Descending negatives then ascending positives, so the row reads like a number line. */
	const amounts = $derived(
		[...game.steps]
			.reverse()
			.map((s) => -s)
			.concat(game.steps)
	);

	const leaders = $derived.by(() => {
		if (game.players.length < 2) return new Set<number>();
		const scores = game.players.map((p) => p.score);
		const max = Math.max(...scores);
		if (max === Math.min(...scores)) return new Set<number>();
		return new Set(game.players.filter((p) => p.score === max).map((p) => p.id));
	});

	const pending = $derived(lastChange());

	const submitStep = (e: SubmitEvent) => {
		e.preventDefault();
		addStep(Number(newStep));
		newStep = '';
	};

	const openCustom = (id: number) => {
		customFor = customFor === id ? null : id;
		customValue = '';
	};

	const applyCustom = (id: number, sign: 1 | -1) => {
		const amount = Math.abs(Number(customValue));
		if (!amount) return;
		adjust(id, amount * sign);
		customFor = null;
		customValue = '';
	};

	/* Both actions are unrecoverable, so they take a second tap rather than a dialog. */
	const armed = (action: 'reset' | 'new', run: () => void) => () => {
		if (confirming === action) {
			run();
			confirming = null;
			return;
		}
		confirming = action;
		clearTimeout(confirmTimer);
		confirmTimer = setTimeout(() => (confirming = null), 3000);
	};

	const format = (n: number) => (n > 0 ? `+${n}` : `${n}`);

	const stepButton =
		'flex min-h-11 cursor-pointer items-center justify-center border border-border bg-bg px-2 font-mono text-sm text-muted transition-[border-color,color] select-none hover:border-accent hover:text-text';
	const ghostButton =
		'min-h-11 cursor-pointer border-0 bg-transparent px-3 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors select-none hover:text-text disabled:cursor-default disabled:opacity-30 disabled:hover:text-muted sm:min-h-0';
</script>

<svelte:head>
	<title>halp/tools / scoreboard</title>
</svelte:head>

<div class="relative flex flex-1 flex-col gap-6 p-4 sm:gap-8 sm:p-8">
	<PageHeader title="Scoreboard" eyebrow={ready && game.phase === 'board' ? 'scoring' : 'setup'} />

	{#if !ready}
		<div
			class="flex h-40 items-center justify-center text-sm tracking-widest text-border uppercase"
		>
			Loading
		</div>
	{:else if game.phase === 'setup'}
		<div class="mx-auto flex w-full max-w-lg flex-col gap-8">
			<section class="flex flex-col gap-3">
				<h2 class="text-xs tracking-[0.16em] text-muted uppercase">Players</h2>

				{#each game.players as player, i (player.id)}
					<div class="flex items-center gap-2">
						<Input bind:value={player.name} placeholder="Player {i + 1}" class="flex-1" />
						<button
							onclick={() => removePlayer(player.id)}
							disabled={game.players.length === 1}
							aria-label="Remove player {i + 1}"
							class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-border bg-bg text-muted transition-[border-color,color] select-none hover:border-accent hover:text-text disabled:cursor-default disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted"
						>
							<X size={14} />
						</button>
					</div>
				{/each}

				<button
					onclick={addPlayer}
					class="min-h-11 cursor-pointer border border-dashed border-border bg-transparent px-3 font-mono text-xs tracking-[0.12em] text-muted uppercase transition-colors select-none hover:border-accent hover:text-text"
				>
					+ Add player
				</button>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="text-xs tracking-[0.16em] text-muted uppercase">Score amounts</h2>

				{#if game.steps.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each game.steps as step (step)}
							<span
								class="flex min-h-11 items-center gap-2 border border-border bg-surface pr-2 pl-3 font-mono text-sm text-text sm:min-h-9"
							>
								{step}
								<button
									onclick={() => removeStep(step)}
									aria-label="Remove amount {step}"
									class="flex h-6 w-6 cursor-pointer items-center justify-center text-muted transition-colors select-none hover:text-accent"
								>
									<X size={12} />
								</button>
							</span>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted">Add at least one amount to score by.</p>
				{/if}

				<form onsubmit={submitStep} class="flex items-center gap-2">
					<Input
						bind:value={newStep}
						type="number"
						step="any"
						min="0"
						inputmode="decimal"
						placeholder="Add an amount..."
						class="flex-1"
					/>
					<Button type="submit" disabled={!(Number(newStep) > 0)} class="disabled:opacity-30">
						Add
					</Button>
				</form>
			</section>

			<label class="flex cursor-pointer items-center gap-3 text-sm text-muted select-none">
				<input
					type="checkbox"
					bind:checked={game.customAmount}
					class="h-4 w-4 rounded-none border-border bg-bg text-accent focus:ring-0 focus:ring-offset-0"
				/>
				Show a custom amount button on each player
			</label>

			<Button onclick={start} disabled={!canStart()} class="w-full disabled:opacity-30">
				Start scoring
			</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			<!-- items-start so opening one card's custom row does not stretch its neighbours. -->
			<div
				class="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] items-start gap-3 sm:gap-4"
			>
				{#each game.players as player (player.id)}
					{@const leading = leaders.has(player.id)}
					<div
						class="flex flex-col gap-4 border bg-surface p-4 transition-[border-color] {leading
							? 'border-accent'
							: 'border-border'}"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="min-w-0 truncate font-heading text-lg text-text sm:text-xl">
								{player.name}
							</span>
							<span
								class="shrink-0 font-heading text-3xl tabular-nums sm:text-4xl {leading
									? 'text-accent'
									: 'text-text'}"
							>
								<NumberFlow value={player.score} />
							</span>
						</div>

						<!-- A grid rather than a wrapping flex row: grid columns are shared across
						     rows, so every button is the same width however many amounts there are. -->
						<div class="grid grid-cols-[repeat(auto-fit,minmax(3.25rem,1fr))] gap-2">
							{#each amounts as amount (amount)}
								<button onclick={() => adjust(player.id, amount)} class={stepButton}>
									{format(amount)}
								</button>
							{/each}
							{#if game.customAmount}
								<button
									onclick={() => openCustom(player.id)}
									aria-label="Custom amount for {player.name}"
									class="{stepButton} {customFor === player.id ? 'border-accent text-text' : ''}"
								>
									&plusmn;
								</button>
							{/if}
						</div>

						{#if game.customAmount && customFor === player.id}
							<form
								onsubmit={(e) => {
									e.preventDefault();
									applyCustom(player.id, 1);
								}}
								class="flex items-center gap-2 border-t border-border pt-4"
							>
								<Input
									bind:value={customValue}
									type="number"
									step="any"
									min="0"
									inputmode="decimal"
									autofocus
									placeholder="Amount"
									class="flex-1"
								/>
								<button
									type="button"
									onclick={() => applyCustom(player.id, -1)}
									aria-label="Subtract custom amount"
									class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-border bg-bg text-muted transition-[border-color,color] select-none hover:border-accent hover:text-text"
								>
									<Minus size={16} />
								</button>
								<button
									type="submit"
									aria-label="Add custom amount"
									class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-accent bg-accent text-text-inverted transition-opacity select-none hover:opacity-80"
								>
									<Plus size={16} />
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Two columns on phones, one divided row once there is space: four controls
			     wrapped mid-row leave dividers stranded at the end of a line. -->
			<div
				class="mx-auto grid w-full max-w-sm grid-cols-2 items-center gap-1 text-xs text-muted sm:flex sm:max-w-none sm:justify-center"
			>
				<button onclick={undo} disabled={!pending} class={ghostButton}>
					{pending ? `Undo ${pending.name} ${format(pending.delta)}` : 'Undo'}
				</button>
				<span class="hidden h-3 w-px bg-border sm:block"></span>
				<button onclick={armed('reset', resetScores)} class={ghostButton}>
					{confirming === 'reset' ? 'Tap again to confirm' : 'Reset scores'}
				</button>
				<span class="hidden h-3 w-px bg-border sm:block"></span>
				<button onclick={editSetup} class={ghostButton}>Edit setup</button>
				<span class="hidden h-3 w-px bg-border sm:block"></span>
				<button onclick={armed('new', newGame)} class={ghostButton}>
					{confirming === 'new' ? 'Tap again to confirm' : 'New game'}
				</button>
			</div>
		</div>
	{/if}
</div>
