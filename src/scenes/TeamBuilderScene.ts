import { GameState } from "../state/GameState";
import type { TeamSlot } from "../core/types";
import { Button } from "../ui/Button";

export class TeamBuilderScene extends Phaser.Scene {
  idxA = 0; idxB = 0;

  constructor(){ super('TeamBuilder'); }

  async create(){
    // background
    this.cameras.main.setBackgroundColor('#0f1226');

    // Title
    this.add.text(32, 16, 'Team Builder', { color:'#7cc7ff', fontSize:'20px', fontFamily:'system-ui,Segoe UI,Roboto,Arial' });

    // Divider
    this.add.rectangle(400, 60, 2, 500, 0x2a2f55).setOrigin(0.5,0);

    // Headers
    this.add.text(100, 60, 'Side A', { color:'#e7ecf7' });
    this.add.text(520, 60, 'Side B', { color:'#e7ecf7' });

    // Carousels
    const slotA = this.add.text(160, 60, '', { color:'#aaa' });
    const slotB = this.add.text(580, 60, '', { color:'#aaa' });

    new Button(this, 60, 60, '◀', 36, 28, ()=>{ this.idxA = (this.idxA+5)%6; this.renderSide('A'); });
    new Button(this, 260, 60, '▶', 36, 28, ()=>{ this.idxA = (this.idxA+1)%6; this.renderSide('A'); });
    new Button(this, 480, 60, '◀', 36, 28, ()=>{ this.idxB = (this.idxB+5)%6; this.renderSide('B'); });
    new Button(this, 680, 60, '▶', 36, 28, ()=>{ this.idxB = (this.idxB+1)%6; this.renderSide('B'); });

    // Store references to update text later
    (this as any).slotA = slotA; (this as any).slotB = slotB;

    // Confirm
    new Button(this, 400, 560, 'Confirm Teams → Battle', 260, 40, ()=>{
      GameState.initBattleFromTeams();
      this.scene.start('Battle');
    });

    this.renderSide('A'); this.renderSide('B');
  }

  renderSide(side:'A'|'B'){
    const xBase = side==='A'? 60 : 480;
    const idx = side==='A'? this.idxA : this.idxB;
    const team = side==='A'? GameState.teamA : GameState.teamB;

    // Clear old cells for this side
    this.children.getAll().forEach(obj=>{
      if((obj as any).__side === side) obj.destroy();
    });

    const slotText = side==='A' ? (this as any).slotA : (this as any).slotB;
    slotText.setText(`${idx+1} / 6`);

    const slot = team[idx];

    // Panel
    const panel = this.add.rectangle(xBase, 100, 280, 420, 0x181c33).setOrigin(0,0).setStrokeStyle(1,0x2a2f55);
    (panel as any).__side = side;

    // Species dropdown (simple cycling button for brevity)
    const speciesNames = GameState.species.map(s=>s.id);
    const currentIdx = Math.max(0, speciesNames.indexOf(slot.speciesId));
    const label = this.add.text(xBase+16, 120, `Species: ${slot.speciesId}`, { color:'#e7ecf7' });
    (label as any).__side = side;

    new Button(this, xBase+220, 122, 'Change', 80, 28, ()=>{
      const next = (speciesNames.indexOf(slot.speciesId)+1) % speciesNames.length;
      slot.speciesId = speciesNames[next];
      label.setText(`Species: ${slot.speciesId}`);
      renderSprite();
    }).setDepth(1);

    // Level
    const lvlLabel = this.add.text(xBase+16, 160, `Level: ${slot.level}`, { color:'#e7ecf7' });
    (lvlLabel as any).__side = side;
    new Button(this, xBase+220, 162, '+', 36, 28, ()=>{ slot.level = Math.min(100, slot.level+1); lvlLabel.setText(`Level: ${slot.level}`); });
    new Button(this, xBase+180, 162, '-', 36, 28, ()=>{ slot.level = Math.max(1, slot.level-1); lvlLabel.setText(`Level: ${slot.level}`); });

    // Moves (cycle buttons)
    const moveIds = GameState.moves.map(m=>m.id);
    for(let i=0;i<4;i++){
      const y = 210 + i*46;
      const mvLabel = this.add.text(xBase+16, y, `Move ${i+1}: ${slot.moveIds[i]||moveIds[0]}`, { color:'#e7ecf7' });
      (mvLabel as any).__side = side;
      new Button(this, xBase+240, y+2, '↻', 28, 28, ()=>{
        const cur = moveIds.indexOf(slot.moveIds[i]); const next = (cur+1)%moveIds.length;
        slot.moveIds[i] = moveIds[next];
        mvLabel.setText(`Move ${i+1}: ${slot.moveIds[i]}`);
      });
    }

    // Sprite preview
    const preview = this.add.image(xBase+140, 480, '').setDisplaySize(96,96);
    (preview as any).__side = side;
    const renderSprite = ()=>{
      const s = GameState.species.find(s=>s.id===slot.speciesId)!;
      preview.setTexture(s.id).setVisible(true);
    };

    // Ensure texture exists (loaded in preload of main.ts)
    renderSprite();
  }
}
