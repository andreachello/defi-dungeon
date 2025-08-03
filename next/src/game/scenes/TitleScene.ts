import Phaser from "phaser";
import Fonts from "../assets/Fonts";
import Graphics from "../assets/Graphics";

export default class TitleScene extends Phaser.Scene {
    private titleText?: Phaser.GameObjects.DynamicBitmapText;
    private subtitleText?: Phaser.GameObjects.DynamicBitmapText;
    private startText?: Phaser.GameObjects.DynamicBitmapText;
    private background?: Phaser.GameObjects.Rectangle;
    private coverImage?: Phaser.GameObjects.Image;
    private particles?: Phaser.GameObjects.Particles.ParticleEmitterManager;
    private startButton?: Phaser.GameObjects.Rectangle;
    private startButtonText?: Phaser.GameObjects.DynamicBitmapText;
    private isTransitioning: boolean = false;
    private walletConnected: boolean = false;

    constructor() {
        super({ key: "TitleScene" });
    }

    preload(): void {
        this.load.bitmapFont("default", ...Fonts.default);

        // Load the cover image
        this.load.image("dungeonheim_cover", "/assets/dungeonheim_cover.jpg");

        // Load environment sprites for background decoration
        this.load.spritesheet(Graphics.environment.name, Graphics.environment.file, {
            frameWidth: Graphics.environment.width,
            frameHeight: Graphics.environment.height,
            margin: Graphics.environment.margin,
            spacing: Graphics.environment.spacing
        });
    }

    create(): void {
        const { width, height } = this.scale;

        // Check wallet connection status
        this.walletConnected = (window as any).walletConnected || false;

        // Create dark background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000);
        this.background.setOrigin(0, 0);

        // Add cover image as background
        this.createCoverBackground();

        // Create particle effect for atmosphere
        this.createParticles();

        // Create decorative background elements
        this.createBackgroundDecoration();

        // Create main title
        // this.titleText = this.add.dynamicBitmapText(
        //     width / 2,
        //     height * 0.15,
        //     "default",
        //     "DUNGEONHEIM",
        //     48
        // );
        // this.titleText.setOrigin(0.5);
        // this.titleText.setTint(0xff6b35); // Orange color for the title

        // // Create subtitle
        // this.subtitleText = this.add.dynamicBitmapText(
        //     width / 2,
        //     height * 0.15 + 80,
        //     "default",
        //     "A DeFi Dungeon Adventure",
        //     16
        // );
        // this.subtitleText.setOrigin(0.5);
        // this.subtitleText.setTint(0xcccccc);

        // Create start button
        this.createStartButton();

        // Create additional info text
        this.createInfoText();

        // Add title animation
        this.animateTitle();

        // Add keyboard input
        this.input.keyboard?.on('keydown-SPACE', () => {
            this.handleStartAction();
        });

        this.input.keyboard?.on('keydown-ENTER', () => {
            this.handleStartAction();
        });

        // Add click/touch input
        this.input.on('pointerdown', () => {
            this.handleStartAction();
        });
    }

    private createCoverBackground(): void {
        const { width, height } = this.scale;

        // Add cover image as background
        this.coverImage = this.add.image(width / 2, height / 2, "dungeonheim_cover");

        // Scale the image to fit the screen while maintaining aspect ratio
        const scaleX = width / this.coverImage.width;
        const scaleY = height / this.coverImage.height;
        const scale = Math.max(scaleX, scaleY);

        this.coverImage.setScale(scale);
        this.coverImage.setAlpha(1.0); // Full opacity for the cover image
        this.coverImage.setDepth(0); // Put it behind everything

        // Remove the dark overlay completely
        // const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);
        // overlay.setOrigin(0, 0);
        // overlay.setDepth(1);
    }

    private createParticles(): void {
        this.particles = this.add.particles(0, 0, Graphics.util.name, {
            frame: Graphics.util.indices.black,
            lifespan: 4000,
            speed: { min: 20, max: 60 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            frequency: 200,
            quantity: 1,
            blendMode: 'ADD',
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height)
            }
        });
        this.particles.setDepth(2);
    }

    private createBackgroundDecoration(): void {
        const { width, height } = this.scale;

        // Add some decorative wall tiles around the edges
        const wallFrame = Graphics.environment.indices.walls.alone;

        // Top border
        for (let x = 0; x < width; x += 16) {
            this.add.sprite(x, 0, Graphics.environment.name, wallFrame).setDepth(3);
        }

        // Bottom border
        for (let x = 0; x < width; x += 16) {
            this.add.sprite(x, height - 16, Graphics.environment.name, wallFrame).setDepth(3);
        }

        // Left border
        for (let y = 0; y < height; y += 16) {
            this.add.sprite(0, y, Graphics.environment.name, wallFrame).setDepth(3);
        }

        // Right border
        for (let x = 0; x < width; x += 16) {
            this.add.sprite(width - 16, x, Graphics.environment.name, wallFrame).setDepth(3);
        }

        // Add some torches for atmosphere
        const torchFrame = Graphics.environment.indices.torch;
        this.add.sprite(50, 50, Graphics.environment.name, torchFrame).setDepth(4);
        this.add.sprite(width - 50, 50, Graphics.environment.name, torchFrame).setDepth(4);
        this.add.sprite(50, height - 50, Graphics.environment.name, torchFrame).setDepth(4);
        this.add.sprite(width - 50, height - 50, Graphics.environment.name, torchFrame).setDepth(4);
    }

    private createStartButton(): void {
        const { width, height } = this.scale;

        // Create button background
        this.startButton = this.add.rectangle(
            width / 2,
            height * 0.75,
            200,
            60,
            0x333333,
            0.8
        );
        this.startButton.setStrokeStyle(2, 0xff6b35);
        this.startButton.setInteractive();
        this.startButton.setDepth(5);

        // Create button text based on wallet connection
        const buttonText = this.walletConnected ? "START GAME" : "CONNECT WALLET";
        this.startButtonText = this.add.dynamicBitmapText(
            width / 2,
            height * 0.75,
            "default",
            buttonText,
            20
        );
        this.startButtonText.setOrigin(0.5);
        this.startButtonText.setTint(0xffffff);
        this.startButtonText.setDepth(5);

        // Add hover effects
        this.startButton.on('pointerover', () => {
            this.startButton?.setStrokeStyle(3, 0xff8c42);
            this.startButtonText?.setTint(0xff6b35);
        });

        this.startButton.on('pointerout', () => {
            this.startButton?.setStrokeStyle(2, 0xff6b35);
            this.startButtonText?.setTint(0xffffff);
        });

        this.startButton.on('pointerdown', () => {
            this.handleStartAction();
        });

        // Add pulsing animation to button
        this.tweens.add({
            targets: this.startButton,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createInfoText(): void {
        const { width, height } = this.scale;

        // Instructions based on wallet connection
        const instructions = this.add.dynamicBitmapText(
            width / 2,
            height * 0.85,
            "default",
            this.walletConnected
                ? "Press SPACE or ENTER to start"
                : "Connect your wallet to begin your adventure",
            12
        );
        instructions.setOrigin(0.5);
        instructions.setTint(0x888888);
        instructions.setDepth(5);

        // Version or additional info
        const version = this.add.dynamicBitmapText(
            width / 2,
            height * 0.92,
            "default",
            "v1.0 - DeFi Dungeon Crawler",
            10
        );
        version.setOrigin(0.5);
        version.setTint(0x666666);
        version.setDepth(5);
    }

    private animateTitle(): void {
        if (!this.titleText) return;

        // Add a subtle floating animation to the title
        this.tweens.add({
            targets: this.titleText,
            y: this.titleText.y - 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add a glow effect
        this.tweens.add({
            targets: this.titleText,
            alpha: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private handleStartAction(): void {
        if (this.walletConnected) {
            this.startGame();
        } else {
            // Dispatch custom event to trigger wallet connection modal
            const connectWalletEvent = new CustomEvent('connectWallet');
            window.dispatchEvent(connectWalletEvent);
        }
    }

    private showConnectWalletMessage(): void {
        // Dispatch custom event to trigger wallet connection
        const connectWalletEvent = new CustomEvent('connectWallet');
        window.dispatchEvent(connectWalletEvent);
    }

    private startGame(): void {
        if (this.isTransitioning) return;

        this.isTransitioning = true;

        // Add transition effect
        const transition = this.add.rectangle(
            0,
            0,
            this.scale.width,
            this.scale.height,
            0x000000,
            0
        );
        transition.setOrigin(0, 0);
        transition.setDepth(10);

        // Fade to black
        this.tweens.add({
            targets: transition,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                // Start the dungeon scene
                this.scene.start("DungeonScene");
                this.scene.start("InfoScene");
                this.scene.start("InventoryScene");
                this.scene.start("MinimapScene");
                this.scene.start("TimerScene");
                this.scene.start("HealthScene");
            }
        });
    }

    update(): void {
        // Check if wallet connection status has changed
        const currentWalletStatus = (window as any).walletConnected || false;
        if (currentWalletStatus !== this.walletConnected) {
            this.walletConnected = currentWalletStatus;
            this.updateButtonText();
        }
    }

    private updateButtonText(): void {
        if (this.startButtonText) {
            const buttonText = this.walletConnected ? "START GAME" : "CONNECT WALLET";
            this.startButtonText.setText(buttonText);
        }
    }
} 