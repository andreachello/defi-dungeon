import Phaser from "phaser";
import DungeonScene from "./scenes/DungeonScene";
import InfoScene from "./scenes/InfoScene";
import ReferenceScene from "./scenes/ReferenceScene";
import InventoryScene from "./scenes/InventoryScene";
import MinimapScene from "./scenes/MinimapScene";

new Phaser.Game({
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  render: { pixelArt: true },
  physics: { default: "arcade", arcade: { debug: false, gravity: { y: 0 } } },
  scene: [DungeonScene, InfoScene, ReferenceScene, InventoryScene, MinimapScene],
  scale: {
    mode: Phaser.Scale.RESIZE
  }
});
