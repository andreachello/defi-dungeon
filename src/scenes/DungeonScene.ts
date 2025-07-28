import Phaser from "phaser";
import Graphics from "../assets/Graphics";


const worldTileHeight = 81;
const worldTileWidth = 81;

export default class DungeonScene extends Phaser.Scene {
  tilemap: Phaser.Tilemaps.Tilemap | null;

  // Inventory overlay properties
  private inventoryBackground?: Phaser.GameObjects.Rectangle;
  private inventorySlots: Phaser.GameObjects.Rectangle[] = [];
  private inventorySprites: Phaser.GameObjects.Sprite[] = [];
  private inventoryTexts: Phaser.GameObjects.Text[] = [];

  preload(): void {
    this.load.image(Graphics.environment.name, Graphics.environment.file);
    this.load.image(Graphics.util.name, Graphics.util.file);
    this.load.spritesheet(Graphics.player.name, Graphics.player.file, {
      frameHeight: Graphics.player.height,
      frameWidth: Graphics.player.width
    });
    this.load.spritesheet(Graphics.slime.name, Graphics.slime.file, {
      frameHeight: Graphics.slime.height,
      frameWidth: Graphics.slime.width
    });
    this.load.spritesheet(Graphics.items.name, Graphics.items.file, {
      frameHeight: Graphics.items.height,
      frameWidth: Graphics.items.width
    });
  }

  constructor() {
    super("DungeonScene");
      this.tilemap = null;
  }

  // TODO: Implement the dungeon scene  



  create(): void {
    this.events.on("wake", () => {
      this.scene.run("InfoScene");
    });

    Object.values(Graphics.player.animations).forEach(anim => {
      if (!this.anims.get(anim.key)) {
        this.anims.create({
          ...anim,
          frames: this.anims.generateFrameNumbers(
            Graphics.player.name,
            anim.frames
          )
        });
      }
    });

    // TODO
    Object.values(Graphics.slime.animations).forEach(anim => {
      if (!this.anims.get(anim.key)) {
        this.anims.create({
          ...anim,
          frames: this.anims.generateFrameNumbers(
            Graphics.slime.name,
            anim.frames
          )
        });
      }
    });

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(3);
   


    this.input.keyboard.on("keydown_R", () => {
      this.scene.stop("InfoScene");
      this.scene.run("ReferenceScene");
      this.scene.sleep();
    });

    this.input.keyboard.on("keydown_Q", () => {
      this.physics.world.drawDebug = !this.physics.world.drawDebug;
      if (!this.physics.world.debugGraphic) {
        this.physics.world.createDebugGraphic();
      }
      this.physics.world.debugGraphic.clear();
    });


 
    this.scene.run("InfoScene");

    // Launch inventory scene in parallel
    this.scene.launch("InventoryScene");


    // Listen for inventory updates and forward them to inventory scene
    this.events.on('inventoryUpdated', () => {
      this.scene.get("InventoryScene").events.emit('updateInventory');
    });
  }

  // TODO: Implement the player update scene

  update(time: number, delta: number) {


    const camera = this.cameras.main;



    const player = new Phaser.Math.Vector2({
      x: 0,
      y: 0
    });

    const bounds = new Phaser.Geom.Rectangle(
      this.tilemap!.worldToTileX(camera.worldView.x) - 1,
      this.tilemap!.worldToTileY(camera.worldView.y) - 1,
      this.tilemap!.worldToTileX(camera.worldView.width) + 2,
      this.tilemap!.worldToTileX(camera.worldView.height) + 2
    );

  }
}
