export interface FutbolApiArea {
  id: number;
  name: string;
}

export interface FutbolApiCompetition {
  id: number;
  name: string;
  area: FutbolApiArea;
}

export interface FutbolApiMatch {
  utcDate: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  competition: FutbolApiCompetition; // ← Ahora TypeScript sabe que existe
}
export interface FutbolApiMatchesResponse {
  matches: FutbolApiMatch[];
}