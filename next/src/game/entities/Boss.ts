import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import DungeonScene from "../scenes/DungeonScene";
import Item from "./Item";
import Player from "./Player";

const BOSS_SPEED = 30;
const BOSS_HEALTH = 10;

export default class Boss {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: DungeonScene;
    private body: Phaser.Physics.Arcade.Body;
    private nextAction: number;
    private health: number;
    private isDead: boolean = false;

    constructor(x: number, y: number, scene: DungeonScene) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, Graphics.boss.name, 0);
        this.sprite.setSize(20, 24); // Adjust as needed for your boss sprite
        this.sprite.setOffset(6, 8); // Adjust as needed for your boss sprite
        this.sprite.setDepth(10);
        this.sprite.anims.play(Graphics.boss.animations.idle.key);

        this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.body.bounce.set(0, 0);
        this.body.setImmovable(true);

        this.nextAction = 0;
        this.health = BOSS_HEALTH;
    }

    update(time: number) {
        if (this.isDead) return;
        if (time < this.nextAction) return;

        // Simple AI: move or attack randomly
        if (Phaser.Math.Between(0, 3) === 0) {
            this.body.setVelocity(0);
            this.sprite.anims.play(Graphics.boss.animations.idle.key, true);
        } else {
            const action = Phaser.Math.Between(0, 2);
            if (action === 0) {
                // Move
                this.sprite.anims.play(Graphics.boss.animations.move.key, true);
                const direction = Phaser.Math.Between(0, 3);
                this.body.setVelocity(0);
                if (!this.body.blocked.left && direction === 0) {
                    this.body.setVelocityX(-BOSS_SPEED);
                } else if (!this.body.blocked.right && direction === 1) {
                    this.body.setVelocityX(BOSS_SPEED);
                } else if (!this.body.blocked.up && direction === 2) {
                    this.body.setVelocityY(-BOSS_SPEED);
                } else if (!this.body.blocked.down && direction === 3) {
                    this.body.setVelocityY(BOSS_SPEED);
                }
            } else {
                // Attack animation (visual only)
                this.sprite.anims.play(Graphics.boss.animations.attack.key, true);
                this.body.setVelocity(0);
            }
        }
        this.nextAction = time + Phaser.Math.Between(800, 2000);
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.sprite.anims.play(Graphics.boss.animations.hit.key, true);
        if (this.health <= 0) {
            this.die();
        }
    }

    private die() {
        this.isDead = true;
        this.sprite.anims.play(Graphics.boss.animations.death.key, false);
        this.sprite.disableBody();
        this.spawnLoot();
    }

    private spawnLoot() {
        // Drop several items on death
        for (let i = 0; i < Phaser.Math.Between(3, 5); i++) {
            const item = Item.createGoldKey(); // Or randomize loot
            const itemSprite = this.scene.physics.add.sprite(
                this.sprite.x + Phaser.Math.Between(-16, 16),
                this.sprite.y + Phaser.Math.Between(-16, 16),
                Graphics.items.name,
                item.data.spriteIndex
            );
            itemSprite.setOrigin(0.5, 0.5);
            itemSprite.setDepth(5);
            (itemSprite as any).itemData = item;
            this.scene.physics.add.overlap(
                this.scene.player!.sprite,
                itemSprite,
                () => {
                    if (this.scene.player!.addItemToInventory(item)) {
                        itemSprite.destroy();
                    }
                }
            );
        }
    }
} 