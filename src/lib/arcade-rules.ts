export const TICKET_REWARDS = { daily: 5, task: 2, ad: 1, signup: 1, wallet: 2, mining: 3 } as const;
export const GAME_COST = 1;
export type ArcadeGame = "crash" | "mines" | "higher" | "memory";
export const ARCADE_GAMES: ArcadeGame[] = ["crash", "mines", "higher", "memory"];
export function dailyTicketsAvailable(last: string | null, now: number) { return !last || now - Date.parse(last) >= 86400000; }
export function crashValue(elapsed: number) { return Math.exp(Math.max(0, elapsed) / 7000); }
export function higherWins(current: number, next: number, choice: number) { return choice === 1 ? next > current : next < current; }
export function memoryMatches(sequence: number[], picks: number[]) { return picks.every((value, index) => sequence[index] === value); }