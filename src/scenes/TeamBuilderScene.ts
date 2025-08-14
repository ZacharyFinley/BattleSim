import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { Button } from "../ui/Button";

type Side = "A" | "B";

export class TeamBuilderScene extends Phaser.Scene {
  idxA = 0;
  idxB = 0;

  constructor() {
    super("TeamBuilder");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0f1226");

    this.add.text(32, 16, "Team Builder", {
      color: "#7cc7ff",
      fontSize: "20px",
      fontFamily: "system-ui,Segoe UI,Roboto,Arial",
    });

    // Divider + headers
    this.add.rectangle(400, 60, 2, 500, 0x2a2f55).setOrigin(0.5, 0);
    this.add.text(120, 60, "Side A", { color: "#e7ecf7" });
    this.add.text(520, 60, "Side B", { color: "#e7ecf7" });

    // Slot counters
    const countA = this.add.text(200, 60, "", { color: "#aaa" });
    const countB = this.add.text(600, 60, "", { color: "#aaa" });
    (this as any).__countA = countA;
    (this as any).__countB = countB;

    // Arrows (do nothing when <2 mons)
    new Button(this, 60, 60, "◀", 36, 28, () => this.prev("A"));
    new Button(this, 260, 60, "▶", 36, 28, () => this.next("A"));
    new Button(this, 480, 60, "◀", 36, 28, () => this.prev("B"));
    new Button(this, 680, 60, "▶", 36, 28, () => this.next("B"));

    // Confirm → Battle (disabled until both sides have ≥1)
    const confirm = new Button(
      this,
      400,
      560,
      "Confirm Teams → Battle",
      260,
      40,
      () => {
        try {
          GameState.initBattleFromTeams();
          this.scene.start("Battle");
        } catch (e) {
          console.warn(e);
        }
      }
    );
    (this as any).__confirm = confirm;

    // Initial render (both sides visible even if empty)
    this.renderSide("A");
    this.renderSide("B");
  }

  // ----- helpers -----
  private team(side: Side) {
    return side === "A" ? GameState.teamA : GameState.teamB;
  }
  private index(side: Side) {
    return side === "A" ? this.idxA : this.idxB;
  }
  private setIndex(side: Side, v: number) {
    if (side === "A") this.idxA = v;
    else this.idxB = v;
  }

  private prev(side: Side) {
    const t = this.team(side);
    if (t.length <= 1) return;                // nothing to do
    const i = this.index(side);
    const next = (i - 1 + t.length) % t.length;
    this.setIndex(side, next);
    this.renderSide(side);
  }

  private next(side: Side) {
    const t = this.team(side);
    if (t.length <= 1) return;                // nothing to do
    const i = this.index(side);
    const next = (i + 1) % t.length;
    this.setIndex(side, next);
    this.renderSide(side);
  }

  private normalizeIndex(side: Side) {
    const t = this.team(side);
    if (t.length === 0) { this.setIndex(side, 0); return; }
    const i = this.index(side);
    if (i >= t.length) this.setIndex(side, t.length - 1);
  }

  private addMon(side: Side) {
    const t = this.team(side);
    if (t.length >= 6) return;
    t.push(GameState.defaultSlot());          // safe default (first species + first 4 moves)
    this.setIndex(side, t.length - 1);
    this.renderSide(side);
  }

  private removeMon(side: Side) {
    const t = this.team(side);
    if (t.length === 0) return;
    t.splice(this.index(side), 1);
    this.normalizeIndex(side);
    this.renderSide(side);
  }

  private updateCounts() {
    const countA = (this as any).__countA as Phaser.GameObjects.Text;
    const countB = (this as any).__countB as Phaser.GameObjects.Text;
    const fmt = (side: Side) => {
      const t = this.team(side);
      if (t.length === 0) return "0 / 0";
      const i = this.index(side);
      return `${i + 1} / ${t.length}`;
    };
    countA.setText(fmt("A"));
    countB.setText(fmt("B"));

    const confirm = (this as any).__confirm as Button;
    confirm.setDisabled(!(GameState.teamA.length > 0 && GameState.teamB.length > 0));
  }

  // ----- main render -----
  renderSide(side: Side) {
    const xBase = side === "A" ? 60 : 480;

    // clear previous for this side
    this.children.getAll().forEach((obj) => {
      if ((obj as any).__side === side) obj.destroy();
    });

    this.updateCounts();
    const t = this.team(side);

    if (t.length === 0) {
      // empty-state panel
      const panel = this.add.rectangle(xBase, 100, 280, 420, 0x181c33)
        .setOrigin(0, 0).setStrokeStyle(1, 0x2a2f55);
      (panel as any).__side = side;

      const label = this.add.text(xBase + 16, 120, "No Pokémon in party.", { color: "#e7ecf7" });
      (label as any).__side = side;

      const addBtn = new Button(this, xBase + 140, 200, "+ Add Pokémon", 180, 36, () => this.addMon(side));
      (addBtn as any).__side = side;
      return;
    }

    // ensure index valid
    this.normalizeIndex(side);
    const idx = this.index(side);
    const slot = t[idx];

    const panel = this.add.rectangle(xBase, 100, 280, 420, 0x181c33)
      .setOrigin(0, 0).setStrokeStyle(1, 0x2a2f55);
    (panel as any).__side = side;

    // species
    const speciesNames = GameState.species.map(s => s.id);
    const speciesLabel = this.add.text(xBase + 16, 120, `Species: ${slot.speciesId}`, { color: "#e7ecf7" });
    (speciesLabel as any).__side = side;

    new Button(this, xBase + 220, 122, "Change", 80, 28, () => {
      const cur = Math.max(0, speciesNames.indexOf(slot.speciesId));
      const next = (cur + 1) % speciesNames.length;
      slot.speciesId = speciesNames[next];
      speciesLabel.setText(`Species: ${slot.speciesId}`);
      renderSprite();
    });

    // level
    const lvlLabel = this.add.text(xBase + 16, 160, `Level: ${slot.level}`, { color: "#e7ecf7" });
    (lvlLabel as any).__side = side;
    new Button(this, xBase + 220, 162, "+", 36, 28, () => {
      slot.level = Math.min(100, slot.level + 1);
      lvlLabel.setText(`Level: ${slot.level}`);
    });
    new Button(this, xBase + 180, 162, "-", 36, 28, () => {
      slot.level = Math.max(1, slot.level - 1);
      lvlLabel.setText(`Level: ${slot.level}`);
    });

    // moves (normalize to 4 valid ids)
    const moveIds = GameState.moves.map(m => m.id);
    for (let i = 0; i < 4; i++) {
      if (!slot.moveIds[i]) slot.moveIds[i] = moveIds[i % moveIds.length];
    }

    for (let i = 0; i < 4; i++) {
      const y = 210 + i * 46;
      const label = this.add.text(xBase + 16, y, `Move ${i + 1}: ${slot.moveIds[i]}`, { color: "#e7ecf7" });
      (label as any).__side = side;
      new Button(this, xBase + 240, y + 2, "↻", 28, 28, () => {
        const curIdx = Math.max(0, moveIds.indexOf(slot.moveIds[i]));
        const nextIdx = (curIdx + 1) % moveIds.length;
        slot.moveIds[i] = moveIds[nextIdx];
        label.setText(`Move ${i + 1}: ${slot.moveIds[i]}`);
      });
    }

    // sprite preview (placeholder ok)
    const preview = this.add.image(xBase + 140, 480, "").setDisplaySize(96, 96);
    (preview as any).__side = side;
    const renderSprite = () => {
      const s = GameState.species.find(s => s.id === slot.speciesId)!;
      preview.setTexture(s.id).setVisible(true);
    };
    renderSprite();

    // add/remove buttons
    if (t.length < 6) {
      const add = new Button(this, xBase + 60, 520, "+ Add", 80, 30, () => this.addMon(side));
      (add as any).__side = side;
    }
    const del = new Button(this, xBase + 200, 520, "Remove", 80, 30, () => this.removeMon(side));
    (del as any).__side = side;
  }
}
