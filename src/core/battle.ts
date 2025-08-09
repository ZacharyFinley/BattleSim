import type { Category, Move, Species, Status, TeamSlot, TypeChart, TypeName } from "./types";

export const Weather = { None:'None', Sun:'Sun', Rain:'Rain', Sand:'Sand', Hail:'Hail' } as const;
export type WeatherName = keyof typeof Weather;

export interface Pokemon {
  speciesId: string; name: string; sprite: string; level: number;
  types: TypeName[]; iv: number; evs: number[];
  maxhp: number; hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
  status: Status; sleep: number; toxic: number;
  stages: Record<"atk"|"def"|"spa"|"spd"|"spe"|"acc"|"eva", number>;
  moves: (Move & { pp: number })[];
  _selected?: number;
}

export function calcHP(base:number, iv:number, ev:number, lvl:number){
  return Math.max(1, Math.floor(((2*base + iv + Math.floor(ev/4)) * lvl)/100) + lvl + 10);
}
export function calcOther(base:number, iv:number, ev:number, lvl:number){
  return Math.floor(((2*base + iv + Math.floor(ev/4)) * lvl)/100) + 5;
}
export function makePokemon(slot: TeamSlot, speciesList: Species[]): Pokemon {
  const s = speciesList.find(x=>x.id===slot.speciesId)!;
  const [hb,ab,db,sab,sdb,speb] = s.base;
  const p: Pokemon = {
    speciesId:s.id, name:s.name, sprite:s.sprite, level:slot.level,
    types:[...s.types], iv:31, evs:[0,0,0,0,0,0],
    maxhp:0,hp:0, atk:0,def:0,spa:0,spd:0,spe:0,
    status:"None", sleep:0, toxic:0,
    stages:{atk:0,def:0,spa:0,spd:0,spe:0,acc:0,eva:0},
    moves: slot.moveIds.map(id => ({ ...(undefined as any), id })) as any // filled later
  };
  p.maxhp = calcHP(hb,31,0,p.level);
  p.atk   = calcOther(ab,31,0,p.level);
  p.def   = calcOther(db,31,0,p.level);
  p.spa   = calcOther(sab,31,0,p.level);
  p.spd   = calcOther(sdb,31,0,p.level);
  p.spe   = calcOther(speb,31,0,p.level);
  p.hp = p.maxhp;
  return p;
}

export function hydrateMoves(p: Pokemon, allMoves: Move[]){
  p.moves = p.moves.map((m:any) => {
    const full = allMoves.find(x=>x.id===m.id)!;
    return { ...full, pp: full.pp };
  });
}

const clamp = (s:number)=>Math.max(-6,Math.min(6,s));
const stageMod = (s:number)=> s>=0 ? (2+s)/2 : 2/(2-s);
const accEvaMod = (s:number)=> s>=0 ? (3+s)/3 : 3/(3-s);
const rollCrit = ()=> Math.floor(Math.random()*16)===0;
const alwaysHits = (m:Move)=> m.acc<=0 || m.acc>=1000;

export function effectiveSpeed(p:Pokemon){
  let s = Math.floor(p.spe * stageMod(p.stages.spe));
  if(p.status==="Paralysis") s = Math.floor(s*0.25);
  return Math.max(1,s);
}

export function stab(p:Pokemon, t:TypeName){ return p.types.includes(t) ? 1.5 : 1; }

export function eff(type:TypeName, defender:Pokemon, chart:TypeChart){
  let m = 1;
  const c = chart.chart;
  const t1 = `${type}:${defender.types[0]}`; if(c[t1]!=null) m*=c[t1];
  if(defender.types[1]){ const t2 = `${type}:${defender.types[1]}`; if(c[t2]!=null) m*=c[t2]; }
  return m;
}

export function checkHit(att:Pokemon, def:Pokemon, move:Move){
  let chance = move.acc;
  const acc = accEvaMod(att.stages.acc);
  const eva = accEvaMod(def.stages.eva);
  chance = Math.max(1, Math.min(100, chance * (acc/eva)));
  return Math.random()*100 < chance;
}

export function canAct(p:Pokemon){
  if(p.status==="Sleep"){ if(p.sleep>0){ p.sleep--; return {ok:false,msg:`${p.name} is fast asleep.`}; } p.status="None"; }
  if(p.status==="Paralysis" && Math.random()<0.25) return {ok:false,msg:`${p.name} is paralyzed! It can't move!`};
  if(p.status==="Freeze" && Math.random()>=0.20) return {ok:false,msg:`${p.name} is frozen solid!`};
  if(p.status==="Freeze") p.status="None";
  return {ok:true};
}

export function endOfTurn(p:Pokemon){
  if(p.hp<=0) return;
  if(p.status==="Burn" || p.status==="Poison") p.hp = Math.max(0, p.hp - Math.max(1, Math.floor(p.maxhp/8)));
  else if(p.status==="BadPoison"){ p.toxic=Math.min(15, p.toxic+1); p.hp = Math.max(0, p.hp - Math.max(1, Math.floor(p.maxhp*p.toxic/16))); }
}

export function useMove(
  attacker:Pokemon, defender:Pokemon, move:Move,
  weather:WeatherName, chart:TypeChart
){
  if(attacker.hp<=0) return `${attacker.name} has fainted and cannot move!`;
  if((move as any).pp<=0) return `${attacker.name} has no PP left for ${move.name}!`;

  const act = canAct(attacker); if(!act.ok) return act.msg;
  (move as any).pp--;

  if(!alwaysHits(move) && !checkHit(attacker, defender, move)) return `${attacker.name}'s ${move.name} missed!`;

  if(move.cat==="Status"){
    if(move.stage){ const t = move.stage.target; const d = move.stage.delta; defender.stages[t] = clamp(defender.stages[t] + d); return `${attacker.name} used ${move.name}!`; }
    if(move.status?.burn && defender.status==="None"){ defender.status="Burn"; return `${attacker.name} used ${move.name}! ${defender.name} was burned!`; }
    return `${attacker.name} used ${move.name}!`;
  }

  const isCrit = rollCrit();
  const power = move.power;
  const Araw = (move.cat==="Physical") ? attacker.atk : attacker.spa;
  const Draw = (move.cat==="Physical") ? defender.def : defender.spd;
  const atkStage = (move.cat==="Physical") ? attacker.stages.atk : attacker.stages.spa;
  const defStage = (move.cat==="Physical") ? defender.stages.def : defender.stages.spd;
  const Amod = (isCrit && atkStage<0) ? 1 : stageMod(atkStage);
  const Dmod = (isCrit && defStage>0) ? 1 : stageMod(defStage);
  const Aeff = Math.floor(Araw*Amod);
  const Deff = Math.max(1,Math.floor(Draw*Dmod));

  const levelTerm = Math.floor((2*attacker.level)/5)+2;
  const base = Math.floor(Math.floor((levelTerm*power*(Aeff/Deff))/50)+2);

  let modifier = 1;
  if(weather==="Rain"){ if(move.type==="Water") modifier*=1.5; if(move.type==="Fire") modifier*=0.5; }
  if(weather==="Sun"){  if(move.type==="Fire")  modifier*=1.5; if(move.type==="Water") modifier*=0.5; }
  if(isCrit) modifier*=2;
  modifier *= (0.85 + Math.random()*0.15);
  modifier *= stab(attacker, move.type);
  const effMult = eff(move.type, defender, chart);
  modifier *= effMult;
  if(move.cat==="Physical" && attacker.status==="Burn") modifier*=0.5;

  const damage = Math.max(1, Math.floor(base*modifier));
  defender.hp = Math.max(0, defender.hp - damage);

  let msg = `${attacker.name} used ${move.name}! ${damage} damage.`;
  if(isCrit) msg += " Critical hit!";
  if(effMult===0) msg += " It had no effect.";
  else if(effMult>=2) msg += " It's super effective!";
  else if(effMult<=0.5) msg += " It's not very effective...";

  if(move.sec){
    if(move.sec.burn && Math.random()*100 < move.sec.burn && defender.status==="None"){ defender.status="Burn"; msg += ` ${defender.name} was burned!`; }
    if(move.sec.para && Math.random()*100 < move.sec.para && defender.status==="None"){ defender.status="Paralysis"; msg += ` ${defender.name} is paralyzed!`; }
    if(move.sec.freeze && Math.random()*100 < move.sec.freeze && defender.status==="None"){ defender.status="Freeze"; msg += ` ${defender.name} was frozen solid!`; }
    if(move.sec.poison && Math.random()*100 < move.sec.poison && defender.status==="None"){ defender.status="Poison"; msg += ` ${defender.name} was poisoned!`; }
  }

  return msg;
}
