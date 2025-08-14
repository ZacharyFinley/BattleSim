export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private _w: number;
  private _h: number;

  /**
   * x, y are CENTER coordinates for convenience.
   */
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

    // Position this container by its top-left so hit area is easy (0..w, 0..h)
    this.setPosition(x - w / 2, y - h / 2);
    this.setSize(w, h);

    // Background (top-left origin)
    this.bg = scene.add
      .rectangle(0, 0, w, h, 0x243059)
      .setStrokeStyle(1, 0x37447a)
      .setOrigin(0, 0);

    // Label (centered within the button)
    this.label = scene.add
      .text(w / 2, h / 2, text, {
        fontFamily: "system-ui,Segoe UI,Roboto,Arial",
        fontSize: "14px",
        color: "#e7ecf7",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);

    // Correct hit area: 0..w / 0..h, relative to container's top-left
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains
    )
      .on("pointerover", () => this.bg.setFillStyle(0x2d3a6e))
      .on("pointerout", () => this.bg.setFillStyle(0x243059))
      .on("pointerdown", () => onClick && onClick());

    scene.add.existing(this);
  }

  setText(t: string) {
    this.label.setText(t);
  }

  setDisabled(disabled: boolean) {
    this.setAlpha(disabled ? 0.5 : 1);
    // Rebind interactability correctly
    if (disabled) {
      this.disableInteractive();
    } else if (!this.input?.enabled) {
      this.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this._w, this._h),
        Phaser.Geom.Rectangle.Contains
      );
    }
  }
}
