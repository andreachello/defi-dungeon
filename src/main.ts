import Phaser from "phaser";
import DungeonScene from "./scenes/DungeonScene";
import InfoScene from "./scenes/InfoScene";
import ReferenceScene from "./scenes/ReferenceScene";
import InventoryScene from "./scenes/InventoryScene";
import MinimapScene from "./scenes/MinimapScene";
import TimerScene from "./scenes/TimerScene";
import HealthScene from "./scenes/HealthScene";

new Phaser.Game({
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  render: { pixelArt: true },
  physics: { default: "arcade", arcade: { debug: false, gravity: { y: 0 } } },
  scene: [
    DungeonScene,
    InfoScene,
    InventoryScene,
    MinimapScene,
    TimerScene,
    ReferenceScene,
    HealthScene
  ],
  scale: {
    mode: Phaser.Scale.RESIZE
  }
});
