export type DiceSkin = 'neon' | 'glass' | 'matte' | 'gold';

export interface Profile {
  id: string;
  username: string;
  total_score: number;
  last_drop: string | null;
  active_skin: DiceSkin;
}

export interface LeaderboardEntry {
  username: string;
  total_score: number;
}

export interface DropResult {
  diceValues: number[];
  score: number;
}

export type DropPhase = 'idle' | 'dropping' | 'settling' | 'done';
