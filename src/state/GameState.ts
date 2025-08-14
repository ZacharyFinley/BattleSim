import type { Move, Species, TeamSlot, TypeChart } from "../core/types";
import { Weather, makePokemon, hydrateMoves, type Pokemon } from "../core/battle";

// Resolve against <base href> so it works locally AND on GitHub Pages
const toUrl = (p: string) => new URL(p, document.baseURI).toString();

async function fetchJson(path: string) {
  const u = toUrl(path) + `?v=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store" });
  const txt = await res.text();
  console.log("[fetchJson]", res.status, u, "bytes:", txt.length);
  if (!res.ok) throw new Error(`Fetch ${res.status} @ ${u}`);
  try { return JSON.parse(txt); }
  catch {
    throw new Error(`JSON parse failed @ ${u}. First 80 chars: ${txt.slice(0,80)}`);
  }
}

export const GameState = new (class {
  species: Species[] = [];
  moves: Move[] = [];
  chart!: TypeChart;

  teamA: TeamSlot[] = [];
  teamB: TeamSlot[] = [];

  weather: keyof typeof Weather = "None";
  A!: Pokemon; B!: Pokemon;

  async loadAll() {
    const [sp, mv, ch] = await Promise.all([
      fetchJson("data/species.json"),
      fetchJson("data/moves.json"),
      fetchJson("data/typeChart.json"),
    ]);
    this.species = sp;
    this.moves   = mv;
    this.chart   = ch;
  }

  defaultSlot(): TeamSlot {
    const sp = this.species[0];
    const mv = this.moves.slice(0,4).map(m=>m.id);
    return { speciesId: sp.id, level: 50, moveIds: mv };
  }

  initBattleFromTeams() {
    if (!this.teamA.length || !this.teamB.length)
      throw new Error("Both teams must have at least one Pokémon.");
    const A0 = makePokemon(this.teamA[0], this.species);
    const B0 = makePokemon(this.teamB[0], this.species);
    hydrateMoves(A0, this.moves);
    hydrateMoves(B0, this.moves);
    this.A = A0; this.B = B0; this.weather = "None";
  }
})();
