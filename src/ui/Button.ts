export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private _w: number;
  private _h: number;
  private _selected = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    w = 180,
    h = 36,
    onClick?: () => void
  ) {
    super(scene);

    this._w = w;
    this._h = h;

    this.setPosition(x, y);
    this.setSize(w, h);

    this.bg = scene.add
      .rectangle(0, 0, w, h, 0x243059)
      .setStrokeStyle(1, 0x37447a)
      .setOrigin(0.5, 0.5);

    this.label = scene.add
      .text(0, 0, text, {
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        fontSize: "14px",
        color: "#e7ecf7",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);

    this.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    )
      .on("pointerover", () => !this._selected && this.bg.setFillStyle(0x2d3a6e))
      .on("pointerout", () => !this._selected && this.bg.setFillStyle(0x243059))
      .on("pointerdown", () => onClick && onClick());

    scene.add.existing(this);
  }

  setText(t: string) {
    this.label.setText(t);
  }

  setSelected(sel: boolean) {
    this._selected = sel;
    // selected style: brighter fill + accent stroke
    if (sel) {
      this.bg.setFillStyle(0x31407f);
      this.bg.setStrokeStyle(2, 0x7cc7ff);
    } else {
      this.bg.setFillStyle(0x243059);
      this.bg.setStrokeStyle(1, 0x37447a);
    }
  }

  setDisabled(disabled: boolean) {
    this.setAlpha(disabled ? 0.5 : 1);
    if (disabled) {
      this.disableInteractive();
    } else if (!this.input?.enabled) {
      // IMPORTANT: keep centered hit area when re-enabling
      this.setInteractive(
        new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
        Phaser.Geom.Rectangle.Contains
      );
    }
  }
}
