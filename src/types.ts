export type WrestlerStatus = 'POOL' | 'DRAFTED' | 'IN_RING' | 'ELIMINATED';

export interface Wrestler {
  id: string;
  name: string;
  status: WrestlerStatus;
  draftedBy: string | null; // Participant ID
  eliminatedBy: string[]; // Array of Wrestler IDs
  entryOrder: number | null;
  eliminationTime: number | null; // timestamp
  affiliation?: string;
  odds?: string | number;
  confirmed?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  roster: string[]; // Array of Wrestler IDs
  totalScore: number;
}

export interface LogEvent {
  message: string;
  timestamp: number;
}
