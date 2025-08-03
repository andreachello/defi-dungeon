import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import DungeonScene from "../scenes/DungeonScene";
import Item from "./Item";
import Player from "./Player";

const BOSS_SPEED = 30;
const BOSS_HEARTS = 10;

// Boss states
enum BossState {
    IDLE = 'idle',
    TELEPORTING = 'teleporting',
    PREATTACK = 'preattack',
    ATTACKING = 'attacking'
}

export default class Boss {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private scene: DungeonScene;
    private body: Phaser.Physics.Arcade.Body;
    private health: number;
    private isDead: boolean = false;

    // FSM properties
    private currentState: BossState = BossState.IDLE;
    private stateTimer: number = 0;
    private stateDuration: number = 0;
    private targetPosition: { x: number, y: number } | null = null;
    private attackTarget: { x: number, y: number } | null = null;

    // State durations (in milliseconds)
    private readonly IDLE_DURATION = 2000;
    private readonly TELEPORT_DURATION = 500;
    private readonly PREATTACK_DURATION = 1000;
    private readonly ATTACK_DURATION = 800;

    private bossRoomBounds: { x: number, y: number, width: number, height: number };
    private healthUI: Phaser.GameObjects.Container | null = null;
    private heartSprites: Phaser.GameObjects.Sprite[] = [];

    constructor(
        x: number,
        y: number,
        scene: DungeonScene,
        bossRoomBounds: { x: number, y: number, width: number, height: number }
    ) {
        this.scene = scene;
        this.bossRoomBounds = bossRoomBounds;
        this.sprite = scene.physics.add.sprite(x, y, Graphics.boss.name, 0);
        this.sprite.setSize(20, 24);
        this.sprite.setOffset(6, 8);
        this.sprite.setDepth(10);
        this.sprite.anims.play(Graphics.boss.animations.idle.key);

        this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.body.bounce.set(0, 0);
        this.body.setImmovable(true);

        this.health = BOSS_HEARTS; // Changed from BOSS_HEALTH to BOSS_HEARTS
        this.startState(BossState.IDLE);
        this.createHealthUI();
    }

    update(time: number) {
        if (this.isDead) return;

        // Update state timer
        this.stateTimer += 16;

        // Check if state should transition
        if (this.stateTimer >= this.stateDuration) {
            this.transitionState();
        }

        // Update current state
        this.updateCurrentState(time);

        // Update health UI position to follow the boss closely
        if (this.healthUI && !this.isDead) {
            this.healthUI.setPosition(
                this.sprite.x - (this.heartSprites.length * 4),
                this.sprite.y - 20
            );
        }
    }

    private startState(state: BossState) {
        this.currentState = state;
        this.stateTimer = 0;

        switch (state) {
            case BossState.IDLE:
                this.stateDuration = this.IDLE_DURATION;
                this.sprite.anims.play(Graphics.boss.animations.idle.key, true);
                this.body.setVelocity(0);
                break;

            case BossState.TELEPORTING:
                this.stateDuration = this.TELEPORT_DURATION;
                this.sprite.anims.play(Graphics.boss.animations.move.key, true);
                this.teleportToRandomPosition();
                break;

            case BossState.PREATTACK:
                this.stateDuration = this.PREATTACK_DURATION;
                this.sprite.anims.play(Graphics.boss.animations.attack.key, true);
                this.body.setVelocity(0);
                this.prepareAttack();
                break;

            case BossState.ATTACKING:
                this.stateDuration = this.ATTACK_DURATION;
                this.sprite.anims.play(Graphics.boss.animations.attack.key, true);
                this.executeAttack();
                break;
        }
    }

    private transitionState() {
        switch (this.currentState) {
            case BossState.IDLE:
                this.startState(BossState.TELEPORTING);
                break;

            case BossState.TELEPORTING:
                this.startState(BossState.PREATTACK);
                break;

            case BossState.PREATTACK:
                this.startState(BossState.ATTACKING);
                break;

            case BossState.ATTACKING:
                this.startState(BossState.IDLE);
                break;
        }
    }

    private updateCurrentState(time: number) {
        switch (this.currentState) {
            case BossState.IDLE:
                // Just wait, no movement
                break;

            case BossState.TELEPORTING:
                // Teleport is instant, just wait for duration
                break;

            case BossState.PREATTACK:
                // Face the player during preattack
                this.facePlayer();
                break;

            case BossState.ATTACKING:
                // Move towards attack target
                this.moveTowardsTarget();
                break;
        }
    }

    private teleportToRandomPosition() {
        // Use the actual boss room bounds
        const roomTL = this.scene.tilemap!.tileToWorldXY(
            this.bossRoomBounds.x + 1,
            this.bossRoomBounds.y + 1
        );
        const roomBounds = this.scene.tilemap!.tileToWorldXY(
            this.bossRoomBounds.x + this.bossRoomBounds.width - 1,
            this.bossRoomBounds.y + this.bossRoomBounds.height - 1
        );

        const newX = Phaser.Math.Between(roomTL.x, roomBounds.x);
        const newY = Phaser.Math.Between(roomTL.y, roomBounds.y);

        this.sprite.setPosition(newX, newY);
        console.log(`Boss teleported to (${newX}, ${newY}) within room bounds`);
    }

    private prepareAttack() {
        // Calculate attack target (player position)
        if (this.scene.player) {
            this.attackTarget = {
                x: this.scene.player.sprite.x,
                y: this.scene.player.sprite.y
            };
            console.log(`Boss preparing attack towards player at (${this.attackTarget.x}, ${this.attackTarget.y})`);
        }
    }

    private executeAttack() {
        if (this.attackTarget) {
            // Move towards the attack target
            this.targetPosition = this.attackTarget;
            console.log(`Boss attacking towards (${this.targetPosition.x}, ${this.targetPosition.y})`);
        }
    }

    private moveTowardsTarget() {
        if (this.targetPosition) {
            const direction = new Phaser.Math.Vector2(
                this.targetPosition.x - this.sprite.x,
                this.targetPosition.y - this.sprite.y
            );

            if (direction.length() > 5) {
                
                direction.normalize();
                this.body.setVelocity(
                    direction.x * BOSS_SPEED * 2,
                    direction.y * BOSS_SPEED * 2
                );
            } else {
                this.body.setVelocity(0);
            }
        }
    }

    private facePlayer() {
        if (this.scene.player) {
            const direction = new Phaser.Math.Vector2(
                this.scene.player.sprite.x - this.sprite.x,
                this.scene.player.sprite.y - this.sprite.y
            );

            // You can add logic here to flip the sprite based on direction
            // this.sprite.setFlipX(direction.x < 0);
        }
    }

    private createHealthUI() {
        this.healthUI = this.scene.add.container(0, 0);
        this.healthUI.setDepth(15);

        for (let i = 0; i < BOSS_HEARTS; i++) {
            const heartSprite = this.scene.add.sprite(
                i * 8,
                0,
                Graphics.environment.name,
                Graphics.environment.indices.heart.full
            );
            heartSprite.setScale(0.5);
            this.heartSprites.push(heartSprite);
            this.healthUI.add(heartSprite);
        }

        this.updateHealthUI();
    }

    private updateHealthUI() {
        if (!this.healthUI) return;

        // Update heart sprites based on current health
        for (let i = 0; i < this.heartSprites.length; i++) {
            const heartSprite = this.heartSprites[i];
            if (i < Math.floor(this.health)) {
                // Full heart
                heartSprite.setTexture(Graphics.environment.name, Graphics.environment.indices.heart.full);
            } else if (i < Math.ceil(this.health) && this.health % 1 !== 0) {
                // Half heart (if there's a decimal part)
                heartSprite.setTexture(Graphics.environment.name, Graphics.environment.indices.heart.half);
            } else {
                // Empty heart
                heartSprite.setTexture(Graphics.environment.name, Graphics.environment.indices.heart.empty);
            }
        }

        // Position the health UI right on top of the boss
        this.healthUI.setPosition(
            this.sprite.x - (this.heartSprites.length * 4),
            this.sprite.y - 20
        );
    }

    public getHealth(): number {
        return this.health;
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.health -= amount;
        this.sprite.anims.play(Graphics.boss.animations.hit.key, true);

        // Update the health UI
        this.updateHealthUI();

        if (this.health <= 0) {
            this.die();
        }
    }

    private die() {
        this.isDead = true;
        this.sprite.anims.play(Graphics.boss.animations.death.key, false);
        this.sprite.disableBody();

        // Remove the health UI
        if (this.healthUI) {
            this.healthUI.destroy();
            this.healthUI = null;
        }

        this.spawnLoot();
    }

    private spawnLoot() {
        // Drop several items on death
        for (let i = 0; i < Phaser.Math.Between(3, 5); i++) {
            const item = Item.createGoldKey();
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