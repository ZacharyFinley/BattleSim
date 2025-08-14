import Phaser from "phaser";
import { TeamBuilderScene } from "./scenes/TeamBuilderScene";
import { BattleScene } from "./scenes/BattleScene";
import { GameState } from "./state/GameState";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0f1226",
  width: 800,
  height: 600,
  scene: [TeamBuilderScene, BattleScene],
};

class LoaderScene extends Phaser.Scene {
  constructor(){ super("Loader"); }
  async create() {
    // Ensure data is loaded BEFORE any scene uses it
    await GameState.loadAll();

    // Preload species textures listed in species.json
    GameState.species.forEach(sp => this.load.image(sp.id, sp.sprite));
    this.load.once("complete", () => this.scene.start("TeamBuilder"));
    this.load.start();
  }
}

new Phaser.Game(config).scene.add("Loader", new LoaderScene(), true);
