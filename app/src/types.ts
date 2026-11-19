export interface Player {
  id: string;
  name: string;
  score: number;
  createdAt: string;
}

export interface GameState {
  players: Player[];
  lastUpdated: string;
  version: number;
}
