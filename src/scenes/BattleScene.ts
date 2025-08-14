import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { Button } from '../ui/Button';
import { effectiveSpeed, endOfTurn, useMove } from '../core/battle';

export class BattleScene extends Phaser.Scene {
  textbox!: Phaser.GameObjects.Text;

  constructor(){ super('Battle'); }

  create() {
    this.cameras.main.setBackgroundColor('#0f1226');
    this.add.text(32, 16, 'Gen 5 Battle', { color:'#7cc7ff', fontSize:'20px' });

    // Divider & sprites
    this.add.rectangle(400, 60, 2, 280, 0x2a2f55).setOrigin(0.5,0);
    const spA = this.add.image(200, 220, GameState.A.speciesId).setDisplaySize(120,120);
    const spB = this.add.image(600, 220, GameState.B.speciesId).setDisplaySize(120,120);

    // Simple cards
    const cardA = this.add.container(60, 320, []);
    const cardB = this.add.container(460, 320, []);
    const drawCard = (c:Phaser.GameObjects.Container, p:any)=>{
      c.removeAll(true);
      const bg = this.add.rectangle(0,0,280,120,0x181c33).setOrigin(0).setStrokeStyle(1,0x2a2f55);
      const title = this.add.text(12,8,`${p.name} Lv ${p.level} • ${p.types.join('/')}`,{color:'#e7ecf7'});
      const pct = Math.round((p.hp*100)/p.maxhp);
      const barBg = this.add.rectangle(12,40,256,12,0x2b304f).setOrigin(0);
      const bar   = this.add.rectangle(12,40, 2.56*pct, 12, pct<=25?0xe85b5b:0x37d16a).setOrigin(0);
      const info  = this.add.text(12,64,`${p.hp}/${p.maxhp} • Spe ${effectiveSpeed(p)} • ${p.status}`,{color:'#aaa'});
      c.add([bg,title,barBg,bar,info]);
    };
    drawCard(cardA, GameState.A); drawCard(cardB, GameState.B);

    // Textbox
    this.textbox = this.add.text(40, 460, '', {
      color:'#e7ecf7',
      fontFamily:'ui-monospace,Menlo,Consolas',
      fontSize:'13px',
      wordWrap:{ width:720 }
    }).setPadding(10).setBackgroundColor('#0e1124').setStroke('#2a2f55', 1);
    const log = (line: any) => {
      const s = String(line ?? '');
      const cur = this.textbox.text;
      this.textbox.setText(cur ? cur + '\n' + s : s);
    };

    // Moves (tap once to select)
    const mkMoves = (x:number, y:number, who:'A'|'B')=>{
      const p = who==='A'?GameState.A:GameState.B;
      p.moves.forEach((m,i)=>{
        new Button(this, x + (i%2)*200, y + Math.floor(i/2)*44, `${m.name} (${m.pp})`, 180,36,
          ()=>{ p._selected = i; });
      });
    };
    mkMoves(80,520,'A'); mkMoves(480,520,'B');

    // Resolve / End turn
    new Button(this, 300, 420, 'Resolve Turn', 150, 36, ()=>{
      const aIdx = GameState.A._selected, bIdx = GameState.B._selected;
      if(aIdx==null || bIdx==null){ log('Pick a move for both sides first.'); return; }

      const order = (()=> {
        const a = effectiveSpeed(GameState.A), b = effectiveSpeed(GameState.B);
        return a>b ? ['A','B'] : a<b ? ['B','A'] : (Math.random()<0.5?['A','B']:['B','A']);
      })();

      for(const who of order){
        const me  = who==='A'?GameState.A:GameState.B;
        const you = who==='A'?GameState.B:GameState.A;
        if(me.hp<=0) continue;
        const mv = me.moves[me._selected!];
        const msg = useMove(me, you, mv, GameState.weather, GameState.chart);
        log(msg);
        if(you.hp<=0){ log(`${you.name} fainted!`); break; }
      }
      GameState.A._selected = GameState.B._selected = undefined;
      drawCard(cardA, GameState.A); drawCard(cardB, GameState.B);
    });

    new Button(this, 480, 420, 'End of Turn', 150, 36, ()=>{
      endOfTurn(GameState.A); endOfTurn(GameState.B);
      GameState.A._selected = GameState.B._selected = undefined;
      drawCard(cardA, GameState.A); drawCard(cardB, GameState.B);
      log('End of turn effects applied.');
    });

    new Button(this, 100, 20, '← Edit Teams', 140, 30, ()=> this.scene.start('TeamBuilder'));
  }
}
