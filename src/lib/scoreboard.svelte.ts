import { browser } from '$app/environment';

export type Phase = 'setup' | 'board';

export interface Player {
	id: number;
	name: string;
	score: number;
}

interface Change {
	playerId: number;
	delta: number;
}

const STORAGE_KEY = 'halp-tools:scoreboard';
const STORAGE_VERSION = 1;
/* A saved game is a round in progress, not a document. After a few hours it is almost
   certainly a stale round nobody wants to resume, so it expires instead of lingering. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

const DEFAULT_STEPS = [1, 5, 10];

let nextId = 1;

const blankPlayer = (): Player => ({ id: nextId++, name: '', score: 0 });

export const game = $state({
	phase: 'setup' as Phase,
	players: [blankPlayer(), blankPlayer()],
	steps: [...DEFAULT_STEPS],
	customAmount: true,
	/* In-memory only. A half-finished undo stack from hours ago is more confusing than
	   no undo stack, so it is deliberately left out of storage. */
	history: [] as Change[]
});

export const addPlayer = () => {
	game.players = [...game.players, blankPlayer()];
};

export const removePlayer = (id: number) => {
	game.players = game.players.filter((p) => p.id !== id);
	game.history = game.history.filter((c) => c.playerId !== id);
};

export const addStep = (amount: number) => {
	if (!Number.isFinite(amount) || amount <= 0 || game.steps.includes(amount)) return;
	game.steps = [...game.steps, amount].sort((a, b) => a - b);
};

export const removeStep = (amount: number) => {
	game.steps = game.steps.filter((s) => s !== amount);
};

export const canStart = () =>
	game.steps.length > 0 && game.players.some((p) => p.name.trim().length > 0);

export const start = () => {
	if (!canStart()) return;
	game.players = game.players
		.filter((p) => p.name.trim().length > 0)
		.map((p) => ({ ...p, name: p.name.trim() }));
	game.phase = 'board';
};

export const editSetup = () => {
	game.phase = 'setup';
};

export const adjust = (id: number, delta: number) => {
	if (!Number.isFinite(delta) || delta === 0) return;
	const player = game.players.find((p) => p.id === id);
	if (!player) return;
	player.score = round(player.score + delta);
	game.history = [...game.history, { playerId: id, delta }];
};

export const undo = () => {
	const last = game.history.at(-1);
	if (!last) return;
	const player = game.players.find((p) => p.id === last.playerId);
	if (player) player.score = round(player.score - last.delta);
	game.history = game.history.slice(0, -1);
};

export const lastChange = () => {
	const last = game.history.at(-1);
	if (!last) return null;
	const player = game.players.find((p) => p.id === last.playerId);
	if (!player) return null;
	return { name: player.name, delta: last.delta };
};

export const resetScores = () => {
	for (const player of game.players) player.score = 0;
	game.history = [];
};

export const newGame = () => {
	game.phase = 'setup';
	game.players = [blankPlayer(), blankPlayer()];
	game.steps = [...DEFAULT_STEPS];
	game.customAmount = true;
	game.history = [];
};

/* Steps may be fractional (0.5-point games), and repeated float addition drifts. */
const round = (n: number) => Math.round(n * 100) / 100;

interface Persisted {
	version: number;
	savedAt: number;
	phase: Phase;
	players: { name: string; score: number }[];
	steps: number[];
	customAmount: boolean;
}

const isPersisted = (value: unknown): value is Persisted => {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.version === 'number' &&
		typeof v.savedAt === 'number' &&
		(v.phase === 'setup' || v.phase === 'board') &&
		typeof v.customAmount === 'boolean' &&
		Array.isArray(v.steps) &&
		v.steps.every((s) => typeof s === 'number' && Number.isFinite(s) && s > 0) &&
		Array.isArray(v.players) &&
		v.players.every(
			(p) =>
				typeof p === 'object' &&
				p !== null &&
				typeof (p as Player).name === 'string' &&
				typeof (p as Player).score === 'number' &&
				Number.isFinite((p as Player).score)
		)
	);
};

const forget = () => {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// storage unavailable
	}
};

export const saveGame = () => {
	if (!browser) return;
	const payload: Persisted = {
		version: STORAGE_VERSION,
		savedAt: Date.now(),
		phase: game.phase,
		players: game.players.map((p) => ({ name: p.name, score: p.score })),
		steps: [...game.steps],
		customAmount: game.customAmount
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// storage full or blocked; the game still works for this session
	}
};

export const loadGame = () => {
	if (!browser) return;

	let raw: string | null;
	try {
		raw = localStorage.getItem(STORAGE_KEY);
	} catch {
		return;
	}
	if (!raw) return;

	let saved: unknown;
	try {
		saved = JSON.parse(raw);
	} catch {
		forget();
		return;
	}

	if (
		!isPersisted(saved) ||
		saved.version !== STORAGE_VERSION ||
		Date.now() - saved.savedAt > MAX_AGE_MS
	) {
		forget();
		return;
	}

	game.phase = saved.phase;
	game.players = saved.players.map((p) => ({ id: nextId++, name: p.name, score: p.score }));
	game.steps = [...saved.steps];
	game.customAmount = saved.customAmount;
	game.history = [];

	/* A board with nothing on it is a dead end: send them back to setup. */
	if (game.players.length === 0) newGame();
};
