import type { Move, Species, TeamSlot, TypeChart } from "../core/types";
import { Weather, makePokemon, hydrateMoves, type Pokemon } from "../core/battle";

export const GameState = new (class {
  species: Species[] = [];
  moves: Move[] = [];
  chart!: TypeChart;

  teamA: TeamSlot[] = [];
  teamB: TeamSlot[] = [];

  weather: keyof typeof Weather = "None";
  A!: Pokemon; B!: Pokemon;

  async loadAll() {
    const [sp,mv,ch] = await Promise.all([
      fetch("/data/species.json").then(r=>r.json()),
      fetch("/data/moves.json").then(r=>r.json()),
      fetch("/data/typeChart.json").then(r=>r.json()),
    ]);
    this.species = sp; this.moves = mv; this.chart = ch;
  }

  defaultSlot(): TeamSlot {
    const sp = this.species[0];
    const mv = this.moves.slice(0,4).map(m=>m.id);
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
    this.A = A0; this.B = B0;
    this.weather = "None";
  }
})();
