export type TypeName =
  | "Normal"|"Fire"|"Water"|"Electric"|"Grass"|"Ice"|"Fighting"|"Poison"|"Ground"|"Flying"|"Psychic"|"Bug"|"Rock"|"Ghost"|"Dragon"|"Dark"|"Steel";

export type Category = "Physical"|"Special"|"Status";
export type Status = "None"|"Burn"|"Poison"|"BadPoison"|"Paralysis"|"Sleep"|"Freeze";

export interface Species {
  id: string;
  name: string;
  types: TypeName[];
  base: [number,number,number,number,number,number]; // HP,Atk,Def,SpA,SpD,Spe
  sprite: string;
}

export interface Move {
  id: string; name: string; type: TypeName; cat: Category; power: number; acc: number; pp: number;
  sec?: { burn?: number; para?: number; freeze?: number; poison?: number };
  stage?: { target: "atk"|"def"|"spa"|"spd"|"spe"; delta: number };
  status?: { burn?: boolean };
}

export interface TypeChart {
  types: TypeName[];
  chart: Record<string, number>; // `${atk}:${def}` -> mult
}

export interface TeamSlot {
  speciesId: string;
  level: number;
  moveIds: string[];
}
