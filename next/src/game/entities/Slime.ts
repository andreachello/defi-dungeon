import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import DungeonScene from "../scenes/DungeonScene";
import Item from "./Item";
import Player from "./Player";
import DungeonMap from "./Map";

const speed = 20;

export default class Slime {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private lastMoveTime: number;
  private moveInterval: number;
  private moveSpeed: number;
  private path: Phaser.Math.Vector2[];
  private pathIndex: number;
  private map: DungeonMap;
  public dropsGoldKey: boolean = false;
  public dropsBossKey: boolean = false;
  public dropsBossRoomItems: boolean = false;

  constructor(x: number, y: number, scene: Phaser.Scene) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, Graphics.slime.name, 0);
    this.sprite.setSize(12, 10);
    this.sprite.setOffset(10, 14);
    this.sprite.anims.play(Graphics.slime.animations.idle.key);
    this.sprite.setDepth(10);

    this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
    this.nextAction = 0;
    this.body.bounce.set(0, 0);
    this.body.setImmovable(true);
  }

  update(time: number) {
    if (time < this.nextAction) {
      return;
    }

    if (Phaser.Math.Between(0, 1) === 0) {
      this.body.setVelocity(0);
      this.sprite.anims.play(Graphics.slime.animations.idle.key, true);
    } else {
      this.sprite.anims.play(Graphics.slime.animations.move.key, true);
      const direction = Phaser.Math.Between(0, 3);
      this.body.setVelocity(0);

      if (!this.body.blocked.left && direction === 0) {
        this.body.setVelocityX(-speed);
      } else if (!this.body.blocked.right && direction <= 1) {
        this.body.setVelocityX(speed);
      } else if (!this.body.blocked.up && direction <= 2) {
        this.body.setVelocityY(-speed);
      } else if (!this.body.blocked.down && direction <= 3) {
        this.body.setVelocityY(speed);
      } else {
        console.log(`Couldn't find direction for slime: ${direction}`);
      }
    }

    this.nextAction = time + Phaser.Math.Between(1000, 3000);
  }

  kill() {
    console.log("Slime killed! Spawning items...");
    this.sprite.anims.play(Graphics.slime.animations.death.key, false);

    console.log("Spawning individual items");
    this.spawnIndividualItems(this.scene);

    this.sprite.disableBody();
  }

  spawnIndividualItems(scene: Phaser.Scene) {
    console.log("Starting to spawn individual items...");

    const numItems = 1;
    console.log(`Spawning ${numItems} items`);

    for (let i = 0; i < numItems; i++) {
      let item: Item;

      if (this.dropsBossRoomItems) {
        // Boss room slimes drop only health potions (100%)
        item = Item.createHealthPotion();
        console.log(`Creating heart potion (100% chance)`);
        console.log(`Creating boss room potion: ${item.data.name}`);
      } else if (this.dropsGoldKey) {
        // Slimes in locked rooms drop gold keys
        item = Item.createGoldKey();
        console.log(`Creating gold key item: ${item.data.name} with sprite index: ${item.data.spriteIndex}`);
      } else if (this.dropsBossKey) {
        // Slimes in golden locked rooms drop boss keys (only if player doesn't have one)
        const player = (scene as DungeonScene).player;
        const hasBossKey = player && player.inventory.hasItem("boss_key");

        if (!hasBossKey) {
          item = Item.createBossKey();
          console.log(`Creating boss key item: ${item.data.name} with sprite index: ${item.data.spriteIndex}`);
        } else {
          // Player already has boss key, drop gold key instead
          item = Item.createGoldKey();
          console.log(`Player has boss key, dropping gold key instead`);
        }
      } else {
        // Normal slimes drop regular items
        const itemType = Phaser.Math.Between(0, 2);
        switch (itemType) {
          case 0:
            item = Item.createKey();
            break;
          // case 1:
          //   item = Item.createHealthPotion();
          //   break;
          // case 2:
          //   item = Item.createHealthPotion();
          //   break;
          default:
            item = Item.createKey();
        }
        console.log(`Creating item: ${item.data.name} with sprite index: ${item.data.spriteIndex}`);
      }

      // Find a valid floor position for the item
      const validPosition = this.findValidFloorPosition(scene);

      if (validPosition) {
        // Create item sprite at valid position
        const itemSprite = scene.physics.add.sprite(
          validPosition.x,
          validPosition.y,
          Graphics.items.name,
          item.data.spriteIndex
        );
        itemSprite.setOrigin(0.5, 0.5);
        itemSprite.setDepth(5);
        itemSprite.setSize(16, 16);
        itemSprite.setOffset(0, 0);

        console.log(`Item sprite created at (${itemSprite.x}, ${itemSprite.y}) for ${item.data.name}`);

        // Store the item data on the sprite
        (itemSprite as any).itemData = item;

        // Add floating animation
        scene.tweens.add({
          targets: itemSprite,
          y: itemSprite.y - 2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Add collision detection with player
        if (scene instanceof DungeonScene) {
          console.log(`Setting up collision detection for item: ${item.data.name}`);

          // Add overlap detection
          scene.physics.add.overlap(
            scene.player!.sprite,
            itemSprite,
            (playerSprite, itemSprite) => {
              console.log(`COLLISION DETECTED! Player touched item: ${item.data.name}`);
              this.pickupItem(scene, itemSprite as Phaser.Physics.Arcade.Sprite, item);
            },
            undefined,
            scene
          );

          console.log(`Collision detection set up for item: ${item.data.name}`);
        } else {
          console.log("Scene is not DungeonScene, cannot set up collision");
        }
      } else {
        console.log(`Could not find valid floor position for item: ${item.data.name}`);
      }
    }

    console.log("Finished spawning individual items");
  }

  private pickupItem(scene: Phaser.Scene, itemSprite: Phaser.Physics.Arcade.Sprite, item: Item) {
    console.log(`=== PICKUP ITEM DEBUG ===`);
    console.log(`Picking up: ${item.data.name}`);
    console.log(`Item quantity: ${item.quantity}`);

    // Get player from DungeonScene
    const dungeonScene = scene as DungeonScene;
    const player = dungeonScene.player;

    if (player) {
      console.log(`Player found! Adding item to inventory...`);

      // Check if this is a boss key and player already has one
      if (item.data.id === "boss_key" && player.inventory.hasItem("boss_key")) {
        console.log(`✗ BLOCKED: Player already has boss key, destroying extra boss key`);

        // Show message that extra boss key was destroyed
        this.showPickupMessage(scene, itemSprite.x, itemSprite.y, "Extra Boss Key Destroyed", 1);

        // Remove the item sprite
        itemSprite.destroy();
        return;
      }

      if (player.addItemToInventory(item)) {
        console.log(`✓ SUCCESS: Added ${item.quantity}x ${item.data.name} to inventory`);

        // Show pickup message
        this.showPickupMessage(scene, itemSprite.x, itemSprite.y, item.data.name, item.quantity);

        // Update inventory display
        const inventoryScene = scene.scene.get("InventoryScene");
        if (inventoryScene) {
          inventoryScene.events.emit('updateInventory');
        }
      } else {
        console.log(`✗ FAILED: Could not add ${item.data.name} - inventory full`);
        this.showInventoryFullMessage(scene, itemSprite.x, itemSprite.y);
      }
    } else {
      console.log(`✗ ERROR: Could not find player reference!`);
    }

    console.log(`=== END PICKUP DEBUG ===`);

    // Remove the item sprite
    itemSprite.destroy();
  }

  private showPickupMessage(scene: Phaser.Scene, x: number, y: number, itemName: string, quantity: number) {
    console.log(`Showing pickup message: +${quantity} ${itemName}`);
    const text = scene.add.text(
      x,
      y - 30,
      `+${quantity} ${itemName}`,
      {
        fontSize: '12px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    );
    text.setOrigin(0.5);
    text.setDepth(10);

    // Fade out and remove after 2 seconds
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 20,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  private showInventoryFullMessage(scene: Phaser.Scene, x: number, y: number) {
    console.log(`Showing inventory full message`);
    const text = scene.add.text(
      x,
      y - 30,
      'Inventory Full!',
      {
        fontSize: '12px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    );
    text.setOrigin(0.5);
    text.setDepth(10);

    // Fade out and remove after 2 seconds
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 20,
      duration: 2000,
      onComplete: () => text.destroy()
    });
  }

  spawnMoreSlimes() {
    const numberOfNewSlimes = 2;
    for (let i = 0; i < numberOfNewSlimes; i++) {
      const xOffset = Phaser.Math.Between(-10, 10);
      const yOffset = Phaser.Math.Between(-10, 10);

      const newSlime = new Slime(this.sprite.x + xOffset, this.sprite.y + yOffset, this.scene);

      if (this.scene instanceof DungeonScene) {
        this.scene.slimes.push(newSlime);
        this.scene.slimeGroup?.add(newSlime.sprite);
      }
    }
  }

  private findValidFloorPosition(scene: Phaser.Scene): { x: number, y: number } | null {
    const dungeonScene = scene as DungeonScene;
    const map = dungeonScene.tilemap;

    if (!map) {
      console.log("No tilemap found, using original position");
      return { x: this.sprite.x, y: this.sprite.y };
    }

    // Convert slime position to tile coordinates
    const slimeTileX = map.worldToTileX(this.sprite.x);
    const slimeTileY = map.worldToTileY(this.sprite.y);

    // Check if slime position is on floor
    if (this.isFloorTile(slimeTileX, slimeTileY, dungeonScene)) {
      return { x: this.sprite.x, y: this.sprite.y };
    }

    // Search in expanding radius for floor tiles
    const maxRadius = 5;
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check tiles at the current radius
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const checkX = slimeTileX + dx;
            const checkY = slimeTileY + dy;

            if (this.isFloorTile(checkX, checkY, dungeonScene)) {
              const worldX = map.tileToWorldX(checkX);
              const worldY = map.tileToWorldY(checkY);
              console.log(`Found valid floor position at tile (${checkX}, ${checkY})`);
              return { x: worldX, y: worldY };
            }
          }
        }
      }
    }

    console.log("No valid floor tile found near slime, using original position");
    return { x: this.sprite.x, y: this.sprite.y };
  }

  private isFloorTile(tileX: number, tileY: number, dungeonScene: DungeonScene): boolean {
    // Defensive: check bounds
    const map = (dungeonScene as any).map; // Use the logical map, not tilemap
    if (!map) return false;
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileY >= map.height ||
      tileX >= map.width
    ) {
      return false;
    }
    const tile = map.tiles[tileY][tileX];
    // Adjust this check to your actual TileType enum/values
    return tile.type === "none" || tile.type === "floor" || tile.type === 0;
  }
}
