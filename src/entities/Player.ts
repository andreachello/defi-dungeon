import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Inventory from "./Inventory";
import Item from "./Item";

const speed = 125;
const attackSpeed = 500;
const attackDuration = 165;
const staggerDuration = 200;
const staggerSpeed = 100;
const attackCooldown = attackDuration * 2;

interface Keys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  // Add number keys for inventory
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  three: Phaser.Input.Keyboard.Key;
  four: Phaser.Input.Keyboard.Key;
  five: Phaser.Input.Keyboard.Key;
  six: Phaser.Input.Keyboard.Key;
  seven: Phaser.Input.Keyboard.Key;
  eight: Phaser.Input.Keyboard.Key;
  nine: Phaser.Input.Keyboard.Key;
}

export default class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public inventory: Inventory;
  private keys: Keys;

  // Add health properties
  private health: number = 6; // 6 health points (3 hearts)
  private maxHealth: number = 6;
  private isDead: boolean = false; // Add dead state

  private attackUntil: number;
  private staggerUntil: number;
  private attackLockedUntil: number;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private flashEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private body: Phaser.Physics.Arcade.Body;
  private attacking: boolean;
  private time: number;
  private staggered: boolean;
  private scene: Phaser.Scene;
  private facingUp: boolean;

  // Add speed potion properties
  private speedMultiplier: number = 1;
  private speedBoostUntil: number = 0;

  // Add vision potion properties
  private visionMultiplier: number = 1;
  private visionBoostUntil: number = 0;

  constructor(x: number, y: number, scene: Phaser.Scene) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, Graphics.player.name, 0);
    this.sprite.setSize(8, 8);
    this.sprite.setOffset(20, 28);
    this.sprite.anims.play(Graphics.player.animations.idle.key);
    this.facingUp = false;
    this.sprite.setDepth(15); // Increased from 5 to 15 to be above chests

    // Initialize inventory
    this.inventory = new Inventory();

    // Initialize health
    this.health = 3;
    this.maxHealth = 3;

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w: "w",
      a: "a",
      s: "s",
      d: "d",
      // Add number keys
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
      six: Phaser.Input.Keyboard.KeyCodes.SIX,
      seven: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      eight: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      nine: Phaser.Input.Keyboard.KeyCodes.NINE
    }) as Keys;

    this.attackUntil = 0;
    this.attackLockedUntil = 0;
    this.attacking = false;
    this.staggerUntil = 0;
    this.staggered = false;
    const particles = scene.add.particles(Graphics.player.name);
    particles.setDepth(6);
    this.emitter = particles.createEmitter({
      alpha: { start: 0.7, end: 0, ease: "Cubic.easeOut" },
      follow: this.sprite,
      quantity: 1,
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      scaleX: () => (this.sprite.flipX ? -1 : 1),
      emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.frame = this.sprite.frame;
      }
    });
    this.emitter.stop();

    this.flashEmitter = particles.createEmitter({
      alpha: { start: 0.5, end: 0, ease: "Cubic.easeOut" },
      follow: this.sprite,
      quantity: 1,
      lifespan: 100,
      scaleX: () => (this.sprite.flipX ? -1 : 1),
      emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.frame = this.sprite.frame;
      }
    });
    this.flashEmitter.stop();

    this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
    this.time = 0;
  }

  // Add health getters and setters
  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  // Add damage method
  takeDamage(amount: number = 0.5): void {
    console.log(`Player taking damage: ${amount}. Current health: ${this.health}`);

    this.health = Math.max(0, this.health - amount);

    console.log(`Player health after damage: ${this.health}`);

    // Emit health change event globally for all scenes
    this.scene.game.events.emit('playerHealthChanged', {
      health: this.health,
      maxHealth: this.maxHealth
    });

    // Check if player is dead
    if (this.health <= 0) {
      console.log("Player health is 0 or below, calling die()");
      this.die();
    } else {
      console.log("Player survived, health remaining:", this.health);
    }
  }

  // Add heal method
  heal(amount: number = 1): void {
    this.health = Math.min(this.maxHealth, this.health + amount);

    // Emit health change event globally for all scenes
    this.scene.game.events.emit('playerHealthChanged', {
      health: this.health,
      maxHealth: this.maxHealth
    });
  }

  // Add death method
  private die(): void {
    console.log("Player died! Game Over!");

    // Set dead state
    this.isDead = true;

    // Stop player movement and actions
    this.sprite.setVelocity(0, 0);
    this.attacking = false;

    // Stop the current animation
    this.sprite.anims.stop();

    // Optional: Play death animation or effect
    this.scene.cameras.main.shake(500, 0.01);
    this.scene.cameras.main.flash(200, 255, 0, 0);

    // Emit game over event to the current scene (DungeonScene)
    this.scene.events.emit('gameOver', { reason: 'player_died' });
    console.log("Game over event emitted to DungeonScene");
  }

  // Add getter for dead state
  isPlayerDead(): boolean {
    return this.isDead;
  }

  isAttacking(): boolean {
    return this.attacking;
  }

  stagger(): void {
    if (this.time > this.staggerUntil) {
      this.staggered = true;
      // TODO
      this.scene.cameras.main.shake(150, 0.001);
      this.scene.cameras.main.flash(50, 100, 0, 0);
    }
  }

  addItemToInventory(item: Item): boolean {
    return this.inventory.addItem(item);
  }

  useItem(itemId: string): boolean {
    const item = this.inventory.getItem(itemId);
    if (!item) return false;

    switch (item.data.type) {
      case "health_potion":
        // Heal 2 health points (1 heart)
        this.heal(2);
        console.log("Used health potion! Health restored!");
        this.inventory.removeItem(itemId, 1);
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      case "mana_potion":
        // Add mana restoration logic here
        console.log("Used mana potion!");
        this.inventory.removeItem(itemId, 1);
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      case "speed_potion":
        // Apply speed boost for 30 seconds
        console.log("Used speed potion! Speed increased by 2x for 30 seconds!");
        this.speedMultiplier = 2;
        this.speedBoostUntil = this.time + 30000; // 30 seconds
        this.inventory.removeItem(itemId, 1);

        // Emit event to notify scene about speed boost
        this.scene.events.emit('speedBoostActivated', { duration: 30000 });
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      case "vision_potion":
        // Apply vision boost for 30 seconds
        console.log("Used vision potion! Vision increased by 2x for 30 seconds!");
        this.visionMultiplier = 2;
        this.visionBoostUntil = this.time + 2000; // 2 seconds
        this.inventory.removeItem(itemId, 1);

        // Emit event to notify scene about vision boost
        this.scene.events.emit('visionBoostActivated', { duration: 2000 });
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      default:
        return false;
    }
  }

  // Add getter for speed boost status
  getSpeedBoostStatus(): { active: boolean; remainingTime: number } {
    if (this.speedBoostUntil > 0 && this.time < this.speedBoostUntil) {
      return {
        active: true,
        remainingTime: Math.ceil((this.speedBoostUntil - this.time) / 1000)
      };
    }
    return { active: false, remainingTime: 0 };
  }

  // Add getter for vision boost status
  getVisionBoostStatus(): { active: boolean; remainingTime: number } {
    if (this.visionBoostUntil > 0 && this.time < this.visionBoostUntil) {
      return {
        active: true,
        remainingTime: Math.ceil((this.visionBoostUntil - this.time) / 1000)
      };
    }
    return { active: false, remainingTime: 0 };
  }

  // Add getter for current vision radius
  getVisionRadius(): number {
    const baseRadius = 7;
    return Math.floor(baseRadius * this.visionMultiplier);
  }

  hasKey(): boolean {
    const key = this.inventory.getItem("key");
    return key !== undefined && key.quantity > 0;
  }

  useKey(): boolean {
    const key = this.inventory.getItem("key");
    if (key && key.quantity > 0) {
      const success = this.inventory.removeItem("key", 1);
      if (success) {
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      }
    }
    return false;
  }

  hasGoldKey(): boolean {
    const goldKey = this.inventory.getItem("gold_key");
    return goldKey !== undefined && goldKey.quantity > 0;
  }

  useGoldKey(): boolean {
    const goldKey = this.inventory.getItem("gold_key");
    if (goldKey && goldKey.quantity > 0) {
      const success = this.inventory.removeItem("gold_key", 1);
      if (success) {
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      }
    }
    return false;
  }

  hasBossKey(): boolean {
    const bossKey = this.inventory.getItem("boss_key");
    return bossKey !== undefined && bossKey.quantity > 0;
  }

  useBossKey(): boolean {
    const bossKey = this.inventory.getItem("boss_key");
    if (bossKey && bossKey.quantity > 0) {
      const success = this.inventory.removeItem("boss_key", 1);
      if (success) {
        // Emit event to notify inventory scene that inventory changed
        this.scene.events.emit('inventoryUpdated');
        return true;
      }
    }
    return false;
  }

  // Add method to use item by slot index
  useItemBySlot(slotIndex: number): boolean {
    console.log(`Attempting to use item in slot ${slotIndex}`);

    const items = this.inventory.getAllItems();
    console.log(`Total items in inventory: ${items.length}`);

    if (slotIndex < items.length) {
      const item = items[slotIndex];
      console.log(`Found item in slot ${slotIndex}: ${item.data.name}`);

      if (this.useItem(item.data.id)) {
        console.log(`Successfully used item: ${item.data.name}`);
        // Show usage message
        this.showItemUsedMessage(item.data.name);

        // Force inventory display update
        this.scene.events.emit('updateInventory');

        return true;
      } else {
        console.log(`Failed to use item: ${item.data.name}`);
      }
    } else {
      console.log(`No item found in slot ${slotIndex}`);
    }
    return false;
  }

  // Add method to show item used message
  private showItemUsedMessage(itemName: string) {
    console.log(`Showing message for used item: ${itemName}`);
    // Emit event globally to show message in UI
    this.scene.game.events.emit('showItemUsedMessage', { itemName });
  }

  update(time: number) {
    this.time = time;

    // If player is dead, don't process any movement or actions
    if (this.isDead) {
      this.body.setVelocity(0, 0);
      // Stop any ongoing animation
      if (this.sprite.anims.isPlaying) {
        this.sprite.anims.stop();
      }
      return;
    }

    // Check number key presses for inventory
    this.checkNumberKeyPresses();

    // Check if speed boost has expired
    if (this.speedBoostUntil > 0 && time > this.speedBoostUntil) {
      this.speedMultiplier = 1;
      this.speedBoostUntil = 0;
      console.log("Speed boost expired!");

      // Emit event to notify scene about speed boost ending
      this.scene.events.emit('speedBoostExpired');
    }

    // Check if vision boost has expired
    if (this.visionBoostUntil > 0 && time > this.visionBoostUntil) {
      this.visionMultiplier = 1;
      this.visionBoostUntil = 0;
      console.log("Vision boost expired!");

      // Emit event to notify scene about vision boost ending
      this.scene.events.emit('visionBoostExpired');
    }

    const keys = this.keys;
    let attackAnim = "";
    let moveAnim = "";

    if (this.staggered && !this.body.touching.none) {
      this.staggerUntil = this.time + staggerDuration;
      this.staggered = false;

      this.body.setVelocity(0);
      if (this.body.touching.down) {
        this.body.setVelocityY(-staggerSpeed);
      } else if (this.body.touching.up) {
        this.body.setVelocityY(staggerSpeed);
      } else if (this.body.touching.left) {
        this.body.setVelocityX(staggerSpeed);
        this.sprite.setFlipX(true);
      } else if (this.body.touching.right) {
        this.body.setVelocityX(-staggerSpeed);
        this.sprite.setFlipX(false);
      }
      this.sprite.anims.play(Graphics.player.animations.stagger.key);

      this.flashEmitter.start();
      // this.sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    if (time < this.attackUntil || time < this.staggerUntil) {
      return;
    }

    this.body.setVelocity(0);

    const left = keys.left.isDown || keys.a.isDown;
    const right = keys.right.isDown || keys.d.isDown;
    const up = keys.up.isDown || keys.w.isDown;
    const down = keys.down.isDown || keys.s.isDown;

    // Apply speed multiplier to movement
    const currentSpeed = speed * this.speedMultiplier;

    if (!this.body.blocked.left && left) {
      this.body.setVelocityX(-currentSpeed);
      this.sprite.setFlipX(true);
    } else if (!this.body.blocked.right && right) {
      this.body.setVelocityX(currentSpeed);
      this.sprite.setFlipX(false);
    }

    if (!this.body.blocked.up && up) {
      this.body.setVelocityY(-currentSpeed);
    } else if (!this.body.blocked.down && down) {
      this.body.setVelocityY(currentSpeed);
    }

    if (left || right) {
      moveAnim = Graphics.player.animations.walk.key;
      attackAnim = Graphics.player.animations.slash.key;
      this.facingUp = false;
    } else if (down) {
      moveAnim = Graphics.player.animations.walk.key;
      attackAnim = Graphics.player.animations.slashDown.key;
      this.facingUp = false;
    } else if (up) {
      moveAnim = Graphics.player.animations.walkBack.key;
      attackAnim = Graphics.player.animations.slashUp.key;
      this.facingUp = true;
    } else if (this.facingUp) {
      moveAnim = Graphics.player.animations.idleBack.key;
    } else {
      moveAnim = Graphics.player.animations.idle.key;
    }

    if (
      keys.space!.isDown &&
      time > this.attackLockedUntil &&
      this.body.velocity.length() > 0
    ) {
      this.attackUntil = time + attackDuration;
      this.attackLockedUntil = time + attackDuration + attackCooldown;
      this.body.velocity.normalize().scale(attackSpeed);
      this.sprite.anims.play(attackAnim, true);
      this.emitter.start();
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.attacking = true;
      return;
    }

    this.attacking = false;
    this.sprite.anims.play(moveAnim, true);
    this.body.velocity.normalize().scale(currentSpeed);
    this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
    if (this.emitter.on) {
      this.emitter.stop();
    }
    if (this.flashEmitter.on) {
      this.flashEmitter.stop();
    }
  }

  // Add method to check number key presses
  private checkNumberKeyPresses() {
    const numberKeys = [
      this.keys.one,
      this.keys.two,
      this.keys.three,
      this.keys.four,
      this.keys.five,
      this.keys.six,
      this.keys.seven,
      this.keys.eight,
      this.keys.nine
    ];

    numberKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        console.log(`Number key ${index + 1} pressed, using item in slot ${index}`);
        this.useItemBySlot(index);
      }
    });
  }
}
