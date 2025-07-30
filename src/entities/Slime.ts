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
      // Randomly choose item type, but respect the drop type
      let item: Item;

      if (this.dropsGoldKey) {
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

      // Add some offset to spread items out
      const xOffset = Phaser.Math.Between(-20, 20);
      const yOffset = Phaser.Math.Between(-20, 20);

      // Create item sprite directly
      const itemSprite = scene.physics.add.sprite(
        this.sprite.x + xOffset,
        this.sprite.y + yOffset,
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
}
