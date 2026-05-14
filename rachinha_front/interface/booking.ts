export interface Booking {
  price_type: "per_person" | "total_split" | undefined;
  price?: number | null;
  _id: string;
  court_id: string;
  start_time: string; // ou Date
  end_time: string; // ou Date
  modality: string;
  status: string;
  created_at: string; // ou Date
  updated_at: string; // ou Date
  max_players: number;
  players: Player[];
  reserve_players: Player[];
  owner_id: string;
  location: {
    alt: string;
  }
  associated_group_id?: string;
  status_list: boolean;
  organized_teams?: BookingOrganizedTeams | null;
}

export interface BookingOrganizedTeams {
  teams?: string[][];
  team_skills_sum?: number[];
  reserves?: string[];
  drawn_at?: string;
  drawn_by_name?: string;
  result?: {
    teams: string[][];
    team_skills_sum: number[];
    reserves?: string[];
  } | null;
}

export interface Player {
  _id: string;
  user_id: string;
  skill_level: number;
  status: string;
}

export type BookingUpdate = Partial<Booking>;