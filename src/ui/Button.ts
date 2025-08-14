export class Button extends Phaser.GameObjects.Container {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x:number, y:number, text:string, w=180, h=36, onClick?:()=>void){
    super(scene, x, y);
    this.bg = scene.add.rectangle(0,0,w,h,0x243059).setStrokeStyle(1,0x37447a).setOrigin(0.5);
    this.label = scene.add.text(0,0,text,{fontFamily:"system-ui,Segoe UI,Roboto,Arial",fontSize:"14px",color:"#e7ecf7"}).setOrigin(0.5);
    this.add([this.bg,this.label]);
    this.setSize(w,h);
    this.setInteractive(new Phaser.Geom.Rectangle(-w/2,-h/2,w,h), Phaser.Geom.Rectangle.Contains)
      .on('pointerover',()=>this.bg.setFillStyle(0x2d3a6e))
      .on('pointerout',()=>this.bg.setFillStyle(0x243059))
      .on('pointerdown',()=> onClick && onClick());
    scene.add.existing(this);
  }

  setText(t:string){ this.label.setText(t); }
  setDisabled(disabled:boolean){
    this.setAlpha(disabled?0.6:1);
    this.disableInteractive();
    if(!disabled){
      this.setInteractive(new Phaser.Geom.Rectangle(-this.width/2,-this.height/2,this.width,this.height), Phaser.Geom.Rectangle.Contains);
    }
  }
}
