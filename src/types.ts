export type PlayerStatus = 'active' | 'sitting_out' | 'playing';

export interface Player {
  id: string;
  name: string;
  skillLevel?: string; // e.g. '3.0', '3.5', '4.0', '4.5+'
  status: PlayerStatus;
  wins: number;
  losses: number;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  streak: number; // positive for win streak, negative/0 for loss
  joinedAt: number; // timestamp ms
  avatarColor: string;
}

export type CourtStatus = 'vacant' | 'playing' | 'paused';

export interface Court {
  id: string;
  number: number;
  name: string;
  status: CourtStatus;
  currentMatchId?: string | null;
  team1: string[]; // array of player IDs
  team2: string[]; // array of player IDs
  team1Score: number;
  team2Score: number;
  startedAt?: number | null;
}

export type MatchStatus = 'in_progress' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  courtId: string;
  courtName: string;
  team1: string[]; // player IDs
  team2: string[]; // player IDs
  team1Names: string[];
  team2Names: string[];
  team1Score: number;
  team2Score: number;
  winnerTeam?: 1 | 2 | null;
  status: MatchStatus;
  startedAt: number;
  completedAt?: number | null;
}

export type RotationMode = 'random' | 'balanced' | 'queue' | 'king';

export interface SessionSettings {
  targetScore: number; // default 11
  winByTwo: boolean; // default true
  gameType: 'doubles' | 'singles';
  rotationMode: RotationMode;
}

export interface Session {
  id: string;
  title: string;
  passcode: string;
  status: 'active' | 'completed';
  createdAt: number;
  updatedAt: number;
  settings: SessionSettings;
  courtCount: number;
  courtNames: string[];
}
