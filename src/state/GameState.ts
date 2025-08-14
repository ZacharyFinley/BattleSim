import type { Move, Species, TeamSlot, TypeChart } from "@core/types";
import { Weather, makePokemon, hydrateMoves, Pokemon } from "@core/battle";

export const GameState = new (class {
  species: Species[] = [];
  moves: Move[] = [];
  chart!: TypeChart;

  teamA: TeamSlot[] = Array.from({length:6}, ()=>({ speciesId:"Charizard", level:50, moveIds:["Flamethrower","Fire Blast","Growl","Swords Dance"] }));
  teamB: TeamSlot[] = Array.from({length:6}, ()=>({ speciesId:"Blastoise", level:50, moveIds:["Surf","Ice Beam","Thunderbolt","Growl"] }));

  weather: keyof typeof Weather = "None";

  A!: Pokemon; B!: Pokemon; // active

  async loadAll(){
    const [sp,mv,ch] = await Promise.all([
      fetch("/data/species.json").then(r=>r.json()),
      fetch("/data/moves.json").then(r=>r.json()),
      fetch("/data/typeChart.json").then(r=>r.json())
    ]);
    this.species = sp; this.moves = mv; this.chart = ch;
  }

  initBattleFromTeams(){
    const A0 = makePokemon(this.teamA[0], this.species);
    const B0 = makePokemon(this.teamB[0], this.species);
    hydrateMoves(A0, this.moves);
    hydrateMoves(B0, this.moves);
    this.A = A0; this.B = B0;
    this.weather = "None";
  }
})();
