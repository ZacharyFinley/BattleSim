import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { Button } from "../ui/Button";
import { SearchSelect } from "../ui/SearchSelect";

type Side = "A" | "B";

export class TeamBuilderScene extends Phaser.Scene {
  idxA = 0; idxB = 0;

  constructor(){ super("TeamBuilder"); }

  create(){
    this.cameras.main.setBackgroundColor("#0f1226");
    this.add.text(32,16,"Team Builder",{color:"#7cc7ff",fontSize:"20px",fontFamily:"system-ui,Segoe UI,Roboto,Arial"});

    this.add.rectangle(400,60,2,500,0x2a2f55).setOrigin(0.5,0);
    this.add.text(120,60,"Side A",{color:"#e7ecf7"});
    this.add.text(520,60,"Side B",{color:"#e7ecf7"});

    const countA = this.add.text(240,60,"",{color:"#aaa"}); (this as any).__countA = countA;
    const countB = this.add.text(600,60,"",{color:"#aaa"}); (this as any).__countB = countB;

    new Button(this, 60, 60, "◀", 36, 28, ()=>this.prev("A"));
    new Button(this,260, 60, "▶", 36, 28, ()=>this.next("A"));
    new Button(this,480, 60, "◀", 36, 28, ()=>this.prev("B"));
    new Button(this,680, 60, "▶", 36, 28, ()=>this.next("B"));

    const confirm = new Button(this,400,560,"Confirm Teams → Battle",260,40,()=>{
      GameState.initBattleFromTeams();
      this.scene.start("Battle");
    });
    (this as any).__confirm = confirm;

    this.renderSide("A"); this.renderSide("B");
  }

  // helpers
  private team(s:Side){ return s==="A"?GameState.teamA:GameState.teamB; }
  private index(s:Side){ return s==="A"?this.idxA:this.idxB; }
  private setIndex(s:Side,v:number){ if(s==="A")this.idxA=v; else this.idxB=v; }

  private prev(s:Side){ const t=this.team(s); if(t.length<=1) return; this.setIndex(s,(this.index(s)-1+t.length)%t.length); this.renderSide(s); }
  private next(s:Side){ const t=this.team(s); if(t.length<=1) return; this.setIndex(s,(this.index(s)+1)%t.length); this.renderSide(s); }
  private normalizeIndex(s:Side){ const t=this.team(s); if(t.length===0){this.setIndex(s,0);return;} if(this.index(s)>=t.length)this.setIndex(s,t.length-1); }

  private addMon(s:Side){
    const t=this.team(s); if(t.length>=6) return;
    // open search select to choose species before adding
    const items = GameState.species.map(sp=>({id:sp.id,label:sp.name}));
    const overlay = new SearchSelect(this, 220+(s==="A"?0:420), 120, 360, 280, items, (speciesId)=>{
      const moves = GameState.moves.slice(0,4).map(m=>m.id);
      t.push({ speciesId, level:50, moveIds: moves });
      this.setIndex(s, t.length-1);
      this.renderSide(s);
    });
    this.add.existing(overlay);
  }

  private removeMon(s:Side){ const t=this.team(s); if(t.length===0) return; t.splice(this.index(s),1); this.normalizeIndex(s); this.renderSide(s); }

  private updateCounts(){
    const fmt=(s:Side)=>{ const t=this.team(s); if(!t.length) return "0 / 0"; return `${this.index(s)+1} / ${t.length}`; };
    (this as any).__countA.setText(fmt("A"));
    (this as any).__countB.setText(fmt("B"));
    (this as any).__confirm.setDisabled(!(GameState.teamA.length && GameState.teamB.length));
  }

  renderSide(s:Side){
    const xBase = s==="A"?60:480;
    this.children.getAll().forEach(o=>{ if((o as any).__side===s) o.destroy(); });
    this.updateCounts();

    const t=this.team(s);
    if(!t.length){
      const panel=this.add.rectangle(xBase,100,280,420,0x181c33).setOrigin(0,0).setStrokeStyle(1,0x2a2f55); (panel as any).__side=s;
      const label=this.add.text(xBase+16,120,"No Pokémon in party.",{color:"#e7ecf7"}); (label as any).__side=s;
      const addBtn=new Button(this,xBase+140,200,"+ Add Pokémon",180,36,()=>this.addMon(s)); (addBtn as any).__side=s;
      return;
    }

    this.normalizeIndex(s);
    const idx=this.index(s); const slot=t[idx];

    const panel=this.add.rectangle(xBase,100,280,420,0x181c33).setOrigin(0,0).setStrokeStyle(1,0x2a2f55); (panel as any).__side=s;

    // species + dropdown search
    const speciesLabel=this.add.text(xBase+16,120,`Species: ${slot.speciesId}`,{color:"#e7ecf7"}); (speciesLabel as any).__side=s;
    const changeBtn=new Button(this,xBase+220,122,"Change",80,28,()=>{
      const items = GameState.species.map(sp=>({id:sp.id,label:sp.name}));
      const overlay = new SearchSelect(this, 220+(s==="A"?0:420), 120, 360, 280, items, (speciesId)=>{
        slot.speciesId = speciesId;
        speciesLabel.setText(`Species: ${slot.speciesId}`);
        renderSprite();
      });
      this.add.existing(overlay);
    }); (changeBtn as any).__side=s;

    // level
    const lvlLabel=this.add.text(xBase+16,160,`Level: ${slot.level}`,{color:"#e7ecf7"}); (lvlLabel as any).__side=s;
    new Button(this,xBase+220,162,"+",36,28,()=>{ slot.level=Math.min(100,slot.level+1); lvlLabel.setText(`Level: ${slot.level}`);} ).setDepth(1);
    new Button(this,xBase+180,162,"-",36,28,()=>{ slot.level=Math.max(1,slot.level-1); lvlLabel.setText(`Level: ${slot.level}`);} ).setDepth(1);

    // moves (normalize)
    const moveIds = GameState.moves.map(m=>m.id);
    for(let i=0;i<4;i++){ if(!slot.moveIds[i]) slot.moveIds[i]=moveIds[i%moveIds.length]; }

    for(let i=0;i<4;i++){
      const y=210+i*46;
      const lab=this.add.text(xBase+16,y,`Move ${i+1}: ${slot.moveIds[i]}`,{color:"#e7ecf7"}); (lab as any).__side=s;
      const btn=new Button(this,xBase+240,y+2,"↻",28,28,()=>{
        const cur=Math.max(0,moveIds.indexOf(slot.moveIds[i]));
        slot.moveIds[i]=moveIds[(cur+1)%moveIds.length];
        lab.setText(`Move ${i+1}: ${slot.moveIds[i]}`);
      }); (btn as any).__side=s;
    }

    // sprite
    const preview=this.add.image(xBase+140,480,"").setDisplaySize(96,96); (preview as any).__side=s;
    const renderSprite=()=>{ const sp=GameState.species.find(q=>q.id===slot.speciesId)!; preview.setTexture(sp.id).setVisible(true); };
    renderSprite();

    if(t.length<6){ const add=new Button(this,xBase+60,520,"+ Add",80,30,()=>this.addMon(s)); (add as any).__side=s; }
    const del=new Button(this,xBase+200,520,"Remove",80,30,()=>this.removeMon(s)); (del as any).__side=s;
  }
}
