import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import FOVLayer from "../entities/FOVLayer";
import Player from "../entities/Player";
import Slime from "../entities/Slime";
import Map from "../entities/Map";
import PickupItem from "../entities/PickupItem";
import { TileType } from "../entities/Tile";
import Chest from "../entities/Chest";
import Boss from "../entities/Boss";

const worldTileHeight = 81;
const worldTileWidth = 81;

export default class DungeonScene extends Phaser.Scene {
  lastX: number;
  lastY: number;
  player: Player | null;
  slimes: Slime[];
  slimeGroup: Phaser.GameObjects.Group | null;
  chests: Chest[];
  chestGroup: Phaser.GameObjects.Group | null;
  fov: FOVLayer | null;
  tilemap: Phaser.Tilemaps.Tilemap | null;
  roomDebugGraphics?: Phaser.GameObjects.Graphics;
  boss: Boss | null = null;

  // Inventory overlay properties
  private inventoryBackground?: Phaser.GameObjects.Rectangle;
  private inventorySlots: Phaser.GameObjects.Rectangle[] = [];
  private inventorySprites: Phaser.GameObjects.Sprite[] = [];
  private inventoryTexts: Phaser.GameObjects.Text[] = [];

  preload(): void {
    this.load.spritesheet(Graphics.environment.name, Graphics.environment.file, {
      frameWidth: Graphics.environment.width,
      frameHeight: Graphics.environment.height,
      margin: Graphics.environment.margin,
      spacing: Graphics.environment.spacing
    });
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
    this.load.atlas('boss', '/assets/boss/boss.png', '/assets/boss/boss.json');
  }

  constructor() {
    super("DungeonScene");
    this.lastX = -1;
    this.lastY = -1;
    this.player = null;
    this.fov = null;
    this.tilemap = null;
    this.slimes = [];
    this.slimeGroup = null;
    this.chests = [];
    this.chestGroup = null;
  }

  slimePlayerCollide(
    _: Phaser.GameObjects.GameObject,
    slimeSprite: Phaser.GameObjects.GameObject
  ) {
    const slime = this.slimes.find(s => s.sprite === slimeSprite);
    if (!slime) {
      console.log("Missing slime for sprite collision!");
      return;
    }

    if (this.player!.isAttacking()) {
      this.slimes = this.slimes.filter(s => s != slime);
      slime.kill();
      return false;
    } else {
      // Deal damage to player (half a heart = 0.5 health points)
      this.player!.takeDamage(0.5);
      this.player!.stagger();
      return true;
    }
  }

  create(): void {
    this.events.on("wake", () => {
      this.scene.run("InfoScene");
    });

    // Listen for game over event
    this.events.on('gameOver', this.onGameOver, this);

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

    Object.values(Graphics.boss.animations).forEach(anim => {
      if (!this.anims.get(anim.key)) {
        this.anims.create({
          ...anim,
          frames: this.anims.generateFrameNumbers(
            Graphics.boss.name,
            anim.frames
          )
        });
      }
    });

    const map = new Map(worldTileWidth, worldTileHeight, this);
    this.tilemap = map.tilemap;

    this.fov = new FOVLayer(map);

    this.player = new Player(
      this.tilemap.tileToWorldX(map.startingX),
      this.tilemap.tileToWorldY(map.startingY),
      this
    );

    // Set the player reference in the map so it can check for keys
    map.setPlayer(this.player);

    // Create minimap after player is created
    console.log("Creating minimap in DungeonScene...");
    // Remove the minimap property since we're using a separate scene

    this.slimes = map.slimes;
    this.slimeGroup = this.physics.add.group(this.slimes.map(s => s.sprite));

    // Add chest handling
    this.chests = map.chests;
    this.chestGroup = this.physics.add.group(this.chests.map(chest => chest.sprite) as unknown as Phaser.GameObjects.Sprite[]);

    // Add boss to the scene
    this.boss = map.boss;
    if (this.boss) {
      this.physics.add.collider(this.player!.sprite, this.boss.sprite, () => {
        // Player takes damage if touching boss
        this.player!.takeDamage(1);
        this.player!.stagger();
      });
    }

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(3);
    this.cameras.main.setBounds(
      0,
      0,
      map.width * Graphics.environment.width,
      map.height * Graphics.environment.height
    );
    this.cameras.main.startFollow(this.player.sprite);

    this.physics.add.collider(this.player.sprite, map.wallLayer);
    this.physics.add.collider(this.slimeGroup, map.wallLayer);

    this.physics.add.collider(this.player.sprite, map.doorLayer);
    this.physics.add.collider(this.slimeGroup, map.doorLayer);

    this.physics.add.collider(this.slimeGroup, this.chestGroup);

    this.physics.add.collider(
      this.player.sprite,
      this.slimeGroup,
      undefined,
      this.slimePlayerCollide,
      this
    );

    // Add collision detection for pickup items
    this.physics.add.overlap(
      this.player.sprite,
      this.children.list.filter(child => child instanceof PickupItem),
      this.playerItemCollide,
      undefined,
      this
    );

    // Replace the overlap with a collider that has a callback
    this.physics.add.collider(
      this.player.sprite,
      this.chestGroup,
      undefined,
      this.playerChestCollide,
      this
    );

    console.log(`Added chest collision detection for ${this.chests.length} chests`);

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
      this.roomDebugGraphics!.setVisible(this.physics.world.drawDebug);
    });

    this.input.keyboard.on("keydown_F", () => {
      this.fov!.layer.setVisible(!this.fov!.layer.visible);
    });

    this.roomDebugGraphics = this.add.graphics({ x: 0, y: 0 });
    this.roomDebugGraphics.setVisible(false);
    this.roomDebugGraphics.lineStyle(2, 0xff5500, 0.5);
    for (let room of map.rooms) {
      this.roomDebugGraphics.strokeRect(
        this.tilemap!.tileToWorldX(room.x),
        this.tilemap!.tileToWorldY(room.y),
        this.tilemap!.tileToWorldX(room.width),

        this.tilemap!.tileToWorldY(room.height)
      );
    }

    this.scene.run("InfoScene");

    // Launch inventory scene in parallel
    this.scene.launch("InventoryScene");

    // Launch minimap scene in parallel
    this.scene.launch("MinimapScene");

    // Launch timer scene in parallel
    this.scene.launch("TimerScene");

    // Launch health scene in parallel
    this.scene.launch("HealthScene");

    // Pass player reference to inventory scene
    this.scene.get("InventoryScene").events.emit('setPlayer', this.player);

    // Pass player reference to timer scene
    this.scene.get("TimerScene").events.emit('setPlayer', this.player);

    // Pass player reference to health scene
    this.scene.get("HealthScene").events.emit('setPlayer', this.player);

    // Pass map and player references to minimap scene with a small delay
    this.time.delayedCall(100, () => {
      const minimapScene = this.scene.get("MinimapScene");
      if (minimapScene) {
        console.log("Passing map and player to MinimapScene");
        minimapScene.events.emit('setMap', map);
        minimapScene.events.emit('setPlayer', this.player);
      } else {
        console.log("MinimapScene not found!");
      }
    });

    // Listen for inventory updates and forward them to inventory scene
    this.events.on('inventoryUpdated', () => {
      this.scene.get("InventoryScene").events.emit('updateInventory');
    });

    // Listen for speed boost events and forward them to timer scene
    this.events.on('speedBoostActivated', (data) => {
      this.scene.get("TimerScene").events.emit('speedBoostActivated', data);
    });
    this.events.on('speedBoostExpired', () => {
      this.scene.get("TimerScene").events.emit('speedBoostExpired');
    });

    // Listen for vision boost events and forward them to timer scene
    this.events.on('visionBoostActivated', (data) => {
      this.scene.get("TimerScene").events.emit('visionBoostActivated', data);
      // Remove FOV layer completely
      if (this.fov) {
        this.fov.setVisionBoost(true);
      }
    });
    this.events.on('visionBoostExpired', () => {
      this.scene.get("TimerScene").events.emit('visionBoostExpired');
      // Restore FOV layer
      if (this.fov) {
        this.fov.setVisionBoost(false);
      }
    });
  }

  // Remove the createHeartUI and updateHealthDisplay methods since they're now in HealthScene

  update(time: number, delta: number) {
    this.player!.update(time);

    const camera = this.cameras.main;

    for (let slime of this.slimes) {
      slime.update(time);
    }

    if (this.boss) {
      this.boss.update(time);
    }

    const player = new Phaser.Math.Vector2({
      x: this.tilemap!.worldToTileX(this.player!.sprite.body.x),
      y: this.tilemap!.worldToTileY(this.player!.sprite.body.y)
    });

    const bounds = new Phaser.Geom.Rectangle(
      this.tilemap!.worldToTileX(camera.worldView.x) - 1,
      this.tilemap!.worldToTileY(camera.worldView.y) - 1,
      this.tilemap!.worldToTileX(camera.worldView.width) + 2,
      this.tilemap!.worldToTileX(camera.worldView.height) + 2
    );

    this.fov!.update(player, bounds, delta);

    // Update minimap
    const minimapScene = this.scene.get("MinimapScene");
    if (minimapScene) {
      minimapScene.events.emit('updateMinimap');
    }

    // Notify inventory scene to update if needed
    // The inventory scene will handle its own updates

    // Update FOV radius if vision boost is active
    // The FOV layer will handle its own visibility based on vision boost status
  }

  // Add the missing playerItemCollide method
  playerItemCollide(
    playerSprite: Phaser.GameObjects.GameObject,
    itemSprite: Phaser.GameObjects.GameObject
  ) {
    // Find the pickup item that corresponds to this sprite
    const item = this.children.list.find(child =>
      child instanceof PickupItem && child.sprite === itemSprite
    ) as PickupItem;

    if (item) {
      console.log("Player collided with pickup item!");
      item.pickupItem(); // Changed from item.pickup(this.player!) to item.pickupItem()
    } else {
      console.log("Could not find pickup item object for sprite:", itemSprite);
    }
  }

  // Add the missing playerChestCollide method
  playerChestCollide(
    playerSprite: Phaser.GameObjects.GameObject,
    chestSprite: Phaser.GameObjects.GameObject
  ) {
    // Find the chest object that corresponds to this sprite
    const chest = this.chests.find(c => c.sprite === chestSprite);
    if (chest) {
      console.log("Player collided with chest!");
      chest.openChest();
    } else {
      console.log("Could not find chest object for sprite:", chestSprite);
    }
  }

  private onGameOver(data: { reason: string }) {
    console.log("Game Over in DungeonScene! Reason:", data.reason);

    // Stop all enemy movement and interactions
    if (this.slimes) {
      this.slimes.forEach(slime => {
        slime.sprite.setVelocity(0, 0);
      });
    }

    // Disable player input
    if (this.player) {
      this.player.sprite.setVelocity(0, 0);
    }

    // Optional: Add visual effects
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(200, 255, 0, 0);

    // Emit global game over event for other scenes
    this.game.events.emit('gameOver', data);
  }
}
