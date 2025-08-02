import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Player from "../entities/Player";

export default class HealthScene extends Phaser.Scene {
    private player: Player | null = null;
    private heartSprites: Phaser.GameObjects.Sprite[] = [];

    // Health UI configuration - moved hearts to the right
    private readonly heartSize = 16;
    private readonly heartSpacing = 15;
    private readonly heartScale = 1.5;
    private readonly startX = 60; // Moved from 30 to 100 (further right)
    private readonly startY = 30;

    constructor() {
        super({ key: "HealthScene" });
    }

    create(): void {
        console.log("HealthScene created!");

        // Create heart sprites directly (no background)
        this.createHeartSprites();

        // Listen for player reference updates and health change events
        this.events.on('setPlayer', this.setPlayer, this);
        this.game.events.on('playerHealthChanged', this.updateHealthDisplay, this);

        // Initial health display update - updated for 3 health points
        this.updateHealthDisplay({ health: 3, maxHealth: 3 });

        console.log("HealthScene setup completed");
    }

    private createHeartSprites(): void {
        for (let i = 0; i < 3; i++) {
            const heartSprite = this.add.sprite(
                this.startX + i * (this.heartSize + this.heartSpacing),
                this.startY,
                Graphics.environment.name,
                Graphics.environment.indices.heart.full
            );
            heartSprite.setDepth(1001);
            heartSprite.setScale(this.heartScale);
            this.heartSprites.push(heartSprite);
        }

        console.log("Created", this.heartSprites.length, "heart sprites");
    }

    private setPlayer(player: Player): void {
        this.player = player;
        console.log("HealthScene: Player reference set");
    }

    private updateHealthDisplay(data: { health: number; maxHealth: number }): void {
        console.log("HealthScene: Updating health display:", data);
        const { health, maxHealth } = data;

        for (let i = 0; i < this.heartSprites.length; i++) {
            const heartSprite = this.heartSprites[i];

            // Calculate health for this heart from left to right
            // Heart 0 (leftmost) = health - 2
            // Heart 1 (middle) = health - 1  
            // Heart 2 (rightmost) = health - 0
            const heartHealth = Math.min(1, Math.max(0, health - i * 1));

            if (heartHealth >= 1) {
                // Full heart
                heartSprite.setFrame(Graphics.environment.indices.heart.full);
            } else if (heartHealth >= 0.5) {
                // Half heart
                heartSprite.setFrame(Graphics.environment.indices.heart.half);
            } else {
                // Empty heart
                heartSprite.setFrame(Graphics.environment.indices.heart.empty);
            }

            console.log(`Heart ${i}: health=${heartHealth}, frame=${heartSprite.frame.name}`);
        }
    }
} 