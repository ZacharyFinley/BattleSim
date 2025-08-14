import Phaser from 'phaser';
import { TeamBuilderScene } from './scenes/TeamBuilderScene';
import { BattleScene } from './scenes/BattleScene';
import { GameState } from './state/GameState';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0f1226',
  width: 800,
  height: 600,
  scene: [TeamBuilderScene, BattleScene]
};

class LoaderScene extends Phaser.Scene {
  constructor() { super('Loader'); }
  preload() {
    GameState.species.forEach(sp => {
      this.load.image(sp.id, sp.sprite);
    });
  }
  create() {
    this.scene.start('TeamBuilder');
  }
}

async function boot() {
  const game = new Phaser.Game(config);
  await GameState.loadAll();
  game.scene.add('Loader', new LoaderScene(), true);
}
boot();
