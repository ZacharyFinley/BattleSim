import type { Move, Species, TeamSlot, TypeChart } from "../core/types";
import { Weather, makePokemon, hydrateMoves, type Pokemon } from "../core/battle";

// Use Vite's base so fetch works both locally and on GitHub Pages (/YourRepo/)
const BASE = (import.meta as any)?.env?.BASE_URL ?? "/"; // e.g. "/BattleSim/" on Pages
const url = (p: string) => new URL(p, document.baseURI).toString(); 

export const GameState = new (class {
  species: Species[] = [];
  moves: Move[] = [];
  chart!: TypeChart;

  // Start empty; UI adds up to 6 per side
  teamA: TeamSlot[] = [];
  teamB: TeamSlot[] = [];

  weather: keyof typeof Weather = "None";
  A!: Pokemon;
  B!: Pokemon;

  async loadAll() {
    // IMPORTANT: use BASE so these resolve on GitHub Pages
    const [sp, mv, ch] = await Promise.all([
      fetch(url("data/species.json")).then((r) => r.json()),
      fetch(url("data/moves.json")).then((r) => r.json()),
      fetch(url("data/typeChart.json")).then((r) => r.json()),
    ]);
    this.species = sp;
    this.moves = mv;
    this.chart = ch;
  }

  // Reasonable default: first species, level 50, first 4 moves
  defaultSlot(): TeamSlot {
    if (!this.species.length || !this.moves.length) {
      throw new Error("Data not loaded yet.");
    }
    const sp = this.species[0];
    const mv = this.moves.slice(0, 4).map((m) => m.id);
    return { speciesId: sp.id, level: 50, moveIds: mv };
    }

  initBattleFromTeams() {
    if (this.teamA.length === 0 || this.teamB.length === 0) {
      throw new Error("Both teams must have at least one Pokémon.");
    }
    const A0 = makePokemon(this.teamA[0], this.species);
    const B0 = makePokemon(this.teamB[0], this.species);
    hydrateMoves(A0, this.moves);
    hydrateMoves(B0, this.moves);
    this.A = A0;
    this.B = B0;
    this.weather = "None";
  }
})();
