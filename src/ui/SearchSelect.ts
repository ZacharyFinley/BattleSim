import Phaser from "phaser";

export interface SearchSelectItem { id: string; label: string; }

export class SearchSelect extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private inputText: Phaser.GameObjects.Text;
  private listWrap: Phaser.GameObjects.Container;
  private items: SearchSelectItem[] = [];
  private filtered: SearchSelectItem[] = [];
  private onPick: (id: string)=>void;
  private query = "";

  constructor(scene: Phaser.Scene, x: number, y: number, w = 360, h = 280, items: SearchSelectItem[], onPick:(id:string)=>void){
    super(scene, x, y);
    this.onPick = onPick;
    this.items = items.slice().sort((a,b)=>a.label.localeCompare(b.label));
    console.log(`SearchSelect created with ${this.items.length} items`);
    this.filtered = this.items.slice();
    console.log(`SearchSelect created with ${this.filtered.length}  filtered items`);
    this.bg = scene.add.rectangle(0,0,w,h,0x0e1124,1).setOrigin(0,0).setStrokeStyle(1,0x2a2f55);
    const title = scene.add.text(10,8,"Select Species",{color:"#e7ecf7", fontSize:"14px"});
    const hint  = scene.add.text(w-10,8,"Esc to close",{color:"#aaa"}).setOrigin(1,0);

    this.inputText = scene.add.text(10,34,"",{color:"#e7ecf7", fontFamily:"ui-monospace", fontSize:"14px"})
      .setBackgroundColor("#181c33").setPadding(6,4,6,4).setStroke("#2a2f55",1);

    this.listWrap = scene.add.container(10, 70);
    this.add([this.bg,title,hint,this.inputText,this.listWrap]);
    scene.add.existing(this);

    this.setInteractive(new Phaser.Geom.Rectangle(0,0,w,h), Phaser.Geom.Rectangle.Contains);

    scene.input.keyboard?.on("keydown", this.onKey, this);
    this.once("destroy", ()=> scene.input.keyboard?.off("keydown", this.onKey, this));

    this.renderList();
  }

  private onKey(e: KeyboardEvent){
    if(e.key === "Escape"){ this.destroy(); return; }
    if(e.key === "Backspace"){ this.query = this.query.slice(0,-1); this.applyFilter(); return; }
    if(e.key.length === 1){
      this.query += e.key;
      console.log(`Search query: "${this.query}"`);
      this.applyFilter();
    }
  }

  private applyFilter(){
    const q = this.query.trim().toLowerCase();
    console.log(`Filtering items with query: "${q}"`);
    this.filtered = q ? this.items.filter(i=>i.label.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)) : this.items.slice();
    this.inputText.setText(this.query);
    console.log(`Filtered items: ${this.filtered.length} matches`);
    this.renderList();
  }

  private renderList(){
    this.listWrap.removeAll(true);
    console.log(`Rendering ${this.filtered.length} items...`);
    const makeBtn = (y:number, text:string, onClick:()=>void)=>{
      const w = (this.bg.width as number) - 20;
      const h = 28;
      const btn = this.scene.add.rectangle(0,y,w,h,0x243059).setOrigin(0,0).setStrokeStyle(1,0x37447a);
      const lab = this.scene.add.text(8,y+h/2,text,{color:"#e7ecf7", fontSize:"14px"}).setOrigin(0,0.5);
      btn.setInteractive(new Phaser.Geom.Rectangle(0,0,w,h), Phaser.Geom.Rectangle.Contains)
        .on("pointerover",()=>btn.setFillStyle(0x2d3a6e))
        .on("pointerout",()=>btn.setFillStyle(0x243059))
        .on("pointerdown", onClick);
      this.listWrap.add([btn,lab]);
    };
    const max = Math.min(8, this.filtered.length);
    for(let i=0;i<max;i++){
      const it = this.filtered[i];
      makeBtn(i*32, `${it.label}`, ()=>{ this.onPick(it.id); this.destroy(); });
    }
    if(this.filtered.length===0){
      this.listWrap.add(this.scene.add.text(0,0,"No matches",{color:"#aaa"}));
    }
  }
}
