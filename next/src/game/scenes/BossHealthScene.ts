import Phaser from "phaser";
import Graphics from "../assets/Graphics";

export default class BossHealthScene extends Phaser.Scene {
    private bossHeartSprites: Phaser.GameObjects.Sprite[] = [];
    private bossHealthBackground: Phaser.GameObjects.Rectangle;
    private bossHealthText: Phaser.GameObjects.Text;
    private bossHeartCountText: Phaser.GameObjects.Text; // Add heart count text
    private bossIcon: Phaser.GameObjects.Sprite;
    private bossHearts: number = 0;
    private currentHealth: number = 0;

    // Boss health UI configuration - positioned below gas price and above timers
    private readonly bossHealthWidth = 250;
    private readonly bossHealthHeight = 50;
    private readonly heartSize = 12;
    private readonly heartSpacing = 8;
    private readonly heartScale = 1.0;
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.8;
    private readonly borderColor = 0xff0000;
    private readonly borderWidth = 2;

    // Gas price positioning constants (matching GasPriceScene)
    private readonly heartStartY = 30;
    private readonly gasPriceHeight = 40;
    private readonly gasPriceOffset = 25; // 25 pixels below hearts

    constructor() {
        super({ key: "BossHealthScene" });
    }

    create(): void {
        console.log("BossHealthScene created!");

        // Calculate position below gas price - increased spacing
        const heartBottomY = this.heartStartY + (this.heartSize * this.heartScale) / 2;
        const gasPriceY = heartBottomY + this.gasPriceOffset;
        const gasPriceBottomY = gasPriceY + this.gasPriceHeight;
        const bossHealthY = gasPriceBottomY + 25; // Increased from 10 to 25 pixels below gas price

        const xPos = 30; // Align with left side like other UI elements
        const yPos = bossHealthY;

        // Create background
        this.bossHealthBackground = this.add.rectangle(
            xPos + this.bossHealthWidth / 2,
            yPos + this.bossHealthHeight / 2,
            this.bossHealthWidth,
            this.bossHealthHeight,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.bossHealthBackground.setDepth(1000);
        this.bossHealthBackground.setStrokeStyle(this.borderWidth, this.borderColor);
        this.bossHealthBackground.setVisible(false);

        // Create boss icon
        this.bossIcon = this.add.sprite(
            xPos + 25,
            yPos + this.bossHealthHeight / 2,
            'boss',
            0
        );
        this.bossIcon.setScale(0.8);
        this.bossIcon.setDepth(1001);
        this.bossIcon.setVisible(false);

        // Create boss health text
        this.bossHealthText = this.add.text(
            xPos + 50,
            yPos + this.bossHealthHeight / 2,
            'BOSS',
            {
                fontSize: '14px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.bossHealthText.setOrigin(0, 0.5);
        this.bossHealthText.setDepth(1001);
        this.bossHealthText.setVisible(false);

        // Create boss heart count text
        this.bossHeartCountText = this.add.text(
            xPos + 100,
            yPos + this.bossHealthHeight / 2,
            '0',
            {
                fontSize: '14px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        this.bossHeartCountText.setOrigin(0, 0.5);
        this.bossHeartCountText.setDepth(1001);
        this.bossHeartCountText.setVisible(false);

        // Listen for boss health events
        this.game.events.on('bossHealthChanged', this.updateBossHealth, this);
        this.game.events.on('bossSpawned', this.onBossSpawned, this);
        this.game.events.on('bossDied', this.onBossDied, this);

        console.log("BossHealthScene setup completed");
    }

    private onBossSpawned(data: { hearts: number; health: number }): void {
        console.log("Boss spawned with health:", data);
        this.bossHearts = data.hearts;
        this.currentHealth = data.health;

        this.showBossHealth();
        this.createBossHearts();
        this.updateBossHealthDisplay();
    }

    private onBossDied(): void {
        console.log("Boss died, hiding health display");
        this.hideBossHealth();
    }

    private updateBossHealth(data: { health: number }): void {
        console.log("Boss health updated:", data);
        this.currentHealth = data.health;
        this.updateBossHealthDisplay();
    }

    private showBossHealth(): void {
        if (this.bossHealthBackground) this.bossHealthBackground.setVisible(true);
        if (this.bossIcon) this.bossIcon.setVisible(true);
        if (this.bossHealthText) this.bossHealthText.setVisible(true);
        if (this.bossHeartCountText) this.bossHeartCountText.setVisible(true);

        // Show heart sprites
        this.bossHeartSprites.forEach(heart => heart.setVisible(true));
    }

    private hideBossHealth(): void {
        if (this.bossHealthBackground) this.bossHealthBackground.setVisible(false);
        if (this.bossIcon) this.bossIcon.setVisible(false);
        if (this.bossHealthText) this.bossHealthText.setVisible(false);
        if (this.bossHeartCountText) this.bossHeartCountText.setVisible(false);

        // Hide heart sprites
        this.bossHeartSprites.forEach(heart => heart.setVisible(false));
    }

    private createBossHearts(): void {
        // Clear existing hearts
        this.bossHeartSprites.forEach(heart => heart.destroy());
        this.bossHeartSprites = [];

        // Calculate position for hearts (to the right of the text) - updated spacing
        const heartBottomY = this.heartStartY + (this.heartSize * this.heartScale) / 2;
        const gasPriceY = heartBottomY + this.gasPriceOffset;
        const gasPriceBottomY = gasPriceY + this.gasPriceHeight;
        const bossHealthY = gasPriceBottomY + 25; // Increased from 10 to 25 pixels

        const xPos = 30;
        const yPos = bossHealthY;
        const heartStartX = xPos + 100; // Position hearts after the "BOSS" text
        const heartStartY = yPos + this.bossHealthHeight / 2;

        // Create heart sprites
        for (let i = 0; i < this.bossHearts; i++) {
            const heartSprite = this.add.sprite(
                heartStartX + i * (this.heartSize + this.heartSpacing),
                heartStartY,
                Graphics.environment.name,
                Graphics.environment.indices.heart.full
            );
            heartSprite.setDepth(1001);
            heartSprite.setScale(this.heartScale);
            heartSprite.setVisible(false);
            this.bossHeartSprites.push(heartSprite);
        }

        console.log(`Created ${this.bossHeartSprites.length} boss heart sprites`);
    }

    private updateBossHealthDisplay(): void {
        console.log("Updating boss health display:", this.currentHealth, "/", this.bossHearts);

        // Update heart count text - show just the total hearts
        if (this.bossHeartCountText) {
            this.bossHeartCountText.setText(`${this.bossHearts} hearts`);
            this.bossHeartCountText.setColor('#ff0000'); // Always red for boss
        }

        // Update heart sprites (optional - you can remove this if you only want the number)
        for (let i = 0; i < this.bossHeartSprites.length; i++) {
            const heartSprite = this.bossHeartSprites[i];

            // Calculate health for this heart
            const heartHealth = Math.min(1, Math.max(0, this.currentHealth - i * 1));

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

            console.log(`Boss heart ${i}: health=${heartHealth}, frame=${heartSprite.frame.name}`);
        }
    }
} 